const Team = require('../models/Team');
const User = require('../models/User');

// Create a new team
exports.createTeam = async (req, res) => {
  try {
    const { teamName } = req.body;
    const teamLeader = req.user._id;

    // Check if team name already exists
    const existingTeam = await Team.findOne({ teamName });
    if (existingTeam) {
      return res.status(400).json({ error: 'Team name already exists' });
    }

    // Verify the team leader exists
    const leader = await User.findById(teamLeader);
    if (!leader) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if the team leader is already in another fixed team
    const leaderInTeam = await Team.findOne({
      teamType: 'fixed',
      $or: [
        { teamLeader: teamLeader },
        { players: teamLeader }
      ]
    });
    if (leaderInTeam) {
      return res.status(400).json({ error: 'User is already in another fixed team' });
    }

    const newTeam = new Team({
      teamName,
      teamLeader,
      players: [teamLeader],
      teamType: 'fixed' // Explicitly set as fixed team for this controller
    });

    await newTeam.save();
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('teamLeader', 'firstName email')
      .populate('players', 'firstName email');
    res.status(201).json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all teams
exports.getAll = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('teamLeader', 'firstName email')
      .populate('players', 'firstName email');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single team by ID
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('teamLeader', 'firstName email')
      .populate('players', 'firstName email');

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { teamName, players } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only allow team leader to update the team
    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only team leader can update the team' });
    }

    // Prevent changing teamType
    if (req.body.teamType && req.body.teamType !== team.teamType) {
      return res.status(400).json({ error: 'Cannot change team type' });
    }

    if (teamName) {
      const existingTeam = await Team.findOne({ teamName });
      if (existingTeam && existingTeam._id.toString() !== team._id.toString()) {
        return res.status(400).json({ error: 'Team name already exists' });
      }
      team.teamName = teamName;
    }

    if (players) {
      // Ensure team leader remains in players list
      const updatedPlayers = [...new Set([team.teamLeader, ...players])];

      // Check if any of the new players are already in another fixed team
      for (const playerId of updatedPlayers) {
        const playerInTeam = await Team.findOne({
          _id: { $ne: team._id }, // Exclude the current team
          teamType: 'fixed',
          $or: [
            { teamLeader: playerId },
            { players: playerId }
          ]
        });
        if (playerInTeam) {
          return res.status(400).json({ error: `User with ID ${playerId} is already in another fixed team` });
        }
      }

      team.players = updatedPlayers;
    }

    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id)
      .populate('teamLeader', 'firstName email')
      .populate('players', 'firstName email');
    res.json(populatedTeam);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // Only allow team leader to delete the team
    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Only team leader can delete the team' });
    }

    await Team.deleteOne({ _id: req.params.id });
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};