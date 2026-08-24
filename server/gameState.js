// In-memory game state
const gameState = {
  phase: 'lobby', // 'lobby' | 'inProgress' | 'voting' | 'ended'
  config: {
    startingBalance: 1000,
    totalRounds: 5,
    showRoundCount: true,
    maxPlayers: 8,
    maxCharactersPerPlayer: 3,
    biddingMode: 'free', // 'free' | 'turnBased'
    timePerCharacter: 30,
    timeoutBehavior: 'skip' // 'skip' | 'finalize'
  },
  characterPool: [],
  players: {}, // { socketId: { name, balance, collection: [], connected: true, isHost: boolean } }
  currentRound: {
    index: 0,
    characterId: null,
    highestBid: 0,
    highestBidderId: null,
    bids: [],
    openerPlayerId: null // for turnBased mode
  },
  roundHistory: [],
  voting: {
    mode: null,
    items: [],
    votes: {} // { playerId: { targetId: value } }
  },
  hostParticipating: false, // Whether the host is also a player
  hostPlayerId: null // Socket ID of the host when participating
};

module.exports = gameState;
