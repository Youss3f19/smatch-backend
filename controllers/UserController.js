const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Signup
exports.signup = async (req, res) => {
    let data = req.body;

    try {
        let existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return res.status(400).send('L\'email est déjà utilisé.');
        }

        let user = new User(data);

        let salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(data.password, salt);

        let savedUser = await user.save();
        res.status(200).send(savedUser);
    } catch (err) {
        console.error('Erreur lors de la création du compte :', err);
        res.status(500).send('Erreur lors de la création du compte.');
    }
};

// Login
exports.login = (req, res) => {
    let data = req.body;
    User.findOne({ email: data.email })
        .then((user) => {
            if (!user) {
                return res.status(400).send('Mail invalid!');
            }
            bcrypt.compare(data.password, user.password, (err, valid) => {
                if (err) return res.status(500).send('Error occurred: ' + err.message);
                if (!valid) return res.status(400).send('Password invalid!!');
         
                let payload = {
                    _id: user._id,
                    email: user.email,
                    name: user.name,
                    role: user.role
                };
                let token = jwt.sign(payload, '123456789');
                res.status(200).send({ mytoken: token });
            });
        })
        .catch((err) => {
            res.status(400).send('Error occurred: ' + err.message);
        });
};

// Retrieve user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user', error });
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

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Error updating user', error });
  }
};

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving users', error });
  }
};