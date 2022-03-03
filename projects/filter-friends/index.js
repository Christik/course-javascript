import './css/styles.css';
import './index.html';
import VK from 'vk-openapi';
// hbs шаблоны для рендера
import templateHeader from './templates/header.hbs';
import templateBestFriend from './templates/friend-best.hbs';
import templateSimpleFriend from './templates/friend-simple.hbs';
const templates = {
  header: templateHeader,
  bestFriend: templateBestFriend,
  simpleFriend: templateSimpleFriend,
};
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
// элементы приложения
const appContainer = document.querySelector('.app');
const header = appContainer.querySelector('.app-header__title');
const containers = {
  simple: appContainer.querySelector('[data-list="simple"]'),
  best: appContainer.querySelector('[data-list="best"]'),
};

// инициализация Open API
VK.init({
  apiId: 8091807,
});

auth()
  .then(function () {
    return callAPI('users.get', { name_case: 'gen' });
  })
  .then(function (me) {
    // рендер шапки приложения с заголовком
    header.innerHTML = templates.header({
      first_name: me[0].first_name,
      last_name: me[0].last_name,
    });

    // запрос списка друзей
    return callAPI('friends.get', { fields: 'photo_50' });
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
        allFriends.simple[id] = friend;
      }

      // создаем html-шаблон для каждого списка друзей
      for (const key in renderFriendsList) {
        const list = allFriends[key];
        if (list[id]) {
          renderFriendsList[key] += renderFriendTemplate(key, list[id]);
        }
      }
    });

    updateStorage();

    // добавление друзей в разметку каждого списка
    for (const key in renderFriendsList) {
      containers[key].innerHTML = renderFriendsList[key];
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
    replaceFriend(currentId, from, to);
  }
});

// массив со всеми зонами перетаскивания
const zones = [];
for (const key in containers) {
  zones.push(containers[key]);
}
// drag and drop
makeDnD(zones);

// все поля поиска
const searchFields = appContainer.querySelectorAll('[data-search]');
// для каждого поля поиска создаем обработчик события 'input'
searchFields.forEach(function (searchField) {
  // название списка, по которому идет поиск (simple или best)
  const listName = searchField.dataset.search;

  searchField.addEventListener('input', function (e) {
    const searchStr = e.target.value.trim();
    updateRenderList(listName, searchStr);
  });
});

// авторизация
function auth() {
  return new Promise(function (resolve, reject) {
    VK.Auth.login(function (response) {
      if (response.session) {
        // если пользоатель успешно авторизовался
        resolve();
      } else {
        // если пользователь нажал «отмена» в окне авторизации
        reject(new Error('Не удалось авторизоваться'));
      }
    }, 2);
  });
}

// отправка запроса на сервер ВК
function callAPI(method, params) {
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
}

// определяет новый ли это друг, которого не было ранее
function isNewFriend(id) {
  let result = true;

  // проверяем наличие друга во всех списках друзей
  for (const key in allFriends) {
    if (allFriends[key][id]) {
      result = false;
    }
  }

  return result;
}

// создание шаблона для друга
function renderFriendTemplate(name, data) {
  return templates[`${name}Friend`](data);
}

// перемещение друга
function replaceFriend(id, from, to, afterElement) {
  replaceFriendData(id, from, to);
  replaceFriendTemplate(id, from, to, afterElement);
}

// обновление данных о списках друзей
function replaceFriendData(id, from, to) {
  // добавляем друга в список 'to'
  allFriends[to][id] = allFriends[from][id];
  // удаляем друга из списка 'from'
  delete allFriends[from][id];
  updateStorage();
}

// перемещение друга в разметке
function replaceFriendTemplate(id, from, to, afterElement) {
  // строка поиска в списке, куда перемещается друг
  const searchStr = appContainer.querySelector(`[data-search="${to}"]`).value.trim();
  // если в списке, куда перемещается друг, активен поиск
  if (searchStr !== '') {
    // обновляем разметку в списке друзей
    updateRenderList(to, searchStr);
  } else {
    // если поиск пустой, то добавляем в разметку перемещаемого друга
    let targetElement = containers[to];
    let where = 'beforeend';

    // если указан параметр, afterElement,
    // то вставляем разметку после этого элемента
    if (afterElement) {
      targetElement = afterElement;
      where = 'afterend';
    }
    // добавляем разметку в список 'to'
    targetElement.insertAdjacentHTML(where, renderFriendTemplate(to, allFriends[to][id]));
  }
  // удаляем друга из разметки списка 'from'
  containers[from].querySelector(`.friend[data-id="${id}"]`).remove();
}

// перетаскивание
function makeDnD(zones) {
  // объект с информацией, что и откуда мы перетаскиваем
  let currentDrag;

  for (const zone of zones) {
    // когда пользователь начал перетаскивать элемент
    zone.addEventListener('dragstart', function (e) {
      currentDrag = { from: zone, node: e.target };
      // для кроссбраузерности
      // добавляем id целевого элемента в объект передачи данных
      e.dataTransfer.setData('text/html', e.target.dataset.id);
    });

    // когда элемент в процессе перетаскивания над допустимой областью сброса
    zone.addEventListener('dragover', function (e) {
      // запрещаем событие по умолчанию, чтобы когда пользователь бросит элемент,
      // сработало следующее событие 'drop'
      e.preventDefault();
    });

    // когда элемент сброшен в допустимую зону
    zone.addEventListener('drop', function (e) {
      // если пользователь перетаскивал элемент
      if (currentDrag) {
        e.preventDefault();
      }

      // если область сброса не та, из которой начали тащить
      if (currentDrag.from !== zone) {
        // id перетаскиваемого друга
        const id = +currentDrag.node.dataset.id;
        // названия списков, откуда и куда перетаскиваем
        const from = currentDrag.from.dataset.list;
        const to = zone.dataset.list;
        // если элемент, на который сбрасывается, является другом
        if (e.target.classList.contains('friend')) {
          // добавляем перетаскиваемый элемент после друга
          replaceFriend(id, from, to, e.target);
        } else {
          // если сбрасываем на пустое место, добавляем в конец списка
          replaceFriend(id, from, to);
        }
      }

      // очищаем данные о перетаскиваемом элементе
      currentDrag = null;
    });
  }
}

// содержится ли подстрока chunk в строке full
function isMatching(full, chunk) {
  full = full.toLowerCase();
  chunk = chunk.toLowerCase();
  return full.search(chunk) !== -1;
}

// обновляем разметку списка друзей
// listName – имя списка ('simple' или 'best')
// searchStr – строка поиска
function updateRenderList(listName, searchStr) {
  // шаблон для списка друзей
  let template = '';
  // перебираем всех друзей из указанного списка
  for (const key in allFriends[listName]) {
    const currentFriend = allFriends[listName][key];
    // если имя и фамилия друга удовлетворяют строке поиска,
    // добавляем этого друга в шаблон
    if (
      isMatching(currentFriend.first_name, searchStr) ||
      isMatching(currentFriend.last_name, searchStr)
    ) {
      template += templates[`${listName}Friend`](currentFriend);
    }
  }
  // обновляем разметку указанного списка друзей
  containers[listName].innerHTML = template;
}

// обновление данные в localStorage
function updateStorage() {
  localStorage.setItem('allFriends', JSON.stringify(allFriends));
}
