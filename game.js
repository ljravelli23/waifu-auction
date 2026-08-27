// ==================== GAME STATE ====================
console.log('[Version] Game version: 3.0 - Cache fix applied');
console.log('[Game] Initializing game state');
window.gameInitialized = false; // Flag para tracking de inicialización
const GameState = {
    screen: 'start', // start, avatar, lobby, config, selection, auction, end
    isHost: false,
    playerName: '',
    roomCode: '',
    avatar: null,
    peer: null,
    connections: new Map(), // playerId -> DataConnection
    players: new Map(), // playerId -> {name, avatar, money, collection}
    hostId: null,
    localStream: null,
    audioConnections: new Map(), // peerId -> MediaConnection
    isMuted: false,
    
    // Game configuration
    config: {
        gameMode: 'choice', // choice, random, blind
        initialMoney: 1000,
        maxRounds: 10,
        unlimitedRounds: false,
        maxWaifus: 5,
        unlimitedWaifus: false,
        bidMode: 'free', // free, turns
        maxPlayers: 8,
        showRounds: true,
        noBidTimeout: 15,
        voteMode: 'price' // price, onebyone, round
    },
    
    // Game state
    characterPool: [],
    currentRound: 0,
    currentCharacter: null,
    currentBid: 0,
    currentBidder: null,
    bidTimer: null,
    roundPhase: 'waiting', // waiting, bidding, closed
    collections: new Map(), // playerId -> array of characters
    isGameRunning: false
};

// ==================== AVATAR SYSTEM ====================
const AvatarSystem = {
    canvas: null,
    ctx: null,
    
    init() {
        console.log('[AvatarSystem] Initializing avatar system');
        this.canvas = document.getElementById('avatar-canvas');
        this.ctx = this.canvas.getContext('2d');
        console.log('[AvatarSystem] Canvas initialized:', !!this.canvas, !!this.ctx);
    },
    
    drawAvatar(avatarData) {
        console.log('[AvatarSystem] Drawing avatar with data:', avatarData);
        if (!this.ctx) {
            console.error('[AvatarSystem] Context not initialized');
            return;
        }
        
        const ctx = this.ctx;
        const canvas = this.canvas;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Background
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Draw face shape
        this.drawFace(centerX, centerY, avatarData);
        
        // Draw hair
        this.drawHair(centerX, centerY, avatarData);
        
        // Draw eyes
        this.drawEyes(centerX, centerY, avatarData);
        
        // Draw eyebrows
        this.drawEyebrows(centerX, centerY, avatarData);
        
        // Draw nose
        this.drawNose(centerX, centerY, avatarData);
        
        // Draw mouth
        this.drawMouth(centerX, centerY, avatarData);
        
        // Draw accessory
        this.drawAccessory(centerX, centerY, avatarData);
    },
    
    drawFace(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.fillStyle = data.skinTone;
        
        const shapes = [
            // Round
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY, 60, 0, Math.PI * 2);
                ctx.fill();
            },
            // Oval
            () => {
                ctx.beginPath();
                ctx.ellipse(centerX, centerY, 55, 70, 0, 0, Math.PI * 2);
                ctx.fill();
            },
            // Square
            () => {
                ctx.fillRect(centerX - 50, centerY - 60, 100, 120);
                // Round corners
                ctx.beginPath();
                ctx.arc(centerX - 50, centerY - 60, 10, Math.PI, 1.5 * Math.PI);
                ctx.arc(centerX + 50, centerY - 60, 10, 1.5 * Math.PI, 2 * Math.PI);
                ctx.arc(centerX + 50, centerY + 60, 10, 0, 0.5 * Math.PI);
                ctx.arc(centerX - 50, centerY + 60, 10, 0.5 * Math.PI, Math.PI);
                ctx.fill();
            },
            // Heart
            () => {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY + 40);
                ctx.bezierCurveTo(centerX, centerY + 20, centerX - 40, centerY - 20, centerX - 40, centerY - 40);
                ctx.bezierCurveTo(centerX - 40, centerY - 70, centerX, centerY - 50, centerX, centerY - 30);
                ctx.bezierCurveTo(centerX, centerY - 50, centerX + 40, centerY - 70, centerX + 40, centerY - 40);
                ctx.bezierCurveTo(centerX + 40, centerY - 20, centerX, centerY + 20, centerX, centerY + 40);
                ctx.fill();
            }
        ];
        
        shapes[data.faceShape]();
    },
    
    drawHair(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.fillStyle = data.hairColor;
        
        const styles = [
            // Short
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fill();
            },
            // Medium
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fillRect(centerX - 55, centerY - 30, 110, 40);
                ctx.fill();
            },
            // Long
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fillRect(centerX - 55, centerY - 30, 110, 80);
                ctx.fill();
            },
            // Ponytail
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.ellipse(centerX + 40, centerY + 30, 20, 40, 0.3, 0, Math.PI * 2);
                ctx.fill();
            },
            // Punk
            () => {
                for (let i = 0; i < 8; i++) {
                    const angle = Math.PI + (i * Math.PI / 7);
                    const x = centerX + Math.cos(angle) * 55;
                    const y = centerY - 30 + Math.sin(angle) * 20;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + Math.cos(angle) * 30, y + Math.sin(angle) * 30 - 20);
                    ctx.lineTo(x + Math.cos(angle + 0.2) * 30, y + Math.sin(angle + 0.2) * 30 - 20);
                    ctx.fill();
                }
            },
            // Wavy
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX - 20, centerY + 20, 25, 0, Math.PI * 2);
                ctx.arc(centerX + 20, centerY + 20, 25, 0, Math.PI * 2);
                ctx.fill();
            },
            // Bald
            () => {},
            // Bun
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 55, Math.PI, 2 * Math.PI);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX, centerY - 70, 25, 0, Math.PI * 2);
                ctx.fill();
            },
            // Afro
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 20, 70, 0, Math.PI * 2);
                ctx.fill();
            },
            // Buzz cut
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY - 25, 58, Math.PI, 2 * Math.PI);
                ctx.fill();
            }
        ];
        
        styles[data.hairStyle]();
    },
    
    drawEyes(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.fillStyle = data.eyeColor;
        
        const eyeOffset = 20;
        const eyeY = centerY - 5;
        
        const styles = [
            // Normal
            (x, y) => {
                ctx.beginPath();
                ctx.ellipse(x, y, 8, 6, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            },
            // Big
            (x, y) => {
                ctx.beginPath();
                ctx.ellipse(x, y, 12, 10, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 3, y - 3, 3, 0, Math.PI * 2);
                ctx.fill();
            },
            // Almond
            (x, y) => {
                ctx.beginPath();
                ctx.ellipse(x, y, 10, 7, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            },
            // Round
            (x, y) => {
                ctx.beginPath();
                ctx.arc(x, y, 9, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            },
            // Tired
            (x, y) => {
                ctx.beginPath();
                ctx.ellipse(x, y, 8, 4, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 2, y - 1, 1.5, 0, Math.PI * 2);
                ctx.fill();
            },
            // Happy
            (x, y) => {
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI);
                ctx.fill();
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(x - 2, y - 2, 2, 0, Math.PI * 2);
                ctx.fill();
            }
        ];
        
        styles[data.eyeStyle](centerX - eyeOffset, eyeY);
        styles[data.eyeStyle](centerX + eyeOffset, eyeY);
    },
    
    drawEyebrows(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.strokeStyle = this.darkenColor(data.hairColor, 0.3);
        ctx.lineWidth = 2;
        
        const browOffset = 20;
        const browY = centerY - 18;
        
        const styles = [
            // Normal
            (x, y) => {
                ctx.beginPath();
                ctx.moveTo(x - 8, y);
                ctx.lineTo(x + 8, y);
                ctx.stroke();
            },
            // Thick
            (x, y) => {
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(x - 8, y);
                ctx.lineTo(x + 8, y);
                ctx.stroke();
                ctx.lineWidth = 2;
            },
            // Thin
            (x, y) => {
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x - 8, y);
                ctx.lineTo(x + 8, y);
                ctx.stroke();
                ctx.lineWidth = 2;
            },
            // High
            (x, y) => {
                ctx.beginPath();
                ctx.moveTo(x - 8, y - 5);
                ctx.lineTo(x + 8, y - 5);
                ctx.stroke();
            }
        ];
        
        styles[data.eyebrowStyle](centerX - browOffset, browY);
        styles[data.eyebrowStyle](centerX + browOffset, browY);
    },
    
    drawNose(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.fillStyle = this.darkenColor(data.skinTone, 0.1);
        
        const styles = [
            // Small
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY + 10, 4, 0, Math.PI * 2);
                ctx.fill();
            },
            // Medium
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY + 12, 6, 0, Math.PI * 2);
                ctx.fill();
            },
            // Large
            () => {
                ctx.beginPath();
                ctx.arc(centerX, centerY + 15, 8, 0, Math.PI * 2);
                ctx.fill();
            },
            // Pointy
            () => {
                ctx.beginPath();
                ctx.moveTo(centerX, centerY + 5);
                ctx.lineTo(centerX - 5, centerY + 18);
                ctx.lineTo(centerX + 5, centerY + 18);
                ctx.fill();
            }
        ];
        
        styles[data.noseStyle]();
    },
    
    drawMouth(centerX, centerY, data) {
        const ctx = this.ctx;
        ctx.strokeStyle = '#cc8888';
        ctx.lineWidth = 3;
        
        const mouthY = centerY + 35;
        
        const styles = [
            // Smile
            () => {
                ctx.beginPath();
                ctx.arc(centerX, mouthY - 5, 15, 0, Math.PI);
                ctx.stroke();
            },
            // Neutral
            () => {
                ctx.beginPath();
                ctx.moveTo(centerX - 10, mouthY);
                ctx.lineTo(centerX + 10, mouthY);
                ctx.stroke();
            },
            // Serious
            () => {
                ctx.beginPath();
                ctx.moveTo(centerX - 10, mouthY + 2);
                ctx.lineTo(centerX + 10, mouthY + 2);
                ctx.stroke();
            },
            // Open
            () => {
                ctx.fillStyle = '#cc8888';
                ctx.beginPath();
                ctx.arc(centerX, mouthY, 8, 0, Math.PI * 2);
                ctx.fill();
            },
            // Grin
            () => {
                ctx.beginPath();
                ctx.arc(centerX, mouthY - 8, 18, 0, Math.PI);
                ctx.stroke();
                ctx.fillStyle = '#cc8888';
                ctx.beginPath();
                ctx.arc(centerX, mouthY, 12, 0, Math.PI);
                ctx.fill();
            }
        ];
        
        styles[data.mouthStyle]();
    },
    
    drawAccessory(centerX, centerY, data) {
        const ctx = this.ctx;
        
        const accessories = {
            none: () => {},
            glasses: () => {
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 2;
                ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
                
                // Left lens
                ctx.beginPath();
                ctx.rect(centerX - 35, centerY - 10, 25, 18);
                ctx.fill();
                ctx.stroke();
                
                // Right lens
                ctx.beginPath();
                ctx.rect(centerX + 10, centerY - 10, 25, 18);
                ctx.fill();
                ctx.stroke();
                
                // Bridge
                ctx.beginPath();
                ctx.moveTo(centerX - 10, centerY - 1);
                ctx.lineTo(centerX + 10, centerY - 1);
                ctx.stroke();
            },
            hat: () => {
                ctx.fillStyle = data.hairColor;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY - 55, 50, 15, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(centerX - 30, centerY - 85, 60, 35);
            },
            headphones: () => {
                ctx.fillStyle = '#333';
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 8;
                
                // Band
                ctx.beginPath();
                ctx.arc(centerX, centerY - 30, 65, Math.PI, 2 * Math.PI);
                ctx.stroke();
                
                // Ear cups
                ctx.beginPath();
                ctx.arc(centerX - 55, centerY, 15, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(centerX + 55, centerY, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        accessories[data.accessory]();
    },
    
    darkenColor(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, parseInt(hex.substr(0, 2), 16) - amount * 255);
        const g = Math.max(0, parseInt(hex.substr(2, 2), 16) - amount * 255);
        const b = Math.max(0, parseInt(hex.substr(4, 2), 16) - amount * 255);
        return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
    },
    
    getAvatarFromForm() {
        return {
            faceShape: parseInt(document.getElementById('face-shape').value),
            skinTone: document.getElementById('skin-tone').value,
            eyeStyle: parseInt(document.getElementById('eye-style').value),
            eyeColor: document.getElementById('eye-color').value,
            eyebrowStyle: parseInt(document.getElementById('eyebrow-style').value),
            noseStyle: parseInt(document.getElementById('nose-style').value),
            mouthStyle: parseInt(document.getElementById('mouth-style').value),
            hairStyle: parseInt(document.getElementById('hair-style').value),
            hairColor: document.getElementById('hair-color').value,
            accessory: document.getElementById('accessory').value
        };
    },
    
    saveAvatar() {
        console.log('[AvatarSystem] Saving avatar to localStorage');
        const avatar = this.getAvatarFromForm();
        localStorage.setItem('subastaWaifus:avatar', JSON.stringify(avatar));
        GameState.avatar = avatar;
        console.log('[AvatarSystem] Avatar saved successfully');
        return avatar;
    },
    
    loadAvatar() {
        console.log('[AvatarSystem] Loading avatar from localStorage');
        const saved = localStorage.getItem('subastaWaifus:avatar');
        if (saved) {
            try {
                GameState.avatar = JSON.parse(saved);
                console.log('[AvatarSystem] Avatar loaded successfully');
                return GameState.avatar;
            } catch (e) {
                console.error('[AvatarSystem] Error loading avatar:', e);
            }
        }
        console.log('[AvatarSystem] No saved avatar found');
        return null;
    },
    
    createAvatarTexture(avatarData) {
        const canvas = document.createElement('canvas');
        canvas.width = 200;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        // Temporarily switch context
        const originalCtx = this.ctx;
        const originalCanvas = this.canvas;
        this.ctx = ctx;
        this.canvas = canvas;
        
        this.drawAvatar(avatarData);
        
        // Restore context
        this.ctx = originalCtx;
        this.canvas = originalCanvas;
        
        return new THREE.CanvasTexture(canvas);
    }
};

// ==================== ANILIST API ====================
const AniListAPI = {
    async searchAnime(searchTerm) {
        console.log('[AniListAPI] Searching anime:', searchTerm);
        const query = `
            query ($search: String) {
                Page(page: 1, perPage: 10) {
                    media(search: $search, type: ANIME) {
                        id
                        title { romaji english }
                        coverImage { large }
                        description
                    }
                }
            }
        `;
        
        try {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables: { search: searchTerm }
                })
            });
            
            const data = await response.json();
            console.log('[AniListAPI] Search results:', data.data.Page.media.length, 'animes found');
            return data.data.Page.media;
        } catch (error) {
            console.error('[AniListAPI] Error searching anime:', error);
            return [];
        }
    },
    
    async getCharacters(animeId) {
        console.log('[AniListAPI] Getting characters for anime ID:', animeId);
        const query = `
            query ($id: Int) {
                Media(id: $id, type: ANIME) {
                    id
                    title { romaji english }
                    characters(page: 1, perPage: 25, sort: FAVOURITES_DESC) {
                        edges {
                            role
                            node {
                                id
                                name { full }
                                image { large }
                            }
                        }
                    }
                }
            }
        `;
        
        try {
            const response = await fetch('https://graphql.anilist.co', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    query,
                    variables: { id: animeId }
                })
            });
            
            const data = await response.json();
            console.log('[AniListAPI] Characters loaded:', data.data.Media.characters.edges.length, 'characters');
            return data.data.Media;
        } catch (error) {
            console.error('[AniListAPI] Error getting characters:', error);
            return null;
        }
    }
};

