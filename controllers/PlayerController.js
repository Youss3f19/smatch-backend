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
