const { user } = require('@angular/fire/auth');
const Player = require('../models/Player');

// Participer à un match
exports.participerMatch = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).send('Player not found');

        // Fake logic (example)
        const matchId = req.body.matchId;
        player.participerMatch(matchId); // method in model
        res.status(200).send(`Player ${player.name} participates in match ${matchId}`);
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
};

// Consulter le classement
exports.consulterClassement = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id);
        if (!player) return res.status(404).send('Player not found');
        
        res.status(200).send({ classement: player.consulterClassement() });
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
};

// create player
exports.createPlayer = async (req, res) => {
    try {
        const { birthDate, position, jerseyNumber, height, weight } = req.body;
        
        const userId = req.user._id; 
        
        const newPlayer = new Player({
            user: userId,
            birthDate,
            position,
            jerseyNumber,
            height,
            weight
        });

        await newPlayer.save();
        res.status(201).send(newPlayer);
    } catch (err) {
        res.status(500).send('Error creating player: ' + err.message);
    }
};
