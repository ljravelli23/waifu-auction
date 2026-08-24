const gameState = require('./gameState');

// Player management
function addPlayer(socketId, name, isHost = false) {
  if (Object.keys(gameState.players).length >= gameState.config.maxPlayers) {
    return false;
  }
  
  gameState.players[socketId] = {
    name,
    balance: gameState.config.startingBalance,
    collection: [],
    connected: true,
    isHost: isHost
  };

  if (isHost) {
    gameState.hostPlayerId = socketId;
    gameState.hostParticipating = true;
  }
  
  return true;
}

function removePlayer(socketId) {
  delete gameState.players[socketId];
}

function getPlayer(socketId) {
  return gameState.players[socketId];
}

function getAllPlayers() {
  return gameState.players;
}

// Game configuration
function setConfig(config) {
  gameState.config = { ...gameState.config, ...config };
}

function setCharacterPool(characters) {
  gameState.characterPool = characters;
  gameState.config.totalRounds = characters.length;
}

// Round management
function startRound(roundIndex) {
  if (roundIndex >= gameState.characterPool.length) {
    return false;
  }

  const character = gameState.characterPool[roundIndex];
  gameState.currentRound = {
    index: roundIndex,
    characterId: character.id,
    highestBid: 0,
    highestBidderId: null,
    bids: [],
    openerPlayerId: null
  };

  // Set opener for turnBased mode
  if (gameState.config.biddingMode === 'turnBased') {
    const playerIds = Object.keys(gameState.players);
    const openerIndex = roundIndex % playerIds.length;
    gameState.currentRound.openerPlayerId = playerIds[openerIndex];
  }

  gameState.phase = 'inProgress';
  return character;
}

function placeBid(playerId, amount) {
  const player = gameState.players[playerId];
  if (!player) return false;

  // Check if player can bid
  if (amount > player.balance) return false;
  if (amount <= gameState.currentRound.highestBid) return false;
  if (player.collection.length >= gameState.config.maxCharactersPerPlayer) return false;

  // Check if it's turnBased and this player needs to open
  if (gameState.config.biddingMode === 'turnBased' && 
      gameState.currentRound.highestBid === 0 && 
      gameState.currentRound.openerPlayerId && 
      gameState.currentRound.openerPlayerId !== playerId) {
    return false;
  }

  // Place bid
  gameState.currentRound.highestBid = amount;
  gameState.currentRound.highestBidderId = playerId;
  gameState.currentRound.bids.push({
    playerId,
    amount,
    timestamp: Date.now()
  });

  return true;
}

function resolveRound() {
  const { highestBidderId, characterId, index } = gameState.currentRound;
  
  let winnerId = null;
  let winningBid = 0;

  if (highestBidderId && highestBid > 0) {
    winnerId = highestBidderId;
    winningBid = highestBid;

    // Deduct balance and add to collection
    gameState.players[winnerId].balance -= winningBid;
    gameState.players[winnerId].collection.push(characterId);
  }

  // Save to history
  const character = gameState.characterPool[index];
  gameState.roundHistory.push({
    index,
    characterId,
    characterName: character.characterName,
    animeName: character.animeName,
    imageUrl: character.imageUrl,
    winnerId,
    winningBid,
    bids: [...gameState.currentRound.bids]
  });

  return {
    winnerId,
    character,
    winningBid,
    players: gameState.players
  };
}

function playerPass(playerId) {
  // Mark that player passed (can add tracking if needed)
  return true;
}

function canPlayerBid(playerId) {
  const player = gameState.players[playerId];
  if (!player) return false;
  if (player.balance <= gameState.currentRound.highestBid) return false;
  if (player.collection.length >= gameState.config.maxCharactersPerPlayer) return false;
  
  // Check turnBased opener requirement
  if (gameState.config.biddingMode === 'turnBased' && 
      gameState.currentRound.highestBid === 0 && 
      gameState.currentRound.openerPlayerId && 
      gameState.currentRound.openerPlayerId !== playerId) {
    return false;
  }

  return true;
}