// ==================== NETWORKING (PeerJS) ====================
const Networking = {
    generateRoomCode() {
        console.log('[Networking] Generating room code');
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const code = Array.from({length: 4}, () =>
            letters[Math.floor(Math.random() * letters.length)]
        ).join('');
        console.log('[Networking] Generated code:', code);
        return code;
    },

    async createRoom() {
        console.log('[Networking] Creating room as host');
        let attempts = 5;
        while (attempts > 0) {
            const code = this.generateRoomCode();
            try {
                console.log('[Networking] Attempting to create room with code:', code, 'Attempts left:', attempts);
                GameState.peer = new Peer(code);

                GameState.peer.on('open', (id) => {
                    console.log('[Networking] Room created successfully with ID:', id);
                    GameState.roomCode = id;
                    GameState.isHost = true;
                    GameState.hostId = id;
                    UI.showRoomCode(id);
                });
                
                GameState.peer.on('connection', (conn) => {
                    this.handleConnection(conn);
                });
                
                GameState.peer.on('error', (err) => {
                    console.error('[Networking] PeerJS error:', err.type, err.message);
                    if (err.type === 'unavailable-id' && attempts > 0) {
                        console.log('[Networking] ID unavailable, retrying...');
                        attempts--;
                        GameState.peer.destroy();
                    } else {
                        console.error('[Networking] Critical PeerJS error:', err);
                        UI.showError('Error al crear la sala: ' + err.message);
                    }
                });

                return; // Success
            } catch (error) {
                console.error('[Networking] Error creating room:', error);
                attempts--;
            }
        }

        console.error('[Networking] Failed to create room after all attempts');
        UI.showError('No se pudo crear una sala. Intenta nuevamente.');
    },

    async joinRoom(roomCode) {
        console.log('[Networking] Joining room with code:', roomCode);
        try {
            GameState.peer = new Peer();

            GameState.peer.on('open', () => {
                console.log('[Networking] Peer opened, connecting to room:', roomCode);
                const conn = GameState.peer.connect(roomCode);

                conn.on('open', () => {
                    console.log('[Networking] Connected to host successfully');
                    GameState.hostId = roomCode;
                    this.handleConnection(conn);
                    this.sendJoinRequest(conn);
                });

                conn.on('error', (err) => {
                    console.error('[Networking] Connection error:', err);
                    UI.showError('Error al conectar: ' + err.message);
                });
            });

            GameState.peer.on('error', (err) => {
                console.error('[Networking] PeerJS error:', err);
                UI.showError('Error de conexión: ' + err.message);
            });

        } catch (error) {
            console.error('[Networking] Error joining room:', error);
            UI.showError('Error al unirse a la sala');
        }
    },
    
    handleConnection(conn) {
        const playerId = conn.peer;
        console.log('[Networking] Handling connection from player:', playerId);
        GameState.connections.set(playerId, conn);

        conn.on('data', (data) => {
            this.handleMessage(data, playerId);
        });

        conn.on('close', () => {
            console.log('[Networking] Player disconnected:', playerId);
            GameState.connections.delete(playerId);
            GameState.players.delete(playerId);
            this.removeAudioConnection(playerId);
            UI.updatePlayerList();

            if (GameState.isHost) {
                this.broadcastState();
            }
        });

        if (GameState.isHost) {
            console.log('[Networking] Sending current state to new player:', playerId);
            this.sendStateToPlayer(conn);
        }
    },

    sendJoinRequest(conn) {
        console.log('[Networking] Sending join request');
        conn.send({
            tipo: 'JOIN_REQUEST',
            nombre: GameState.playerName,
            avatar: GameState.avatar
        });
    },

    handleMessage(data, senderId) {
        console.log('[Networking] Received message type:', data.tipo, 'from:', senderId, 'data:', data);
        
        switch (data.tipo) {
            case 'JOIN_REQUEST':
                if (GameState.isHost) {
                    this.handlePlayerJoin(senderId, data);
                }
                break;
                
            case 'JOIN_REJECTED':
                UI.showError(data.razon || 'No se pudo unir a la sala');
                break;
                
            case 'ROOM_STATE':
                this.handleRoomState(data);
                break;
                
            case 'PLACE_BID':
                if (GameState.isHost) {
                    this.handleBid(senderId, data.monto);
                }
                break;
                
            case 'SKIP':
                if (GameState.isHost) {
                    this.handleSkip(senderId);
                }
                break;
                
            case 'PROPONER_PERSONAJE':
                if (GameState.isHost) {
                    this.handleCharacterProposal(senderId, data.personaje);
                }
                break;
                
            case 'VOTE':
                if (GameState.isHost) {
                    this.handleVote(senderId, data);
                }
                break;
                
            case 'ROUND_START':
                this.handleRoundStart(data);
                break;
                
            case 'BID_UPDATE':
                this.handleBidUpdate(data);
                break;
                
            case 'ROUND_END':
                this.handleRoundEnd(data);
                break;
                
            case 'GAME_END':
                this.handleGameEnd(data);
                break;
                
            case 'VOTE_PROMPT':
                this.handleVotePrompt(data);
                break;
                
            case 'VOTE_RESULT':
                this.handleVoteResult(data);
                break;
        }
    },
    
    handlePlayerJoin(playerId, data) {
        console.log('[Networking] Handling player join:', playerId, data.nombre);
        if (GameState.players.size >= GameState.config.maxPlayers) {
            console.log('[Networking] Room full, rejecting player:', playerId);
            const conn = GameState.connections.get(playerId);
            if (conn && conn.open) {
                conn.send({ tipo: 'JOIN_REJECTED', razon: 'La sala está llena' });
            }
            return;
        }

        const player = {
            id: playerId,
            nombre: data.nombre,
            avatar: data.avatar,
            money: GameState.config.initialMoney,
            collection: []
        };

        GameState.players.set(playerId, player);
        console.log('[Networking] Player added. Total players:', GameState.players.size);
        UI.updatePlayerList();
        this.broadcastState();

        // Setup voice chat
        this.setupVoiceChat(playerId);
    },
    
    handleCharacterProposal(playerId, character) {
        const yaExiste = GameState.characterPool.some(c => c.id === character.id);
        if (!yaExiste) {
            GameState.characterPool.push(character);
        }
        this.broadcastState();
    },
    
    setupVoiceChat(targetId) {
        console.log('[Networking] Setting up voice chat with:', targetId);
        if (!GameState.localStream) {
            console.warn('[Networking] No local stream available for voice chat');
            return;
        }

        const call = GameState.peer.call(targetId, GameState.localStream);

        call.on('stream', (remoteStream) => {
            console.log('[Networking] Received audio stream from:', targetId);
            this.playAudio(targetId, remoteStream);
        });

        GameState.audioConnections.set(targetId, call);
    },

    playAudio(peerId, stream) {
        console.log('[Networking] Playing audio from:', peerId);
        const audio = new Audio();
        audio.srcObject = stream;
        audio.play();

        // Store audio element to manage it
        if (!GameState.audioElements) {
            GameState.audioElements = new Map();
        }
        GameState.audioElements.set(peerId, audio);
    },
    
    removeAudioConnection(peerId) {
        // Clean up media connection
        const conn = GameState.audioConnections.get(peerId);
        if (conn) {
            conn.close();
            GameState.audioConnections.delete(peerId);
        }
        
        // Clean up audio element
        if (GameState.audioElements) {
            const audio = GameState.audioElements.get(peerId);
            if (audio) {
                audio.pause();
                audio.srcObject = null;
                GameState.audioElements.delete(peerId);
            }
        }
    },
    
    async initializeVoiceChat() {
        console.log('[Networking] Initializing voice chat');
        try {
            GameState.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            console.log('[Networking] Microphone access granted');

            GameState.peer.on('call', (call) => {
                console.log('[Networking] Incoming call from:', call.peer);
                call.answer(GameState.localStream);
                call.on('stream', (remoteStream) => {
                    this.playAudio(call.peer, remoteStream);
                });
            });

        } catch (error) {
            console.error('[Networking] Error accessing microphone:', error);
            UI.showError('No se pudo acceder al micrófono');
        }
    },

    toggleMute() {
        console.log('[Networking] Toggle mute, current state:', GameState.isMuted);
        if (GameState.localStream) {
            const audioTrack = GameState.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                GameState.isMuted = !audioTrack.enabled;
                console.log('[Networking] Mute state changed to:', GameState.isMuted);
                UI.updateMuteButton(GameState.isMuted);
            }
        }
    },
    
    broadcast(message) {
        GameState.connections.forEach((conn) => {
            if (conn.open) {
                conn.send(message);
            }
        });
    },
    
    broadcastState() {
        const state = {
            tipo: 'ROOM_STATE',
            jugadores: Array.from(GameState.players.values()),
            configuracion: GameState.config,
            fase: GameState.isGameRunning ? 'playing' : 'lobby',
            hostAvatar: GameState.avatar,
            hostName: GameState.playerName,
            poolSize: GameState.characterPool.length
        };
        this.broadcast(state);
    },
    
    sendStateToPlayer(conn) {
        const state = {
            tipo: 'ROOM_STATE',
            jugadores: Array.from(GameState.players.values()),
            configuracion: GameState.config,
            fase: GameState.isGameRunning ? 'playing' : 'lobby',
            hostAvatar: GameState.avatar,
            hostName: GameState.playerName,
            poolSize: GameState.characterPool.length
        };
        conn.send(state);
    },
    
    handleRoomState(data) {
        // Update local state with host's state
        GameState.players.clear();
        data.jugadores.forEach(player => {
            GameState.players.set(player.id, player);
        });
        GameState.config = data.configuracion;
        GameState.hostAvatarData = data.hostAvatar || GameState.hostAvatarData;
        GameState.hostNameDisplay = data.hostName || GameState.hostNameDisplay;
        GameState.poolSize = data.poolSize || 0;
        
        UI.updatePlayerList();
        
        if (data.fase === 'playing' && GameState.screen === 'lobby') {
            UI.showScreen('auction');
            ThreeJSRoom.initialize();
        }
    },
    
    // Game messages (host side)
    handleBid(playerId, amount) {
        console.log('[Networking] Handling bid from:', playerId, 'amount:', amount);
        if (!this.validateBid(playerId, amount)) {
            console.log('[Networking] Bid validation failed');
            return; // Invalid bid, don't broadcast
        }

        GameState.currentBid = amount;
        GameState.currentBidder = playerId;

        // Reset soft close timer
        this.resetBidTimer();

        const message = {
            tipo: 'BID_UPDATE',
            jugadorId: playerId,
            monto: amount,
            cierreSuaveHasta: Date.now() + 10000 // 10 seconds
        };

        console.log('[Networking] Broadcasting bid update');
        this.broadcast(message);
        UI.updateBidDisplay(amount, playerId);
    },
    
    validateBid(playerId, amount) {
        console.log('[Networking] Validating bid:', playerId, amount, 'current bid:', GameState.currentBid);
        const player = GameState.players.get(playerId);
        if (!player) {
            console.log('[Networking] Validation failed: Player not found');
            return false;
        }

        // Check if bid is higher than current
        if (amount <= GameState.currentBid) {
            console.log('[Networking] Validation failed: Bid not higher than current');
            return false;
        }

        // Check if player has enough money
        if (amount > player.money) {
            console.log('[Networking] Validation failed: Insufficient funds');
            return false;
        }

        // Check turn-based mode
        if (GameState.config.bidMode === 'turns' && GameState.currentBid === 0) {
            const currentPlayerIndex = (GameState.currentRound - 1) % GameState.players.size;
            const playersArray = Array.from(GameState.players.keys());
            const currentPlayerId = playersArray[currentPlayerIndex];
            if (playerId !== currentPlayerId) {
                console.log('[Networking] Validation failed: Not player\'s turn');
                return false;
            }
        }

        // Check max waifus limit
        if (!GameState.config.unlimitedWaifus && player.collection.length >= GameState.config.maxWaifus) {
            console.log('[Networking] Validation failed: Max waifus limit reached');
            return false;
        }

        console.log('[Networking] Bid validation passed');
        return true;
    },
    
    resetBidTimer() {
        if (GameState.bidTimer) {
            clearTimeout(GameState.bidTimer);
        }
        
        GameState.bidTimer = setTimeout(() => {
            this.endRound();
        }, 10000); // 10 seconds soft close
    },
    
    handleSkip(playerId) {
        // Skip logic - player passes on this round
        // Could implement skip tracking if needed
    },
    
    startRound() {
        console.log('[Networking] Starting round:', GameState.currentRound + 1);
        if (GameState.characterPool.length === 0) {
            console.log('[Networking] No characters left, ending game');
            this.endGame();
            return;
        }

        GameState.currentRound++;

        // Select character based on game mode
        let character;
        let soloAnime = false;

        switch (GameState.config.gameMode) {
            case 'random':
            case 'blind':
                const randomIndex = Math.floor(Math.random() * GameState.characterPool.length);
                character = GameState.characterPool[randomIndex];
                soloAnime = GameState.config.gameMode === 'blind';
                break;
            case 'choice':
                // En modo Elección el pool ya lo arman los jugadores (PROPONER_PERSONAJE);
                // cada ronda se toma uno al azar de ese pool colaborativo.
                const choiceIndex = Math.floor(Math.random() * GameState.characterPool.length);
                character = GameState.characterPool[choiceIndex];
                break;
        }

        GameState.currentCharacter = character;
        GameState.currentBid = 0;
        GameState.currentBidder = null;
        GameState.roundPhase = 'bidding';

        console.log('[Networking] Selected character:', character.name, 'soloAnime:', soloAnime);

        // Determine who opens the bid in turn mode
        let openerId = null;
        if (GameState.config.bidMode === 'turns') {
            const playersArray = Array.from(GameState.players.keys());
            const openerIndex = (GameState.currentRound - 1) % playersArray.length;
            openerId = playersArray[openerIndex];
            console.log('[Networking] Turn mode, opener:', openerId);
        }

        const message = {
            tipo: 'ROUND_START',
            personaje: character,
            soloAnime: soloAnime,
            numeroRonda: GameState.currentRound,
            jugadorQueAbre: openerId
        };

        console.log('[Networking] Broadcasting round start');
        this.broadcast(message);
        UI.startRound(character, soloAnime, GameState.currentRound, openerId);

        // Start no-bid timeout
        this.startNoBidTimeout();
    },
    
    startNoBidTimeout() {
        if (GameState.noBidTimer) {
            clearTimeout(GameState.noBidTimer);
        }
        
        GameState.noBidTimer = setTimeout(() => {
            if (GameState.currentBid === 0) {
                // No one bid, skip character
                this.skipCharacter();
            }
        }, GameState.config.noBidTimeout * 1000);
    },
    
    skipCharacter() {
        // Remove character from pool and move to next round
        const characterIndex = GameState.characterPool.indexOf(GameState.currentCharacter);
        if (characterIndex > -1) {
            GameState.characterPool.splice(characterIndex, 1);
        }
        
        this.startRound();
    },
    
    endRound() {
        console.log('[Networking] Ending round, winner:', GameState.currentBidder, 'amount:', GameState.currentBid);
        if (GameState.currentBidder && GameState.currentCharacter) {
            // Award character to winner
            const winner = GameState.players.get(GameState.currentBidder);
            if (winner) {
                winner.money -= GameState.currentBid;
                winner.collection.push({
                    ...GameState.currentCharacter,
                    price: GameState.currentBid
                });

                // Remove character from pool
                const characterIndex = GameState.characterPool.indexOf(GameState.currentCharacter);
                if (characterIndex > -1) {
                    GameState.characterPool.splice(characterIndex, 1);
                }
                console.log('[Networking] Character awarded to:', winner.nombre, 'remaining money:', winner.money);
            }
        }

        const message = {
            tipo: 'ROUND_END',
            ganadorId: GameState.currentBidder,
            personaje: GameState.currentCharacter,
            precioFinal: GameState.currentBid
        };

        console.log('[Networking] Broadcasting round end');
        this.broadcast(message);
        UI.endRound(GameState.currentBidder, GameState.currentCharacter, GameState.currentBid);

        // Check if game should end
        if (this.shouldEndGame()) {
            console.log('[Networking] Game should end');
            setTimeout(() => this.endGame(), 2000);
        } else {
            console.log('[Networking] Starting next round in 3 seconds');
            setTimeout(() => this.startRound(), 3000);
        }
    },
    
    shouldEndGame() {
        if (GameState.config.unlimitedRounds) {
            return GameState.characterPool.length === 0;
        }
        
        return GameState.currentRound >= GameState.config.maxRounds || 
               GameState.characterPool.length === 0;
    },
    
    endGame() {
        GameState.isGameRunning = false;
        
        const collections = {};
        GameState.players.forEach((player, id) => {
            collections[id] = player.collection;
        });
        
        const message = {
            tipo: 'GAME_END',
            coleccionesFinales: collections
        };
        
        this.broadcast(message);
        UI.showEndScreen(collections);
        
        // Start voting
        setTimeout(() => this.startVoting(), 3000);
    },
    
    startVoting() {
        const mode = GameState.config.voteMode;
        GameState.voting = { mode, items: [], currentIndex: 0, votesReceived: new Map(), results: [] };
        
        if (mode === 'onebyone') {
            this.startOneByOneVoting();
        } else {
            // 'price' y 'round' comparten la misma mecánica: comparar un ítem por jugador
            this.startCompareVoting(mode);
        }
    },
    
    startCompareVoting(mode) {
        const items = [];
        GameState.players.forEach((player, id) => {
            if (player.collection.length === 0) return;
            const character = mode === 'round'
                ? player.collection[0] // primera compra
                : player.collection.reduce((a, b) => (a.price > b.price ? a : b)); // más cara
            items.push({ playerId: id, playerName: player.nombre, character });
        });
        
        if (items.length === 0) {
            this.finishVoting(null);
            return;
        }
        
        GameState.voting.items = items;
        GameState.voting.votesReceived = new Map();
        
        this.broadcast({ tipo: 'VOTE_PROMPT', items, modo: mode });
        UI.showVoting(items, mode);
    },
    
    startOneByOneVoting() {
        const items = [];
        GameState.players.forEach((player, id) => {
            player.collection.forEach(character => {
                items.push({ playerId: id, playerName: player.nombre, character });
            });
        });
        
        if (items.length === 0) {
            this.finishVoting(null);
            return;
        }
        
        GameState.voting.items = items;
        GameState.voting.currentIndex = 0;
        this.presentNextOneByOneItem();
    },
    
    presentNextOneByOneItem() {
        if (GameState.voting.currentIndex >= GameState.voting.items.length) {
            const mejor = GameState.voting.results.length > 0
                ? GameState.voting.results.reduce((a, b) => (b.promedio > a.promedio ? b : a))
                : null;
            this.finishVoting(mejor);
            return;
        }
        
        GameState.voting.votesReceived = new Map();
        const item = GameState.voting.items[GameState.voting.currentIndex];
        this.broadcast({ tipo: 'VOTE_PROMPT', items: [item], modo: 'onebyone' });
        UI.showVoting([item], 'onebyone');
    },
    
    handleVote(playerId, data) {
        if (!GameState.voting) return;
        GameState.voting.votesReceived.set(playerId, data.valor);
        
        if (GameState.voting.votesReceived.size >= GameState.players.size) {
            this.tallyCurrentVote();
        }
    },
    
    tallyCurrentVote() {
        const mode = GameState.voting.mode;
        const votos = Array.from(GameState.voting.votesReceived.values()).filter(v => v !== 'skip');
        
        if (mode === 'onebyone') {
            const item = GameState.voting.items[GameState.voting.currentIndex];
            const calificaciones = votos.filter(v => typeof v === 'number');
            const promedio = calificaciones.length > 0
                ? calificaciones.reduce((a, b) => a + b, 0) / calificaciones.length
                : 0;
            const resultado = { item, promedio, totalVotos: calificaciones.length };
            GameState.voting.results.push(resultado);
            
            this.broadcast({ tipo: 'VOTE_RESULT', resultado, esFinal: false });
            UI.showVoteResults(resultado, false);
            
            GameState.voting.currentIndex++;
            setTimeout(() => this.presentNextOneByOneItem(), 3000);
        } else {
            const conteo = {};
            votos.forEach(id => { conteo[id] = (conteo[id] || 0) + 1; });
            let ganadorId = null, maxVotos = -1;
            Object.entries(conteo).forEach(([id, n]) => {
                if (n > maxVotos) { maxVotos = n; ganadorId = id; }
            });
            const ganador = GameState.voting.items.find(i => i.playerId === ganadorId) || null;
            const resultado = ganador ? { ganador, totalVotos: votos.length } : null;
            
            this.finishVoting(resultado);
        }
    },
    
    finishVoting(resultado) {
        this.broadcast({ tipo: 'VOTE_RESULT', resultado, esFinal: true });
        UI.showVoteResults(resultado, true);
    },
    
    // Client-side message handlers
    handleRoundStart(data) {
        GameState.currentCharacter = data.personaje;
        GameState.currentRound = data.numeroRonda;
        GameState.roundPhase = 'bidding';
        
        UI.startRound(data.personaje, data.soloAnime, data.numeroRonda, data.jugadorQueAbre);
    },
    
    handleBidUpdate(data) {
        GameState.currentBid = data.monto;
        GameState.currentBidder = data.jugadorId;
        
        UI.updateBidDisplay(data.monto, data.jugadorId);
        UI.updateBidTimer(data.cierreSuaveHasta);
    },
    
    handleRoundEnd(data) {
        // Actualizar el estado local de quien haya ganado (no solo si soy yo),
        // para que todos vean dinero/colección al día en todo momento
        if (data.ganadorId) {
            const player = GameState.players.get(data.ganadorId);
            if (player) {
                player.money -= data.precioFinal;
                player.collection.push({
                    ...data.personaje,
                    price: data.precioFinal
                });
            }
        }
        
        UI.endRound(data.ganadorId, data.personaje, data.precioFinal);
    },
    
    handleGameEnd(data) {
        GameState.isGameRunning = false;
        GameState.collections = new Map(Object.entries(data.coleccionesFinales));
        UI.showEndScreen(data.coleccionesFinales);
    },
    
    handleVotePrompt(data) {
        UI.showVoting(data.items, data.modo);
    },
    
    handleVoteResult(data) {
        UI.showVoteResults(data.resultado, data.esFinal);
    },
    
    // Bid placement (client-side)
    placeBid(amount) {
        if (GameState.isHost) {
            this.handleBid(GameState.peer.id, amount);
        } else {
            const conn = GameState.connections.get(GameState.hostId);
            if (conn && conn.open) {
                conn.send({
                    tipo: 'PLACE_BID',
                    monto: amount
                });
            }
        }
    },
    
    skip() {
        if (GameState.isHost) {
            this.handleSkip(GameState.peer.id);
        } else {
            const conn = GameState.connections.get(GameState.hostId);
            if (conn && conn.open) {
                conn.send({
                    tipo: 'SKIP'
                });
            }
        }
    },
    
    submitVote(itemId, value) {
        if (GameState.isHost) {
            this.handleVote(GameState.peer.id, { itemId, valor: value });
        } else {
            const conn = GameState.connections.get(GameState.hostId);
            if (conn && conn.open) {
                conn.send({
                    tipo: 'VOTE',
                    itemId,
                    valor: value
                });
            }
        }
    }
};

