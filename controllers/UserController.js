const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path'); // Added path import

// Signup// Signup
exports.signup = async (req, res) => {
  try {
    // Destructure only required fields
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    // Check for unexpected fields
    const allowedFields = ['name', 'email', 'password'];
    const receivedFields = Object.keys(req.body);
    const unexpectedFields = receivedFields.filter(field => !allowedFields.includes(field));
    if (unexpectedFields.length > 0) {
      return res.status(400).json({ message: `Unexpected fields provided: ${unexpectedFields.join(', ')}` });
    }

    // Check for existing user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'L\'email est déjà utilisé.' });
    }

    // Define list of profile pictures
    const profilePictures = Array.from({ length: 10 }, (_, i) => `profile${i + 1}.png`);

    // Randomly select a profile picture
    const randomIndex = Math.floor(Math.random() * profilePictures.length);
    const selectedProfilePicture = `uploads/${profilePictures[randomIndex]}`;

    // Create new user with random profile picture
    const user = new User({ name, email, profilePicture: selectedProfilePicture });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user
    const savedUser = await user.save();
    res.status(201).json(savedUser);
  } catch (err) {
    console.error('Erreur lors de la création du compte :', err);
    res.status(500).json({ message: 'Erreur lors de la création du compte.', error: err.message });
  }
};
// Login
exports.login = async (req, res) => {
  try {
    const data = req.body;
    const user = await User.findOne({ email: data.email });
    if (!user) {
      return res.status(400).json({ message: 'Mail invalid!' });
    }

    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return res.status(400).json({ message: 'Password invalid!' });
    }

    const payload = {
      _id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    const token = jwt.sign(payload, '123456789');
    res.status(200).json({ mytoken: token });
  } catch (err) {
    console.error('Erreur lors de la connexion :', err);
    res.status(500).json({ message: 'Erreur lors de la connexion.', error: err.message });
  }
};

// Retrieve user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    // Transform profilePicture to full URL
    const userResponse = user.toObject();
    if (userResponse.profilePicture) {
      userResponse.profilePicture = `${req.protocol}://${req.get('host')}/uploads/${path.basename(userResponse.profilePicture)}`;
    }
    res.status(200).json(userResponse);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur :', error);
    res.status(500).json({ message: 'Error retrieving user', error: error.message });
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle profile picture upload
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    // Check for player fields and upgrade to player if all are provided
    const playerFields = ['phone', 'address', 'birthDate', 'position'];
    const hasPlayerFields = playerFields.every(field => updateData[field] !== undefined);
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (hasPlayerFields && user.role !== 'player') {
      updateData.role = 'player';
      if (updateData.birthDate) {
        updateData.birthDate = new Date(updateData.birthDate);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    // Transform profilePicture to full URL
    const userResponse = updatedUser.toObject();
    if (userResponse.profilePicture) {
      userResponse.profilePicture = `${req.protocol}://${req.get('host')}/uploads/${path.basename(userResponse.profilePicture)}`;
    }

    res.status(200).json({ message: 'User updated successfully', user: userResponse });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error: error.message });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    // Transform profilePicture to full URL for all users
    const usersResponse = users.map(user => {
      const userObj = user.toObject();
      if (userObj.profilePicture) {
          userObj.profilePicture = `${req.protocol}://${req.get('host')}/uploads/${path.basename(userObj.profilePicture)}`;      
      }
      return userObj;
    });
    res.status(200).json(usersResponse);
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs :', error);
    res.status(500).json({ message: 'Error retrieving users', error: error.message });
  }
};