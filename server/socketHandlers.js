const gameLogic = require('./gameLogic');
const gameState = require('./gameState');

function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Player joins lobby
    socket.on('player:join', ({ name, roomCode }) => {
      if (gameState.phase !== 'lobby') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      // Validate room code
      if (!gameLogic.validateRoomCode(roomCode)) {
        socket.emit('player:joined', { success: false, error: 'Invalid room code' });
        return;
      }

      const success = gameLogic.addPlayer(socket.id, name);
      
      if (success) {
        io.emit('lobby:update', { players: gameLogic.getAllPlayers() });
        socket.emit('player:joined', { success: true, playerId: socket.id });
      } else {
        socket.emit('player:joined', { success: false, error: 'Game is full' });
      }
    });

    // Host starts game
    socket.on('host:startGame', () => {
      const firstCharacter = gameLogic.startRound(0);
      
      if (firstCharacter) {
        const state = gameLogic.getGameState();
        io.emit('game:start', { state });
        
        io.emit('round:start', {
          roundIndex: state.currentRound.index,
          animeName: firstCharacter.animeName,
          timeLimit: state.config.timePerCharacter,
          roundTotal: state.config.showRoundCount ? state.config.totalRounds : null,
          openerPlayerId: state.currentRound.openerPlayerId
        });
      }
    });

    // Player places bid
    socket.on('player:bid', ({ amount }) => {
      const success = gameLogic.placeBid(socket.id, amount);
      
      if (success) {
        const state = gameLogic.getGameState();
        io.emit('round:bidUpdate', {
          highestBid: state.currentRound.highestBid,
          highestBidderId: state.currentRound.highestBidderId
        });
      } else {
        socket.emit('bid:rejected', { reason: 'Invalid bid' });
      }
    });

    // Player passes
    socket.on('player:pass', () => {
      gameLogic.playerPass(socket.id);
      socket.emit('player:passed', { playerId: socket.id });
    });

    // Host resolves round (timer ended or manual)
    socket.on('host:resolveRound', () => {
      const result = gameLogic.resolveRound();
      const state = gameLogic.getGameState();
      
      io.emit('round:result', {
        winnerId: result.winnerId,
        characterName: result.character.characterName,
        imageUrl: result.character.imageUrl,
        animeName: result.character.animeName,
        winningBid: result.winningBid,
        balances: Object.fromEntries(
          Object.entries(result.players).map(([id, p]) => [id, p.balance])
        ),
        collections: Object.fromEntries(
          Object.entries(result.players).map(([id, p]) => [id, p.collection])
        )
      });

      // Check if game should continue
      if (state.currentRound.index < state.config.totalRounds - 1) {
        // Start next round after delay
        setTimeout(() => {
          const nextCharacter = gameLogic.startRound(state.currentRound.index + 1);
          const newState = gameLogic.getGameState();
          
          io.emit('round:start', {
            roundIndex: newState.currentRound.index,
            animeName: nextCharacter.animeName,
            timeLimit: newState.config.timePerCharacter,
            roundTotal: newState.config.showRoundCount ? newState.config.totalRounds : null,
            openerPlayerId: newState.currentRound.openerPlayerId
          });
        }, 3000);
      } else {
        // Game ended, go to voting
        gameState.phase = 'ended';
        io.emit('game:readyForVoting', { state: gameLogic.getGameState() });
      }
    });

    // Host joins
    socket.on('host:join', () => {
      if (gameState.phase !== 'lobby') {
        socket.emit('error', { message: 'Game already in progress' });
        return;
      }

      // Reset game state for new host
      gameLogic.resetGame();
      
      // Generate room code
      const roomCode = gameLogic.generateRoomCode();
      gameLogic.setRoomCode(roomCode);
      
      socket.emit('host:joined', { success: true, roomCode });
    });

    // Host starts voting
    socket.on('host:startVoting', ({ mode }) => {
      if (mode === 'skip') {
        // Skip to results
        const state = gameLogic.getGameState();
        io.emit('game:end', { summary: state });
      } else {
        gameLogic.startVoting(mode);
        const state = gameLogic.getGameState();
        io.emit('voting:start', {
          mode: state.voting.mode,
          items: state.voting.items
        });
      }
    });

    // Player votes
    socket.on('player:vote', ({ targetId, value }) => {
      gameLogic.castVote(socket.id, targetId, value);
      
      // Check if all players voted
      const state = gameLogic.getGameState();
      const playerCount = Object.keys(state.players).length;
      const votesReceived = Object.keys(state.voting.votes).length;
      
      if (votesReceived >= playerCount) {
        const results = gameLogic.calculateVotingResults();
        io.emit('voting:result', { results });
      }
    });

    // Host ends voting
    socket.on('host:endVoting', () => {
      const results = gameLogic.calculateVotingResults();
      io.emit('voting:result', { results });
    });

    // Host ends game
    socket.on('host:endGame', () => {
      const state = gameLogic.getGameState();
      io.emit('game:end', { summary: state });
    });

    // Host updates config
    socket.on('host:updateConfig', (config) => {
      gameLogic.setConfig(config);
      io.emit('config:updated', { config: gameLogic.getGameState().config });
    });

    // Host joins as player
    socket.on('host:joinAsPlayer', ({ name }) => {
      const success = gameLogic.addPlayer(socket.id, name, true);
      
      if (success) {
        io.emit('lobby:update', { players: gameLogic.getAllPlayers() });
        socket.emit('player:joined', { success: true, playerId: socket.id, isHost: true });
      } else {
        socket.emit('player:joined', { success: false, error: 'Game is full' });
      }
    });

    // Host sets character pool
    socket.on('host:setPool', ({ characters }) => {
      gameLogic.setCharacterPool(characters);
      io.emit('pool:updated', { 
        characters, 
        totalRounds: gameLogic.getGameState().config.totalRounds 
      });
    });

    // Player disconnects
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      const player = gameLogic.getPlayer(socket.id);
      if (player) {
        player.connected = false;
        io.emit('lobby:update', { players: gameLogic.getAllPlayers() });
      }
    });

    // Player reconnects
    socket.on('player:reconnect', ({ playerId, name }) => {
      // Check if player exists
      const existingPlayer = gameLogic.getPlayer(playerId);
      if (existingPlayer) {
        existingPlayer.connected = true;
        // Update socket ID mapping (simplified - in production you'd want proper session management)
        delete gameState.players[playerId];
        gameState.players[socket.id] = existingPlayer;
        
        io.emit('lobby:update', { players: gameLogic.getAllPlayers() });
        socket.emit('player:reconnected', { 
          success: true, 
          state: gameLogic.getGameState() 
        });
      } else {
        // Treat as new player
        const success = gameLogic.addPlayer(socket.id, name);
        if (success) {
          io.emit('lobby:update', { players: gameLogic.getAllPlayers() });
          socket.emit('player:joined', { success: true, playerId: socket.id });
        }
      }
    });
  });
}

module.exports = setupSocketHandlers;
