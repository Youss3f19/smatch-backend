const express = require('express');
const router = express.Router();
const OrganisateurController = require('../controllers/OrganisateurController');

// Créer un tournoi
router.post('/:id/creer-tournoi', OrganisateurController.creerTournoi);

// Planifier un match
router.post('/:id/planifier-match', OrganisateurController.planifierMatch);

// Gérer inscriptions
router.post('/:id/gerer-inscriptions', OrganisateurController.gererInscriptions);

module.exports = router;
