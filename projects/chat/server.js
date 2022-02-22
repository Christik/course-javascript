const ws = require('ws');
const wss = new ws.Server({ port: 9090 });

wss.on('connection', function connection(ws) {
  // обработчик события message для приема сообщений
  ws.on('message', function (message) {
    // отправляем сообщение всем слушающим клиентам
    wss.clients.forEach(function (client) {
      // если у клиента сокет-соединение открыто
      // отправляем ему сообщение
      if (client.readyState === ws.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  });

  // закрытие подключения
  ws.on('close', function () {});
});
