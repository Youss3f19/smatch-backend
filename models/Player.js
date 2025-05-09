const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  birthDate: Date,
  position: String,
  jerseyNumber: Number,
  height: Number,
  weight: Number,
  likes: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ],
  friends: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  ]
});

module.exports = mongoose.model('Player', playerSchema);