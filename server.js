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
    console.log('Uživatel připojen:', socket.id);

    clients.push({ id: socket.id, name: `Uživatel-${clients.length + 1}` });
    io.emit('clients-update', clients);

    socket.emit('document', documentContent);

    socket.on('edit', (data) => {
        const patches = dmp.patch_make(documentContent, data.content);
        documentContent = dmp.patch_apply(patches, documentContent)[0];

        socket.broadcast.emit('patch', patches);
    });

    socket.on('disconnect', () => {
        console.log('Uživatel odpojen:', socket.id);
        clients = clients.filter(client => client.id !== socket.id);
        io.emit('clients-update', clients);
    });
});

setInterval(() => {
    io.emit('document', documentContent);
}, 1000);

const PORT = 8080;
server.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});