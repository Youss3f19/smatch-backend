const mongoose = require('mongoose');
const Match = require('../models/Match');
const Team = require('../models/Team');
const User = require('../models/User');
const QuickMatch = require('../models/QuickMatch');

// Créer un match rapide de volleyball
exports.createQuickMatch = async (req, res) => {
  try {
    const { isPublic, team1Name, team2Name, date, location, terrainType, maxSets } = req.body;

    // Validate required fields
    if (!date || !location) {
      return res.status(400).json({ message: 'Date and location are required' });
    }

    // Validate date is in the future
    const matchDate = new Date(date);
    if (matchDate <= new Date()) {
      return res.status(400).json({ message: 'Match date must be in the future' });
    }

    // Créer l'équipe 1 avec le créateur
    const team1 = new Team({
      teamName: team1Name || `Volley Team 1 ${Date.now()}`,
      teamLeader: req.user._id,
      players: [req.user._id],
      teamType: 'quick'
    });
    await team1.save();

    // Créer l'équipe 2 vide
    const team2 = new Team({
      teamName: team2Name || `Volley Team 2 ${Date.now()}`,
      teamLeader: null,
      players: [],
      teamType: 'quick'
    });
    await team2.save();

    // Créer le match rapide
    const match = new QuickMatch({
      team1: team1._id,
      team2: team2._id,
      isPublic: isPublic !== undefined ? isPublic : true,
      creator: req.user._id,
      joinRequests: [],
      terrainType: terrainType || 'indoor',
      maxSets: maxSets || 3,
      sets: [],
      date: matchDate,
      location
    });
    await match.save();

    // Peupler les champs pour la réponse
    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.status(201).json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Inviter un joueur à rejoindre une équipe pour un match rapide
exports.invitePlayerToQuickMatch = async (req, res) => {
  try {
    const { playerId, teamId } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le créateur peut inviter des joueurs' });
    }

    const team = await Team.findById(teamId);
    if (!team || ![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Équipe invalide pour ce match' });
    }

    if (team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Joueur non trouvé' });
    }

    if (team.players.includes(playerId)) {
      return res.status(400).json({ message: 'Le joueur est déjà dans cette équipe' });
    }

    // Ajouter une demande d'invitation (simulée ici, à adapter avec un modèle Invitation si nécessaire)
    match.joinRequests.push({
      user: playerId,
      team: teamId,
      status: 'pending'
    });
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json({
      message: 'Invitation envoyée avec succès',
      match: populatedMatch
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Rejoindre un match rapide (public uniquement)
exports.joinQuickMatch = async (req, res) => {
  try {
    const { teamId } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (!match.isPublic) {
      return res.status(403).json({ message: 'Ce match est privé. Veuillez demander à rejoindre.' });
    }

    if (match.team1 && match.team2 && ![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Le match est complet ou l\'équipe n\'est pas valide' });
    }

    let quickTeam = await Team.findById(teamId);
    if (!quickTeam) {
      quickTeam = new Team({
        teamName: `Volley Team ${Date.now()}`,
        teamLeader: req.user._id,
        players: [req.user._id],
        teamType: 'quick'
      });
      await quickTeam.save();
    }

    if (quickTeam.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    if (!quickTeam.players.includes(req.user._id)) {
      quickTeam.players.push(req.user._id);
      await quickTeam.save();
    }

    if (!match.team1 || (match.team1.toString() === teamId && match.team2)) {
      match.team1 = quickTeam._id;
    } else if (!match.team2) {
      match.team2 = quickTeam._id;
    }

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Demander à rejoindre un match rapide privé
exports.requestToJoinQuickMatch = async (req, res) => {
  try {
    const { teamId } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.isPublic) {
      return res.status(400).json({ message: 'Ce match est public. Rejoignez directement.' });
    }

    const team = await Team.findById(teamId);
    if (!team || ![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Équipe invalide pour ce match' });
    }

    if (team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    if (team.players.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà dans cette équipe' });
    }

    if (match.joinRequests.some(req => req.user.toString() === req.user._id.toString() && req.team.toString() === teamId)) {
      return res.status(400).json({ message: 'Demande de participation déjà soumise' });
    }

    match.joinRequests.push({
      user: req.user._id,
      team: teamId,
      status: 'pending'
    });
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Gérer une demande de participation à un match rapide
exports.handleJoinRequest = async (req, res) => {
  try {
    const { userId, teamId, status } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le créateur peut gérer les demandes' });
    }

    const joinRequest = match.joinRequests.find(
      request => request.user.toString() === userId && request.team.toString() === teamId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Demande de participation non trouvée' });
    }

    joinRequest.status = status;

    if (status === 'accepted') {
      const team = await Team.findById(teamId);
      if (team.players.length >= 6) {
        return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
      }
      if (!team.players.includes(userId)) {
        team.players.push(userId);
        await team.save();
      }
    }

    match.joinRequests = match.joinRequests.filter(
      request => request.user.toString() !== userId || request.team.toString() !== teamId
    );
    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les matchs rapides
exports.getQuickMatches = async (req, res) => {
  try {
    const matches = await QuickMatch.find()
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('winner', 'teamName')
      .populate('joinRequests.user', 'username');
    res.json(matches);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un match rapide (scores des sets, gagnant, etc.)
exports.updateQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { sets, score1, score2, winner } = req.body;

    if (sets) {
      match.sets = sets;
      const team1SetsWon = match.sets.filter(set => set.team1Score > set.team2Score && (set.team1Score >= 25 || (match.sets.length === match.maxSets && set.team1Score >= 15)) && set.team1Score - set.team2Score >= 2).length;
      const team2SetsWon = match.sets.filter(set => set.team2Score > set.team1Score && (set.team2Score >= 25 || (match.sets.length === match.maxSets && set.team2Score >= 15)) && set.team2Score - set.team1Score >= 2).length;

      match.score1 = team1SetsWon;
      match.score2 = team2SetsWon;

      const setsToWin = Math.ceil(match.maxSets / 2);
      if (team1SetsWon >= setsToWin) {
        match.winner = match.team1;
      } else if (team2SetsWon >= setsToWin) {
        match.winner = match.team2;
      }
    }

    if (score1 !== undefined) match.score1 = score1;
    if (score2 !== undefined) match.score2 = score2;
    if (winner) match.winner = winner;

    await match.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json(populatedMatch);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un match rapide
exports.deleteQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await match.remove();
    res.json({ message: 'Match rapide supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};