require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);

// --- Centralized Connection State ---
let currentActiveConnection = null;

// Configure Socket.IO with CORS for your specific URLs
const io = new Server(server, {
    cors: {
        origin: [
            "https://ambulancepatroldrone.onrender.com", // Your Render URL
            "https://testfile6.onrender.com",            // Old Render URL
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:8003",
            "http://localhost:5500",
            "http://127.0.0.1:5500"
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

// Serve static files (this also serves /socket.io/socket.io.js automatically)
app.use(express.static(__dirname));

// Route handlers
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/drone.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'drone.html'));
});

app.get('/doctor.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'doctor.html'));
});

// Socket.io events
io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send current active connection to newly connected client
    if (currentActiveConnection) {
        socket.emit('currentConnectionStatus', currentActiveConnection);
    } else {
        socket.emit('currentConnectionStatus', null);
    }

    socket.on('join', (room) => {
        socket.join(room);
        console.log(`${socket.id} joined room: ${room}`);
    });

    // Handle Connection Updates from Clients
    socket.on('updateConnection', (connectionData) => {
        currentActiveConnection = connectionData;
        console.log('Updated active connection:', currentActiveConnection);
        io.emit('currentConnectionStatus', currentActiveConnection);
    });

    // Handle Connection Reset from Clients
    socket.on('resetConnection', () => {
        currentActiveConnection = null;
        console.log('Connection reset by a client.');
        io.emit('currentConnectionStatus', null);
    });

    // GPS Data Sync
    socket.on('updateDroneData', (data) => {
        socket.to('108').emit('droneData', data);
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Render provides the PORT dynamically. Fallback to 8003 for local testing.
const PORT = process.env.PORT || 8003;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port: ${PORT}`);
    console.log(`Main interface: https://ambulancepatroldrone.onrender.com/`);
    console.log(`Drone interface: https://ambulancepatroldrone.onrender.com/drone.html`);
    console.log(`Doctor interface: https://ambulancepatroldrone.onrender.com/doctor.html`);
});
