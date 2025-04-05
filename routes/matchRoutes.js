const express = require('express');
const router = express.Router();
const matchController = require('../controllers/MatchController');

router.post('/createMatch', matchController.createMatch);
router.get('/getAllMatchs', matchController.getAllMatchs);
router.get('/:id', matchController.getMatchById);
router.put('/:id', matchController.updateMatch);
router.delete('/:id', matchController.deleteMatch);

module.exports = router;
