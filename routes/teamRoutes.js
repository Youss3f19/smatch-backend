const express = require('express');
const router = express.Router();
const teamController = require('../controllers/TeamController');
const auth = require('../middleware/auth');
const { upload } = require("../middleware/multerMiddleware");

// Team routes
router.post('/create', auth, upload.single('file'), teamController.createTeam);
router.get('/getAll', teamController.getAll);
router.get('/:id', teamController.getTeamById);
router.put('/:id', auth, upload.single('file'), teamController.updateTeam);
router.delete('/:id', auth, teamController.deleteTeam);

module.exports = router;