// ==================== THREE.JS 3D ROOM ====================
const ThreeJSRoom = {
    scene: null,
    camera: null,
    renderer: null,
    playerSprites: new Map(),
    
    initialize() {
        console.log('[ThreeJSRoom] Initializing 3D room');
        const container = document.getElementById('three-container');
        if (!container) {
            console.error('[ThreeJSRoom] Container not found');
            return;
        }
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 1.6, 0); // Eye level
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.renderer.domElement);
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);
        
        // Create room
        this.createRoom();
        
        // Create player seats
        this.createPlayerSeats();
        
        // Create center podium
        this.createCenterPodium();
        
        // Add players
        this.addPlayersToScene();
        
        // Add el anfitrión como presentador junto al podio
        this.addHostToScene();
        
        // Handle resize
        window.addEventListener('resize', () => this.onWindowResize());
        
        // Start render loop
        this.animate();
        
        // Setup pointer lock controls
        this.setupControls();
    },
    
    createRoom() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513,
            roughness: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = 0;
        this.scene.add(floor);
        
        // Walls
        const wallMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xDEB887,
            roughness: 0.9
        });
        
        // Back wall
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 5),
            wallMaterial
        );
        backWall.position.set(0, 2.5, -10);
        this.scene.add(backWall);
        
        // Side walls
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 5),
            wallMaterial
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-10, 2.5, 0);
        this.scene.add(leftWall);
        
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 5),
            wallMaterial
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(10, 2.5, 0);
        this.scene.add(rightWall);
    },
    
    createPlayerSeats() {
        const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x4a4a4a });
        const players = Array.from(GameState.players.values());
        const radius = 6;
        
        players.forEach((player, index) => {
            const angle = (index / players.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Chair
            const chair = new THREE.Mesh(
                new THREE.BoxGeometry(1, 0.5, 1),
                seatMaterial
            );
            chair.position.set(x, 0.25, z);
            chair.rotation.y = -angle + Math.PI;
            this.scene.add(chair);
            
            // Chair back
            const chairBack = new THREE.Mesh(
                new THREE.BoxGeometry(1, 1, 0.1),
                seatMaterial
            );
            chairBack.position.set(x, 0.75, z + 0.45);
            chairBack.rotation.y = -angle + Math.PI;
            this.scene.add(chairBack);
        });
    },
    
    createCenterPodium() {
        // Podium base
        const podium = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 1, 32),
            new THREE.MeshStandardMaterial({ color: 0x8B0000 })
        );
        podium.position.set(0, 0.5, 0);
        this.scene.add(podium);
        
        // Screen stand
        const stand = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.3, 3, 16),
            new THREE.MeshStandardMaterial({ color: 0x4a4a4a })
        );
        stand.position.set(0, 2.5, 0);
        this.scene.add(stand);
        
        // Screen frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 0.2),
            new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
        );
        frame.position.set(0, 4.5, 0);
        this.scene.add(frame);
        
        // Screen (will be updated with character images)
        const screenGeometry = new THREE.PlaneGeometry(2.8, 1.8);
        const screenMaterial = new THREE.MeshBasicMaterial({ color: 0x1a1a1a });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 4.5, 0.1);
        screen.name = 'characterScreen';
        this.scene.add(screen);
    },
    
    addPlayersToScene() {
        const players = Array.from(GameState.players.values());
        const radius = 6;
        
        players.forEach((player, index) => {
            const angle = (index / players.length) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // Create avatar sprite
            if (player.avatar) {
                const texture = AvatarSystem.createAvatarTexture(player.avatar);
                const material = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(material);
                sprite.scale.set(1, 1, 1);
                sprite.position.set(x, 1.5, z);
                this.scene.add(sprite);
                this.playerSprites.set(player.id, sprite);
            }
        });
    },
    
    addHostToScene() {
        // El anfitrión no está en GameState.players (no puja), así que se dibuja
        // aparte, junto al podio, usando su propio avatar o el que llegó por
        // ROOM_STATE si quien mira la escena es un jugador invitado.
        const avatarData = GameState.isHost ? GameState.avatar : GameState.hostAvatarData;
        if (!avatarData) return;
        
        const texture = AvatarSystem.createAvatarTexture(avatarData);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.3, 1.3, 1.3);
        sprite.position.set(0, 2.3, -1.6);
        this.scene.add(sprite);
        this.hostSprite = sprite;
    },
    
    updateCharacterScreen(imageUrl) {
        const screen = this.scene.getObjectByName('characterScreen');
        if (screen && imageUrl) {
            const textureLoader = new THREE.TextureLoader();
            textureLoader.load(imageUrl, (texture) => {
                screen.material.map = texture;
                screen.material.needsUpdate = true;
            });
        }
    },
    
    setupControls() {
        // Simple mouse look
        let isPointerLocked = false;
        
        const canvas = this.renderer.domElement;
        
        canvas.addEventListener('click', () => {
            if (!isPointerLocked) {
                canvas.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            isPointerLocked = document.pointerLockElement === canvas;
        });
        
        document.addEventListener('mousemove', (event) => {
            if (isPointerLocked) {
                const sensitivity = 0.002;
                this.camera.rotation.y -= event.movementX * sensitivity;
                this.camera.rotation.x -= event.movementY * sensitivity;
                
                // Limit vertical look
                this.camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.camera.rotation.x));
            }
        });
    },
    
    onWindowResize() {
        const container = document.getElementById('three-container');
        if (!container) return;
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    },
    
    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    },
    
    cleanup() {
        if (this.renderer) {
            this.renderer.domElement.remove();
            this.renderer.dispose();
        }
        this.playerSprites.clear();
    }
};

