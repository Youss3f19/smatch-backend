const mongoose = require('mongoose');
const QuickMatch = require('../models/QuickMatch');
const Team = require('../models/Team');
const User = require('../models/User');
const Invitation = require('../models/Invitation');

// Créer un match rapide
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

    // Créer deux équipes rapides pour le match
    const team1 = new Team({
      teamName: team1Name || `Quick Team 1 ${Date.now()}`,
      teamLeader: req.user._id,
      players: [req.user._id],
      teamType: 'quick'
    });
    await team1.save();

    const team2 = new Team({
      teamName: team2Name || `Quick Team 2 ${Date.now()}`,
      teamLeader: req.user._id,
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
      date: matchDate,
      location,
      terrainType: terrainType || 'indoor',
      maxSets: maxSets || 3
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

// Inviter un joueur à rejoindre un match rapide
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

    if (![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Équipe invalide pour ce match' });
    }

    const team = await Team.findById(teamId);
    if (team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    const player = await User.findById(playerId);
    if (!player) {
      return res.status(404).json({ message: 'Joueur non trouvé' });
    }

    // Vérifier si le joueur est déjà dans une équipe
    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);
    if (team1.players.includes(playerId) || team2.players.includes(playerId)) {
      return res.status(400).json({ message: 'Le joueur est déjà dans une équipe' });
    }

    // Vérifier les invitations existantes
    const existingInvitation = await Invitation.findOne({
      userId: playerId,
      quickMatch: match._id,
      status: { $in: ['pending', 'accepted'] }
    });
    if (existingInvitation) {
      return res.status(400).json({ message: 'Une invitation active existe déjà pour ce joueur' });
    }

    // Créer une nouvelle invitation
    const invitation = new Invitation({
      userId: playerId,
      quickMatch: match._id,
      team: teamId,
      status: 'pending'
    });
    await invitation.save();

    const populatedMatch = await QuickMatch.findById(match._id)
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('joinRequests.user', 'username');

    res.json({
      message: 'Invitation envoyée avec succès',
      match: populatedMatch,
      invitation
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Répondre à une invitation ou une demande de participation
exports.handleJoinRequest = async (req, res) => {
  try {
    const { userId, status, isInvitation } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    let target;
    if (isInvitation) {
      // Gérer une réponse à une invitation
      target = await Invitation.findOne({ userId, quickMatch: match._id });
      if (!target) {
        return res.status(404).json({ message: 'Invitation non trouvée' });
      }
      if (req.user._id.toString() !== userId) {
        return res.status(403).json({ message: 'Seul le joueur invité peut répondre' });
      }
    } else {
      // Gérer une demande de participation
      target = match.joinRequests.find(request => request.user.toString() === userId);
      if (!target) {
        return res.status(404).json({ message: 'Demande de participation non trouvée' });
      }
      if (match.creator.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Seul le créateur peut gérer les demandes' });
      }
    }

    const team = await Team.findById(target.team);
    if (!team) {
      return res.status(404).json({ message: 'Équipe non trouvée' });
    }

    if (status === 'accepted' && team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    // Mettre à jour le statut
    target.status = status;

    if (status === 'accepted') {
      team.players.push(userId);
      await team.save();
    }

    // Supprimer la demande/invitation après traitement
    if (isInvitation) {
      await target.deleteOne();
    } else {
      match.joinRequests = match.joinRequests.filter(
        request => request.user.toString() !== userId
      );
      await match.save();
    }

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

// Rejoindre un match rapide (public uniquement)
exports.joinQuickMatch = async (req, res) => {
  try {
    const { teamId } = req.body;
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (!match.isPublic) {
      return res.status(403).json({ message: 'Impossible de rejoindre directement un match privé. Veuillez demander une invitation.' });
    }

    if (![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Équipe invalide pour ce match' });
    }

    const team = await Team.findById(teamId);
    if (team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);
    if (team1.players.includes(req.user._id) || team2.players.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà dans une équipe' });
    }

    team.players.push(req.user._id);
    await team.save();

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
      return res.status(400).json({ message: 'Les matchs publics peuvent être rejoints directement' });
    }

    if (![match.team1.toString(), match.team2.toString()].includes(teamId)) {
      return res.status(400).json({ message: 'Équipe invalide pour ce match' });
    }

    const team = await Team.findById(teamId);
    if (team.players.length >= 6) {
      return res.status(400).json({ message: 'L\'équipe a déjà atteint la limite de 6 joueurs' });
    }

    const team1 = await Team.findById(match.team1);
    const team2 = await Team.findById(match.team2);
    if (team1.players.includes(req.user._id) || team2.players.includes(req.user._id)) {
      return res.status(400).json({ message: 'Vous êtes déjà dans une équipe' });
    }

    // La vérification d'une demande unique est gérée par l'index unique dans le schéma

    match.joinRequests.push({
      user: req.user._id,
      team: teamId,
      status: 'pending',
      requestedAt: new Date()
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

// Lister tous les matchs rapides
exports.getQuickMatches = async (req, res) => {
  try {
    const matches = await QuickMatch.find()
      .populate('team1', 'teamName players teamLeader')
      .populate('team2', 'teamName players teamLeader')
      .populate('creator', 'username')
      .populate('winner', 'teamName')
      .populate('joinRequests.user', 'username')
      .select('team1 team2 creator isPublic date location terrainType maxSets joinRequests');

    // Inclure les invitations pour chaque match
    const matchesWithInvitations = await Promise.all(
      matches.map(async (match) => {
        const invitations = await Invitation.find({ quickMatch: match._id })
          .populate('userId', 'username')
          .populate('team', 'teamName');
        return { ...match.toObject(), invitations };
      })
    );

    res.json(matchesWithInvitations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un match rapide
exports.updateQuickMatch = async (req, res) => {
  try {
    const match = await QuickMatch.findById(req.params.id);

    if (!match) {
      return res.status(404).json({ message: 'Match rapide non trouvé' });
    }

    if (match.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const { isPublic, date, location, terrainType, maxSets } = req.body;

    if (date) {
      const matchDate = new Date(date);
      if (matchDate <= new Date()) {
        return res.status(400).json({ message: 'Match date must be in the future' });
      }
      match.date = matchDate;
    }

    if (isPublic !== undefined) match.isPublic = isPublic;
    if (location) match.location = location;
    if (terrainType) match.terrainType = terrainType;
    if (maxSets) match.maxSets = maxSets;

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

    // Supprimer les invitations associées
    await Invitation.deleteMany({ quickMatch: match._id });
    await match.deleteOne();

    res.json({ message: 'Match rapide supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};