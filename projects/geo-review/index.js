import './map.html';
import ymaps from 'ymaps';
import './css/styles.css';
import balloonTemplate from './templates/balloon.hbs';
import reviewTemplate from './templates/review.hbs';

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
        openBalloon(balloonTemplate());
      } else {
        map.balloon.close();
      }
    });

    // подписка на события dom-элемента
    maps.domEvent.manager.group(document).add(['click'], function (event) {
      // клик по кнопке «добавить»
      if (event.get('target').id === 'btnAdd') {
        // список всех полей формы
        const formFields = {
          name: document.querySelector('#fieldName'),
          location: document.querySelector('#fieldLocation'),
          review: document.querySelector('#fieldReview'),
        };

        // проверка полей формы
        if (isValidForm(formFields)) {
          // добавление нового отзыва
          const currentReview = {
            id: idCount,
            coords: currentCoords,
            name: formFields.name.value,
            location: formFields.location.value,
            review: formFields.review.value,
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
              balloonContentBody: reviewTemplate({
                name: currentReview.name,
                location: currentReview.location,
                date: currentReview.date,
                review: currentReview.review,
                link: 'review__location_link',
                latitude: currentCoords[0],
                longitude: currentCoords[1],
              }),
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
      }

      // клик по локации в карусели отзывов
      if (event.get('target').classList.contains('review__location_link')) {
        currentCoords = [
          +event.get('target').dataset.latitude,
          +event.get('target').dataset.longitude,
        ];
        const currentReviews = getReviewsByCoords(currentCoords);
        openBalloon(balloonTemplate(currentReviews));
      }
    });

    // клик по метке
    objectManager.objects.events.add('click', function (e) {
      currentCoords = objectManager.objects.getById(e.get('objectId')).geometry
        .coordinates;
      const currentReviews = getReviewsByCoords(currentCoords);
      openBalloon(balloonTemplate(currentReviews));
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

    // получение списка отзывов по координатам места
    function getReviewsByCoords(coords) {
      const result = {
        reviews: [],
      };

      dataReviews.forEach(function (review) {
        if (review.coords[0] === coords[0] && review.coords[1] === coords[1]) {
          result.reviews.push(review);
        }
      });

      return result;
    }

    // добавление на карту меток
    function renderMap() {
      objectManager.add(dataObj);
      map.geoObjects.add(objectManager);
    }

    // проверка полей формы перед отправкой
    function isValidForm(fieldsObj) {
      let result = true;

      for (const fieldName in fieldsObj) {
        const errorClassName = 'is-error';
        const field = fieldsObj[fieldName];
        let val = field.value;
        val = val.trim();

        if (val === '') {
          field.classList.add(errorClassName);
          result = false;
        } else if (field.classList.contains(errorClassName)) {
          field.classList.remove(errorClassName);
        }
      }

      return result;
    }
  })
  .catch((error) => console.log('Failed to load Yandex Maps', error));
