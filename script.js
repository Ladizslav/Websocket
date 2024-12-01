const ws = new WebSocket("ws://<public-ip>:8080");
const editor = document.getElementById('editor');
const editorContainer = document.getElementById('editor-container');
const connectionStatus = document.getElementById('connection-status');
const usersDiv = document.getElementById('users');
const cursors = {};
const highlights = {};

editor.disabled = true;

ws.onopen = () => {
    connectionStatus.textContent = "Connected to server";
    connectionStatus.style.color = "green";
};

ws.onclose = () => {
    connectionStatus.textContent = "Disconnected from server";
    connectionStatus.style.color = "red";
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'init') {
        editor.value = data.text;
        updateUsers(data.users);
    }

    if (data.type === 'update_text') {
        editor.value = data.text;
    }

    if (data.type === 'user_connected') {
        updateUsers(data.users);
    }

    if (data.type === 'user_disconnected') {
        updateUsers(data.users);
    }

    if (data.type === 'cursor_position') {
        if (!cursors[data.userId]) {
            const cursor = document.createElement('div');
            cursor.className = 'cursor';
            cursor.style.backgroundColor = data.userColor;
            editorContainer.appendChild(cursor);
            cursors[data.userId] = cursor;
        }
        const cursor = cursors[data.userId];
        cursor.style.left = `${data.position.x}px`;
        cursor.style.top = `${data.position.y}px`;
    }

    if (data.type === 'selection') {
        if (!highlights[data.userId]) {
            const highlight = document.createElement('div');
            highlight.className = 'highlight';
            highlight.style.backgroundColor = data.userColor;
            editorContainer.appendChild(highlight);
            highlights[data.userId] = highlight;
        }
        const highlight = highlights[data.userId];
        const rect = editor.getBoundingClientRect();
        const lineHeight = parseFloat(getComputedStyle(editor).lineHeight);

        highlight.style.left = `${rect.left + data.selection.startX}px`;
        highlight.style.width = `${data.selection.endX - data.selection.startX}px`;
        highlight.style.top = `${rect.top + data.selection.startY}px`;
        highlight.style.height = `${data.selection.endY - data.selection.startY}px`;
    }
};

editor.addEventListener('input', () => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'update_text', text: editor.value }));
    }
});

editor.addEventListener('mouseup', () => {
    if (ws.readyState === WebSocket.OPEN) {
        const rect = editor.getBoundingClientRect();
        const selection = window.getSelection();
        const range = selection.getRangeAt(0).getBoundingClientRect();

        ws.send(JSON.stringify({
            type: 'selection',
            selection: {
                startX: range.left - rect.left,
                startY: range.top - rect.top,
                endX: range.right - rect.left,
                endY: range.bottom - rect.top,
            }
        }));
    }
});

editor.addEventListener('mousemove', (event) => {
    if (ws.readyState === WebSocket.OPEN) {
        const rect = editor.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        ws.send(JSON.stringify({ type: 'cursor_position', position: { x, y } }));
    }
});

ws.onerror = (error) => {
    console.error("WebSocket error:", error);
    connectionStatus.textContent = "Error connecting to server";
    connectionStatus.style.color = "orange";
};


function updateUsers(users) {
    usersDiv.innerHTML = `Connected users: ${users.map(u => `<span class="user">${u.userId}</span>`).join(', ')}`;
}
