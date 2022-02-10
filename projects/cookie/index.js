/*
 ДЗ 7 - Создать редактор cookie с возможностью фильтрации

 7.1: На странице должна быть таблица со списком имеющихся cookie. Таблица должна иметь следующие столбцы:
   - имя
   - значение
   - удалить (при нажатии на кнопку, выбранная cookie удаляется из браузера и таблицы)

 7.2: На странице должна быть форма для добавления новой cookie. Форма должна содержать следующие поля:
   - имя
   - значение
   - добавить (при нажатии на кнопку, в браузер и таблицу добавляется новая cookie с указанным именем и значением)

 Если добавляется cookie с именем уже существующей cookie, то ее значение в браузере и таблице должно быть обновлено

 7.3: На странице должно быть текстовое поле для фильтрации cookie
 В таблице должны быть только те cookie, в имени или значении которых, хотя бы частично, есть введенное значение
 Если в поле фильтра пусто, то должны выводиться все доступные cookie
 Если добавляемая cookie не соответствует фильтру, то она должна быть добавлена только в браузер, но не в таблицу
 Если добавляется cookie, с именем уже существующей cookie и ее новое значение не соответствует фильтру,
 то ее значение должно быть обновлено в браузере, а из таблицы cookie должна быть удалена

 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер
 */

import './cookie.html';

/*
 app - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#app');
// текстовое поле для фильтрации cookie
const filterNameInput = homeworkContainer.querySelector('#filter-name-input');
// текстовое поле с именем cookie
const addNameInput = homeworkContainer.querySelector('#add-name-input');
// текстовое поле со значением cookie
const addValueInput = homeworkContainer.querySelector('#add-value-input');
// кнопка "добавить cookie"
const addButton = homeworkContainer.querySelector('#add-button');
// таблица со списком cookie
const listTable = homeworkContainer.querySelector('#list-table tbody');

let cookiesObj = getCookieObj();
let filterValue = '';

// проверяет, содержится для в full подстрока chunk
function isMatching(full, chunk) {
  full = full.toLowerCase();
  chunk = chunk.toLowerCase();
  return full.search(chunk) === -1 ? false : true;
}

// возвращает объект, соответствующий document.cookie
function getCookieObj() {
  return document.cookie.split('; ').reduce((obj, current) => {
    const [name, value] = current.split('=');
    obj[name] = value;
    return obj;
  }, {});
}

// удаляет cookie по ее имени
function deleteCookie(name) {
  document.cookie = `${name}=; max-age=-1`;
}

// создает и возвращает ячейку <td>
function createCell(content) {
  const cell = document.createElement('td');

  if (content instanceof HTMLElement) {
    cell.appendChild(content);
  }

  if (typeof content === 'string') {
    cell.textContent = content;
  }

  return cell;
}

// создает и возвращает строку <tr>
function createRow(name, value) {
  const row = document.createElement('tr');

  // добавляем строке <tr> атрибут data-name с именем cookie
  row.setAttribute('data-name', name);

  row.appendChild(createCell(name));
  row.appendChild(createCell(value));

  const btnDel = document.createElement('button');
  btnDel.textContent = 'Удалить';
  btnDel.classList.add('btn-delete');
  row.appendChild(createCell(btnDel));

  return row;
}

function loadTable() {
  const fragment = document.createDocumentFragment();

  for (const name in cookiesObj) {
    if (
      filterValue === '' ||
      isMatching(name, filterValue) ||
      isMatching(cookiesObj[name], filterValue)
    ) {
      fragment.appendChild(createRow(name, cookiesObj[name]));
    }
  }

  listTable.innerHTML = '';
  listTable.appendChild(fragment);
}

filterNameInput.addEventListener('input', function () {
  filterValue = filterNameInput.value;
  loadTable();
});

addButton.addEventListener('click', () => {
  const cookieName = addNameInput.value;
  const cookieValue = addValueInput.value;

  document.cookie = `${cookieName}=${cookieValue}`;
  cookiesObj = getCookieObj();

  loadTable();

  addNameInput.value = '';
  addValueInput.value = '';
});

listTable.addEventListener('click', (e) => {
  if (e.target.classList.contains('btn-delete')) {
    const name = e.target.closest('tr').dataset.name;

    // удаляем cookie
    deleteCookie(name);

    // обновляем объект с куками
    cookiesObj = getCookieObj();

    loadTable();
  }
});

loadTable();
