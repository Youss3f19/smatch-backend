const mongoose = require('mongoose');
const Tournament = require('../models/Tournament');
const TournamentMatch = require('../models/tournamentMatch');
const Match = require('../models/Match');
const Team = require('../models/Team');

// Créer un tournoi
exports.createTournament = async (req, res) => {
  try {
    const { name, startDate, endDate, location, numberTeam, prize, tournamentType, terrainType, maxSets } = req.body;

    const tournament = new Tournament({
      name,
      organizer: [req.user._id],
      startDate,
      endDate,
      location,
      numberTeam,
      prize,
      tournamentType,
      teams: [],
      joinRequests: [],
      structure: {
        matches: [],
        groups: [],
        rounds: 0
      }
    });

    await tournament.save();
    res.status(201).json(tournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Lister tous les tournois
exports.getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('organizer', 'username')
      .populate('teams', 'teamName')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');
    res.json(tournaments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Récupérer un tournoi par ID
exports.getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }
    res.json(tournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour un tournoi
exports.updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    Object.assign(tournament, req.body);
    await tournament.save();
    res.json(tournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Supprimer un tournoi
exports.deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    await tournament.remove();
    res.json({ message: 'Tournoi supprimé' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Créer une demande de participation à un tournoi
exports.createJoinRequest = async (req, res) => {
  try {
    const { teamId } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Équipe non trouvée' });
    }

    if (!team.teamLeader || team.teamLeader.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Seul le chef d\'équipe peut demander à rejoindre' });
    }

    if (team.players.length < 6) {
      return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un tournoi de volleyball' });
    }

    if (tournament.teams.length >= tournament.numberTeam) {
      return res.status(400).json({ message: 'Le tournoi est déjà complet' });
    }

    if (tournament.joinRequests.some(req => req.team.toString() === teamId)) {
      return res.status(400).json({ message: 'Demande de participation déjà soumise' });
    }

    tournament.joinRequests.push({ team: teamId });
    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Gérer une demande de participation à un tournoi
exports.handleJoinRequest = async (req, res) => {
  try {
    const { teamId, status } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Non autorisé' });
    }

    const joinRequest = tournament.joinRequests.find(
      request => request.team.toString() === teamId
    );

    if (!joinRequest) {
      return res.status(404).json({ message: 'Demande de participation non trouvée' });
    }

    joinRequest.status = status;

    if (status === 'accepted' && tournament.teams.length < tournament.numberTeam) {
      const team = await Team.findById(teamId);
      if (team.players.length < 6) {
        return res.status(400).json({ message: 'L\'équipe doit avoir au moins 6 joueurs pour un tournoi de volleyball' });
      }
      tournament.teams.push(teamId);
    }

    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('joinRequests.team', 'teamName');

    res.json(populatedTournament);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Générer la structure du tournoi
exports.generateTournamentStructure = async (req, res) => {
  try {
    const { terrainType, maxSets } = req.body;
    const tournament = await Tournament.findById(req.params.id);

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    // if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
    //   return res.status(403).json({ message: 'Non autorisé' });
    // }

    if (tournament.teams.length < 2) {
      return res.status(400).json({ message: 'Le tournoi doit avoir au moins 2 équipes' });
    }

    // Vider la structure existante
    tournament.structure.matches = [];
    tournament.structure.groups = [];
    tournament.structure.rounds = 0;

    const teams = tournament.teams;
    const matches = [];

    if (tournament.tournamentType === 'SingleElimination') {
      const numTeams = teams.length;
      const rounds = Math.ceil(Math.log2(numTeams));
      tournament.structure.rounds = rounds;

      // Créer une liste pour stocker les matchs par ronde
      const matchesByRound = Array.from({ length: rounds }, () => []);

      // Créer les matchs pour la première ronde
      const firstRoundMatches = Math.ceil(numTeams / 2);
      for (let i = 0; i < firstRoundMatches; i++) {
        const match = new TournamentMatch({
          team1: teams[i * 2] || null,
          team2: teams[i * 2 + 1] || null,
          tournament: tournament._id,
          round: 1,
          matchNumber: i + 1,
          sets: [],
          terrainType: terrainType || 'indoor',
          maxSets: maxSets || 3
        });
        await match.save();
        matches.push(match._id);
        matchesByRound[0].push(match);
      }

      // Créer les matchs pour les rondes suivantes et lier avec nextMatch
      for (let round = 2; round <= rounds; round++) {
        const numMatches = Math.ceil(firstRoundMatches / Math.pow(2, round - 1));
        for (let i = 0; i < numMatches; i++) {
          const match = new TournamentMatch({
            team1: null,
            team2: null,
            tournament: tournament._id,
            round,
            matchNumber: i + 1,
            sets: [],
            terrainType: terrainType || 'indoor',
            maxSets: maxSets || 3
          });
          await match.save();
          matches.push(match._id);
          matchesByRound[round - 1].push(match);

          // Lier les matchs de la ronde précédente à ce match
          const prevRound = round - 1;
          const prevMatch1 = matchesByRound[prevRound - 1][i * 2];
          const prevMatch2 = matchesByRound[prevRound - 1][i * 2 + 1] || null;

          if (prevMatch1) {
            prevMatch1.nextMatch = match._id;
            await prevMatch1.save();
          }
          if (prevMatch2) {
            prevMatch2.nextMatch = match._id;
            await prevMatch2.save();
          }
        }
      }
    } else if (tournament.tournamentType === 'GroupKnockout') {
      const teamsPerGroup = 4;
      const numGroups = Math.ceil(teams.length / teamsPerGroup);
      const groups = [];

      for (let i = 0; i < numGroups; i++) {
        const groupTeams = teams.slice(i * teamsPerGroup, (i + 1) * teamsPerGroup);
        const groupMatches = [];

        for (let j = 0; j < groupTeams.length; j++) {
          for (let k = j + 1; k < groupTeams.length; k++) {
            const match = new TournamentMatch({
              team1: groupTeams[j],
              team2: groupTeams[k],
              tournament: tournament._id,
              round: 1,
              matchNumber: matches.length + 1,
              groupName: `Groupe ${i + 1}`,
              sets: [],
              terrainType: terrainType || 'indoor',
              maxSets: maxSets || 3
            });
            await match.save();
            groupMatches.push(match._id);
            matches.push(match._id);
          }
        }

        groups.push({
          groupName: `Groupe ${i + 1}`,
          teams: groupTeams,
          matches: groupMatches
        });
      }

      tournament.structure.groups = groups;
      tournament.structure.rounds = 1;

      if (numGroups > 1) {
        const knockoutMatches = [];
        for (let i = 0; i < 2; i++) {
          const match = new TournamentMatch({
            team1: null,
            team2: null,
            tournament: tournament._id,
            round: 2,
            matchNumber: i + 1,
            sets: [],
            terrainType: terrainType || 'indoor',
            maxSets: maxSets || 3
          });
          await match.save();
          knockoutMatches.push(match._id);
          matches.push(match._id);
        }
        const finalMatch = new TournamentMatch({
          team1: null,
          team2: null,
          tournament: tournament._id,
          round: 3,
          matchNumber: 1,
          sets: [],
          terrainType: terrainType || 'indoor',
          maxSets: maxSets || 3
        });
        await finalMatch.save();
        matches.push(finalMatch._id);
        tournament.structure.rounds = 3;
      }
    }

    tournament.structure.matches = matches;
    await tournament.save();

    const populatedTournament = await Tournament.findById(tournament._id)
      .populate('organizer', 'username')
      .populate('teams', 'teamName players')
      .populate('structure.matches')
      .populate('structure.groups.teams', 'teamName')
      .populate('structure.groups.matches');

    res.json(populatedTournament);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mettre à jour le résultat d'un match
exports.updateMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { sets, winnerId } = req.body;

    const match = await TournamentMatch.findById(matchId).populate('team1 team2');
    if (!match) {
      return res.status(404).json({ message: 'Match non trouvé' });
    }

    const tournament = await Tournament.findById(match.tournament);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    // if (!tournament.organizer.some(org => org.toString() === req.user._id.toString())) {
    //   return res.status(403).json({ message: 'Non autorisé' });
    // }

    // Valider que le gagnant appartient au match
    if (winnerId && ![match.team1?._id.toString(), match.team2?._id.toString()].includes(winnerId)) {
      return res.status(400).json({ message: 'L\'équipe gagnante doit être l\'une des équipes du match' });
    }

    // Mettre à jour les sets et le gagnant
    match.sets = sets || [];
    match.winner = winnerId || null;
    // Ne pas définir score1/score2 pour TournamentMatch, car utilisé pour Match de base
    await match.save();

    // Propager le gagnant au match suivant
    if (match.nextMatch && winnerId) {
      const nextMatch = await TournamentMatch.findById(match.nextMatch);
      if (nextMatch) {
        const prevMatches = await TournamentMatch.find({ nextMatch: nextMatch._id });
        const matchIndex = prevMatches.findIndex(m => m._id.toString() === match._id.toString());

        if (matchIndex === 0) {
          nextMatch.team1 = winnerId;
        } else if (matchIndex === 1) {
          nextMatch.team2 = winnerId;
        }

        await nextMatch.save();

        // Réinitialiser les matchs suivants si nécessaire
        if (nextMatch.winner) {
          await resetSubsequentMatches(nextMatch);
        }
      }
    }

    const populatedMatch = await TournamentMatch.findById(matchId)
      .populate('team1', 'teamName')
      .populate('team2', 'teamName')
      .populate('winner', 'teamName')
      .populate('nextMatch');

    res.json(populatedMatch);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Réinitialiser les matchs suivants
async function resetSubsequentMatches(match) {
  if (!match || !match.nextMatch) return;

  const nextMatch = await TournamentMatch.findById(match.nextMatch);
  if (nextMatch) {
    nextMatch.winner = null;
    nextMatch.sets = [];
    nextMatch.team1 = null;
    nextMatch.team2 = null;
    await nextMatch.save();
    await resetSubsequentMatches(nextMatch);
  }
}

// Récupérer les matchs par ronde
exports.getMatchesByRound = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate({
        path: 'structure.matches',
        populate: [
          { path: 'team1', select: 'teamName' },
          { path: 'team2', select: 'teamName' },
          { path: 'winner', select: 'teamName' }
        ]
      });

    if (!tournament) {
      return res.status(404).json({ message: 'Tournoi non trouvé' });
    }

    const matchesByRound = {};
    tournament.structure.matches.forEach(match => {
      if (!matchesByRound[match.round]) {
        matchesByRound[match.round] = [];
      }
      matchesByRound[match.round].push(match);
    });

    res.json(matchesByRound);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};