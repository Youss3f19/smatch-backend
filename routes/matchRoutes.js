const express = require('express');
const router = express.Router();
const QuickMatchController = require('../controllers/QuickMatchController');
const auth = require('../middleware/auth'); // Import auth middleware
const authorize = require('../middleware/authorize'); // Import authorize middleware

// Routes for Quick Matches
// Create a new quick match (authenticated players only)
router.post('/quick-matches', auth, authorize(['player']), QuickMatchController.createQuickMatch);

// Invite a player to a quick match (authenticated players only)
router.post('/quick-matches/:id/invite', auth, authorize(['player']), QuickMatchController.invitePlayerToQuickMatch);

// Join a public quick match (authenticated players only)
router.post('/quick-matches/:id/join', auth, authorize(['player']), QuickMatchController.joinQuickMatch);

// Request to join a private quick match (authenticated players only)
router.post('/quick-matches/:id/request-join', auth, authorize(['player']), QuickMatchController.requestToJoinQuickMatch);

// Handle join request (accept/reject) for a quick match (authenticated players only)
router.post('/quick-matches/:id/handle-join', auth, authorize(['player']), QuickMatchController.handleJoinRequest);

// Get all quick matches (no authentication required)
router.get('/quick-matches', QuickMatchController.getQuickMatches);

// Get a specific quick match by ID (no authentication required)
router.get('/quick-matches/:id', QuickMatchController.getQuickMatchById);

// Update a quick match (authenticated players only)
router.put('/quick-matches/:id', auth, authorize(['player']), QuickMatchController.updateQuickMatch);

// Delete a quick match (authenticated players only)
router.delete('/quick-matches/:id', auth, authorize(['player']), QuickMatchController.deleteQuickMatch);

module.exports = router;