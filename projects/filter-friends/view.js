// hbs шаблоны для рендера
const templateHeader = require('./templates/header.hbs');
const templateBestFriend = require('./templates/friend-best.hbs');
const templateSimpleFriend = require('./templates/friend-simple.hbs');
const templates = {
  header: templateHeader,
  bestFriend: templateBestFriend,
  simpleFriend: templateSimpleFriend,
};

module.exports = {
  // создание шаблона
  renderTemplate(templateName, data) {
    return templates[templateName](data);
  },
  // создание шаблона для друга
  renderFriend(name, data) {
    return templates[`${name}Friend`](data);
  },
};
