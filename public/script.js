const socket = io(); 
let isUpdating = false;

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
    if (!isUpdating) {
        editor.innerText = content; 
    }
});

socket.on('clients-update', (clients) => {
    userList.innerHTML = '';
    clients.forEach(client => {
        const li = document.createElement('li');
        li.textContent =