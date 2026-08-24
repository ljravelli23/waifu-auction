// Host-specific functionality
class HostView {
    constructor(client) {
        this.client = client;
        this.config = {};
        this.currentAnimeName = '';
        this.currentBid = 0;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Role selection
        document.getElementById('btn-host').addEventListener('click', () => {
            this.client.isHost = true;
            this.client.connect();
            this.client.showScreen('host-setup');
            
            // Emit host:join after a short delay to ensure connection
            setTimeout(() => {
                if (this.client.socket && this.client.socket.connected) {
                    this.client.socket.emit('host:join');
                } else {
                    // If not connected yet, wait for connect event
                    this.client.socket.once('connect', () => {
                        this.client.socket.emit('host:join');
                    });
                }
            }, 100);
        });

        // Configuration updates
        document.getElementById('config-startingBalance').addEventListener('change', (e) => {
            this.updateConfig({ startingBalance: parseInt(e.target.value) });
        });

        document.getElementById('config-maxPlayers').addEventListener('change', (e) => {
            this.updateConfig({ maxPlayers: parseInt(e.target.value) });
        });

        document.getElementById('config-maxCharactersPerPlayer').addEventListener('change', (e) => {
            this.updateConfig({ maxCharactersPerPlayer: parseInt(e.target.value) });
        });

        document.getElementById('config-timePerCharacter').addEventListener('change', (e) => {
            this.updateConfig({ timePerCharacter: parseInt(e.target.value) });
        });

        document.getElementById('config-biddingMode').addEventListener('change', (e) => {
            this.updateConfig({ biddingMode: e.target.value });
        });

        document.getElementById('config-timeoutBehavior').addEventListener('change', (e) => {
            this.updateConfig({ timeoutBehavior: e.target.value });
        });

        document.getElementById('config-showRoundCount').addEventListener('change', (e) => {
            this.updateConfig({ showRoundCount: e.target.checked });
        });

        // Host participation toggle
        document.getElementById('config-hostParticipating').addEventListener('change', (e) => {
            const nameGroup = document.getElementById('host-name-group');
            nameGroup.style.display = e.target.checked ? 'block' : 'none';
        });

        // AniList search
        document.getElementById('btn-search').addEventListener('click', () => this.searchCharacters());
        document.getElementById('anilist-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchCharacters();
        });

        // Random characters
        document.getElementById('btn-random').addEventListener('click', () => this.generateRandomCharacters());

        // Start game
        document.getElementById('btn-start-game').addEventListener('click', () => this.startGame());

        // Bidding controls (for when host participates)
        document.getElementById('btn-bid').addEventListener('click', () => this.placeBid());
        document.getElementById('btn-pass').addEventListener('click', () => this.pass());

