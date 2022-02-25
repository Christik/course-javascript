const ws = require('ws');
const wss = new ws.Server({ port: 9090 });

// список подключенных клиентов
const usersList = {};

// список сохраненных аватаров, привязанных к нику
// ключ - ник, значение - аватар
const avatarsList = {};

wss.on('connection', function connection(ws) {
  // обработчик события message для приема сообщений
  ws.on('message', function message(data) {
    const message = JSON.parse(data);

    // если залогинился новый пользователь, сохраняем его имя и id,
    // добавляем его в писок юзеров и рассылаем всем сообщение
    if (message.login) {
      ws.id = message.id;
      ws.userName = message.name;
      // если у данного пользователя есть сохраненный аватар
      if (avatarsList[message.name]) {
        ws.avatarUrl = avatarsList[message.name];
        message.avatarUrl = ws.avatarUrl;
      }

      // добавляем пользователя в список подключенных юзеров
      usersList[ws.id] = {
        id: ws.id,
        name: ws.userName,
        avatarUrl: ws.avatarUrl,
      };

      // добавляем к сообщению обновленный список подключенных юзеров
      // и рассылаем всем клиентам
      message.usersList = usersList;
      sendAll(message);
    }

    // если пользователь написал сообщение,
    // рассылаем это сообщение всем клиентам
    if (message.message) {
      sendAll({
        message: {
          id: ws.id,
          name: ws.userName,
          text: message.message,
          date: message.date,
          avatarUrl: ws.avatarUrl,
        },
      });
    }

    // если кто-то из пользователей загрузил аватар
    if (message.updateAvatar) {
      // добавляем информацию об аватаре текущему клиенту
      ws.avatarUrl = message.avatarUrl;
      // добавляем информацию в список подключенных клиентов
      usersList[ws.id]['avatarUrl'] = message.avatarUrl;
      // сохраняем аватар в массив avatarsList
      avatarsList[ws.userName] = ws.avatarUrl;
      // рассылаем информацию всем клиентам
      sendAll({
        updateAvatar: true,
        avatarUrl: message.avatarUrl,
        id: ws.id,
      });
    }
  });

  // закрытие подключения
  ws.on('close', function () {
    // удаляем пользователя из списка
    delete usersList[ws.id];

    // отправляем клиентам информацию о пользователе,
    // который закрыл подключение
    sendAll({
      id: ws.id,
      name: ws.userName,
      logout: true,
    });
  });
});

// отправляем сообщение всем слушающим клиентам
function sendAll(message) {
  wss.clients.forEach(function (client) {
    // если у клиента сокет-соединение открыто
    // отправляем ему сообщение
    if (client.readyState === ws.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
