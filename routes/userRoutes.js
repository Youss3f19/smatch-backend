const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const auth = require('../middleware/auth'); 
const authorize = require('../middleware/authorize'); 
const upload = require('../middleware/upload'); 

// Routes pour la gestion des utilisateurs
router.post('/signup', UserController.signup);
router.post('/login', UserController.login);
router.get('/:id', auth, UserController.getUserById);
router.put('/:id', auth, upload.single('profilePicture'), UserController.updateUser);
router.get('/', auth, authorize(['admin']), UserController.getAllUsers);
router.put('/:id/upgrade-to-player', auth, UserController.upgradeToPlayer);

module.exports = router;