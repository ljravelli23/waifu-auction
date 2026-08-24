// Shared client utilities
class WaifuAuctionClient {
    constructor() {
        this.room = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.gameState = null;
        this.selectedPool = [];
        this.hostView = null;
        this.playerView = null;
        this.APP_ID = 'waifu-auction-v1';
        this.roomCode = null;
    }

    connect(roomCode = null) {
        try {
            const code = roomCode || this.generateRoomCode();
            this.roomCode = code;
            
            console.log('Joining room:', code);
            this.room = window.Tristero.joinRoom({ appId: this.APP_ID }, code);
            
            this.setupRoomEvents();
            
            if (this.isHost) {
                console.log('Host initialized with room code:', code);
                if (this.hostView) {
                    this.hostView.onHostJoined({ success: true, roomCode: code });
                }
            }
        } catch (error) {
            console.error('Error connecting to room:', error);
            alert('Error connecting to room: ' + error.message);
        }
    }

    setupRoomEvents() {
        // Peer join/leave
        this.room.onPeerJoin((peerId) => {
            console.log('Peer joined:', peerId);
        });

        this.room.onPeerLeave((peerId) => {
            console.log('Peer left:', peerId);
        });

        // Generic message handler
        this.room.onMessage((data, peerId) => {
            console.log('Message received:', data, 'from:', peerId);
            
            if (data.type === 'playerJoined') {
                if (this.isHost && this.hostView) {
                    this.hostView.onPlayerJoined(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onPlayerJoined(data.payload);
                }
            } else if (data.type === 'lobbyUpdate') {
                if (this.isHost && this.hostView) {
                    this.hostView.onLobbyUpdate(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onLobbyUpdate(data.payload);
                }
            } else if (data.type === 'gameStart') {
                if (this.isHost && this.hostView) {
                    this.hostView.onGameStart(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onGameStart(data.payload);
                }
            } else if (data.type === 'roundStart') {
                if (this.isHost && this.hostView) {
                    this.hostView.onRoundStart(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onRoundStart(data.payload);
                }
            } else if (data.type === 'bidUpdate') {
                if (this.isHost && this.hostView) {
                    this.hostView.onBidUpdate(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onBidUpdate(data.payload);
                }
            } else if (data.type === 'roundResult') {
                if (this.isHost && this.hostView) {
                    this.hostView.onRoundResult(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onRoundResult(data.payload);
                }
            } else if (data.type === 'gameEnd') {
                if (this.isHost && this.hostView) {
                    this.hostView.onGameEnd(data.payload);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onGameEnd(data.payload);
                }
            }
        });
    }

    send(type, payload) {
        if (this.room) {
            this.room.send({ type, payload });
        }
    }

    generateRoomCode() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += letters.charAt(Math.floor(Math.random() * letters.length));
        }
        return code;
    }

    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    // Methods to be overridden by specific views
    onPlayerJoined(data) {}
    onJoinError(data) {}
    onLobbyUpdate(data) {}
    onGameStart(data) {}
    onRoundStart(data) {}
    onBidUpdate(data) {}
    onRoundResult(data) {}
    onBidRejected(data) {}
    onPlayerPassed(data) {}
    onReadyForVoting(data) {}
    onVotingStart(data) {}
    onVotingResult(data) {}
    onGameEnd(data) {}
    onConfigUpdated(data) {}
    onPoolUpdated(data) {}
    onReconnected(data) {}

    // Shared utility methods
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });
        document.getElementById(screenId).classList.remove('hidden');
    }

    formatCurrency(amount) {
        return amount.toLocaleString();
    }

    // AniList API integration
    async searchAniList(query, genres = [], genderFilter = 'all') {
        console.log('Searching AniList for:', query, 'genres:', genres, 'gender:', genderFilter);
        
        let genreFilter = '';
        if (genres.length > 0) {
            genreFilter = `, genre_in: [${genres.map(g => `"${g}"`).join(', ')}]`;
        }

        const graphqlQuery = `
            query ($search: String) {
                Media(search: $search, type: ANIME${genreFilter}) {
                    id
                    title { romaji english }
                    genres
                    characters(sort: FAVOURITES_DESC, perPage: 25) {
                        nodes {
                            id
                            name { full }
                            image { large }
                            gender
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
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    query: graphqlQuery,
                    variables: { search: query }
                })
            });

            const data = await response.json();
            console.log('AniList response:', data);
            
            if (!data.data || !data.data.Media) {
                console.error('Invalid AniList response structure');
                return { characters: [], animeTitle: '' };
            }

            const animeTitle = data.data.Media.title.romaji || data.data.Media.title.english;
            let characters = data.data.Media.characters ? data.data.Media.characters.nodes : [];
            
            // Filter by gender if specified
            if (genderFilter !== 'all') {
                characters = characters.filter(char => {
                    if (!char.gender) return false;
                    return char.gender === genderFilter;
                });
            }
            
            console.log('Found anime:', animeTitle, 'with', characters.length, 'characters after filter');
            
            return {
                characters: characters,
                animeTitle: animeTitle
            };
        } catch (error) {
            console.error('Error searching AniList:', error);
            return { characters: [], animeTitle: '' };
        }
    }

    // Search anime by genres for random mode
    async searchAnimeByGenres(genres, genderFilter = 'all', count = 5) {
        console.log('Searching anime by genres:', genres, 'gender:', genderFilter, 'count:', count);
        
        let genreFilter = '';
        if (genres.length > 0) {
            genreFilter = `genre_in: [${genres.map(g => `"${g}"`).join(', ')}]`;
        } else {
            genreFilter = 'genre_in: ["Action", "Comedy", "Romance", "Fantasy"]'; // Default genres
        }

        const graphqlQuery = `
            query {
                Page(page: 1, perPage: 50) {
                    media(type: ANIME, sort: POPULARITY_DESC, ${genreFilter}) {
                        id
                        title { romaji english }
                        genres
                        characters(sort: FAVOURITES_DESC, perPage: 10) {
                            nodes {
                                id
                                name { full }
                                image { large }
                                gender
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
                    'Accept': 'application/json',
                },
                body: JSON.stringify({ query: graphqlQuery })
            });

            const data = await response.json();
            console.log('AniList genre search response:', data);
            
            if (!data.data || !data.data.Page || !data.data.Page.media) {
                console.error('Invalid AniList response structure');
                return [];
            }

            const animeList = data.data.Page.media;
            const allCharacters = [];

            animeList.forEach(anime => {
                let characters = anime.characters ? anime.characters.nodes : [];
                
                // Filter by gender if specified
                if (genderFilter !== 'all') {
                    characters = characters.filter(char => {
                        if (!char.gender) return false;
                        return char.gender === genderFilter;
                    });
                }

                characters.forEach(char => {
                    allCharacters.push({
                        id: char.id.toString(),
                        characterName: char.name.full,
                        imageUrl: char.image.large,
                        animeName: anime.title.romaji || anime.title.english,
                        isBlind: true // Mark as blind mode for random characters
                    });
                });
            });

            // Shuffle and return random characters
            const shuffled = allCharacters.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, count);
        } catch (error) {
            console.error('Error searching anime by genres:', error);
            return [];
        }
    }
}

// Create global client instance immediately
const client = new WaifuAuctionClient();
console.log('Client initialized');
