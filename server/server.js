const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const setupSocketHandlers = require('./socketHandlers');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`Waifu Auction server running on port ${PORT}`);
  console.log(`Access the game at http://localhost:${PORT}`);
});
