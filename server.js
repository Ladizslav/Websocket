const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const diff_match_patch = require('diff-match-patch');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const dmp = new diff_match_patch();
let documentContent = ''; 
let clients = []; 

app.use(express.static('public'));

io.on('connection', (socket) => {
    const userIp = socket.handshake.address; 
    console.log(`Uživatel připojen z IP: ${userIp}`);

    clients.push({ id: socket.id, ip: userIp });
    io.emit('clients-update', clients); 

    socket.emit('document', documentContent);

    socket.on('edit', (changes) => {
        const patches = dmp.patch_make(documentContent, changes);
        documentContent = dmp.patch_apply(patches, documentContent)[0];

        socket.broadcast.emit('patch', patches);
    });

    socket.on('cursor', (data) => {
        socket.broadcast.emit('cursor', { id: socket.id, ...data });
    });

    socket.on('disconnect', () => {
        console.log(`Uživatel odpojen: ${socket.id}`);
        clients = clients.filter(client => client.id !== socket.id);
        io.emit('clients-update', clients); 
    });
});

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
