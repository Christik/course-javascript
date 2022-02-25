import './index.html';
import './css/styles.css';
import messageTemplate from './templates/message.hbs';
import noticeTemplate from './templates/notice.hbs';
import userTemplate from './templates/user.hbs';
import modalTemplate from './templates/modal.hbs';

const socket = new WebSocket('ws://localhost:9090');

// объект с информацией о текущем пользователе
const user = {
  // создаем уникальный id для пользователя
  id: new Date().getTime(),
};

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
const usersList = document.querySelector('.users-list');
const fieldCount = document.querySelector('#usersCount');

// получение сообщения от сокет-сервера
socket.addEventListener('message', function (event) {
  const message = JSON.parse(event.data);

  // если пришла информация о новом пользователе
  if (message.login) {
    addNotice(`${message.name} вошел в чат`);

    // если это текущий пользователь вошел в чат,
    if (message.id === user.id) {
      // добавляем в разметку список всех юзеров
      renderUserList(message.usersList);
      // если у пользователя сохранен аватар на сервере,
      // сораняем его в объект user
      if (message.avatarUrl) {
        user.avatar = message.avatarUrl;
      }
    } else {
      // если вошел новый пользователь,
      // добавляем его в разметку списка пользователей
      addSingleUser(message.usersList[message.id]);
    }

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

  // если кто-то из пользователей обновил аватар
  if (message.updateAvatar) {
    updateAvatar(message.avatarUrl, message.id);
  }
});

// отправка нового сообщения
btnSend.addEventListener('click', sendMessage);
fieldMessage.addEventListener('change', sendMessage);

// кнопка вызова модального окна
const btnSettings = document.querySelector('#btnSettings');

btnSettings.addEventListener('click', function () {
  openModal();
});

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

    // отправляем ник и id на сервер
    const data = {
      login: true,
      id: user.id,
      name: field,
    };
    socket.send(JSON.stringify(data));

    // сохраняем ник пользователя
    user.name = field;

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
      isMine: isMine(messageObj.id),
      id: messageObj.id,
      name: messageObj.name,
      text: messageObj.text,
      date: messageObj.date,
      avatarUrl: messageObj.avatarUrl,
    })
  );

  updateScroll();
}

// добавление в разметку списка пользователей
function renderUserList(obj) {
  let fragment = '';

  for (const id in obj) {
    fragment += userTemplate({
      id: id,
      name: obj[id].name,
      avatarUrl: obj[id].avatarUrl,
      isMine: isMine(id),
    });
  }

  usersList.innerHTML = fragment;
}

// добавление одного пользователя в разметку со списком юзеров
function addSingleUser(obj) {
  usersList.insertAdjacentHTML(
    'beforeend',
    userTemplate({
      id: obj.id,
      name: obj.name,
      avatarUrl: obj.avatarUrl,
      isMine: isMine(obj.id),
    })
  );
}

// удаление пользователя из списка
function removeUser(id) {
  const user = usersList.querySelector(`[data-id="${id}"]`);
  if (user) user.remove();
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

// обновление аватаров, которые уже есть на странице
function updateAvatar(url, id) {
  const avatars = document.querySelectorAll(
    `.message[data-id="${id}"] .avatar, .user[data-id="${id}"] .avatar, .modal__avatar`
  );
  const modalAvatarIcon = document.querySelector('.modal__avatar svg');
  if (modalAvatarIcon) {
    modalAvatarIcon.remove();
  }

  avatars.forEach(function (avatar) {
    avatar.style.backgroundImage = `url(${url})`;
  });
}

// указанный пользователь является текущим
function isMine(id) {
  return +id === user.id;
}

// открываем модальное окно с выбором аватара
function openModal() {
  console.log(user);
  // добавление в разметку модального окна
  document.body.insertAdjacentHTML(
    'beforeend',
    modalTemplate({
      name: user.name,
      avatarUrl: user.avatar,
    })
  );

  // инпут для загрузки аватара
  const inputFile = document.querySelector('#inputFile');
  const fileReader = new FileReader();

  // событие выбора файла для загрузки
  inputFile.addEventListener('change', function (e) {
    // сохраняем выбранный файл
    const file = e.target.files[0];

    console.log(file.type);

    // если был выбран файл
    if (file) {
      if (file.size > 500 * 1024) {
        alert('Слишком большой файл. Выберите изображение до 500кб.');
      } else if (file.type !== 'image/png' && file.type !== 'image/jpeg') {
        alert('Можно загрузить только изображение в формате .png и .jpg');
      } else {
        // читаем содержимое файла и конвертируем его содержимое в Base64
        fileReader.readAsDataURL(file);
      }
    }
  });

  // когда файл полностью загружен
  fileReader.addEventListener('load', function () {
    const url = fileReader.result;

    // отправить данные об аватаре на сервер
    const data = {
      updateAvatar: true,
      avatarUrl: url,
    };

    socket.send(JSON.stringify(data));
  });

  // закрытие модального окна
  const btnClose = document.querySelector('#btnClose');

  btnClose.addEventListener('click', function () {
    document.querySelector('.backgrop').remove();
    document.querySelector('.modal').remove();
  });
}
