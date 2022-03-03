const VK = require('vk-openapi');

// allFriends содержит списки друзей
// внутри каждого списка: свойство – id друга, значение – объект с данными
if (!localStorage.getItem('allFriends')) {
  localStorage.setItem(
    'allFriends',
    JSON.stringify({
      simple: {},
      best: {},
    })
  );
}
const allFriends = JSON.parse(localStorage.getItem('allFriends'));

module.exports = {
  login(apiId, permissions) {
    return new Promise(function (resolve, reject) {
      // инициализация Open API
      VK.init({
        apiId: apiId,
      });
      // авторизация
      VK.Auth.login(function (response) {
        if (response.session) {
          // если пользоатель успешно авторизовался
          resolve();
        } else {
          // если пользователь нажал «отмена» в окне авторизации
          reject(new Error('Не удалось авторизоваться'));
        }
      }, permissions);
    });
  },
  // отправка запроса на сервер ВК
  callAPI(method, params) {
    params.v = '5.131';

    return new Promise(function (resolve, reject) {
      VK.Api.call(method, params, function (data) {
        if (data.error) {
          reject(data.error);
        } else {
          resolve(data.response);
        }
      });
    });
  },
  // получение юзера (меня)
  getUser(params = {}) {
    return this.callAPI('users.get', params);
  },
  //  получение списка друзей
  getFriends(params = {}) {
    return this.callAPI('friends.get', params);
  },
  // списки друзей
  allFriends,
  // обновление данные в localStorage
  updateStorage() {
    localStorage.setItem('allFriends', JSON.stringify(this.allFriends));
  },
};
