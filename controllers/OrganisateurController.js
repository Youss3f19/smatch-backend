const Organisateur = require('../models/Organisateur');

// Créer un tournoi
exports.creerTournoi = async (req, res) => {
    try {
        const organisateur = await Organisateur.findById(req.params.id);
        if (!organisateur) return res.status(404).send('Organisateur not found');

        // Example: creating tournament logic
        const tournoi = req.body;
        organisateur.creerTournoi(tournoi);
        res.status(200).send('Tournoi créé avec succès');
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
};

// Planifier un match
exports.planifierMatch = async (req, res) => {
    try {
        const organisateur = await Organisateur.findById(req.params.id);
        if (!organisateur) return res.status(404).send('Organisateur not found');

        const match = req.body;
        organisateur.planifierMatch(match);
        res.status(200).send('Match planifié avec succès');
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
};

// Gérer les inscriptions
exports.gererInscriptions = async (req, res) => {
    try {
        const organisateur = await Organisateur.findById(req.params.id);
        if (!organisateur) return res.status(404).send('Organisateur not found');

        organisateur.gererInscriptions();
        res.status(200).send('Inscriptions gérées avec succès');
    } catch (err) {
        res.status(500).send('Error: ' + err.message);
    }
};
