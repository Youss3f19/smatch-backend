const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  quickMatch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'QuickMatch',
    required: true
  },
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
  createdAt: {
    type: Date,
    default: Date.now
  }
});

invitationSchema.index({ userId: 1, quickMatch: 1 }, { unique: true });

const Invitation = mongoose.model('Invitation', invitationSchema);

module.exports = Invitation;