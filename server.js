const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const diffMatchPatch = require('diff-match-patch');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const dmp = new diffMatchPatch();

let documentContent = ""; 
const users = new Map(); 

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log(`Uživatel připojen: ${socket.id}`);

    socket.emit('init', { content: documentContent, users: Array.from(users.values()) });

    users.set(socket.id, { id: socket.id, cursor: null, selection: null });
    io.emit('updateUsers', Array.from(users.values()));

    socket.on('edit', (data) => {
        const patches = dmp.patch_make(documentContent, data.content);
        documentContent = dmp.patch_apply(patches, documentContent)[0];
        socket.broadcast.emit('patch', patches);
    });

    socket.on('cursor', (cursor) => {
        const user = users.get(socket.id);
        if (user) {
            user.cursor = cursor;
            io.emit('updateUsers', Array.from(users.values()));
        }
    });

    socket.on('selection', (selection) => {
        const user = users.get(socket.id);
        if (user) {
            user.selection = selection;
            io.emit('updateUsers', Array.from(users.values()));
        }
    });

    socket.on('disconnect', () => {
        console.log(`Uživatel odpojen: ${socket.id}`);
        users.delete(socket.id);
        io.emit('updateUsers', Array.from(users.values()));
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server běží na portu ${PORT}`);
});
