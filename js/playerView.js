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
        // Join game
        const joinBtn = document.getElementById('btn-join-game');
        if (joinBtn) {
            joinBtn.addEventListener('click', () => this.joinGame());
        }

        // Bidding controls
        document.getElementById('btn-bid').addEventListener('click', () => this.placeBid());
        document.getElementById('btn-pass').addEventListener('click', () => this.pass());

        // Bid input enter key
        document.getElementById('bid-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.placeBid();
        });

        // Player Selection UI
        const btnPlayerSearch = document.getElementById('btn-player-search');
        if (btnPlayerSearch) {
            btnPlayerSearch.addEventListener('click', () => this.searchCharactersForSelection());
        }
        const playerSearchInput = document.getElementById('player-anilist-search');
        if (playerSearchInput) {
            playerSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchCharactersForSelection();
            });
        }
    }

    joinGame() {
        const roomCode = document.getElementById('room-code').value.trim().toUpperCase();
        const name = document.getElementById('player-name').value.trim();

        if (!name) {
            alert('Por favor ingresa tu nombre');
            return;
        }

        if (!roomCode) {
            alert('Por favor ingresa el código de sala');
            return;
        }

        this.client.isHost = false;
        this.client.playerName = name;
        localStorage.setItem('waifuAuctionPlayerName', name);

        // Hide config controls for player
        const configInputs = document.querySelectorAll('.config-panel input, .config-panel select');
        configInputs.forEach(input => input.disabled = true);
        
        // Change start button to waiting state
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.disabled = true;
            startBtn.textContent = 'Esperando al host...';
        }

        this.client.connect(roomCode);
        this.client.showScreen('unified-lobby');
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
            this.client.send('playerJoined', { playerId: this.client.playerId, playerName: this.client.playerName });
        }
        
        this.showJoinStatus('¡Unido exitosamente! Esperando al anfitrión...', 'success');
        this.client.showScreen('unified-lobby');
    }

    onJoinError(data) {
        this.showJoinStatus(data.error || 'Error al unirse', 'error');
    }

    onLobbyUpdate(data) {
        this.updateWaitingLobby(data.players);
    }

    updateWaitingLobby(players) {
        const waitingPlayers = document.getElementById('lobby-players');
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

    onConfigUpdated(config) {
        document.getElementById(`mode-${config.gameMode}`).checked = true;
        document.getElementById('config-enableMaxWaifus').checked = config.enableMaxWaifus;
        document.getElementById('config-maxWaifus').value = config.maxWaifus;
        document.getElementById('config-enableMaxRounds').checked = config.enableMaxRounds;
        document.getElementById('config-maxRounds').value = config.maxRounds;
        document.getElementById('config-startingBalance').value = config.startingBalance;
        document.getElementById('config-biddingMode').value = config.biddingMode;
        
        // Ensure inputs stay disabled for players
        const configInputs = document.querySelectorAll('.config-panel input, .config-panel select');
        configInputs.forEach(input => input.disabled = true);
    }

    onPoolUpdated(data) {
        // Pool is no longer shown in the new unified lobby, but we might need it later
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
        const characterDisplay = document.getElementById('character-reveal');
        if (character.isBlind) {
            characterDisplay.innerHTML = `
                <div class="blind-placeholder-large">🎭</div>
                <h3 id="anime-name">${character.animeName}</h3>
                <p class="blind-mode-text" id="blind-mode-msg">Personaje oculto (se revelará al final)</p>
            `;
        } else {
            characterDisplay.innerHTML = `
                <img src="${character.imageUrl}" alt="${character.characterName}" style="max-width: 200px; max-height: 200px; border-radius: 8px;">
                <h3 id="anime-name">${character.animeName}</h3>
                <p>${character.characterName}</p>
            `;
        }

        // Reset bid display
        document.getElementById('current-bid').textContent = this.client.formatCurrency(0);
        document.getElementById('current-bidder').textContent = 'Nadie';
        
        // Enable bidding controls
        document.getElementById('btn-bid').disabled = false;
        document.getElementById('btn-pass').disabled = false;
        document.getElementById('bid-amount').disabled = false;
        
        // Start timer
        this.startRoundTimer(data.timeLimit);
    }

    onTimerUpdate(data) {
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = data.timeLeft;
        }
    }

    onRequestCharacterSelection(data) {
        this.client.showScreen('player-selection-screen');
        document.getElementById('player-selection-blind').checked = false;
        document.getElementById('player-anilist-search').value = '';
        document.getElementById('player-search-results').innerHTML = '';
    }

    async searchCharactersForSelection() {
        const query = document.getElementById('player-anilist-search').value.trim();
        if (!query) return;

        const resultsContainer = document.getElementById('player-search-results');
        resultsContainer.innerHTML = '<p>Buscando...</p>';

        const result = await this.client.searchAniList(query, [], 'all');
        this.currentAnimeName = result.animeTitle || query;
        
        resultsContainer.innerHTML = '';
        
        if (result.characters.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados</p>';
            return;
        }

        result.characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'search-item';
            item.innerHTML = `
                <img src="${char.image.large}" alt="${char.name.full}">
                <div class="search-item-info">
                    <h4>${char.name.full}</h4>
                    <p>${char.gender || 'Género desconocido'}</p>
                </div>
            `;
            item.addEventListener('click', () => {
                const isBlind = document.getElementById('player-selection-blind').checked;
                const normalizedChar = {
                    id: char.id,
                    characterName: char.characterName || char.name?.full || 'Unknown',
                    imageUrl: char.imageUrl || char.image?.large || '',
                    animeName: char.animeName || this.currentAnimeName || 'Unknown',
                    isBlind: isBlind
                };
                
                // Send selected character to host
                if (this.client.room) {
                    this.client.send('characterSelected', { character: normalizedChar });
                }
                
                // Show game screen again
                this.client.showScreen('game-screen');
                document.getElementById('character-reveal').innerHTML = `<h3>Esperando a que inicie la subasta...</h3>`;
            });
            resultsContainer.appendChild(item);
        });
    }

    startRoundTimer(seconds) {
        // Timer is now fully controlled by the host via timerUpdate events
        const timerDisplay = document.getElementById('timer');
        if (timerDisplay) {
            timerDisplay.textContent = seconds;
        }
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
            this.client.send('bidUpdate', { playerId: this.client.playerId, playerName: this.client.playerName, amount: bidAmount });
        }
        document.getElementById('bid-amount').value = '';
    }

    pass() {
        if (this.client.room) {
            this.client.send('bidUpdate', { playerId: this.client.playerId, playerName: this.client.playerName, pass: true });
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

        // Sync local stats
        if (data.balances && data.balances[this.client.playerId] !== undefined) {
            document.getElementById('player-balance').textContent = this.client.formatCurrency(data.balances[this.client.playerId]);
        }
        if (data.collections && data.collections[this.client.playerId] !== undefined) {
            const maxWaifus = document.getElementById('config-enableMaxWaifus').checked ? document.getElementById('config-maxWaifus').value : '∞';
            document.getElementById('player-collection').textContent = `${data.collections[this.client.playerId].length}/${maxWaifus}`;
        }

        // Countdown for next round
        let countdown = 3;
        const countdownEl = document.getElementById('next-round-countdown');
        countdownEl.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Transition will be handled by the next onRoundStart or onGameEnd event from the host
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
    client.playerView = new PlayerView(client);
});
