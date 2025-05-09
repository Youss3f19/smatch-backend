const express = require('express');
const router = express.Router();
const teamController = require('../controllers/TeamController');
const auth = require('../middleware/auth'); // Import auth middleware

router.post('/create',auth, teamController.createTeam);
router.get('/getAll', teamController.getAll);
router.get('/:id', teamController.getTeamById);
router.put('/:id', teamController.updateTeam);
router.delete('/:id', teamController.deleteTeam);

module.exports = router;