// Player-specific functionality
class PlayerView {
    constructor(client) {
        this.client = client;
        this.currentBid = 0;
        this.timerInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Role selection
        document.getElementById('btn-player').addEventListener('click', () => {
            this.client.isHost = false;
            this.client.showScreen('player-join');
        });

        // Join game
        document.getElementById('btn-join-game').addEventListener('click', () => this.joinGame());

        // Bidding controls
        document.getElementById('btn-bid').addEventListener('click', () => this.placeBid());
        document.getElementById('btn-pass').addEventListener('click', () => this.pass());

        // Bid input enter key
        document.getElementById('bid-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.placeBid();
        });
    }

    joinGame() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim();

        if (!name) {
            this.showJoinStatus('Por favor ingresa tu nombre', 'error');
            return;
        }

        this.client.playerName = name;
        this.client.connect();
        
        this.client.socket.emit('player:join', { name });
    }

    showJoinStatus(message, type) {
        const statusEl = document.getElementById('join-status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
    }

    onPlayerJoined(data) {
        if (data.success) {
            this.client.showScreen('lobby-waiting');
        } else {
            this.showJoinStatus(data.error || 'Error al unirse', 'error');
        }
    }

    onJoinError(data) {
        this.showJoinStatus(data.error || 'Error al unirse', 'error');
    }

    onLobbyUpdate(data) {
        this.updateWaitingLobby(data.players);
    }

    updateWaitingLobby(players) {
        const waitingPlayers = document.getElementById('waiting-players');
        waitingPlayers.innerHTML = '';

        Object.entries(players).forEach(([id, player]) => {
            const card = document.createElement('div');
            card.className = `player-card ${player.connected ? 'connected' : 'disconnected'}`;
            card.innerHTML = `
                <h4>${player.name}</h4>
                <p class="status">${player.connected ? '✓ Conectado' : '✗ Desconectado'}</p>
            `;
            waitingPlayers.appendChild(card);
        });
    }

    onGameStart(data) {
        this.client.gameState = data.state;
        this.client.showScreen('game-screen');
        this.setupGameUI();
    }

    setupGameUI() {
        document.getElementById('player-name-display').textContent = this.client.playerName;
        this.updatePlayerInfo();
    }

    updatePlayerInfo() {
        if (!this.client.gameState || !this.client.gameState.players[this.client.playerId]) {
            return;
        }

        const player = this.client.gameState.players[this.client.playerId];
        document.getElementById('player-balance').textContent = this.client.formatCurrency(player.balance);
        document.getElementById('player-collection').textContent = 
            `${player.collection.length}/${this.client.gameState.config.maxCharactersPerPlayer}`;
    }

    onRoundStart(data) {
        // Update round display
        const roundDisplay = document.getElementById('round-display');
        if (data.roundTotal) {
            roundDisplay.textContent = `Ronda ${data.roundIndex + 1} de ${data.roundTotal}`;
        } else {
            roundDisplay.textContent = `Ronda ${data.roundIndex + 1}`;
        }

        // Update anime name
        document.getElementById('anime-name').textContent = data.animeName;

        // Reset bid display
        document.getElementById('current-bid').textContent = '0';
        document.getElementById('current-bidder').textContent = '-';

        // Reset bidding controls
        document.getElementById('bid-amount').value = '';
        document.getElementById('bid-amount').disabled = false;
        document.getElementById('btn-bid').disabled = false;
        document.getElementById('btn-pass').disabled = false;

        // Show/hide turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (data.openerPlayerId) {
            turnIndicator.classList.remove('hidden');
            // Get opener name from gameState
            if (this.client.gameState && this.client.gameState.players[data.openerPlayerId]) {
                document.getElementById('opener-name').textContent = 
                    this.client.gameState.players[data.openerPlayerId].name;
            }
        } else {
            turnIndicator.classList.add('hidden');
        }

        // Start timer
        this.startTimer(data.timeLimit);

        // Update players summary
        this.updatePlayersSummary();
    }

    startTimer(seconds) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        let timeLeft = seconds;
        const timerDisplay = document.getElementById('timer');
        timerDisplay.textContent = timeLeft;

        this.timerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(this.timerInterval);
                // Timer ended - host will resolve the round
            }
        }, 1000);
    }

    onBidUpdate(data) {
        document.getElementById('current-bid').textContent = this.client.formatCurrency(data.highestBid);
        
        if (data.highestBidderId && this.client.gameState && this.client.gameState.players[data.highestBidderId]) {
            const bidderName = this.client.gameState.players[data.highestBidderId].name;
            document.getElementById('current-bidder').textContent = `por ${bidderName}`;
        } else {
            document.getElementById('current-bidder').textContent = '-';
        }

        // Update current bid reference
        this.currentBid = data.highestBid;

        // Check if current player can still bid
        this.updateBiddingControls();
    }

    updateBiddingControls() {
        const canBid = this.canPlayerBid();
        document.getElementById('bid-amount').disabled = !canBid;
        document.getElementById('btn-bid').disabled = !canBid;
        document.getElementById('btn-pass').disabled = !canBid;
    }

    canPlayerBid() {
        if (!this.client.gameState) return false;
        
        const player = this.client.gameState.players[this.client.playerId];
        if (!player) return false;

        // Check balance
        if (player.balance <= this.currentBid) return false;

        // Check character limit
        if (player.collection.length >= this.client.gameState.config.maxCharactersPerPlayer) return false;

        // Check turn-based mode
        if (this.client.gameState.config.biddingMode === 'turnBased' && this.currentBid === 0) {
            const currentRound = this.client.gameState.currentRound;
            if (currentRound.openerPlayerId && currentRound.openerPlayerId !== this.client.playerId) {
                return false;
            }
        }

        return true;
    }

    placeBid() {
        const bidInput = document.getElementById('bid-amount');
        const amount = parseInt(bidInput.value);

        if (!amount || amount <= this.currentBid) {
            alert('La puja debe ser mayor que la puja actual');
            return;
        }

        this.client.socket.emit('player:bid', { amount });
        bidInput.value = '';
    }

    pass() {
        this.client.socket.emit('player:pass');
        document.getElementById('bid-amount').disabled = true;
        document.getElementById('btn-bid').disabled = true;
        document.getElementById('btn-pass').disabled = true;
    }

    onBidRejected(data) {
        alert(`Puja rechazada: ${data.reason}`);
    }

    onPlayerPassed(data) {
        // Could add visual feedback for passed players
    }

    onRoundResult(data) {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Update local game state
        if (this.client.gameState && this.client.gameState.players[this.client.playerId]) {
            this.client.gameState.players[this.client.playerId].balance = data.balances[this.client.playerId];
            this.client.gameState.players[this.client.playerId].collection = data.collections[this.client.playerId];
        }

        // Show result screen
        this.client.showScreen('round-result');
        
        document.getElementById('result-image').src = data.imageUrl;
        document.getElementById('result-character').textContent = data.characterName;
        document.getElementById('result-anime').textContent = data.animeName;
        
        if (data.winnerId && this.client.gameState && this.client.gameState.players[data.winnerId]) {
            document.getElementById('result-winner').textContent = 
                `Ganado por: ${this.client.gameState.players[data.winnerId].name}`;
        } else {
            document.getElementById('result-winner').textContent = 'Sin ganador';
        }
        
        document.getElementById('result-bid').textContent = `Puja: ${this.client.formatCurrency(data.winningBid)}`;

        // Countdown for next round
        let countdown = 3;
        const countdownEl = document.getElementById('next-round-countdown');
        countdownEl.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Return to game screen for next round
                this.client.showScreen('game-screen');
                this.updatePlayerInfo();
            }
        }, 1000);
    }

    updatePlayersSummary() {
        if (!this.client.gameState) return;

        const playersSummary = document.getElementById('game-players');
        playersSummary.innerHTML = '';

        Object.entries(this.client.gameState.players).forEach(([playerId, player]) => {
            const card = document.createElement('div');
            card.className = 'mini-player-card';
            card.innerHTML = `
                <strong>${player.name}</strong><br>
                💰 ${this.client.formatCurrency(player.balance)}<br>
                🎭 ${player.collection.length}/${this.client.gameState.config.maxCharactersPerPlayer}
            `;
            playersSummary.appendChild(card);
        });
    }

    onReadyForVoting(data) {
        // Players wait for host to select voting mode
        this.client.showScreen('lobby-waiting');
        document.querySelector('#lobby-waiting h1').textContent = '⏳ Esperando Votación';
        document.querySelector('#lobby-waiting p').textContent = 'El anfitrión está seleccionando el modo de votación...';
    }

    onVotingStart(data) {
        this.client.showScreen('voting-screen');
        this.setupVotingUI(data);
    }

    setupVotingUI(data) {
        const modeDisplay = document.getElementById('voting-mode-display');
        const itemsContainer = document.getElementById('voting-items');
        
        // Display mode
        const modeNames = {
            'byPrice': 'Por Precio - Vota por la mejor compra de cada jugador',
            'oneByOne': 'Uno por Uno - Califica cada personaje del 1 al 10',
            'byRound': 'Por Ronda - Vota por el mejor personaje de cada ronda'
        };
        modeDisplay.textContent = modeNames[data.mode] || data.mode;

        // Display items
        itemsContainer.innerHTML = '';
        this.currentVoteData = { mode: data.mode, votedItems: new Set() };

        data.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'voting-item';
            itemDiv.dataset.itemId = item.id;

            let content = '';
            if (item.type === 'character' && item.character) {
                content = `
                    <img src="${item.character.imageUrl}" alt="${item.name}">
                    <h4>${item.name}</h4>
                    <p>${item.character.animeName}</p>
                `;
            } else if (item.type === 'player') {
                content = `
                    <h4>${item.name}</h4>
                    <p>Mejor compra: ${item.character ? item.character.characterName : 'N/A'}</p>
                `;
            } else if (item.type === 'round') {
                content = `
                    <h4>${item.name}</h4>
                    <p>${item.characters.length} personajes</p>
                `;
            }

            // Add rating buttons for oneByOne mode
            if (data.mode === 'oneByOne') {
                content += `
                    <div class="rating">
                        ${[1,2,3,4,5,6,7,8,9,10].map(num => 
                            `<button class="rating-btn" data-value="${num}">${num}</button>`
                        ).join('')}
                    </div>
                `;
            } else {
                content += `
                    <button class="btn btn-primary vote-btn" data-item-id="${item.id}">Votar</button>
                `;
            }

            itemDiv.innerHTML = content;
            itemsContainer.appendChild(itemDiv);
        });

        // Add event listeners
        if (data.mode === 'oneByOne') {
            itemsContainer.querySelectorAll('.rating-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemDiv = e.target.closest('.voting-item');
                    const itemId = itemDiv.dataset.itemId;
                    const value = parseInt(e.target.dataset.value);
                    
                    // Remove active class from siblings
                    itemDiv.querySelectorAll('.rating-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    
                    this.submitVote(itemId, value);
                });
            });
        } else {
            itemsContainer.querySelectorAll('.vote-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const itemId = e.target.dataset.itemId;
                    this.submitVote(itemId, 1); // Simple vote
                });
            });
        }
    }

    submitVote(targetId, value) {
        if (this.currentVoteData.votedItems.has(targetId)) {
            return; // Already voted for this item
        }

        this.currentVoteData.votedItems.add(targetId);
        this.client.socket.emit('player:vote', { targetId, value });

        // Disable voting for this item
        const itemDiv = document.querySelector(`.voting-item[data-item-id="${targetId}"]`);
        if (itemDiv) {
            itemDiv.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }

        // Check if all items voted
        const totalItems = document.querySelectorAll('.voting-item').length;
        if (this.currentVoteData.votedItems.size >= totalItems) {
            document.getElementById('voting-status').textContent = '✓ Votos enviados. Esperando resultados...';
            document.getElementById('voting-status').className = 'status-message success';
        }
    }

    onVotingResult(data) {
        this.client.showScreen('voting-results');
        this.displayVotingResults(data.results);
    }

    displayVotingResults(results) {
        const resultsList = document.getElementById('voting-results-list');
        resultsList.innerHTML = '';

        const sortedResults = Object.values(results).sort((a, b) => b.average - a.average);

        sortedResults.forEach((result, index) => {
            const item = document.createElement('div');
            item.className = `result-item ${index === 0 ? 'winner' : ''}`;
            
            let content = '';
            if (result.type === 'character' && result.character) {
                content = `
                    <img src="${result.character.imageUrl}" alt="${result.name}">
                    <div class="result-item-info">
                        <h4>${result.name}</h4>
                        <p>${result.character.animeName}</p>
                        <p class="score">Puntuación: ${result.average.toFixed(1)}</p>
                    </div>
                `;
            } else if (result.type === 'player') {
                content = `
                    <div class="result-item-info">
                        <h4>${result.name}</h4>
                        <p>Mejor compra: ${result.character ? result.character.characterName : 'N/A'}</p>
                        <p class="score">Puntuación: ${result.average.toFixed(1)}</p>
                    </div>
                `;
            } else if (result.type === 'round') {
                content = `
                    <div class="result-item-info">
                        <h4>${result.name}</h4>
                        <p>${result.characters.length} personajes</p>
                        <p class="score">Puntuación: ${result.average.toFixed(1)}</p>
                    </div>
                `;
            }

            item.innerHTML = content;
            resultsList.appendChild(item);
        });

        // Change button text for players
        const finalResultsBtn = document.getElementById('btn-final-results');
        finalResultsBtn.textContent = 'Esperando al anfitrión...';
        finalResultsBtn.disabled = true;
    }

    onGameEnd(data) {
        this.client.showScreen('final-results');
        this.displayFinalResults(data.summary);
    }

    displayFinalResults(state) {
        const collectionsContainer = document.getElementById('final-collections');
        collectionsContainer.innerHTML = '';

        Object.entries(state.players).forEach(([playerId, player]) => {
            const collectionDiv = document.createElement('div');
            collectionDiv.className = 'player-collection';
            
            const characterCards = player.collection.map(charId => {
                const roundResult = state.roundHistory.find(r => r.characterId === charId);
                if (roundResult) {
                    return `
                        <div class="collection-item">
                            <img src="${roundResult.imageUrl}" alt="${roundResult.characterName}">
                            <span class="price">${roundResult.winningBid}</span>
                        </div>
                    `;
                }
                return '';
            }).join('');

            collectionDiv.innerHTML = `
                <h3>${player.name}</h3>
                <p>Saldo restante: ${this.client.formatCurrency(player.balance)}</p>
                <p>Personajes: ${player.collection.length}</p>
                <div class="collection-grid">
                    ${characterCards}
                </div>
            `;

            collectionsContainer.appendChild(collectionDiv);
        });

        // Hide new game button for players
        document.getElementById('btn-new-game').style.display = 'none';
    }

    onReconnected(data) {
        // Restore game state and show appropriate screen
        if (data.state.phase === 'lobby') {
            this.client.showScreen('lobby-waiting');
            this.updateWaitingLobby(data.state.players);
        } else if (data.state.phase === 'inProgress') {
            this.client.showScreen('game-screen');
            this.client.gameState = data.state;
            this.setupGameUI();
        } else if (data.state.phase === 'voting') {
            this.client.showScreen('lobby-waiting');
            document.querySelector('#lobby-waiting h1').textContent = '⏳ Votación en progreso';
        } else if (data.state.phase === 'ended') {
            this.client.showScreen('final-results');
            this.displayFinalResults(data.state);
        }
    }
}

// Initialize player view when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PlayerView(client);
});
