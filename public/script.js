const socket = io(); 
const editor = document.getElementById('editor');
const status = document.getElementById('connection-status');
const usersList = document.getElementById('users');

let isUpdating = false; 

function setEditorEditable(isEditable) {
    editor.contentEditable = isEditable;
    editor.style.backgroundColor = isEditable ? 'white' : '#f0f0f0';
    editor.style.cursor = isEditable ? 'text' : 'not-allowed'; 
}

socket.on('connect', () => {
    status.textContent = 'Připojeno';
    setEditorEditable(true); 
});

socket.on('disconnect', () => {
    status.textContent = 'Nepřipojeno';
    setEditorEditable(false); 
});

socket.on('clients-update', (clients) => {
    usersList.innerHTML = 'Připojení uživatelé:<br>' + clients.map(client => client.ip).join('<br>');
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
    if (!socket.connected) return; 
    isUpdating = true;
    const content = editor.innerText;
    socket.emit('edit', content);

    setTimeout(() => {
        isUpdating = false;
    }, 500);
});

editor.addEventListener('keyup', () => {
    if (!socket.connected) return;
    const selection = window.getSelection();
    const range = selection.getRangeAt(0).getBoundingClientRect();
    socket.emit('cursor', {
        position: { left: range.left, top: range.top }
    });
});


setEditorEditable(false);
