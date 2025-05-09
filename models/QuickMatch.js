const mongoose = require('mongoose');
const Match = require('./Match');

const quickMatchSchema = new mongoose.Schema({
  isPublic: { type: Boolean, default: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  joinRequests: [{
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    requestedAt: {
      type: Date,
      default: Date.now
    }
  }],
  sets: [{
    team1Score: { type: Number, default: 0 },
    team2Score: { type: Number, default: 0 }
  }],
  terrainType: {
    type: String,
    enum: ['indoor', 'beach'],
    default: 'indoor'
  },
  maxSets: {
    type: Number,
    enum: [3, 5],
    default: 3
  }
});

//create a discriminator
const QuickMatch = Match.discriminator('QuickMatch', quickMatchSchema);

// Export the QuickMatch model
module.exports = QuickMatch;