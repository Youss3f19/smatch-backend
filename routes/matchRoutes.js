const express = require('express');
const router = express.Router();
const QuickMatchController = require('../controllers/QuickMatchController');
const auth = require('../middleware/auth'); // Import auth middleware
const authorize = require('../middleware/authorize'); // Import authorize middleware

// Routes des matchs rapides
router.post('/quick-matches', auth, authorize(['player']), QuickMatchController.createQuickMatch);
router.post('/quick-matches/:id/invite', auth, authorize(['player']), QuickMatchController.invitePlayerToQuickMatch);
router.post('/quick-matches/:id/join', auth, authorize(['player']), QuickMatchController.joinQuickMatch);
router.post('/quick-matches/:id/request-join', auth, authorize(['player']), QuickMatchController.requestToJoinQuickMatch);
router.post('/quick-matches/:id/handle-join', auth, authorize(['player']), QuickMatchController.handleJoinRequest);
router.get('/quick-matches', QuickMatchController.getQuickMatches);
router.put('/quick-matches/:id', auth, authorize(['player']), QuickMatchController.updateQuickMatch);
router.delete('/quick-matches/:id', auth, authorize(['player']), QuickMatchController.deleteQuickMatch);

module.exports = router;