// Player-specific functionality
class PlayerView {
    constructor(client) {
        this.client = client;
        this.currentBid = 0;
        this.timerInterval = null;
        this.setupEventListeners();
        
        // Load cached name if available
        const cachedName = localStorage.getItem('waifuAuctionPlayerName');
        if (cachedName) {
            document.getElementById('player-name').value = cachedName;
        }
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
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        const name = document.getElementById('player-name').value.trim();

        if (!roomCode) {
            alert('Por favor ingresa el código de sala');
            return;
        }

        if (!name) {
            alert('Por favor ingresa tu nombre');
            return;
        }

        this.client.playerName = name;
        this.client.connect(roomCode);
        this.showJoinStatus('Conectando...', 'success');
    }

    showJoinStatus(message, type) {
        const statusEl = document.getElementById('join-status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
    }

    onPlayerJoined(data) {
        // For P2P, we're connected immediately
        this.client.playerId = 'player-' + Date.now();
        
        // Save name to cache
        localStorage.setItem('waifuAuctionPlayerName', this.client.playerName);
        
        // Notify host that player joined
        if (this.client.room) {
            const playerJoined = this.client.room.makeAction('playerJoined');
            playerJoined.send({ playerId: this.client.playerId, playerName: this.client.playerName });
        }
        
        this.showJoinStatus('¡Unido exitosamente! Esperando al anfitrión...', 'success');
        this.client.showScreen('lobby-waiting');
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
        this.client.showScreen('game-screen');
        this.setupGameUI();
    }

    setupGameUI() {
        document.getElementById('player-name-display').textContent = this.client.playerName;
    }

    onRoundStart(data) {
        this.client.showScreen('game-screen');
        this.setupGameUI();
        
        const character = data.character;
        
        // Display character
        const characterDisplay = document.getElementById('character-display');
        if (character.isBlind) {
            characterDisplay.innerHTML = `
                <div class="blind-placeholder-large">🎭</div>
                <h2>${character.animeName}</h2>
                <p class="blind-mode-text">Personaje oculto (se revelará al final)</p>
            `;
        } else {
            characterDisplay.innerHTML = `
                <img src="${character.imageUrl}" alt="${character.characterName}">
                <h2>${character.characterName}</h2>
                <p>${character.animeName}</p>
            `;
        }

        // Reset bid display
        document.getElementById('current-bid').textContent = this.client.formatCurrency(0);
        document.getElementById('current-bidder').textContent = 'Nadie';
        
        // Enable bidding
        document.getElementById('bid-amount').disabled = false;
        document.getElementById('btn-bid').disabled = false;
        document.getElementById('btn-pass').disabled = false;
        
        // Start timer
        this.startRoundTimer(data.timeLimit);
    }

    startRoundTimer(seconds) {
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
        document.getElementById('current-bid').textContent = this.client.formatCurrency(data.amount);
        document.getElementById('current-bidder').textContent = `por ${data.playerName}`;
        this.currentBid = data.amount;
    }

    placeBid() {
        const bidAmount = parseInt(document.getElementById('bid-amount').value);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            alert('Ingresa una puja válida');
            return;
        }

        if (this.client.room) {
            const bidUpdate = this.client.room.makeAction('bidUpdate');
            bidUpdate.send({ playerId: this.client.playerId, playerName: this.client.playerName, amount: bidAmount });
        }
        document.getElementById('bid-amount').value = '';
    }

    pass() {
        if (this.client.room) {
            const bidUpdate = this.client.room.makeAction('bidUpdate');
            bidUpdate.send({ playerId: this.client.playerId, playerName: this.client.playerName, pass: true });
        }
        document.getElementById('bid-amount').disabled = true;
        document.getElementById('btn-bid').disabled = true;
        document.getElementById('btn-pass').disabled = true;
    }

    onRoundResult(data) {
        // Stop timer
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        // Show result screen
        this.client.showScreen('round-result');
        
        document.getElementById('result-image').src = data.character.imageUrl;
        document.getElementById('result-character').textContent = data.character.characterName;
        document.getElementById('result-anime').textContent = data.character.animeName;
        
        if (data.winnerName) {
            document.getElementById('result-winner').textContent = `Ganado por: ${data.winnerName}`;
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
            }
        }, 1000);
    }

    onGameEnd(data) {
        this.client.showScreen('final-results');
        this.displayFinalResults(data.players);
    }

    displayFinalResults(players) {
        const collectionsContainer = document.getElementById('final-collections');
        collectionsContainer.innerHTML = '';

        Object.entries(players).forEach(([playerId, player]) => {
            const collectionDiv = document.createElement('div');
            collectionDiv.className = 'player-collection';
            
            const characterCards = player.collection.map(char => {
                return `
                    <div class="collection-item">
                        <img src="${char.imageUrl}" alt="${char.characterName}">
                        <span class="price">${this.client.formatCurrency(char.price || 0)}</span>
                    </div>
                `;
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
}

// Initialize player view when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new PlayerView(client);
});