// ==================== UI MANAGEMENT ====================
const UI = {
    showScreen(screenName) {
        console.log('[UI] Switching to screen:', screenName);
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Map screen names to actual HTML IDs
        const screenIdMap = {
            'start': 'start-screen',
            'avatar': 'avatar-creator',
            'lobby': 'lobby-screen',
            'config': 'config-screen',
            'selection': 'character-selection',
            'auction': 'auction-room',
            'end': 'end-screen'
        };

        const targetId = screenIdMap[screenName] || screenName + '-screen';
        const targetScreen = document.getElementById(targetId);

        if (targetScreen) {
            targetScreen.classList.remove('hidden');
            console.log('[UI] Screen displayed:', targetId);
        } else {
            console.error('[UI] Screen not found:', targetId);
        }

        GameState.screen = screenName;
    },

    showError(message) {
        console.error('[UI] Showing error:', message);
        alert(message); // Simple error display
    },
    
    showRoomCode(code) {
        console.log('[UI] Showing room code:', code);
        document.getElementById('display-room-code').textContent = code;
        this.showScreen('lobby');

        if (GameState.isHost) {
            document.getElementById('host-info').classList.remove('hidden');
            document.getElementById('host-controls').classList.remove('hidden');
        }
    },
    
    updatePlayerList() {
        console.log('[UI] Updating player list, total players:', GameState.players.size);
        const list = document.getElementById('players-list');
        if (!list) {
            console.error('[UI] Player list element not found');
            return;
        }
        
        list.innerHTML = '';
        GameState.players.forEach((player) => {
            const li = document.createElement('li');
            
            // Create avatar thumbnail
            const avatarCanvas = document.createElement('canvas');
            avatarCanvas.width = 40;
            avatarCanvas.height = 40;
            const originalCtx = AvatarSystem.ctx;
            const originalCanvas = AvatarSystem.canvas;
            AvatarSystem.ctx = avatarCanvas.getContext('2d');
            AvatarSystem.canvas = avatarCanvas;
            AvatarSystem.drawAvatar(player.avatar);
            AvatarSystem.ctx = originalCtx;
            AvatarSystem.canvas = originalCanvas;
            
            const img = document.createElement('img');
            img.src = avatarCanvas.toDataURL();
            
            li.appendChild(img);
            li.appendChild(document.createTextNode(player.nombre));
            
            if (player.id === GameState.hostId) {
                li.appendChild(document.createTextNode(' (Anfitrión)'));
            }
            
            list.appendChild(li);
        });
        
        // Enable start button if host and enough players
        const startButton = document.getElementById('btn-start-game');
        if (startButton && GameState.isHost) {
            startButton.disabled = GameState.players.size < 2;
            console.log('[UI] Start button enabled:', !startButton.disabled);
        }
        
        const proposeBtn = document.getElementById('btn-propose-characters');
        if (proposeBtn) {
            proposeBtn.classList.toggle('hidden', GameState.isHost || GameState.config.gameMode !== 'choice');
        }
        const poolProgress = document.getElementById('pool-progress');
        if (poolProgress) {
            if (!GameState.isHost && GameState.config.gameMode === 'choice') {
                poolProgress.classList.remove('hidden');
                const countSpan = document.getElementById('pool-progress-count');
                if (countSpan) countSpan.textContent = GameState.poolSize || 0;
            } else {
                poolProgress.classList.add('hidden');
            }
        }
    },
    
    updateMuteButton(isMuted) {
        const muteButtons = [document.getElementById('btn-mute'), document.getElementById('hud-mute')];
        muteButtons.forEach(btn => {
            if (btn) {
                if (isMuted) {
                    btn.textContent = '🔇 Activar';
                    btn.classList.add('muted');
                } else {
                    btn.textContent = '🎤 Silenciar';
                    btn.classList.remove('muted');
                }
            }
        });
        
        const status = document.getElementById('voice-status');
        if (status) {
            status.textContent = isMuted ? 'Voz silenciada' : 'Voz activa';
        }
    },
    
    showCharacterSearchResults(results) {
        const container = document.getElementById('search-results');
        if (!container) return;
        
        container.innerHTML = '';
        
        results.forEach(anime => {
            const div = document.createElement('div');
            div.className = 'anime-result';
            div.innerHTML = `
                <h4>${anime.title.romaji || anime.title.english}</h4>
                <p>${anime.description ? anime.description.substring(0, 100) + '...' : ''}</p>
            `;
            div.addEventListener('click', () => this.loadAnimeCharacters(anime.id, anime.title));
            container.appendChild(div);
        });
    },
    
    async loadAnimeCharacters(animeId, animeTitle) {
        const media = await AniListAPI.getCharacters(animeId);
        if (!media) return;
        
        const container = document.getElementById('search-results');
        container.innerHTML = `
            <h4>${animeTitle.romaji || animeTitle.english}</h4>
            <div class="character-grid"></div>
        `;
        
        const grid = container.querySelector('.character-grid');
        
        media.characters.edges.forEach(edge => {
            const char = edge.node;
            const div = document.createElement('div');
            div.className = 'character-item';
            div.innerHTML = `
                <img src="${char.image.large}" alt="${char.name.full}">
                <div class="select-indicator hidden">✓</div>
            `;
            div.addEventListener('click', () => this.toggleCharacterSelection(div, char, animeTitle));
            grid.appendChild(div);
        });
    },
    
    toggleCharacterSelection(element, character, animeTitle) {
        const isSelected = element.classList.contains('selected');
        
        if (isSelected) {
            element.classList.remove('selected');
            element.querySelector('.select-indicator').classList.add('hidden');
            
            // Remove from pool
            const index = GameState.characterPool.findIndex(c => c.id === character.id);
            if (index > -1) {
                GameState.characterPool.splice(index, 1);
            }
        } else {
            element.classList.add('selected');
            element.querySelector('.select-indicator').classList.remove('hidden');
            
            // Add to pool
            GameState.characterPool.push({
                id: character.id,
                name: character.name.full,
                image: character.image.large,
                anime: animeTitle.romaji || animeTitle.english
            });
        }
        
        this.updatePoolDisplay();
    },
    
    updatePoolDisplay() {
        const count = document.getElementById('pool-count');
        const pool = document.getElementById('character-pool');
        
        if (count) count.textContent = GameState.characterPool.length;
        
        if (pool) {
            pool.innerHTML = '';
            GameState.characterPool.forEach((char, index) => {
                const div = document.createElement('div');
                div.className = 'pool-character';
                div.innerHTML = `
                    <img src="${char.image}" alt="${char.name}">
                    <div class="remove-btn" data-index="${index}">✕</div>
                `;
                div.querySelector('.remove-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    GameState.characterPool.splice(index, 1);
                    this.updatePoolDisplay();
                });
                pool.appendChild(div);
            });
        }
        
        const confirmBtn = document.getElementById('btn-confirm-pool');
        if (confirmBtn) {
            if (GameState.isHost) {
                const minRounds = GameState.config.unlimitedRounds ? 1 : GameState.config.maxRounds;
                confirmBtn.disabled = GameState.characterPool.length < minRounds;
            } else {
                confirmBtn.disabled = GameState.characterPool.length < 1;
            }
        }
    },
    
    startRound(character, soloAnime, roundNumber, openerId) {
        // Update HUD
        const nameEl = document.getElementById('character-name');
        const animeEl = document.getElementById('anime-name');
        const imageEl = document.getElementById('character-image');
        const roundEl = document.getElementById('hud-round');
        
        if (nameEl) nameEl.textContent = soloAnime ? '???' : character.name;
        if (animeEl) animeEl.textContent = character.anime;
        
        if (imageEl) {
            if (soloAnime) {
                imageEl.classList.add('hidden');
            } else {
                imageEl.src = character.image;
                imageEl.classList.remove('hidden');
            }
        }
        
        if (roundEl) {
            if (GameState.config.showRounds && !GameState.config.unlimitedRounds) {
                roundEl.textContent = `Ronda ${roundNumber}/${GameState.config.maxRounds}`;
            } else {
                roundEl.textContent = `Ronda ${roundNumber}`;
            }
        }
        
        // Update 3D screen
        ThreeJSRoom.updateCharacterScreen(soloAnime ? null : character.image);
        
        // Reset bid display
        this.updateBidDisplay(0, null);
    },
    
    updateBidDisplay(amount, bidderId) {
        const amountEl = document.getElementById('bid-amount');
        if (amountEl) {
            amountEl.textContent = `$${amount}`;
        }
        
        // Update player money in HUD
        const moneyEl = document.getElementById('hud-money');
        if (moneyEl && GameState.players.has(GameState.peer.id)) {
            const player = GameState.players.get(GameState.peer.id);
            moneyEl.textContent = `$${player.money}`;
        }
    },
    
    updateBidTimer(endTime) {
        const timerEl = document.getElementById('bid-timer');
        if (!timerEl) return;
        
        const updateTimer = () => {
            const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
            timerEl.textContent = remaining > 0 ? `${remaining}s` : '';
            
            if (remaining > 0) {
                requestAnimationFrame(updateTimer);
            }
        };
        
        updateTimer();
    },
    
    endRound(winnerId, character, price) {
        // Show round end message
        const winner = GameState.players.get(winnerId);
        const message = winner 
            ? `${winner.nombre} ganó a ${character.name} por $${price}!`
            : 'Nadie pujó por este personaje';
        
        // Could show a temporary overlay
        console.log(message);
        
        this.updateCollectionDisplay();
    },
    
    updateCollectionDisplay() {
        const container = document.getElementById('hud-my-collection');
        const countEl = document.getElementById('hud-waifu-count');
        if (!GameState.peer) return;
        
        const me = GameState.players.get(GameState.peer.id);
        if (!me) return; // el anfitrión no tiene colección propia
        
        if (countEl) countEl.textContent = `${me.collection.length} 🎴`;
        if (container) {
            container.innerHTML = me.collection.map(item =>
                `<img src="${item.image}" alt="${item.name}" class="hud-collection-thumb" title="${item.name} ($${item.price})">`
            ).join('');
        }
    },
    
    showEndScreen(collections) {
        this.showScreen('end');
        
        const container = document.getElementById('final-collections');
        if (!container) return;
        
        container.innerHTML = '';
        
        Object.entries(collections).forEach(([playerId, collection]) => {
            const player = GameState.players.get(playerId);
            if (!player) return;
            
            const div = document.createElement('div');
            div.className = 'player-collection';
            div.innerHTML = `
                <h4>${player.nombre}</h4>
                <div class="collection-grid"></div>
            `;
            
            const grid = div.querySelector('.collection-grid');
            collection.forEach(item => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'collection-item';
                itemDiv.innerHTML = `
                    <img src="${item.image}" alt="${item.name}">
                    <div class="price">$${item.price}</div>
                `;
                grid.appendChild(itemDiv);
            });
            
            container.appendChild(div);
        });
    },
    
    showVoting(items, mode) {
        const section = document.getElementById('voting-section');
        if (!section) return;
        
        section.classList.remove('hidden');
        document.getElementById('vote-results')?.classList.add('hidden');
        
        const itemDiv = document.getElementById('vote-item');
        const controls = document.getElementById('vote-controls');
        controls.innerHTML = '';
        
        if (mode === 'onebyone') {
            const item = items[0];
            itemDiv.innerHTML = `
                <p>${item.playerName} compró:</p>
                <img src="${item.character.image}" alt="${item.character.name}">
                <p>${item.character.name} — $${item.character.price}</p>
                <p>Califica del 1 al 10:</p>
            `;
            for (let i = 1; i <= 10; i++) {
                const btn = document.createElement('button');
                btn.textContent = i;
                btn.addEventListener('click', () => Networking.submitVote(item.character.id, i));
                controls.appendChild(btn);
            }
            const skipBtn = document.createElement('button');
            skipBtn.textContent = 'Saltar >>';
            skipBtn.className = 'skip-btn';
            skipBtn.addEventListener('click', () => Networking.submitVote(item.character.id, 'skip'));
            controls.appendChild(skipBtn);
        } else {
            itemDiv.innerHTML = '<p>Vota por la mejor compra:</p>';
            items.forEach(item => {
                const btn = document.createElement('button');
                btn.innerHTML = `<img src="${item.character.image}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:8px;">${item.playerName} — ${item.character.name} ($${item.character.price})`;
                btn.addEventListener('click', () => Networking.submitVote(item.character.id, item.playerId));
                controls.appendChild(btn);
            });
            const skipBtn = document.createElement('button');
            skipBtn.textContent = 'Saltar >>';
            skipBtn.className = 'skip-btn';
            skipBtn.addEventListener('click', () => Networking.submitVote(null, 'skip'));
            controls.appendChild(skipBtn);
        }
    },
    
    showVoteResults(resultado, esFinal) {
        const votingSection = document.getElementById('voting-section');
        const resultsDiv = document.getElementById('vote-results');
        
        if (votingSection) votingSection.classList.add('hidden');
        if (resultsDiv) resultsDiv.classList.remove('hidden');
        
        const list = document.getElementById('results-list');
        if (!list) return;
        
        if (!resultado) {
            list.innerHTML = '<p>No hubo suficientes compras para votar.</p>';
            return;
        }
        
        if (resultado.promedio !== undefined) {
            list.innerHTML = `
                <div class="result-item ${esFinal ? 'winner' : ''}">
                    <img src="${resultado.item.character.image}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">
                    <div>
                        <strong>${esFinal ? '🏆 Mejor compra: ' : ''}${resultado.item.playerName} — ${resultado.item.character.name}</strong>
                        <p>Promedio: ${resultado.promedio.toFixed(1)}/10 (${resultado.totalVotos} votos)</p>
                    </div>
                </div>
            `;
        } else if (resultado.ganador) {
            list.innerHTML = `
                <div class="result-item winner">
                    <img src="${resultado.ganador.character.image}" alt="" style="width:60px;height:60px;object-fit:cover;border-radius:6px;">
                    <div>
                        <strong>🏆 Mejor compra: ${resultado.ganador.playerName} — ${resultado.ganador.character.name}</strong>
                        <p>${resultado.totalVotos} votos</p>
                    </div>
                </div>
            `;
        } else {
            list.innerHTML = '<p>Nadie votó.</p>';
        }
    }
};

