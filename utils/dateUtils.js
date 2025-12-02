import moment from 'moment';

const formatDate = (dateString) => {
    let date = new Date(dateString);
    let today = new Date();
    let yesterday = new Date(today.setDate(today.getDate() - 1));
    let formattedDate;
  
    let localeDate =  moment(date).format('HH:mm')
    if (moment(date).format('DD.MM.YY') === ( moment().format('DD.MM.YY'))) {
          formattedDate = 'сьогодні, ' + localeDate;
    } else if (moment(date).format('DD.MM.YY') === ( moment(yesterday).format('DD.MM.YY'))) {
      formattedDate = 'вчора, ' +  localeDate;
    } else {
      formattedDate = moment(date).format('DD.MM.YY, HH:mm')
    }
    return formattedDate;
  };

  const formatDateFull = (dateString) => {
    return moment(dateString).format('DD.MM.YY, HH:mm')
  };
  
  const calculateIdleTime = (startTime) => {
    const now = new Date();
    const startDate = new Date(startTime);
    const diff = now.getTime() - startDate.getTime();
  
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  
    return `${days} днів ${hours} годин`;
  }

  const calculateIdleTimeForCurrentMonth = (routes) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  let idleTime = 0;
    let routesCal = [{unload_date: firstDayOfMonth}, ...routes, {load_date: now}];
  for (let i = 0; i < routesCal.length - 1; i++) {
    const currentTrip = routesCal[i];
    const nextTrip = routesCal[i + 1];

    const currentTripMonth = new Date(currentTrip.unload_date).getMonth();
    const nextTripMonth = new Date(nextTrip.load_date).getMonth();

    if (currentTripMonth === currentMonth && nextTripMonth === currentMonth) {
      const currentTripUnloadTime = new Date(currentTrip.unload_date).getTime();
      const nextTripLoadTime = new Date(nextTrip.load_date).getTime();

      if (currentTripUnloadTime < now.getTime()) {
        idleTime += nextTripLoadTime - currentTripUnloadTime;
        console.log(idleTime);
      }
    } else if (nextTripMonth === currentMonth){
      const currentTripUnloadTime = firstDayOfMonth.getTime();
      const nextTripLoadTime = new Date(nextTrip.load_date).getTime();

      if (currentTripUnloadTime < now.getTime()) {
        idleTime += nextTripLoadTime - currentTripUnloadTime;
        console.log(idleTime);
      }
    }
  }
  const days = Math.floor(idleTime / (1000 * 60 * 60 * 24));
  console.log((idleTime / (1000 * 60 * 60)) % 24);
  const hours = Math.floor((idleTime / (1000 * 60 * 60)) % 24);
  
  
    return `${days} днів ${hours} годин`;
  }
  
  export { formatDate, formatDateFull, calculateIdleTime, calculateIdleTimeForCurrentMonth };