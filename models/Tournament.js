const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TournamentMatch' }]
});

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  organizer: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  numberTeam: {
    type: Number,
    required: true,
  },
  teams: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }],
  prize: {
    type: String,
    required: true,
  },
  tournamentType: {
    type: String,
    enum: [
      'SingleElimination',
      'DoubleElimination',
      'RoundRobin',
      'League',
      'GroupKnockout'
    ],
    required: true
  },
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
  structure: {
    matches: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TournamentMatch' }],
    groups: [groupSchema],
    rounds: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tournament', tournamentSchema);