// ==================== EVENT LISTENERS ====================
function setupEventListeners() {
    console.log('[Init] Setting up event listeners...');

    try {
        // Verificar elementos críticos
        const criticalElements = [
            'btn-create-room', 'btn-join-room', 'btn-edit-avatar',
            'player-name', 'start-screen'
        ];

        console.log('[Init] Checking for critical DOM elements...');
        criticalElements.forEach(id => {
            const element = document.getElementById(id);
            if (!element) {
                console.error(`[Init] Critical element not found: ${id}`);
            } else {
                console.log(`[Init] Element found: ${id}`);
            }
        });

        // Start screen
        const btnCreateRoom = document.getElementById('btn-create-room');
        if (btnCreateRoom) {
            addVisualFeedback('btn-create-room');
            btnCreateRoom.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-create-room');
                try {
                    handleCreateRoom(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleCreateRoom:', error);
                }
            });
            console.log('[Init] btn-create-room listener registered');
        } else {
            console.error('[Init] btn-create-room not found');
        }

        const btnJoinRoom = document.getElementById('btn-join-room');
        if (btnJoinRoom) {
            addVisualFeedback('btn-join-room');
            btnJoinRoom.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-join-room');
                document.getElementById('join-section').classList.toggle('hidden');
            });
            console.log('[Init] btn-join-room listener registered');
        }

        const btnJoinSubmit = document.getElementById('btn-join-submit');
        if (btnJoinSubmit) {
            addVisualFeedback('btn-join-submit');
            btnJoinSubmit.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-join-submit');
                try {
                    handleJoinRoom(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleJoinRoom:', error);
                }
            });
            console.log('[Init] btn-join-submit listener registered');
        }

        const btnEditAvatar = document.getElementById('btn-edit-avatar');
        if (btnEditAvatar) {
            addVisualFeedback('btn-edit-avatar');
            btnEditAvatar.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-edit-avatar');
                try {
                    handleEditAvatar(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleEditAvatar:', error);
                }
            });
            console.log('[Init] btn-edit-avatar listener registered');
        }

        // Avatar creator
        const btnSaveAvatar = document.getElementById('btn-save-avatar');
        if (btnSaveAvatar) {
            addVisualFeedback('btn-save-avatar');
            btnSaveAvatar.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-save-avatar');
                try {
                    handleSaveAvatar(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleSaveAvatar:', error);
                }
            });
            console.log('[Init] btn-save-avatar listener registered');
        }

        const btnCancelAvatar = document.getElementById('btn-cancel-avatar');
        if (btnCancelAvatar) {
            addVisualFeedback('btn-cancel-avatar');
            btnCancelAvatar.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-cancel-avatar');
                UI.showScreen('start');
            });
            console.log('[Init] btn-cancel-avatar listener registered');
        }

        // Avatar controls
        const avatarControls = [
            'face-shape', 'skin-tone', 'eye-style', 'eye-color',
            'eyebrow-style', 'nose-style', 'mouth-style', 'hair-style',
            'hair-color', 'accessory'
        ];

        avatarControls.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log(`[DEBUG] Avatar control changed: ${id}`);
                    try {
                        AvatarSystem.init();
                        AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
                    } catch (error) {
                        console.error(`[DEBUG] Error in avatar control ${id}:`, error);
                    }
                });
                console.log(`[Init] Avatar control listener registered: ${id}`);
            } else {
                console.warn(`[Init] Avatar control not found: ${id}`);
            }
        });

        // Lobby
        const btnConfigureGame = document.getElementById('btn-configure-game');
        if (btnConfigureGame) {
            addVisualFeedback('btn-configure-game');
            btnConfigureGame.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-configure-game');
                try {
                    handleConfigureGame(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleConfigureGame:', error);
                }
            });
            console.log('[Init] btn-configure-game listener registered');
        }

        const btnStartGame = document.getElementById('btn-start-game');
        if (btnStartGame) {
            addVisualFeedback('btn-start-game');
            btnStartGame.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-start-game');
                try {
                    handleStartGame(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleStartGame:', error);
                }
            });
            console.log('[Init] btn-start-game listener registered');
        }

        const btnMute = document.getElementById('btn-mute');
        if (btnMute) {
            addVisualFeedback('btn-mute');
            btnMute.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-mute');
                Networking.toggleMute();
            });
            console.log('[Init] btn-mute listener registered');
        }

        const btnLeaveRoom = document.getElementById('btn-leave-room');
        if (btnLeaveRoom) {
            addVisualFeedback('btn-leave-room');
            btnLeaveRoom.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-leave-room');
                try {
                    handleLeaveRoom(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleLeaveRoom:', error);
                }
            });
            console.log('[Init] btn-leave-room listener registered');
        }

        // Configuration
        const btnSaveConfig = document.getElementById('btn-save-config');
        if (btnSaveConfig) {
            addVisualFeedback('btn-save-config');
            btnSaveConfig.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-save-config');
                try {
                    handleSaveConfig(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleSaveConfig:', error);
                }
            });
            console.log('[Init] btn-save-config listener registered');
        }

        const btnCancelConfig = document.getElementById('btn-cancel-config');
        if (btnCancelConfig) {
            addVisualFeedback('btn-cancel-config');
            btnCancelConfig.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-cancel-config');
                UI.showScreen('lobby');
            });
            console.log('[Init] btn-cancel-config listener registered');
        }

        // Character selection
        const btnSearchAnime = document.getElementById('btn-search-anime');
        if (btnSearchAnime) {
            addVisualFeedback('btn-search-anime');
            btnSearchAnime.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-search-anime');
                try {
                    handleSearchAnime(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleSearchAnime:', error);
                }
            });
            console.log('[Init] btn-search-anime listener registered');
        }

        const btnConfirmPool = document.getElementById('btn-confirm-pool');
        if (btnConfirmPool) {
            addVisualFeedback('btn-confirm-pool');
            btnConfirmPool.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-confirm-pool');
                try {
                    handleConfirmPool(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleConfirmPool:', error);
                }
            });
            console.log('[Init] btn-confirm-pool listener registered');
        }

        const btnCancelPool = document.getElementById('btn-cancel-pool');
        if (btnCancelPool) {
            addVisualFeedback('btn-cancel-pool');
            btnCancelPool.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-cancel-pool');
                UI.showScreen('lobby');
            });
            console.log('[Init] btn-cancel-pool listener registered');
        }

        const btnProposeCharacters = document.getElementById('btn-propose-characters');
        if (btnProposeCharacters) {
            addVisualFeedback('btn-propose-characters');
            btnProposeCharacters.addEventListener('click', () => {
                console.log('[DEBUG] Click on btn-propose-characters');
                UI.showScreen('selection');
            });
            console.log('[Init] btn-propose-characters listener registered');
        }

        // HUD bidding
        document.querySelectorAll('.bid-btn').forEach(btn => {
            addVisualFeedback(btn);
            btn.addEventListener('click', () => {
                console.log('[DEBUG] Click on bid-btn');
                const amount = btn.dataset.amount;
                if (amount === 'max') {
                    const player = GameState.players.get(GameState.peer.id);
                    if (player) {
                        Networking.placeBid(player.money);
                    }
                } else {
                    Networking.placeBid(parseInt(amount) + GameState.currentBid);
                }
            });
        });
        console.log('[Init] bid-btn listeners registered');

        const skipBtn = document.querySelector('.skip-btn');
        if (skipBtn) {
            addVisualFeedback(skipBtn);
            skipBtn.addEventListener('click', () => {
                console.log('[DEBUG] Click on skip-btn');
                Networking.skip();
            });
            console.log('[Init] skip-btn listener registered');
        }

        const hudMute = document.getElementById('hud-mute');
        if (hudMute) {
            addVisualFeedback('hud-mute');
            hudMute.addEventListener('click', () => {
                console.log('[DEBUG] Click on hud-mute');
                Networking.toggleMute();
            });
            console.log('[Init] hud-mute listener registered');
        }

        // End screen
        const btnBackToStart = document.getElementById('btn-back-to-start');
        if (btnBackToStart) {
            addVisualFeedback('btn-back-to-start');
            btnBackToStart.addEventListener('click', (e) => {
                console.log('[DEBUG] Click on btn-back-to-start');
                try {
                    handleBackToStart(e);
                } catch (error) {
                    console.error('[DEBUG] Error in handleBackToStart:', error);
                }
            });
            console.log('[Init] btn-back-to-start listener registered');
        }

        console.log('[Init] All event listeners registered successfully');

    } catch (error) {
        console.error('[Init] Error setting up event listeners:', error);
    }
}

