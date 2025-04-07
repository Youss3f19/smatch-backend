const express = require('express');
const router = express.Router();
const PlayerController = require('../controllers/PlayerController');

// Participer à un match
router.post('/:id/participer-match', PlayerController.participerMatch);

// Consulter classement
router.get('/:id/classement', PlayerController.consulterClassement);

module.exports = router;
