const ws = require('ws');
const wss = new ws.Server({ port: 9090 });

// список подключенных клиентов
const usersList = {};

wss.on('connection', function connection(ws) {
  // обработчик события message для приема сообщений
  ws.on('message', function message(data) {
    const message = JSON.parse(data);

    // если залогинился новый пользователь, сохраняем его имя и id,
    // добавляем его в писок юзеров и рассылаем всем сообщение
    if (message.login) {
      ws.id = message.id;
      ws.userName = message.name;

      usersList[ws.id] = {
        name: ws.userName,
      };

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
        },
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
