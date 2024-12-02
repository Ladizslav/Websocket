const express = require('express');
const http = require('http');
const socketIo = require('socket.io'); // Import socket.io
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server); // Inicializace socket.io

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let documentText = "";
let users = [];

io.on('connection', (socket) => {
    const userId = `User-${Math.random().toString(36).substr(2, 9)}`;
    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`;
    users.push({ userId, userColor });

    socket.emit('init', { text: documentText, users });

    io.emit('user_connected', users);

    socket.on('update_text', (data) => {
        documentText = data.text;
        io.emit('update_text', { text: documentText });
    });

    socket.on('cursor_position', (data) => {
        io.emit('cursor_position', {
            userId,
            position: data.position,
            userColor
        });
    });

    socket.on('selection', (data) => {
        console.log('Received selection from client:', data);
        io.emit('selection', {
            userId,
            selection: data.selection,
            userColor
        });
        console.log('Broadcasting selection:', { userId, selection: data.selection, userColor }); // Log pro přenos
    });

    socket.on('disconnect', () => {
        users = users.filter((user) => user.userId !== userId);
        io.emit('user_disconnected', users);
    });
});

server.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
