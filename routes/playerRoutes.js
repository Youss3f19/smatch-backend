const express = require('express');
const router = express.Router();
const TournamentController = require('../controllers/TournamentController');
const auth = require('../middleware/auth'); // Import auth middleware
const authorize = require('../middleware/authorize'); // Import authorize middleware

// Tournament CRUD routes
router.post('/', auth, authorize(['organizer']), TournamentController.createTournament);
router.get('/', TournamentController.getAllTournaments);
router.get('/:id', TournamentController.getTournamentById);
router.put('/:id', auth, authorize(['organizer']), TournamentController.updateTournament);
router.delete('/:id', auth, authorize(['organizer']), TournamentController.deleteTournament);

// Join request routes
router.post('/:id/join', auth, authorize(['player']), TournamentController.createJoinRequest);
router.put('/:id/join', auth, authorize(['organizer']), TournamentController.handleJoinRequest);

module.exports = router;