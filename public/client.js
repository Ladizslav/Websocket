const socket = io();

const editor = document.getElementById('editor');
const usersDiv = document.getElementById('users');

let localCursor = { start: 0, end: 0 };

socket.on('init', (data) => {
    editor.innerText = data.content;
    updateUsers(data.users);
});

socket.on('patch', (patches) => {
    const diffMatchPatch = new diff_match_patch();
    const result = diffMatchPatch.patch_apply(patches, editor.innerText);
    editor.innerText = result[0];
});

socket.on('updateUsers', (users) => {
    updateUsers(users);
});

editor.addEventListener('input', () => {
    const content = editor.innerText;
    localStorage.setItem('cachedDocument', content); 
    socket.emit('edit', { content });
});

editor.addEventListener('mouseup', () => {
    localCursor = getCursor();
    socket.emit('cursor', localCursor);
});

editor.addEventListener('mouseup', () => {
    const selection = getSelectionRange();
    if (selection) {
        socket.emit('selection', selection);
    }
});

socket.on('selection', (data) => {
    highlightSelection(data.userId, data.selection);
});

socket.on('disconnect', () => {
    alert('Odpojeno! Změny jsou ukládány lokálně.');
});

socket.on('connect', () => {
    const cachedContent = localStorage.getItem('cachedDocument');
    if (cachedContent) {
        socket.emit('edit', { content: cachedContent });
        localStorage.removeItem('cachedDocument');
    }
});

function updateUsers(users) {
    usersDiv.innerHTML = 'Uživatelé: ' + users.map(u => `User ${u.id}`).join(', ');
}

function getCursor() {
    const selection = window.getSelection();
    return { start: selection.anchorOffset, end: selection.focusOffset };
}

function getSelectionRange() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        return {
            start: range.startOffset,
            end: range.endOffset
        };
    }
    return null;
}

function highlightSelection(userId, selection) {
    const text = editor.innerText;
    if (selection) {
        const start = Math.min(selection.start, selection.end);
        const end = Math.max(selection.start, selection.end);
        const highlighted = text.substring(0, start) +
                            '<span class="highlight">' +
                            text.substring(start, end) +
                            '</span>' +
                            text.substring(end);
        editor.innerHTML = highlighted;
    }
}
