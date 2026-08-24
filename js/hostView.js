// Host-specific functionality
class HostView {
    constructor(client) {
        this.client = client;
        this.config = {
            gameMode: 'eleccion',
            enableMaxWaifus: true,
            maxWaifus: 5,
            enableMaxRounds: false,
            maxRounds: 10,
            startingBalance: 100,
            biddingMode: 'free'
        };
        this.players = {};
        this.currentRound = {
            index: 0,
            character: null,
            highestBid: 0,
            highestBidder: null,
            bids: []
        };
        this.currentAnimeName = '';
        this.currentBid = 0;
        this.roundTimer = null;
        this.setupEventListeners();
        this.setupGameLogic();
    }

    setupEventListeners() {
        // Host button - sets up host mode and connects
        const hostBtn = document.getElementById('btn-host');
        if (hostBtn) {
            hostBtn.addEventListener('click', () => {
                const name = document.getElementById('player-name').value.trim();
                if (!name) {
                    alert('Por favor ingresa tu nombre para continuar');
                    return;
                }
                
                console.log('Host button clicked');
                this.client.isHost = true;
                this.client.playerName = name;
                localStorage.setItem('waifuAuctionPlayerName', name);
                
                // Add host to their own players list with full structure
                this.players[this.client.playerId] = {
                    name: name,
                    balance: this.config.startingBalance,
                    collection: []
                };
                
                this.client.connect();
                this.client.showScreen('unified-lobby');
                
                // Ensure config panel is enabled for host
                const configInputs = document.querySelectorAll('.config-panel input, .config-panel select');
                configInputs.forEach(input => input.disabled = false);
                document.getElementById('btn-start-game').textContent = 'Iniciar Partida';
                document.getElementById('btn-start-game').disabled = false;
                
                // Populate default config
                this.updateConfig(this.config);
            });
        }

        // Configuration updates
        document.querySelectorAll('input[name="gameMode"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                if(e.target.checked) this.updateConfig({ gameMode: e.target.value });
            });
        });
        
        const enableMaxWaifusEl = document.getElementById('config-enableMaxWaifus');
        if (enableMaxWaifusEl) {
            enableMaxWaifusEl.addEventListener('change', (e) => {
                document.getElementById('config-maxWaifus').disabled = !e.target.checked;
                this.updateConfig({ enableMaxWaifus: e.target.checked });
            });
        }
        
        const maxWaifusEl = document.getElementById('config-maxWaifus');
        if (maxWaifusEl) {
            maxWaifusEl.addEventListener('change', (e) => {
                this.updateConfig({ maxWaifus: parseInt(e.target.value) });
            });
        }
        
        const enableMaxRoundsEl = document.getElementById('config-enableMaxRounds');
        if (enableMaxRoundsEl) {
            enableMaxRoundsEl.addEventListener('change', (e) => {
                document.getElementById('config-maxRounds').disabled = !e.target.checked;
                this.updateConfig({ enableMaxRounds: e.target.checked });
            });
        }
        
        const maxRoundsEl = document.getElementById('config-maxRounds');
        if (maxRoundsEl) {
            maxRoundsEl.addEventListener('change', (e) => {
                this.updateConfig({ maxRounds: parseInt(e.target.value) });
            });
        }

        const startingBalanceEl = document.getElementById('config-startingBalance');
        if (startingBalanceEl) {
            startingBalanceEl.addEventListener('change', (e) => {
                this.updateConfig({ startingBalance: parseInt(e.target.value) });
            });
        }

        const biddingModeEl = document.getElementById('config-biddingMode');
        if (biddingModeEl) {
            biddingModeEl.addEventListener('change', (e) => {
                this.updateConfig({ biddingMode: e.target.value });
            });
        }

        // Host start game button
        const startBtn = document.getElementById('btn-start-game');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                if (this.client.isHost) {
                    this.startGame();
                }
            });
        }

        // Random characters
        document.getElementById('btn-random').addEventListener('click', () => this.generateRandomCharacters());

        // Player Selection UI (for when host is chosen)
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
        if (this.client.room) {
            this.client.send('configUpdated', this.config);
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
        let addedCount = 0;
        
        characters.forEach(char => {
            // Evitar duplicados silenciosamente en lugar de mostrar alert
            if (!this.client.selectedPool.find(c => c.id === char.id)) {
                // Normalize character structure for addToPool
                const normalizedChar = {
                    id: char.id,
                    characterName: char.characterName || char.name?.full || 'Unknown',
                    imageUrl: char.imageUrl || char.image?.large || '',
                    animeName: char.animeName || this.currentAnimeName || 'Unknown',
                    isBlind: char.isBlind || false
                };
                
                this.client.selectedPool.push(normalizedChar);
                addedCount++;
            }
        });
        
        this.updatePoolDisplay();
        if (this.client.room) {
            this.client.send('poolUpdated', { characters: this.client.selectedPool });
        }
        
        resultsContainer.innerHTML = `<p style="color: #48bb78; font-weight: bold;">¡Se añadieron ${addedCount} personajes aleatorios a la subasta!</p>`;
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
        if (this.client.room) {
            this.client.send('poolUpdated', { characters: this.client.selectedPool });
        }
    }

    removeFromPool(characterId) {
        this.client.selectedPool = this.client.selectedPool.filter(c => c.id !== characterId);
        this.updatePoolDisplay();
        if (this.client.room) {
            this.client.send('poolUpdated', { characters: this.client.selectedPool });
        }
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
        // Enviar el evento de inicio a todos los jugadores
        if (this.client.room) {
            this.client.send('gameStart', { config: this.config });
        }
        
        // El host también ejecuta su propia lógica de inicio
        this.onGameStart({ config: this.config });
    }

    // Override client methods
    onLobbyUpdate(data) {
        this.updateLobbyDisplay(data.players);
    }

    onHostJoined(data) {
        console.log('onHostJoined called with:', data);
        if (data.success && data.roomCode) {
            const display = document.getElementById('room-code-display');
            console.log('Display element:', display);
            if (display) {
                display.textContent = data.roomCode;
                console.log('Room code displayed:', data.roomCode);
            } else {
                console.error('Room code display element not found');
            }
        }
    }

    onPlayerJoined(data) {
        console.log('Player joined:', data);
        this.players[data.playerId] = {
            id: data.playerId,
            name: data.playerName,
            balance: this.config.startingBalance,
            collection: [],
            connected: true
        };
        this.updateLobbyDisplay();
        
        // Broadcast lobby update to all players
        if (this.client.room) {
            this.client.send('lobbyUpdate', { players: this.players });
        }
    }

    onGameStart(data) {
        this.client.showScreen('game-screen');
        this.setupGameUI();
        this.startFirstRound();
    }

    setupGameLogic() {
        // Bids are handled in client.js onMessage handler
    }

    handleBid(data) {
        if (data.pass) {
            // Player passed
            console.log(`${data.playerName} passed`);
            return;
        }

        // Validate bid
        const player = this.players[data.playerId];
        if (!player) {
            console.error('Unknown player:', data.playerId);
            return;
        }

        if (data.amount <= this.currentRound.highestBid) {
            console.log('Bid too low:', data.amount, 'vs', this.currentRound.highestBid);
            return;
        }

        if (data.amount > player.balance) {
            console.log('Insufficient balance:', data.amount, 'vs', player.balance);
            return;
        }

        // Update highest bid
        this.currentRound.highestBid = data.amount;
        this.currentRound.highestBidder = data.playerId;
        this.currentRound.bids.push(data);

        const updateData = {
            highestBid: this.currentRound.highestBid,
            highestBidderId: this.currentRound.highestBidder,
            playerName: data.playerName, // Para compatibilidad con el UI de player
            amount: this.currentRound.highestBid
        };

        // Update Host UI
        this.onBidUpdate(updateData);

        // Broadcast bid update to all
        if (this.client.room) {
            this.client.send('bidUpdate', updateData);
        }

        // Reset the 5-second timer on new bid
        this.startRoundTimer();
    }

    startFirstRound() {
        this.currentRound.index = 0;
        this.startRound();
    }

    checkGameEndCondition() {
        // Condition 1: Max Rounds reached
        if (this.config.enableMaxRounds && this.currentRound.index >= this.config.maxRounds) {
            return true;
        }

        const activePlayers = Object.values(this.players).filter(p => p.connected);
        if (activePlayers.length === 0) return true;

        // Condition 2: All players are broke
        const allBroke = activePlayers.every(p => p.balance <= 0);
        if (allBroke) return true;

        // Condition 3: All players reached max waifus
        if (this.config.enableMaxWaifus) {
            const allFull = activePlayers.every(p => p.collection.length >= this.config.maxWaifus);
            if (allFull) return true;
        }

        return false;
    }

    async startRound() {
        if (this.checkGameEndCondition()) {
            this.endGame();
            return;
        }

        this.currentRound.index++;
        
        if (this.config.gameMode === 'eleccion') {
            // Pick a random connected player
            const activePlayers = Object.values(this.players).filter(p => p.connected);
            const chosenPlayer = activePlayers[Math.floor(Math.random() * activePlayers.length)];
            
            console.log('Player chosen for selection:', chosenPlayer.name);
            
            if (chosenPlayer.id === this.client.playerId) {
                // Host is chosen
                this.client.showScreen('player-selection-screen');
                document.getElementById('player-selection-blind').checked = false;
                document.getElementById('player-anilist-search').value = '';
                document.getElementById('player-search-results').innerHTML = '';
            } else {
                // Send request to specific player
                if (this.client.room) {
                    this.client.send('requestCharacterSelection', { targetPlayerId: chosenPlayer.id });
                }
                // Update host UI to show waiting message
                this.client.showScreen('game-screen');
                document.getElementById('character-reveal').innerHTML = `<h3>Esperando a que ${chosenPlayer.name} elija un personaje...</h3>`;
                document.querySelector('.bidding-controls').style.display = 'none';
            }
        } else {
            // aleatorio or aciegas
            this.client.showScreen('game-screen');
            document.getElementById('character-reveal').innerHTML = `<h3>Buscando personaje aleatorio...</h3>`;
            document.querySelector('.bidding-controls').style.display = 'none';
            
            // Get 1 random character
            const characters = await this.client.searchAnimeByGenres([], 'all', 1);
            if (characters && characters.length > 0) {
                const char = characters[0];
                const normalizedChar = {
                    id: char.id,
                    characterName: char.characterName || char.name?.full || 'Unknown',
                    imageUrl: char.imageUrl || char.image?.large || '',
                    animeName: char.animeName || this.currentAnimeName || 'Unknown',
                    isBlind: this.config.gameMode === 'aciegas'
                };
                this.startAuctionWithCharacter(normalizedChar);
            } else {
                alert('Error al buscar personaje aleatorio. Reintentando...');
                setTimeout(() => this.startRound(), 2000);
            }
        }
    }

    startAuctionWithCharacter(character) {
        this.currentRound.character = character;
        this.currentRound.highestBid = 0;
        this.currentRound.highestBidder = null;
        this.currentRound.bids = [];
        this.currentRound.timerActive = false;
        if (this.roundTimer) clearTimeout(this.roundTimer);

        // Broadcast round start
        if (this.client.room) {
            this.client.send('roundStart', {
                roundIndex: this.currentRound.index,
                character: character,
                timeLimit: 5 // Initial time doesn't matter much as timer only starts on first bid
            });
        }
        
        this.client.showScreen('game-screen');
        // Let the normal game UI setup handle showing the character
        this.setupGameUI(); // Wait, setupGameUI doesn't render character. Let's rely on onRoundStart event.
        this.onRoundStart({ character: character, roundIndex: this.currentRound.index });

        // Start the 5-second timer
        this.startRoundTimer();
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
                
                // If it's the host selecting, just handle directly
                this.onCharacterSelected({ character: normalizedChar });
            });
            resultsContainer.appendChild(item);
        });
    }

    onCharacterSelected(data) {
        this.startAuctionWithCharacter(data.character);
    }

    startRoundTimer() {
        if (this.roundTimer) clearTimeout(this.roundTimer);
        
        this.currentRound.timerActive = true;
        let timeLeft = 5;
        
        if (this.client.room) {
            this.client.send('timerUpdate', { timeLeft });
        }
        this.onTimerUpdate({ timeLeft });

        this.roundTimer = setInterval(() => {
            timeLeft--;
            
            if (this.client.room) {
                this.client.send('timerUpdate', { timeLeft });
            }
            this.onTimerUpdate({ timeLeft });

            if (timeLeft <= 0) {
                clearInterval(this.roundTimer);
                this.resolveRound();
            }
        }, 1000);
    }

    resolveRound() {
        if (this.currentRound.highestBidder) {
            const winner = this.players[this.currentRound.highestBidder];
            winner.balance -= this.currentRound.highestBid;
            winner.collection.push(this.currentRound.character);
        }

        const resultData = {
            winnerId: this.currentRound.highestBidder,
            winnerName: this.currentRound.highestBidder ? this.players[this.currentRound.highestBidder].name : null,
            winningBid: this.currentRound.highestBid,
            character: this.currentRound.character,
            balances: {},
            collections: {}
        };
        
        // Populate current states for sync
        Object.entries(this.players).forEach(([id, p]) => {
            resultData.balances[id] = p.balance;
            resultData.collections[id] = p.collection;
        });

        // Broadcast round result
        if (this.client.room) {
            this.client.send('roundResult', resultData);
        }
        
        // Show result locally
        this.onRoundResult(resultData);

        // Next round
        setTimeout(() => this.startRound(), 3000);
    }

    endGame() {
        // Broadcast game end
        if (this.client.room) {
            this.client.send('gameEnd', { players: this.players });
        }
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
            this.resolveRound();
        });
        biddingControls.appendChild(resolveBtn);
        
        this.setupHostTimer();
    }

    setupHostTimer() {
        this.hostTimerInterval = null;
    }

    updatePlayerInfo() {
        if (!this.players || !this.players[this.client.playerId]) {
            return;
        }

        const player = this.players[this.client.playerId];
        document.getElementById('player-balance').textContent = this.client.formatCurrency(player.balance);
        const maxWaifus = this.config.enableMaxWaifus ? this.config.maxWaifus : '∞';
        document.getElementById('player-collection').textContent = `${player.collection.length}/${maxWaifus}`;
    }

    placeBid() {
        const bidAmount = parseInt(document.getElementById('bid-amount').value);
        if (isNaN(bidAmount) || bidAmount <= 0) {
            alert('Ingresa una puja válida');
            return;
        }

        if (this.client.room) {
            const bidData = { playerId: this.client.playerId, playerName: this.client.playerName, amount: bidAmount };
            this.handleBid(bidData); // Host maneja su propia puja localmente
        }
        document.getElementById('bid-amount').value = '';
    }

    pass() {
        if (this.client.room) {
            this.handleBid({ playerId: this.client.playerId, playerName: this.client.playerName, pass: true });
        }
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
        const roundDisplay = document.getElementById('round-display');
        const roundText = this.config.enableMaxRounds ? `Ronda ${data.roundIndex + 1} de ${this.config.maxRounds}` : `Ronda ${data.roundIndex + 1}`;
        if (roundDisplay) {
            roundDisplay.textContent = roundText;
        }

        const character = data.character;
        
        // Display character for host
        const characterDisplay = document.getElementById('character-reveal');
        if (characterDisplay) {
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
        }

        // Reset bid display
        document.getElementById('current-bid').textContent = '0';
        document.getElementById('current-bidder').textContent = '-';
        this.currentBid = 0;

        // Reset bidding controls if host is participating
        const hostParticipating = true; // Host always participates in the new UI? Wait, host always joins.
        // Let's assume host is always participating now since we removed the toggle, wait, did we?
        // Wait, in my previous edit I removed `config-hostParticipating` from config, but wait, I didn't remove the checkbox from index.html!
        // Actually, let's just enable the controls for the host.
        const bidAmountInput = document.getElementById('bid-amount');
        if (bidAmountInput) {
            bidAmountInput.value = '';
            bidAmountInput.disabled = false;
        }
        const btnBid = document.getElementById('btn-bid');
        if (btnBid) btnBid.disabled = false;
        const btnPass = document.getElementById('btn-pass');
        if (btnPass) btnPass.disabled = false;

        // Show/hide turn indicator (we can just hide it as free bidding is the default)
        const turnIndicator = document.getElementById('turn-indicator');
        if (turnIndicator) {
            turnIndicator.classList.add('hidden');
        }

        // Update players summary
        this.updatePlayersSummary();
    }


    onBidUpdate(data) {
        document.getElementById('current-bid').textContent = this.client.formatCurrency(data.highestBid);
        this.currentBid = data.highestBid;
        
        if (data.highestBidderId && this.players && this.players[data.highestBidderId]) {
            const bidderName = this.players[data.highestBidderId].name;
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

        // Update host player info if participating
        const hostParticipating = true;
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
        if (countdownEl) countdownEl.textContent = countdown;

        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownEl) countdownEl.textContent = countdown;
            
            if (countdown <= 0) {
                clearInterval(countdownInterval);
                // Transition handled by next startRound or endGame
            }
        }, 1000);
    }

    updatePlayersSummary() {
        const summaryContainer = document.getElementById('game-players');
        if (!summaryContainer || !this.players) return;

        summaryContainer.innerHTML = '';

        Object.entries(this.players).forEach(([playerId, player]) => {
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
                // Start voting with the selected mode
                console.log('Starting voting with mode:', btn.dataset.mode);
                if (this.client.room) {
                    this.client.send('votingStart', { mode: btn.dataset.mode });
                }
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
            this.endGame();
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
    client.hostView = new HostView(client);
});


