const serverUrl = 'https://630393-vds-atp16363.tech.gmhost.pp.ua:5001' //'http://5.154.181.113:5000'; //'http://192.168.0.107:5000'; //
const appVersion = '1.2.2b';
const checkpointsList = [
  { id: 1, stage: 'До виїзду', checkpoints: [
    { id: 1, name: 'Рейс створено, водій ще не прийняв'},
    { id: 2, name: 'Водій прийняв рейс'},
  ] },
  { id: 2, stage: 'Точка завантаження', checkpoints: [
    { id: 3, name: 'Переїзд на завантаження'},
    { id: 4, name: 'Завантаження'},
    { id: 5, name: 'Завантажений, слідую за маршрутом'},
  ] },
  { id: 3, stage: 'Точка розвантаження', checkpoints: [
    { id: 6, name: 'Проміжне розвантаження'},
    { id: 7, name: 'Кінцеве розвантаження'},
  ] },
  { id: 4, stage: 'Опціонально', checkpoints: [
    { id: 8, name: 'Відпочинок'},
    { id: 9, name: 'Ремонт'},
    { id: 10, name: 'Повернувся на маршрут'},
  ] },
  { id: 5, stage: 'Кінець рейса', checkpoints: [
    { id: 11, name: 'Рейс завершено'},
  ]}

  


  ];

export { serverUrl, checkpointsList, appVersion};
