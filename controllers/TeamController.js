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

        const newTeam = new Team({
            teamName,
            teamLeader,
            players: [teamLeader] // Include team leader as first player
        });

        await newTeam.save();
        res.status(201).json(newTeam);
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
        if (team.teamLeader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only team leader can update the team' });
        }

        if (teamName) team.teamName = teamName;
        if (players) team.players = players;

        const updatedTeam = await team.save();
        res.json(updatedTeam);
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
        if (team.teamLeader.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only team leader can delete the team' });
        }

        await team.remove();
        res.json({ message: 'Team deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

