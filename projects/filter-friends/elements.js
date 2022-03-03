// элементы приложения
const appContainer = document.querySelector('.app');
const header = appContainer.querySelector('.app-header__title');
const containers = {
  simple: appContainer.querySelector('[data-list="simple"]'),
  best: appContainer.querySelector('[data-list="best"]'),
};
const searchFields = appContainer.querySelectorAll('[data-search]');
module.exports = {
  appContainer,
  header,
  containers,
  searchFields,
};