// ==================== EVENT HANDLERS ====================
function handleCreateRoom() {
    console.log('[Event] handleCreateRoom called');
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
        console.error('[Event] No name provided');
        UI.showError('Por favor ingresa tu nombre');
        return;
    }

    GameState.playerName = name;
    console.log('[Event] Player name set:', name);

    // Check for avatar
    if (!AvatarSystem.loadAvatar()) {
        console.log('[Event] No avatar found, showing avatar creator');
        UI.showScreen('avatar');
        AvatarSystem.init();
        AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
        return;
    }

    console.log('[Event] Creating room and initializing voice chat');
    Networking.createRoom();
    Networking.initializeVoiceChat();
}

function handleJoinRoom() {
    console.log('[Event] handleJoinRoom called');
    const name = document.getElementById('player-name').value.trim();
    const code = document.getElementById('room-code').value.trim().toUpperCase();

    if (!name) {
        console.error('[Event] No name provided');
        UI.showError('Por favor ingresa tu nombre');
        return;
    }

    if (code.length !== 4) {
        console.error('[Event] Invalid room code length:', code.length);
        UI.showError('El código debe tener 4 letras');
        return;
    }

    GameState.playerName = name;
    GameState.roomCode = code;
    console.log('[Event] Joining room:', code, 'as:', name);

    // Check for avatar
    if (!AvatarSystem.loadAvatar()) {
        console.log('[Event] No avatar found, showing avatar creator');
        UI.showScreen('avatar');
        AvatarSystem.init();
        AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
        return;
    }

    console.log('[Event] Joining room and initializing voice chat');
    Networking.joinRoom(code);
    Networking.initializeVoiceChat();
}

