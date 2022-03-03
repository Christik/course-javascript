const Model = require('./model');
const View = require('./view');
const Element = require('./elements');

// содержится ли подстрока chunk в строке full
function isMatching(full, chunk) {
  full = full.toLowerCase();
  chunk = chunk.toLowerCase();
  return full.search(chunk) !== -1;
}

module.exports = {
  // обновление данных о списках друзей
  replaceFriendData(id, from, to) {
    // добавляем друга в список 'to'
    Model.allFriends[to][id] = Model.allFriends[from][id];
    // удаляем друга из списка 'from'
    delete Model.allFriends[from][id];
    Model.updateStorage();
  },

  // перемещение друга в разметке
  replaceFriendTemplate(id, from, to, afterElement) {
    // строка поиска в списке, куда перемещается друг
    const searchStr = Element.appContainer
      .querySelector(`[data-search="${to}"]`)
      .value.trim();
    // если в списке, куда перемещается друг, активен поиск
    if (searchStr !== '') {
      // обновляем разметку в списке друзей
      this.updateRenderList(to, searchStr);
    } else {
      // если поиск пустой, то добавляем в разметку перемещаемого друга
      let targetElement = Element.containers[to];
      let where = 'beforeend';

      // если указан параметр, afterElement,
      // то вставляем разметку после этого элемента
      if (afterElement) {
        targetElement = afterElement;
        where = 'afterend';
      }
      // добавляем разметку в список 'to'
      targetElement.insertAdjacentHTML(
        where,
        View.renderFriend(to, Model.allFriends[to][id])
      );
    }
    // удаляем друга из разметки списка 'from'
    Element.containers[from].querySelector(`.friend[data-id="${id}"]`).remove();
  },

  // перемещение друга
  replaceFriend(id, from, to, afterElement) {
    this.replaceFriendData(id, from, to);
    this.replaceFriendTemplate(id, from, to, afterElement);
  },

  // обновляем разметку списка друзей
  // listName – имя списка ('simple' или 'best')
  // searchStr – строка поиска
  updateRenderList(listName, searchStr) {
    // шаблон для списка друзей
    let template = '';
    // перебираем всех друзей из указанного списка
    for (const key in Model.allFriends[listName]) {
      const currentFriend = Model.allFriends[listName][key];
      // если имя и фамилия друга удовлетворяют строке поиска,
      // добавляем этого друга в шаблон
      if (
        isMatching(currentFriend.first_name, searchStr) ||
        isMatching(currentFriend.last_name, searchStr)
      ) {
        template += View.renderTemplate(`${listName}Friend`, currentFriend);
      }
    }
    // обновляем разметку указанного списка друзей
    Element.containers[listName].innerHTML = template;
  },
};
