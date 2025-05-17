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
                    name : user.name ,
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

    if (req.file) {
      updateData.profilePicture = req.file.path; 
    }

    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
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

// Upgrade user to player
exports.upgradeToPlayer = async (req, res) => {
  try {
    const userId = req.params.id;
    const { phone, address, birthDate, position } = req.body;

    // Validate required fields
    if (!phone || !address || !birthDate || !position) {
      return res.status(400).json({ message: 'All player fields (phone, address, birthDate, position) are required' });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a player
    if (user.role === 'player') {
      return res.status(400).json({ message: 'User is already a player' });
    }

    // Update user with player information
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        phone,
        address,
        birthDate: new Date(birthDate),
        position,
        role: 'player'
      },
      { new: true }
    );

    res.status(200).json({
      message: 'Successfully upgraded to player',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error upgrading to player:', error);
    res.status(500).json({ message: 'Error upgrading to player', error });
  }
};