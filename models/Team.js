const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: {
    type: String,
    required: true,
    unique: true
  },
  teamLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  players: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  teamType: {
    type: String,
    enum: ['quick', 'fixed'],
    required: true,
    default: 'quick'
  },
  photo: {
    type: String 
  }
}, { timestamps: true });

module.exports = mongoose.model('Team', teamSchema);