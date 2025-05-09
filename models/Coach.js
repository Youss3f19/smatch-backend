const mongoose = require('mongoose');

const coachSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  licenseNumber: String
});

module.exports = mongoose.model('Coach', coachSchema);