function handleEditAvatar() {
    console.log('[Event] handleEditAvatar called');
    try {
        console.log('[Event] Switching to avatar screen');
        UI.showScreen('avatar');
        AvatarSystem.init();

        // Load existing avatar or default
        const avatar = AvatarSystem.loadAvatar() || AvatarSystem.getAvatarFromForm();
        console.log('[Event] Drawing avatar:', avatar ? 'loaded' : 'default');
        AvatarSystem.drawAvatar(avatar);
        console.log('[Event] Avatar screen setup complete');
    } catch (error) {
        console.error('[Event] Error in handleEditAvatar:', error);
    }
}

function handleSaveAvatar() {
    AvatarSystem.saveAvatar();
    UI.showScreen('start');
}

function handleConfigureGame() {
    UI.showScreen('config');
    
    // Load current config
    document.getElementById('game-mode').value = GameState.config.gameMode;
    document.getElementById('initial-money').value = GameState.config.initialMoney;
    document.getElementById('max-rounds').value = GameState.config.maxRounds;
    document.getElementById('unlimited-rounds').checked = GameState.config.unlimitedRounds;
    document.getElementById('max-waifus').value = GameState.config.maxWaifus;
    document.getElementById('unlimited-waifus').checked = GameState.config.unlimitedWaifus;
    document.getElementById('bid-mode').value = GameState.config.bidMode;
    document.getElementById('max-players').value = GameState.config.maxPlayers;
    document.getElementById('show-rounds').checked = GameState.config.showRounds;
    document.getElementById('no-bid-timeout').value = GameState.config.noBidTimeout;
    document.getElementById('vote-mode').value = GameState.config.voteMode;
}

