const socket = io();
const editor = document.getElementById('editor');
const editorContainer = document.getElementById('editor-container');
const status = document.getElementById('status');
const usersDiv = document.getElementById('users');
const cursors = {};
const highlights = {};

// Cache pro místní ukládání
const cache = {
    text: localStorage.getItem('cachedText') || "",
    selections: JSON.parse(localStorage.getItem('cachedSelections')) || []
};

// Funkce pro uložení cache do localStorage
function saveToCache() {
    localStorage.setItem('cachedText', cache.text);
    localStorage.setItem('cachedSelections', JSON.stringify(cache.selections));
}

// Funkce pro synchronizaci s cache
function syncWithCache() {
    editor.value = cache.text;
    cache.selections.forEach(selection => applyHighlight(selection));
}

// Zakázání editoru
function disableEditor() {
    editor.disabled = true;
    status.textContent = "Disconnected from server";
    status.style.color = "red";
}

// Povolení editoru
function enableEditor() {
    editor.disabled = false;
    status.textContent = "Connected to server";
    status.style.color = "green";
}

socket.on('connect', () => {
    enableEditor();

    // Při opětovném připojení synchronizovat cache
    if (cache.text) {
        socket.emit('update_text', { text: cache.text });
    }
});

socket.on('disconnect', () => {
    disableEditor();
});

socket.on('init', (data) => {
    editor.value = data.text;
    cache.text = data.text;
    cache.selections = [];
    saveToCache();
    updateUsers(data.users);
});

socket.on('update_text', (data) => {
    editor.value = data.text;
    cache.text = data.text;
    saveToCache();
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
    applyHighlight(data.selection, data.userId, data.userColor);
});

function applyHighlight(selection, userId, userColor) {
    if (!highlights[userId]) {
        const highlight = document.createElement('div');
        highlight.className = 'highlight';
        highlight.style.backgroundColor = userColor;
        editorContainer.appendChild(highlight);
        highlights[userId] = highlight;
    }
    const highlight = highlights[userId];
    const rect = editor.getBoundingClientRect();
    highlight.style.left = `${rect.left + selection.startX}px`;
    highlight.style.width = `${selection.endX - selection.startX}px`;
    highlight.style.top = `${rect.top + selection.startY}px`;
    highlight.style.height = `${selection.endY - selection.startY}px`;

    cache.selections.push(selection);
    saveToCache();
}

editor.addEventListener('input', () => {
    cache.text = editor.value;
    saveToCache();
    socket.emit('update_text', { text: editor.value });
});

editor.addEventListener('mouseup', () => {
    const rect = editor.getBoundingClientRect();
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0).getBoundingClientRect();
        if (range.width > 0 && range.height > 0) {
            const selectionData = {
                startX: range.left - rect.left,
                startY: range.top - rect.top,
                endX: range.right - rect.left,
                endY: range.bottom - rect.top,
            };

            socket.emit('selection', { selection: selectionData });
        }
    }
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
