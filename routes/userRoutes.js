const express = require('express');
const router = express.Router();
const UserController = require('../controllers/UserController');
const { upload } = require("../middleware/multerMiddleware");

// Routes pour la gestion des utilisateurs
router.post('/signup',upload.single('file'),UserController.signup);
router.post('/login', UserController.login);
router.get('/:id', UserController.getUserById);    
router.put('/:id', upload.single('file'), UserController.updateUser);     

module.exports = router;
