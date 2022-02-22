import './index.html';

const socket = new WebSocket('ws://localhost:9090');

const messageText = document.querySelector('#messageText');
const sendButton = document.querySelector('#sendButton');
const messageContainer = document.querySelector('#messages');

// получение сообщения от сокет-сервера
socket.addEventListener('message', function (event) {
  const data = JSON.parse(event.data).data;

  // преобразование в текст
  let text = '';
  data.forEach((item) => {
    text += String.fromCharCode(item);
  });

  addMessage(text);
});

socket.addEventListener('error', function () {
  alert('Соединение закрыто или не может быть открыто');
});

// добавление сообщения в разметку
function addMessage(message) {
  const messageItem = document.createElement('div');
  messageItem.textContent = message;
  messageContainer.appendChild(messageItem);
  messageContainer.scrollTop = messageContainer.scrollHeight;
}

// отправка сообещния
function sendMessage(e) {
  e.preventDefault();
  socket.send(messageText.value);
  messageText.value = '';
}

sendButton.addEventListener('click', sendMessage);
messageText.addEventListener('change', sendMessage);