        // Bid input enter key
        document.getElementById('bid-amount').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.placeBid();
        });
    }

    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.client.socket) {
            this.client.socket.emit('host:updateConfig', this.config);
        }
    }

    async searchCharacters() {
        const query = document.getElementById('anilist-search').value.trim();
        console.log('Search called with query:', query);
        if (!query) return;

        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '<p>Buscando...</p>';

        // Get selected genres
        const selectedGenres = Array.from(document.querySelectorAll('.genre-filter:checked'))
            .map(cb => cb.value);

        // Get gender filter
        const genderFilter = document.getElementById('character-gender-filter').value;

        const result = await this.client.searchAniList(query, selectedGenres, genderFilter);
        console.log('Search result:', result);
        this.currentAnimeName = result.animeTitle || query;
        
        resultsContainer.innerHTML = '';
        
        if (result.characters.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron resultados con los filtros seleccionados</p>';
            console.log('No characters found');
            return;
        }

        console.log('Displaying', result.characters.length, 'characters');
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
            item.addEventListener('click', () => this.addToPool(char));
            resultsContainer.appendChild(item);
        });
    }

    async generateRandomCharacters() {
        const resultsContainer = document.getElementById('search-results');
        resultsContainer.innerHTML = '<p>Generando personajes aleatorios...</p>';

        // Get selected genres
        const selectedGenres = Array.from(document.querySelectorAll('.genre-filter:checked'))
            .map(cb => cb.value);

        // Get gender filter
        const genderFilter = document.getElementById('character-gender-filter').value;

        // Ask how many characters to generate
        const count = prompt('¿Cuántos personajes aleatorios quieres generar?', '5');
        const numCharacters = parseInt(count) || 5;

        const characters = await this.client.searchAnimeByGenres(selectedGenres, genderFilter, numCharacters);
        
        resultsContainer.innerHTML = '';
        
        if (characters.length === 0) {
            resultsContainer.innerHTML = '<p>No se encontraron personajes con los filtros seleccionados</p>';
            console.log('No random characters found');
            return;
        }

        console.log('Generated', characters.length, 'random characters');
        characters.forEach(char => {
            const item = document.createElement('div');
            item.className = 'search-item blind-mode-item';
            item.innerHTML = `
                <div class="blind-placeholder">🎭</div>
                <div class="search-item-info">
                    <h4>${char.animeName}</h4>
                    <p class="blind-mode-text">Personaje oculto (se revelará al final)</p>
                </div>
            `;
            item.addEventListener('click', () => this.addToPool(char));
            resultsContainer.appendChild(item);
        });
    }

    addToPool(character) {
        // Check if already in pool
        if (this.client.selectedPool.find(c => c.id === character.id)) {
            alert('Este personaje ya está en el pool');
            return;
        }

        // Normalize character structure
        const normalizedChar = {
            id: character.id,
            characterName: character.characterName || character.name?.full || 'Unknown',
            imageUrl: character.imageUrl || character.image?.large || '',
            animeName: character.animeName || this.currentAnimeName || 'Unknown',
            isBlind: character.isBlind || false
        };

        this.client.selectedPool.push(normalizedChar);
        this.updatePoolDisplay();
        this.client.socket.emit('host:setPool', { 
            characters: this.client.selectedPool 
        });
    }

    removeFromPool(characterId) {
        this.client.selectedPool = this.client.selectedPool.filter(c => c.id !== characterId);
        this.updatePoolDisplay();
        this.client.socket.emit('host:setPool', { 
            characters: this.client.selectedPool 
        });
    }

    updatePoolDisplay() {
        const poolCount = document.getElementById('pool-count');
        const poolList = document.getElementById('pool-list');
        
        poolCount.textContent = this.client.selectedPool.length;
        poolList.innerHTML = '';

        this.client.selectedPool.forEach(char => {
            const item = document.createElement('div');
            item.className = 'pool-item';
            
            if (char.isBlind) {
                item.innerHTML = `
                    <div class="blind-placeholder-small">🎭</div>
                    <p class="pool-item-name">${char.animeName}</p>
                    <button class="remove-btn" data-id="${char.id}">×</button>
                `;
            } else {
                item.innerHTML = `
                    <img src="${char.imageUrl}" alt="${char.characterName}">
                    <button class="remove-btn" data-id="${char.id}">×</button>
                `;
            }
            
            item.querySelector('.remove-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFromPool(char.id);
            });
            
            poolList.appendChild(item);
        });

        // Enable/disable start button
        const startBtn = document.getElementById('btn-start-game');
        startBtn.disabled = this.client.selectedPool.length === 0;
    }

    updateLobbyDisplay(players) {
        const lobbyPlayers = document.getElementById('lobby-players');
        lobbyPlayers.innerHTML = '';

        Object.entries(players).forEach(([id, player]) => {
            const card = document.createElement('div');
            card.className = `player-card ${player.connected ? 'connected' : 'disconnected'}`;
            card.innerHTML = `
                <h4>${player.name}</h4>
                <p class="balance">Saldo: ${this.client.formatCurrency(player.balance)}</p>
                <p class="collection">Personajes: ${player.collection.length}</p>
            `;
            lobbyPlayers.appendChild(card);
        });
    }

    startGame() {
        if (this.client.selectedPool.length === 0) {
            alert('Debes seleccionar al menos un personaje');
            return;
        }

        // Check if host wants to participate
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        if (hostParticipating) {
            const hostName = document.getElementById('host-player-name').value.trim();
            if (!hostName) {
                alert('Debes ingresar tu nombre para participar como jugador');
                return;
            }
            this.client.socket.emit('host:joinAsPlayer', { name: hostName });
        }

        this.client.socket.emit('host:startGame');
    }

    // Override client methods
    onLobbyUpdate(data) {
        this.updateLobbyDisplay(data.players);
    }

    onHostJoined(data) {
        console.log('Host joined event received:', data);
        if (data.success && data.roomCode) {
            const display = document.getElementById('room-code-display');
            if (display) {
                display.textContent = data.roomCode;
                console.log('Room code displayed:', data.roomCode);
            } else {
                console.error('Room code display element not found');
            }
        }
    }

    onGameStart(data) {
        this.client.showScreen('game-screen');
        this.setupGameUI();
    }

    setupGameUI() {
        // Check if host is participating as player
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        
        if (hostParticipating && this.client.playerId) {
            // Host is participating - enable player UI
            const hostName = document.getElementById('host-player-name').value;
            document.getElementById('player-name-display').textContent = hostName;
            this.updatePlayerInfo();
            
            // Enable bidding controls for participating host
            document.getElementById('bid-amount').disabled = false;
            document.getElementById('btn-bid').disabled = false;
            document.getElementById('btn-pass').disabled = false;
        } else {
            // Host monitors the game but doesn't participate
            document.getElementById('player-name-display').textContent = 'Anfitrión';
            document.getElementById('player-balance').textContent = '-';
            document.getElementById('player-collection').textContent = '-';
            
            // Disable bidding controls for non-participating host
            document.getElementById('bid-amount').disabled = true;
            document.getElementById('btn-bid').disabled = true;
            document.getElementById('btn-pass').disabled = true;
        }
        
        // Add host-specific resolve button
        const biddingControls = document.querySelector('.bidding-controls');
        const resolveBtn = document.createElement('button');
        resolveBtn.id = 'btn-resolve-round';
        resolveBtn.className = 'btn btn-primary';
        resolveBtn.textContent = 'Finalizar Ronda';
        resolveBtn.addEventListener('click', () => {
            this.client.socket.emit('host:resolveRound');
        });
        biddingControls.appendChild(resolveBtn);
        
        this.setupHostTimer();
    }

    setupHostTimer() {
        this.hostTimerInterval = null;
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

    updateBiddingControls() {
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        if (!hostParticipating || !this.client.playerId) return;

        const canBid = this.canPlayerBid();
        document.getElementById('bid-amount').disabled = !canBid;
        document.getElementById('btn-bid').disabled = !canBid;
        document.getElementById('btn-pass').disabled = !canBid;
    }

    canPlayerBid() {
        if (!this.client.gameState || !this.client.playerId) return false;
        
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
        this.currentBid = 0;

        // Reset bidding controls for participating host
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        if (hostParticipating && this.client.playerId) {
            document.getElementById('bid-amount').value = '';
            document.getElementById('bid-amount').disabled = false;
            document.getElementById('btn-bid').disabled = false;
            document.getElementById('btn-pass').disabled = false;
        }

        // Show/hide turn indicator
        const turnIndicator = document.getElementById('turn-indicator');
        if (data.openerPlayerId) {
            turnIndicator.classList.remove('hidden');
            if (this.client.gameState && this.client.gameState.players[data.openerPlayerId]) {
                document.getElementById('opener-name').textContent = 
                    this.client.gameState.players[data.openerPlayerId].name;
            }
        } else {
            turnIndicator.classList.add('hidden');
        }

        // Start host timer (auto-resolve when time ends)
        this.startHostTimer(data.timeLimit);

        // Update players summary
        this.updatePlayersSummary();
    }

    startHostTimer(seconds) {
        if (this.hostTimerInterval) {
            clearInterval(this.hostTimerInterval);
        }

        let timeLeft = seconds;
        const timerDisplay = document.getElementById('timer');
        timerDisplay.textContent = timeLeft;

        this.hostTimerInterval = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(this.hostTimerInterval);
                // Auto-resolve round when timer ends
                this.client.socket.emit('host:resolveRound');
            }
        }, 1000);
    }

    onBidUpdate(data) {
        document.getElementById('current-bid').textContent = this.client.formatCurrency(data.highestBid);
        this.currentBid = data.highestBid;
        
        if (data.highestBidderId && this.client.gameState && this.client.gameState.players[data.highestBidderId]) {
            const bidderName = this.client.gameState.players[data.highestBidderId].name;
            document.getElementById('current-bidder').textContent = `por ${bidderName}`;
        } else {
            document.getElementById('current-bidder').textContent = '-';
        }

        // Update host player info if participating
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        if (hostParticipating && this.client.playerId) {
            this.updatePlayerInfo();
            this.updateBiddingControls();
        }

        this.updatePlayersSummary();
    }

    onRoundResult(data) {
        // Stop host timer
        if (this.hostTimerInterval) {
            clearInterval(this.hostTimerInterval);
        }

        // Update local game state
        if (this.client.gameState) {
            Object.keys(data.balances).forEach(playerId => {
                if (this.client.gameState.players[playerId]) {
                    this.client.gameState.players[playerId].balance = data.balances[playerId];
                    this.client.gameState.players[playerId].collection = data.collections[playerId];
                }
            });
        }

        // Update host player info if participating
        const hostParticipating = document.getElementById('config-hostParticipating').checked;
        if (hostParticipating && this.client.playerId) {
            this.updatePlayerInfo();
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
                this.updatePlayersSummary();
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
        this.showVotingOptions();
    }

    showVotingOptions() {
        // Create voting mode selection modal
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 40px; border-radius: 20px; max-width: 500px; text-align: center;">
                <h2>Seleccionar Modo de Votación</h2>
                <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 20px;">
                    <button class="btn btn-primary voting-mode-btn" data-mode="byPrice">Por Precio (compra más cara de cada jugador)</button>
                    <button class="btn btn-primary voting-mode-btn" data-mode="oneByOne">Uno por Uno (calificar cada personaje)</button>
                    <button class="btn btn-primary voting-mode-btn" data-mode="byRound">Por Ronda (agrupar por número de ronda)</button>
                    <button class="btn btn-secondary voting-mode-btn" data-mode="skip">Saltar Votación</button>
                </div>
            </div>
        `;

        modal.querySelectorAll('.voting-mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.client.socket.emit('host:startVoting', { mode: btn.dataset.mode });
                document.body.removeChild(modal);
            });
        });

        document.body.appendChild(modal);
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
            if (result.type === 'character') {
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
                        <p>Mejor compra: ${result.character.characterName}</p>
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

        document.getElementById('btn-final-results').addEventListener('click', () => {
            this.client.socket.emit('host:endGame');
        });
    }

    onConfigUpdated(data) {
        // Update local config if needed
        this.config = data.config;
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

        document.getElementById('btn-new-game').addEventListener('click', () => {
            location.reload();
        });
    }

    onPoolUpdated(data) {
        // Update local pool state
        this.client.selectedPool = data.characters;
        this.updatePoolDisplay();
    }
}

// Initialize host view when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new HostView(client);
});


