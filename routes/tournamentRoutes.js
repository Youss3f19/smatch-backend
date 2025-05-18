const express = require('express');
const router = express.Router();
const TournamentController = require('../controllers/TournamentController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');
const { upload } = require("../middleware/multerMiddleware");

// Routes des tournois
router.post('/tournaments', auth, authorize(['admin','organizer']), upload.single('file'), TournamentController.createTournament);
router.get('/tournaments', TournamentController.getAllTournaments);
router.get('/tournaments/:id', TournamentController.getTournamentById);
router.put('/tournaments/:id', auth, authorize(['admin','organizer']), upload.single('file'), TournamentController.updateTournament);
router.delete('/tournaments/:id', auth, authorize(['admin','organizer']), TournamentController.deleteTournament);
router.post('/tournaments/:id/join', auth, authorize(['player']), TournamentController.createJoinRequest);
router.put('/tournaments/:id/join', auth, authorize(['player']), TournamentController.handleJoinRequest);
router.post('/tournaments/:id/generate', auth, authorize(['admin','organizer']), TournamentController.generateTournamentStructure);
router.put('/tournaments/:id/matches/:matchId', auth, authorize(['player']), TournamentController.updateMatchResult);
router.get('/tournaments/:id/matches-by-round', TournamentController.getMatchesByRound);
router.get('/tournaments/:id/teams', auth, authorize(['admin','organizer']), TournamentController.getTournamentTeams);
module.exports = router;