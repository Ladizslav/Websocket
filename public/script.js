const socket = io(); 

const editor = document.getElementById('editor');
const userList = document.getElementById('user-list');
const connectionStatus = document.getElementById('connection-status');

socket.on('connect', () => {
    connectionStatus.textContent = 'Připojeno k serveru';
    connectionStatus.style.color = 'green';
});

socket.on('disconnect', () => {
    connectionStatus.textContent = 'Odpojeno od serveru';
    connectionStatus.style.color = 'red';
});

socket.on('document', (content) => {
    editor.innerText = content;
});

socket.on('clients-update', (clients) => {
    userList.innerHTML = '';
    clients.forEach(client => {
        const li = document.createElement('li');
        li.textContent = client.name;
        userList.appendChild(li);
    });
});

socket.on('patch', (patches) => {
    const diffMatchPatch = new diff_match_patch();
    const result = diffMatchPatch.patch_apply(patches, editor.innerText);
    editor.innerText = result[0];
});

editor.addEventListener('input', () => {
    const content = editor.innerText;
    socket.emit('edit', { content });
});
