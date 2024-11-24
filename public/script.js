const socket = io();
const editor = document.getElementById('editor');
const status = document.getElementById('connection-status');
const usersList = document.getElementById('users');

let isUpdating = false; 

socket.on('connect', () => {
    status.textContent = 'Připojeno';
});
socket.on('disconnect', () => {
    status.textContent = 'Nepřipojeno';
});

socket.on('clients-update', (clients) => {
    usersList.innerHTML = 'Připojení uživatelé:<br>' + clients.map(client => client.name).join('<br>');
});

socket.on('document', (content) => {
    if (!isUpdating) {
        editor.innerText = content;
    }
});

socket.on('patch', (patches) => {
    const dmp = new diff_match_patch();
    documentContent = editor.innerText;
    const [updatedContent] = dmp.patch_apply(patches, documentContent);
    editor.innerText = updatedContent;
});

socket.on('cursor', ({ id, position }) => {
    const existingCursor = document.getElementById(`cursor-${id}`);
    if (existingCursor) {
        existingCursor.style.left = `${position.left}px`;
        existingCursor.style.top = `${position.top}px`;
    } else {
        const cursor = document.createElement('div');
        cursor.id = `cursor-${id}`;
        cursor.className = 'cursor';
        cursor.style.left = `${position.left}px`;
        cursor.style.top = `${position.top}px`;
        document.body.appendChild(cursor);
    }
});

editor.addEventListener('input', () => {
    isUpdating = true;
    const content = editor.innerText;
    socket.emit('edit', content);

    setTimeout(() => {
        isUpdating = false;
    }, 500);
});

editor.addEventListener('keyup', () => {
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).getBoundingClientRect();
    socket.emit('cursor', {
        position: { left: range.left, top: range.top }
    });
});
