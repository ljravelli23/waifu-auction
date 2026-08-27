// ==================== GAME STATE ====================
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
        this.canvas = document.getElementById('avatar-canvas');
        this.ctx = this.canvas.getContext('2d');
    },
    
    drawAvatar(avatarData) {
        if (!this.ctx) return;
        
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
        const avatar = this.getAvatarFromForm();
        localStorage.setItem('subastaWaifus:avatar', JSON.stringify(avatar));
        GameState.avatar = avatar;
        return avatar;
    },
    
    loadAvatar() {
        const saved = localStorage.getItem('subastaWaifus:avatar');
        if (saved) {
            try {
                GameState.avatar = JSON.parse(saved);
                return GameState.avatar;
            } catch (e) {
                console.error('Error loading avatar:', e);
            }
        }
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
            return data.data.Page.media;
        } catch (error) {
            console.error('Error searching anime:', error);
            return [];
        }
    },
    
    async getCharacters(animeId) {
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
            return data.data.Media;
        } catch (error) {
            console.error('Error getting characters:', error);
            return null;
        }
    }
};

// ==================== NETWORKING (PeerJS) ====================
const Networking = {
    generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        return Array.from({length: 4}, () => 
            letters[Math.floor(Math.random() * letters.length)]
        ).join('');
    },
    
    async createRoom() {
        let attempts = 5;
        while (attempts > 0) {
            const code = this.generateRoomCode();
            try {
                GameState.peer = new Peer(code);
                
                GameState.peer.on('open', (id) => {
                    console.log('Room created with ID:', id);
                    GameState.roomCode = id;
                    GameState.isHost = true;
                    GameState.hostId = id;
                    UI.showRoomCode(id);
                });
                
                GameState.peer.on('connection', (conn) => {
                    this.handleConnection(conn);
                });
                
                GameState.peer.on('error', (err) => {
                    if (err.type === 'unavailable-id' && attempts > 0) {
                        attempts--;
                        GameState.peer.destroy();
                    } else {
                        console.error('PeerJS error:', err);
                        UI.showError('Error al crear la sala: ' + err.message);
                    }
                });
                
                return; // Success
            } catch (error) {
                console.error('Error creating room:', error);
                attempts--;
            }
        }
        
        UI.showError('No se pudo crear una sala. Intenta nuevamente.');
    },
    
    async joinRoom(roomCode) {
        try {
            GameState.peer = new Peer();
            
            GameState.peer.on('open', () => {
                console.log('Connecting to room:', roomCode);
                const conn = GameState.peer.connect(roomCode);
                
                conn.on('open', () => {
                    console.log('Connected to host');
                    GameState.hostId = roomCode;
                    this.handleConnection(conn);
                    this.sendJoinRequest(conn);
                });
                
                conn.on('error', (err) => {
                    console.error('Connection error:', err);
                    UI.showError('Error al conectar: ' + err.message);
                });
            });
            
            GameState.peer.on('error', (err) => {
                console.error('PeerJS error:', err);
                UI.showError('Error de conexión: ' + err.message);
            });
            
        } catch (error) {
            console.error('Error joining room:', error);
            UI.showError('Error al unirse a la sala');
        }
    },
    
    handleConnection(conn) {
        const playerId = conn.peer;
        GameState.connections.set(playerId, conn);
        
        conn.on('data', (data) => {
            this.handleMessage(data, playerId);
        });
        
        conn.on('close', () => {
            console.log('Player disconnected:', playerId);
            GameState.connections.delete(playerId);
            GameState.players.delete(playerId);
            this.removeAudioConnection(playerId);
            UI.updatePlayerList();
            
            if (GameState.isHost) {
                this.broadcastState();
            }
        });
        
        if (GameState.isHost) {
            // Send current state to new player
            this.sendStateToPlayer(conn);
        }
    },
    
    sendJoinRequest(conn) {
        conn.send({
            tipo: 'JOIN_REQUEST',
            nombre: GameState.playerName,
            avatar: GameState.avatar
        });
    },
    
    handleMessage(data, senderId) {
        console.log('Received message:', data, 'from:', senderId);
        
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
        if (GameState.players.size >= GameState.config.maxPlayers) {
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
        if (!GameState.localStream) return;
        
        const call = GameState.peer.call(targetId, GameState.localStream);
        
        call.on('stream', (remoteStream) => {
            this.playAudio(targetId, remoteStream);
        });
        
        GameState.audioConnections.set(targetId, call);
    },
    
    playAudio(peerId, stream) {
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
        try {
            GameState.localStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false
            });
            
            GameState.peer.on('call', (call) => {
                call.answer(GameState.localStream);
                call.on('stream', (remoteStream) => {
                    this.playAudio(call.peer, remoteStream);
                });
            });
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            UI.showError('No se pudo acceder al micrófono');
        }
    },
    
    toggleMute() {
        if (GameState.localStream) {
            const audioTrack = GameState.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                GameState.isMuted = !audioTrack.enabled;
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
        if (!this.validateBid(playerId, amount)) {
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
        
        this.broadcast(message);
        UI.updateBidDisplay(amount, playerId);
    },
    
    validateBid(playerId, amount) {
        const player = GameState.players.get(playerId);
        if (!player) return false;
        
        // Check if bid is higher than current
        if (amount <= GameState.currentBid) return false;
        
        // Check if player has enough money
        if (amount > player.money) return false;
        
        // Check turn-based mode
        if (GameState.config.bidMode === 'turns' && GameState.currentBid === 0) {
            const currentPlayerIndex = (GameState.currentRound - 1) % GameState.players.size;
            const playersArray = Array.from(GameState.players.keys());
            const currentPlayerId = playersArray[currentPlayerIndex];
            if (playerId !== currentPlayerId) return false;
        }
        
        // Check max waifus limit
        if (!GameState.config.unlimitedWaifus && player.collection.length >= GameState.config.maxWaifus) {
            return false;
        }
        
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
        if (GameState.characterPool.length === 0) {
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
        
        // Determine who opens the bid in turn mode
        let openerId = null;
        if (GameState.config.bidMode === 'turns') {
            const playersArray = Array.from(GameState.players.keys());
            const openerIndex = (GameState.currentRound - 1) % playersArray.length;
            openerId = playersArray[openerIndex];
        }
        
        const message = {
            tipo: 'ROUND_START',
            personaje: character,
            soloAnime: soloAnime,
            numeroRonda: GameState.currentRound,
            jugadorQueAbre: openerId
        };
        
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
            }
        }
        
        const message = {
            tipo: 'ROUND_END',
            ganadorId: GameState.currentBidder,
            personaje: GameState.currentCharacter,
            precioFinal: GameState.currentBid
        };
        
        this.broadcast(message);
        UI.endRound(GameState.currentBidder, GameState.currentCharacter, GameState.currentBid);
        
        // Check if game should end
        if (this.shouldEndGame()) {
            setTimeout(() => this.endGame(), 2000);
        } else {
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
        const container = document.getElementById('three-container');
        if (!container) return;
        
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
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        
        const targetScreen = document.getElementById(screenName + '-screen');
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
        
        GameState.screen = screenName;
    },
    
    showError(message) {
        alert(message); // Simple error display
    },
    
    showRoomCode(code) {
        document.getElementById('display-room-code').textContent = code;
        this.showScreen('lobby');
        
        if (GameState.isHost) {
            document.getElementById('host-info').classList.remove('hidden');
            document.getElementById('host-controls').classList.remove('hidden');
        }
    },
    
    updatePlayerList() {
        const list = document.getElementById('players-list');
        if (!list) return;
        
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
    // Start screen
    document.getElementById('btn-create-room').addEventListener('click', handleCreateRoom);
    document.getElementById('btn-join-room').addEventListener('click', () => {
        document.getElementById('join-section').classList.toggle('hidden');
    });
    document.getElementById('btn-join-submit').addEventListener('click', handleJoinRoom);
    document.getElementById('btn-edit-avatar').addEventListener('click', handleEditAvatar);
    
    // Avatar creator
    document.getElementById('btn-save-avatar').addEventListener('click', handleSaveAvatar);
    document.getElementById('btn-cancel-avatar').addEventListener('click', () => {
        UI.showScreen('start');
    });
    
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
                AvatarSystem.init();
                AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
            });
        }
    });
    
    // Lobby
    document.getElementById('btn-configure-game').addEventListener('click', handleConfigureGame);
    document.getElementById('btn-start-game').addEventListener('click', handleStartGame);
    document.getElementById('btn-mute').addEventListener('click', () => Networking.toggleMute());
    document.getElementById('btn-leave-room').addEventListener('click', handleLeaveRoom);
    
    // Configuration
    document.getElementById('btn-save-config').addEventListener('click', handleSaveConfig);
    document.getElementById('btn-cancel-config').addEventListener('click', () => {
        UI.showScreen('lobby');
    });
    
    // Character selection
    document.getElementById('btn-search-anime').addEventListener('click', handleSearchAnime);
    document.getElementById('btn-confirm-pool').addEventListener('click', handleConfirmPool);
    document.getElementById('btn-cancel-pool').addEventListener('click', () => {
        UI.showScreen('lobby');
    });
    document.getElementById('btn-propose-characters')?.addEventListener('click', () => {
        UI.showScreen('selection');
    });
    
    // HUD bidding
    document.querySelectorAll('.bid-btn').forEach(btn => {
        btn.addEventListener('click', () => {
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
    
    document.querySelector('.skip-btn')?.addEventListener('click', () => {
        Networking.skip();
    });
    
    document.getElementById('hud-mute')?.addEventListener('click', () => {
        Networking.toggleMute();
    });
    
    // End screen
    document.getElementById('btn-back-to-start').addEventListener('click', handleBackToStart);
}

// ==================== EVENT HANDLERS ====================
function handleCreateRoom() {
    const name = document.getElementById('player-name').value.trim();
    if (!name) {
        UI.showError('Por favor ingresa tu nombre');
        return;
    }
    
    GameState.playerName = name;
    
    // Check for avatar
    if (!AvatarSystem.loadAvatar()) {
        UI.showScreen('avatar');
        AvatarSystem.init();
        AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
        return;
    }
    
    Networking.createRoom();
    Networking.initializeVoiceChat();
}

function handleJoinRoom() {
    const name = document.getElementById('player-name').value.trim();
    const code = document.getElementById('room-code').value.trim().toUpperCase();
    
    if (!name) {
        UI.showError('Por favor ingresa tu nombre');
        return;
    }
    
    if (code.length !== 4) {
        UI.showError('El código debe tener 4 letras');
        return;
    }
    
    GameState.playerName = name;
    GameState.roomCode = code;
    
    // Check for avatar
    if (!AvatarSystem.loadAvatar()) {
        UI.showScreen('avatar');
        AvatarSystem.init();
        AvatarSystem.drawAvatar(AvatarSystem.getAvatarFromForm());
        return;
    }
    
    Networking.joinRoom(code);
    Networking.initializeVoiceChat();
}

function handleEditAvatar() {
    UI.showScreen('avatar');
    AvatarSystem.init();
    
    // Load existing avatar or default
    const avatar = AvatarSystem.loadAvatar() || AvatarSystem.getAvatarFromForm();
    AvatarSystem.drawAvatar(avatar);
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
    if (GameState.characterPool.length === 0) {
        // Need to select characters first
        UI.showScreen('selection');
        return;
    }
    
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
    // Clean up
    if (GameState.peer) {
        GameState.peer.destroy();
    }
    
    if (ThreeJSRoom) {
        ThreeJSRoom.cleanup();
    }
    
    // Reset state
    GameState.connections.clear();
    GameState.players.clear();
    GameState.audioConnections.clear();
    GameState.isGameRunning = false;
    
    UI.showScreen('start');
}

function handleBackToStart() {
    handleLeaveRoom();
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    
    // Load saved avatar if exists
    AvatarSystem.loadAvatar();
});