function handleSaveConfig() {
    GameState.config = {
        gameMode: document.getElementById('game-mode').value,
        initialMoney: parseInt(document.getElementById('initial-money').value),
        maxRounds: parseInt(document.getElementById('max-rounds').value),
        unlimitedRounds: document.getElementById('unlimited-rounds').checked,
        maxWaifus: parseInt(document.getElementById('max-waifus').value),
        unlimitedWaifus: document.getElementById('unlimited-waifus').checked,
        bidMode: document.getElementById('bid-mode').value,
        maxPlayers: parseInt(document.getElementById('max-players').value),
        showRounds: document.getElementById('show-rounds').checked,
        noBidTimeout: parseInt(document.getElementById('no-bid-timeout').value),
        voteMode: document.getElementById('vote-mode').value
    };
    
    UI.showScreen('lobby');
}

async function handleStartGame() {
    console.log('[Event] handleStartGame called');
    if (GameState.characterPool.length === 0) {
        console.log('[Event] No characters in pool, showing selection screen');
        // Need to select characters first
        UI.showScreen('selection');
        return;
    }

    console.log('[Event] Starting game with', GameState.characterPool.length, 'characters');
    GameState.isGameRunning = true;
    
    // Initialize players' money
    GameState.players.forEach(player => {
        player.money = GameState.config.initialMoney;
        player.collection = [];
    });
    
    // Show auction room
    UI.showScreen('auction');
    ThreeJSRoom.initialize();
    
    // Update HUD with player info
    if (GameState.isHost) {
        document.getElementById('hud-name').textContent = GameState.playerName + ' (Presentador)';
        document.querySelector('.bid-controls')?.classList.add('hidden');
    } else {
        document.getElementById('hud-name').textContent = GameState.playerName;
        const player = GameState.players.get(GameState.peer.id);
        if (player) {
            document.getElementById('hud-money').textContent = `$${player.money}`;
        }
        UI.updateCollectionDisplay();
    }
    
    // Start first round
    setTimeout(() => Networking.startRound(), 1000);
}

async function handleSearchAnime() {
    const searchTerm = document.getElementById('anime-search').value.trim();
    if (!searchTerm) return;
    
    const results = await AniListAPI.searchAnime(searchTerm);
    UI.showCharacterSearchResults(results);
}

function handleConfirmPool() {
    if (!GameState.isHost && GameState.config.gameMode === 'choice') {
        const conn = GameState.connections.get(GameState.hostId);
        if (conn && conn.open) {
            GameState.characterPool.forEach(personaje => {
                conn.send({ tipo: 'PROPONER_PERSONAJE', personaje });
            });
        }
        GameState.characterPool = [];
        const poolEl = document.getElementById('character-pool');
        const countEl = document.getElementById('pool-count');
        if (poolEl) poolEl.innerHTML = '';
        if (countEl) countEl.textContent = '0';
    }
    UI.showScreen('lobby');
}

function handleLeaveRoom() {
    console.log('[Event] handleLeaveRoom called, cleaning up');
    // Clean up
    if (GameState.peer) {
        console.log('[Event] Destroying peer connection');
        GameState.peer.destroy();
    }

    if (ThreeJSRoom) {
        console.log('[Event] Cleaning up 3D room');
        ThreeJSRoom.cleanup();
    }

    // Reset state
    GameState.connections.clear();
    GameState.players.clear();
    GameState.audioConnections.clear();
    GameState.isGameRunning = false;

    console.log('[Event] Returning to start screen');
    UI.showScreen('start');
}

function handleBackToStart() {
    handleLeaveRoom();
}

// ==================== INITIALIZATION ====================

function checkExternalScripts() {
    console.log('[Init] Checking external scripts...');

    // Check Three.js
    if (typeof THREE === 'undefined') {
        console.error('[Init] Three.js not loaded');
        return false;
    } else {
        console.log('[Init] Three.js loaded successfully');
    }

    // Check PeerJS
    if (typeof Peer === 'undefined') {
        console.error('[Init] PeerJS not loaded');
        return false;
    } else {
        console.log('[Init] PeerJS loaded successfully');
    }

    return true;
}

function addVisualFeedback(element) {
    let targetElement;

    // Handle both string IDs and DOM elements
    if (typeof element === 'string') {
        targetElement = document.getElementById(element);
    } else if (element instanceof HTMLElement) {
        targetElement = element;
    } else {
        console.error('[DEBUG] Invalid element type for visual feedback:', typeof element);
        return;
    }

    if (targetElement) {
        const elementId = targetElement.id || targetElement.className || 'unknown';
        targetElement.addEventListener('click', () => {
            console.log(`[DEBUG] Visual feedback on ${elementId}`);
            targetElement.style.transform = 'scale(0.95)';
            setTimeout(() => {
                targetElement.style.transform = 'scale(1)';
            }, 100);
        });
    } else {
        console.error('[DEBUG] Cannot add visual feedback - element not found:', element);
    }
}

function initGame() {
    if (window.gameInitialized) {
        console.log('[Init] Game already initialized, skipping');
        return;
    }

    console.log('[Init] Starting game initialization...');
    window.gameInitialized = true;

    // Check external scripts
    if (!checkExternalScripts()) {
        console.error('[Init] External scripts failed to load, game may not work properly');
    }

    // Setup event listeners
    try {
        setupEventListeners();
    } catch (error) {
        console.error('[Init] Error setting up event listeners:', error);
    }

    // Load saved avatar if exists
    try {
        AvatarSystem.loadAvatar();
    } catch (error) {
        console.error('[Init] Error loading avatar:', error);
    }

    console.log('[Init] Initialization complete');
}

// Primary initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('[Init] DOMContentLoaded event fired');
    initGame();
});

// Fallback if DOMContentLoaded doesn't fire
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    console.log('[Init] DOM already loaded, initializing immediately');
    setTimeout(initGame, 100);
}

// Final fallback
window.addEventListener('load', () => {
    if (!window.gameInitialized) {
        console.log('[Init] Using load event as fallback');
        initGame();
    }
});