// Voting
function startVoting(mode) {
  gameState.phase = 'voting';
  gameState.voting = {
    mode,
    items: [],
    votes: {}
  };

  // Prepare voting items based on mode
  if (mode === 'byPrice') {
    // Group by player, get their most expensive purchase
    Object.keys(gameState.players).forEach(playerId => {
      const player = gameState.players[playerId];
      const purchases = gameState.roundHistory
        .filter(r => r.winnerId === playerId)
        .sort((a, b) => b.winningBid - a.winningBid);
      
      if (purchases.length > 0) {
        gameState.voting.items.push({
          id: playerId,
          type: 'player',
          name: player.name,
          character: purchases[0],
          value: purchases[0].winningBid
        });
      }
    });
  } else if (mode === 'oneByOne') {
    // All purchased characters
    gameState.roundHistory
      .filter(r => r.winnerId)
      .forEach(r => {
        gameState.voting.items.push({
          id: r.characterId,
          type: 'character',
          name: r.characterName,
          character: r,
          value: 0
        });
      });
  } else if (mode === 'byRound') {
    // Group by round
    const rounds = {};
    gameState.roundHistory.forEach(r => {
      if (!rounds[r.index]) {
        rounds[r.index] = [];
      }
      if (r.winnerId) {
        rounds[r.index].push(r);
      }
    });
    
    Object.keys(rounds).forEach(roundIndex => {
      gameState.voting.items.push({
        id: `round-${roundIndex}`,
        type: 'round',
        name: `Ronda ${parseInt(roundIndex) + 1}`,
        characters: rounds[roundIndex],
        value: 0
      });
    });
  }
}

function castVote(playerId, targetId, value) {
  if (!gameState.voting.votes[playerId]) {
    gameState.voting.votes[playerId] = {};
  }
  gameState.voting.votes[playerId][targetId] = value;
  return true;
}

function calculateVotingResults() {
  const results = {};
  
  gameState.voting.items.forEach(item => {
    let total = 0;
    let count = 0;
    
    Object.values(gameState.voting.votes).forEach(playerVotes => {
      if (playerVotes[item.id] !== undefined) {
        total += playerVotes[item.id];
        count++;
      }
    });
    
    results[item.id] = {
      ...item,
      average: count > 0 ? total / count : 0,
      totalVotes: count
    };
  });

  return results;
}

// Game state
function getGameState() {
  return {
    phase: gameState.phase,
    config: gameState.config,
    players: gameState.players,
    currentRound: gameState.currentRound,
    roundHistory: gameState.roundHistory,
    voting: gameState.voting
  };
}

function resetGame() {
  gameState.phase = 'lobby';
  gameState.characterPool = [];
  gameState.players = {};
  gameState.currentRound = {
    index: 0,
    characterId: null,
    highestBid: 0,
    highestBidderId: null,
    bids: [],
    openerPlayerId: null
  };
  gameState.roundHistory = [];
  gameState.voting = {
    mode: null,
    items: [],
    votes: {}
  };
  gameState.hostParticipating = false;
  gameState.hostPlayerId = null;
  gameState.roomCode = null;
}

function generateRoomCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

function setRoomCode(code) {
  gameState.roomCode = code;
}

function getRoomCode() {
  return gameState.roomCode;
}

function validateRoomCode(code) {
  return gameState.roomCode === code.toUpperCase();
}

function setHostParticipating(participating) {
  gameState.hostParticipating = participating;
}

module.exports = {
  addPlayer,
  removePlayer,
  getPlayer,
  getAllPlayers,
  setConfig,
  setCharacterPool,
  startRound,
  placeBid,
  resolveRound,
  playerPass,
  canPlayerBid,
  startVoting,
  castVote,
  calculateVotingResults,
  getGameState,
  resetGame,
  setHostParticipating,
  generateRoomCode,
  setRoomCode,
  getRoomCode,
  validateRoomCode
};
