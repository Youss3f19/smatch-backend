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
      return res.status(400).json({ message: 'Team name already exists' });
    }

    // Verify the team leader exists
    const leader = await User.findById(teamLeader);
    if (!leader) {
      return res.status(404).json({ message: 'User not found' });
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
      return res.status(400).json({ message: 'User is already in another fixed team' });
    }

    const teamData = {
      teamName,
      teamLeader,
      players: [teamLeader],
      teamType: 'fixed' // Explicitly set as fixed team for this controller
    };

    // Handle photo upload
    if (req.file) {
      teamData.photo = req.file.path;
    }

    const newTeam = new Team(teamData);

    await newTeam.save();
    const populatedTeam = await Team.findById(newTeam._id)
      .populate('teamLeader', 'firstName email')
      .populate('players', 'firstName email');
    res.status(201).json(populatedTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ message: 'Error creating team', error: error.message });
  }
};

// Get all teams
exports.getAll = async (req, res) => {
  try {
    const teams = await Team.find()
      .populate('teamLeader', 'name email')
      .populate('players', 'name email');
    res.status(200).json(teams);
  } catch (error) {
    console.error('Error retrieving teams:', error);
    res.status(500).json({ message: 'Error retrieving teams', error: error.message });
  }
};

// Get a single team by ID
exports.getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('teamLeader', 'name email')
      .populate('players', 'name email');

    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    res.status(200).json(team);
  } catch (error) {
    console.error('Error retrieving team:', error);
    res.status(500).json({ message: 'Error retrieving team', error: error.message });
  }
};

// Update a team
exports.updateTeam = async (req, res) => {
  try {
    const { teamName, players } = req.body;

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only allow team leader to update the team
    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can update the team' });
    }

    // Prevent changing teamType
    if (req.body.teamType && req.body.teamType !== team.teamType) {
      return res.status(400).json({ message: 'Cannot change team type' });
    }

    const updateData = {};

    if (teamName) {
      const existingTeam = await Team.findOne({ teamName });
      if (existingTeam && existingTeam._id.toString() !== team._id.toString()) {
        return res.status(400).json({ message: 'Team name already exists' });
      }
      updateData.teamName = teamName;
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
          return res.status(400).json({ message: `User with ID ${playerId} is already in another fixed team` });
        }
      }

      updateData.players = updatedPlayers;
    }

    // Handle photo upload
    if (req.file) {
      updateData.photo = req.file.path;
    }

    Object.assign(team, updateData);
    const updatedTeam = await team.save();
    const populatedTeam = await Team.findById(updatedTeam._id)
      .populate('teamLeader', 'name email')
      .populate('players', 'name email');
    res.status(200).json(populatedTeam);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ message: 'Error updating team', error: error.message });
  }
};

// Delete a team
exports.deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Only allow team leader to delete the team
    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only team leader can delete the team' });
    }

    await Team.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ message: 'Error deleting team', error: error.message });
  }
};