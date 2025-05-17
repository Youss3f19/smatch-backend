const mongoose = require('mongoose');
const Match = require('./Match');

const quickMatchSchema = new mongoose.Schema({
  isPublic: { type: Boolean, default: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  joinRequests: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    requestedAt: { type: Date, default: Date.now }
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
  },
  date: {
    type: Date,
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Match date must be in the future'
    }
  },
  location: {
    type: String,
    required: true,
    trim: true,
    minlength: [3, 'Location must be at least 3 characters long'],
    maxlength: [100, 'Location must be less than 100 characters']
  }
});

// Ensure only one join request per user per match
quickMatchSchema.index({ 'joinRequests.user': 1 }, { unique: true });

// Create a discriminator
const QuickMatch = Match.discriminator('QuickMatch', quickMatchSchema);

// Export the QuickMatch model
module.exports = QuickMatch;