const express = require('express');
const router = express.Router();
const teamController = require('../controllers/TeamController');

router.post('/create', teamController.createTeam);
router.get('/getAll', teamController.getAll);
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;