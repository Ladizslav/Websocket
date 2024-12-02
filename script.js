const socket = io();
const editor = document.getElementById('editor');
const editorContainer = document.getElementById('editor-container');
const status = document.getElementById('status');
const usersDiv = document.getElementById('users');
const cursors = {};
const highlights = {};
let localCache = { text: '', selection: null };

function disableEditor() {
    editor.disabled = true;
    status.textContent = "Disconnected from server";
    status.style.color = "red";
    saveToCache();
}

function enableEditor() {
    editor.disabled = false;
    status.textContent = "Connected to server";
    status.style.color = "green";
    syncWithCache();
}

function saveToCache() {
    localCache.text = editor.value;
    localStorage.setItem('editorCache', JSON.stringify(localCache));
}

function loadFromCache() {
    const cachedData = localStorage.getItem('editorCache');
    if (cachedData) {
        localCache = JSON.parse(cachedData);
        editor.value = localCache.text;
    }
}

function syncWithCache() {
    if (localCache.text && localCache.text !== editor.value) {
        socket.emit('update_text', { text: localCache.text });
    }
}

socket.on('disconnect', () => {
    disableEditor();
});

socket.on('connect', () => {
    enableEditor();
});

socket.on('init', (data) => {
    editor.value = data.text;
    updateUsers(data.users);
});

socket.on('update_text', (data) => {
    editor.value = data.text;
});

socket.on('user_connected', (users) => {
    updateUsers(users);
});

socket.on('user_disconnected', (users) => {
    updateUsers(users);
});

socket.on('cursor_position', (data) => {
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
});

socket.on('selection', (data) => {
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
});

editor.addEventListener('input', () => {
    socket.emit('update_text', { text: editor.value });
    saveToCache();
});

editor.addEventListener('mouseup', () => {
    const rect = editor.getBoundingClientRect();
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).getBoundingClientRect();

    const selectionData = {
        selection: {
            startX: range.left - rect.left,
            startY: range.top - rect.top,
            endX: range.right - rect.left,
            endY: range.bottom - rect.top,
        }
    };

    localCache.selection = selectionData;
    saveToCache();

    socket.emit('selection', selectionData);
});

editor.addEventListener('mousemove', (event) => {
    const rect = editor.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    socket.emit('cursor_position', { position: { x, y } });
});

function updateUsers(users) {
    usersDiv.innerHTML = `Connected users: ${users.map(u => `<span class="user">${u.userId}</span>`).join(', ')}`;
}

window.addEventListener('load', () => {
    loadFromCache();
});

window.addEventListener('beforeunload', () => {
    saveToCache();
});
