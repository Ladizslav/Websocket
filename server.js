const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let documentText = "";
let users = [];

wss.on('connection', (ws) => {
    console.log("A client connected.");
    ws.on('close', () => {
        console.log("A client disconnected.");
    });

    const userId = `User-${Math.random().toString(36).substr(2, 9)}`;
    const userColor = `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`;
    users.push({ userId, userColor });

    ws.send(JSON.stringify({ type: 'init', text: documentText, users }));

    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'user_connected', users }));
        }
    });

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'update_text') {
            documentText = data.text;
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'update_text', text: documentText }));
                }
            });
        }

        if (data.type === 'cursor_position') {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN && client !== ws) {
                    client.send(JSON.stringify({
                        type: 'cursor_position',
                        userId,
                        position: data.position,
                        userColor,
                    }));
                }
            });
        }

        if (data.type === 'selection') {
            wss.clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN && client !== ws) {
                    client.send(JSON.stringify({
                        type: 'selection',
                        userId,
                        selection: data.selection,
                        userColor,
                    }));
                }
            });
        }
    });

    ws.on('close', () => {
        users = users.filter((user) => user.userId !== userId);
        wss.clients.forEach((client) => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({ type: 'user_disconnected', users }));
            }
        });
    });
});

server.listen(8080, () => {
    console.log('Server is running on http://localhost:8080');
});
