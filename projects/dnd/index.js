/* Задание со звездочкой */

/*
 Создайте страницу с кнопкой.
 При нажатии на кнопку должен создаваться div со случайными размерами, цветом и позицией на экране
 Необходимо предоставить возможность перетаскивать созданные div при помощи drag and drop
 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
import './dnd.html';

const homeworkContainer = document.querySelector('#app');

// перетаскиваемый в данный момент div
let draggableDiv;

// координаты курсора относительно родительского div
let cursorPosX = 0;
let cursorPosY = 0;

// функция, возвращающая случайное число в диапазоне от min до max
function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// функция, возвращающая случайный цвет
function getRandomColor() {
  const min = 0;
  const max = 255;

  return `rgb(${getRandom(min, max)}, ${getRandom(min, max)}, ${getRandom(min, max)})`;
}

// функция, задающая элементу случайную позицию
function setRandomCoords(elem) {
  const elemWidth = parseInt(elem.style.width);
  const elemHeight = parseInt(elem.style.height);
  const winWidth = window.innerWidth;
  const winHeight = window.innerHeight;

  elem.style.left = getRandom(0, winWidth - elemWidth) + 'px';
  elem.style.top = getRandom(0, winHeight - elemHeight) + 'px';
}

document.addEventListener('mousemove', (e) => {
  if (draggableDiv) {
    draggableDiv.style.top = e.clientY - cursorPosY + 'px';
    draggableDiv.style.left = e.clientX - cursorPosX + 'px';
  }
});

export function createDiv() {
  const div = document.createElement('div');
  const minSize = 30;
  const maxSize = 100;

  div.classList.add('draggable-div');
  div.style.width = getRandom(minSize, maxSize) + 'px';
  div.style.height = getRandom(minSize, maxSize) + 'px';
  div.style.backgroundColor = getRandomColor();
  setRandomCoords(div);
  div.style.cursor = 'move';

  div.addEventListener('mousedown', function (e) {
    cursorPosX = e.offsetX;
    cursorPosY = e.offsetY;
    draggableDiv = div;
  });

  div.addEventListener('mouseup', function () {
    draggableDiv = false;
    cursorPosX = 0;
    cursorPosY = 0;
  });

  return div;
}

const addDivButton = homeworkContainer.querySelector('#addDiv');

addDivButton.addEventListener('click', function () {
  const div = createDiv();
  homeworkContainer.appendChild(div);
});
