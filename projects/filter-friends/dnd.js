const Controller = require('./controller');

module.exports = {
  // перетаскивание
  makeDnD(zones) {
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
            Controller.replaceFriend(id, from, to, e.target);
          } else {
            // если сбрасываем на пустое место, добавляем в конец списка
            Controller.replaceFriend(id, from, to);
          }
        }

        // очищаем данные о перетаскиваемом элементе
        currentDrag = null;
      });
    }
  },
};
