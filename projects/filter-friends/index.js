import './css/styles.css';
import './index.html';
import Model from './model';
import View from './view';
import Controller from './controller';
import Element from './elements';
import DnD from './dnd';

Model.login(8091807, 2)
  .then(function () {
    return Model.getUser({ name_case: 'gen' });
  })
  .then(function (me) {
    // рендер шапки приложения с заголовком
    Element.header.innerHTML = View.renderTemplate('header', {
      first_name: me[0].first_name,
      last_name: me[0].last_name,
    });

    return Model.getFriends({ fields: 'photo_50' });
  })
  .then(function (friends) {
    // шаблоны для списков друзей
    const renderFriendsList = {
      simple: '',
      best: '',
    };

    // проходимся по каждому другу
    friends.items.forEach(function (friend) {
      const id = friend.id;

      // если это новый друг и его нет в списках,
      // добавляем его в список простых друзей
      if (isNewFriend(id)) {
        Model.allFriends.simple[id] = friend;
      }

      // создаем html-шаблон для каждого списка друзей
      for (const key in renderFriendsList) {
        const list = Model.allFriends[key];
        if (list[id]) {
          renderFriendsList[key] += View.renderFriend(key, list[id]);
        }
      }
    });

    Model.updateStorage();

    // добавление друзей в разметку каждого списка
    for (const key in renderFriendsList) {
      Element.containers[key].innerHTML = renderFriendsList[key];
    }
  });

// делегирование клика
document.addEventListener('click', function (e) {
  // клик по кнопке переноса
  if (e.target.classList.contains('friend__move')) {
    // определеяем, из какого списка надо перенести в какой
    const to = e.target.dataset.to;
    const from = e.target.closest('[data-list]').dataset.list;
    // друг, по которому кликнули
    const elFriend = e.target.closest('.friend');
    // id друга, по которому кликнули
    const currentId = +elFriend.dataset.id;
    // перенос друга из списка from в список to
    Controller.replaceFriend(currentId, from, to);
  }
});

// массив со всеми зонами перетаскивания
const zones = [];
for (const key in Element.containers) {
  zones.push(Element.containers[key]);
}
// реализация drag and drop
DnD.makeDnD(zones);

// для каждого поля поиска создаем обработчик события 'input'
Element.searchFields.forEach(function (searchField) {
  // название списка, по которому идет поиск (simple или best)
  const listName = searchField.dataset.search;

  searchField.addEventListener('input', function (e) {
    const searchStr = e.target.value.trim();
    Controller.updateRenderList(listName, searchStr);
  });
});

// определяет новый ли это друг, которого не было ранее
function isNewFriend(id) {
  let result = true;

  // проверяем наличие друга во всех списках друзей
  for (const key in Model.allFriends) {
    if (Model.allFriends[key][id]) {
      result = false;
    }
  }

  return result;
}
