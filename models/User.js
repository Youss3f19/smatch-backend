const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { Description: String,  },
  address: { type: String,  },
  birthDate: { type: Date  },
  position: { type: String },

  role: { type: String, enum: ['user','player', 'coach', 'organizer', 'admin'], default: 'user' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
