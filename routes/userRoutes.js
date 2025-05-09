const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');

// Routes pour la gestion des utilisateurs
router.post('/signup',UserController.signup);
router.post('/login', UserController.login);
router.get('/:id', UserController.getUserById);
router.put('/:id', UserController.updateUser);

module.exports = router;
