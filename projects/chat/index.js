import './index.html';
import './css/styles.css';
import messageTemplate from './templates/message.hbs';
import noticeTemplate from './templates/notice.hbs';
import userTemplate from './templates/user.hbs';

const socket = new WebSocket('ws://localhost:9090');

// создаем уникальный id для пользователя
const uniqueId = new Date().getTime();

// элементы формы входа
const pageLogin = document.querySelector('.page-login');
const fieldLogin = document.querySelector('#fieldLogin');
const btnLogin = document.querySelector('#btnLogin');

// вход в чат
btnLogin.addEventListener('click', sendLogin);
fieldLogin.addEventListener('change', sendLogin);

// элементы чата
const pageChat = document.querySelector('.page-chat');
const fieldMessage = document.querySelector('#fieldMessage');
const btnSend = document.querySelector('#btnSend');
const chatContent = document.querySelector('.chat-content');
const usersList = document.querySelector('.page-chat__side');
const fieldCount = document.querySelector('#usersCount');

// получение сообщения от сокет-сервера
socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);

  // если пришла информация о новом пользователе
  if (message.login) {
    addNotice(`${message.name} вошел в чат`);
    addUser(message);
    // обновляем в разметке количество участников
    fieldCount.textContent = Object.keys(message.usersList).length;
  }

  // если пришла информация о выходе пользователя из чата
  if (message.logout) {
    removeUser(message.id);
    addNotice(`${message.name} вышел из чата`);
  }

  // если пришло новое сообщение в чат
  if (message.message) {
    addMessage(message.message);
  }
});

// отправка нового сообщения
btnSend.addEventListener('click', sendMessage);
fieldMessage.addEventListener('change', sendMessage);

// соединение с сервером закрыто
socket.addEventListener('error', function () {
  alert('Соединение закрыто или не может быть открыто');
});

// отправка информации о новом пользователе
function sendLogin(e) {
  e.preventDefault();

  // введенный ник в форме авторизации
  const field = fieldLogin.value.trim();

  if (field !== '') {
    // скрываем окно авторизации и отображаем чат
    pageLogin.classList.add('is-hidden');
    pageChat.classList.remove('is-hidden');

    // отправляем ник на сервер
    const data = {
      login: true,
      name: field,
      id: uniqueId,
    };
    socket.send(JSON.stringify(data));

    // очищаем поле с ником
    fieldLogin.value = '';
  } else {
    alert('Введите ник');
  }
}

// добавление уведомления в разметку чата
function addNotice(text) {
  chatContent.insertAdjacentHTML(
    'beforeend',
    noticeTemplate({
      text: text,
    })
  );

  updateScroll();
}

// добавление сообщения в разметку чата
function addMessage(messageObj) {
  chatContent.insertAdjacentHTML(
    'beforeend',
    messageTemplate({
      isMine: messageObj.id === uniqueId,
      name: messageObj.name,
      text: messageObj.text,
      date: messageObj.date,
    })
  );

  updateScroll();
}

// добавление нового юзера в список юзеров
function addUser(messageObj) {
  const list = messageObj.usersList;

  // если это текущий пользователь вошел в чат,
  // отображаем список всех пользователей,
  // который пришел с сервера
  if (messageObj.id === uniqueId) {
    let fragment = '';

    for (const id in list) {
      fragment += userTemplate({
        id: id,
        name: list[id].name,
      });
    }

    usersList.innerHTML = fragment;
  } else {
    // если в чат вошел другой пользователь,
    // то добавляем его в список пользователей
    usersList.insertAdjacentHTML(
      'beforeend',
      userTemplate({
        id: messageObj.id,
        name: messageObj.login,
      })
    );
  }
}

// удаление пользователя из списка
function removeUser(id) {
  usersList.querySelector(`[data-id="${id}"]`).remove();
}

// отправка нового сообщения на сервер
function sendMessage(e) {
  e.preventDefault();

  // отправляем сообщение на сервер
  const data = {
    message: fieldMessage.value,
    date: new Date().toTimeString().slice(0, 5),
  };
  socket.send(JSON.stringify(data));

  // очищаем поле ввода сообщения
  fieldMessage.value = '';
}

function updateScroll() {
  chatContent.scrollTop = chatContent.scrollHeight;
}
