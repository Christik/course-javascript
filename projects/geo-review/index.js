import './map.html';
import ymaps from 'ymaps';
import './css/styles.css';
// console.log(localStorage.clear());
ymaps
  .load()
  .then((maps) => {
    // менеджер объектов
    const objectManager = new maps.ObjectManager({
      // запрет на открытие балуна при клике
      openBalloonOnClick: false,
      // разрешение на кластеризацию меток
      clusterize: true,
      // запрет на изменение масштаба при клике на кластер
      clusterDisableClickZoom: true,
      // балун «карусель» для кластера
      clusterBalloonContentLayout: 'cluster#balloonCarousel',
      // запрет на открытые балуна при клике на кластер
      clusterOpenBalloonOnClick: true,
      // кластеризовать только точки с одинаковыми координатами
      groupByCoordinates: false,
    });
    // координаты клика по карте
    let currentCoords;
    // html-шаблон для формы добавления отзыва
    const htmlForm = [
      '<div class="form">',
      '<div class="form__title">Отзыв:</div>',
      '<input id="fieldName" type="text" placeholder="Укажите ваше имя">',
      '<input id="fieldLocation" type="text" placeholder="Укажите место">',
      '<textarea id="fieldReview" placeholder="Оставьте отзыв"></textarea>',
      '<button type="button" id="btnAdd">Добавить</button>',
      '</div>',
    ].join('');
    // счетчик идентификаторов меток
    if (!localStorage.getItem('idCount')) {
      localStorage.setItem('idCount', 0);
    }
    let idCount = localStorage.getItem('idCount');
    // массив с данными об отзывах
    if (!localStorage.getItem('reviews')) {
      localStorage.setItem('reviews', JSON.stringify([]));
    }
    const dataReviews = JSON.parse(localStorage.getItem('reviews'));
    // объект с метками
    if (!localStorage.getItem('objects')) {
      localStorage.setItem(
        'objects',
        JSON.stringify({
          type: 'FeatureCollection',
          features: [],
        })
      );
    }
    const dataObj = JSON.parse(localStorage.getItem('objects'));

    // создание карты
    const map = new maps.Map(
      'map',
      {
        center: [55.751574, 37.573856],
        zoom: 12,
        controls: ['zoomControl'],
      },
      {
        balloonMaxWidth: 350,
        balloonMaxHeight: 500,
      }
    );

    // обработка события, возникающего при клике в любой точке карты
    map.events.add('click', function (e) {
      if (!map.balloon.isOpen()) {
        currentCoords = e.get('coords');
        openBalloon(htmlForm);
      } else {
        map.balloon.close();
      }
    });

    // подписка на события dom-элемента
    maps.domEvent.manager.group(document).add(['click'], function (event) {
      // клик по кнопке «добавить»
      if (event.get('target').id === 'btnAdd') {
        // добавление нового отзыва
        const currentReview = {
          id: idCount,
          coords: currentCoords,
          name: document.querySelector('#fieldName').value,
          location: document.querySelector('#fieldLocation').value,
          review: document.querySelector('#fieldReview').value,
          date: getCurrentDay(),
        };
        dataReviews.push(currentReview);
        localStorage.setItem('reviews', JSON.stringify(dataReviews));

        // добавление новой метки в dataObj и на карту
        const currentPlace = {
          type: 'Feature',
          id: idCount,
          geometry: {
            type: 'Point',
            coordinates: currentCoords,
          },
          properties: {
            balloonContentBody: generateHtmlReivew(
              currentReview.name,
              currentReview.location,
              currentReview.date,
              currentReview.review,
              true,
              currentCoords
            ),
          },
        };
        dataObj.features.push(currentPlace);
        localStorage.setItem('objects', JSON.stringify(dataObj));
        renderMap();

        // обновление счетчика идентификаторов меток
        idCount++;
        localStorage.setItem('idCount', idCount);

        map.balloon.close();
      }

      // клик по локации в карусели отзывов
      if (event.get('target').classList.contains('review__location_link')) {
        currentCoords = [
          +event.get('target').dataset.latitude,
          +event.get('target').dataset.longitude,
        ];
        openBalloon(generateHtmlReviews(currentCoords) + htmlForm);
      }
    });

    // клик по метке
    objectManager.objects.events.add('click', function (e) {
      currentCoords = objectManager.objects.getById(e.get('objectId')).geometry
        .coordinates;
      openBalloon(generateHtmlReviews(currentCoords) + htmlForm);
    });

    // клик по кластеру
    objectManager.clusters.events.add('click', function (e) {
      currentCoords = objectManager.clusters.getById(e.get('objectId')).geometry
        .coordinates;
    });

    renderMap();

    // открытие балуна
    function openBalloon(htmlBalloon) {
      map.balloon.open(currentCoords, {
        contentBody: htmlBalloon,
      });
    }

    // получение текущей отформатированной даты
    function getCurrentDay() {
      const today = new Date();
      const dd = String(today.getDate()).padStart(2, '0');
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const yyyy = today.getFullYear();

      return `${dd}.${mm}.${yyyy}`;
    }

    // генерация html-шаблона для одного отзыва
    function generateHtmlReivew(name, location, date, text, hasLink, coords) {
      const link = hasLink ? ' review__location_link' : '';
      const dataCoords = coords
        ? ' data-latitude="' + coords[0] + '" data-longitude="' + coords[1] + '"'
        : '';
      const result = [
        '<div class="review">',
        '<div class="review__header">',
        '<div class="review__name">',
        name,
        '</div>',
        '<div class="review__location' + link + '"' + dataCoords + '>',
        location,
        '</div>',
        '<div class="review__date">',
        date,
        '</div>',
        '</div>',
        '<div class="review__text">',
        text,
        '</div>',
        '</div>',
      ];
      return result.join('');
    }

    // генерация html-шаблона списка отзывов
    function generateHtmlReviews(coords) {
      let htmlReviews = '<div class="reviews">';

      dataReviews.forEach(function (review) {
        if (review.coords[0] === coords[0] && review.coords[1] === coords[1]) {
          htmlReviews += generateHtmlReivew(
            review.name,
            review.location,
            review.date,
            review.review
          );
        }
      });
      htmlReviews += '</div>';

      return htmlReviews;
    }

    // добавление на карту меток
    function renderMap() {
      objectManager.add(dataObj);
      map.geoObjects.add(objectManager);
    }
  })
  .catch((error) => console.log('Failed to load Yandex Maps', error));
