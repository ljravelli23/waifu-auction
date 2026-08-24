// Shared client utilities
class WaifuAuctionClient {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.playerName = null;
        this.isHost = false;
        this.gameState = null;
        this.selectedPool = [];
        this.hostView = null;
        this.playerView = null;
    }

    connect() {
        try {
            this.socket = io();
            
            this.socket.on('connect', () => {
                console.log('Connected to server');
                
                // If host, emit host:join event
                if (this.isHost) {
                    console.log('Emitting host:join');
                    this.socket.emit('host:join');
                }
            });

            this.socket.on('disconnect', () => {
                console.log('Disconnected from server');
            });

            this.socket.on('error', (data) => {
                console.error('Server error:', data.message);
                alert(data.message);
            });

            // Host events
            this.socket.on('host:joined', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onHostJoined(data);
                }
            });

            // Game events
            this.socket.on('lobby:update', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onLobbyUpdate(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onLobbyUpdate(data);
                }
            });

            this.socket.on('game:start', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onGameStart(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onGameStart(data);
                }
            });

            this.socket.on('round:start', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onRoundStart(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onRoundStart(data);
                }
            });

            this.socket.on('bid:update', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onBidUpdate(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onBidUpdate(data);
                }
            });

            this.socket.on('round:result', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onRoundResult(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onRoundResult(data);
                }
            });

            this.socket.on('voting:start', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onVotingStart(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onVotingStart(data);
                }
            });

            this.socket.on('voting:end', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onVotingEnd(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onVotingEnd(data);
                }
            });

            this.socket.on('game:end', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onGameEnd(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onGameEnd(data);
                }
            });

            this.socket.on('game:readyForVoting', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onReadyForVoting(data);
                }
            });

            this.socket.on('player:joined', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onPlayerJoined(data);
                } else if (!this.isHost && this.playerView) {
                    this.playerView.onPlayerJoined(data);
                }
            });

            this.socket.on('config:updated', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onConfigUpdated(data);
                }
            });

            this.socket.on('pool:updated', (data) => {
                if (this.isHost && this.hostView) {
                    this.hostView.onPoolUpdated(data);
                }
            });

            this.socket.on('player:reconnected', (data) => {
                if (data.success) {
                    this.playerId = data.success ? this.socket.id : this.playerId;
                    this.gameState = data.state;
                    this.onReconnected(data);
                }
            });
        } catch (error) {
            console.error('Error connecting to socket:', error);
        }
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
