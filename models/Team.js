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
        required: true
    },
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {timestamps: true});


module.exports = mongoose.model('Team', teamSchema);
