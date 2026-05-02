/* eslint-disable no-bitwise */
/* eslint-disable radix */
import moment from 'moment';
import 'moment-timezone';

const currentTimezone = moment.tz.guess();

export const DateTimeFormatter = {
  dateToTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    minutes = minutes < 10 ? '0' + minutes : minutes;
    const strTime = `${hours}:${minutes} ${ampm}`;
    return strTime;
  },

  // function to conver seconds to X Hrs Y Mins or X Mins or X Hrs or X sec
  convertSecondsToReadable(seconds) {
    // if(!seconds) return "Loading"
    const hours = Math.floor(seconds / 3600);
    let minss = seconds % 3600;
    minss = parseInt(minss / 60);
    let secs = seconds % 60;
    secs = parseInt(secs);
    if (secs < 1) {
      return `${hours} Hrs ${minss} Mins`;
    } else if (hours < 1) {
      return `${minss} Mins`;
    } else {
      return `${hours} Hrs ${minss} Mins`;
    }
  },
  millisecondsToReadable(ms) {
    // if(!ms) return "Loading"
    let minutes = Math.floor(ms / 60000);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    const days = Math.floor(hours / 24);
    hours = hours % 24;
    let seconds = Math.floor(ms / 1000);
    seconds = seconds % 60;

    if (days > 0) {
      return `${days} days ${hours} hrs ${minutes} mins`;
    } else if (hours > 0) {
      return `${hours} hrs ${minutes} mins`;
    } else if (minutes > 0) {
      return `${minutes} mins`;
    } else {
      return `${seconds} secs`;
    }
  },

  _millisecondsToReadable(ms) {
    // if(!ms) return "Loading"
    let minutes = Math.floor(ms / 60000);
    let hours = Math.floor(minutes / 60);
    minutes = minutes % 60;
    const days = Math.floor(hours / 24);
    hours = hours % 24;
    let seconds = Math.floor(ms / 1000);
    seconds = seconds % 60;

    if (days > 0) {
      return `${days} d ${hours} h ${minutes} m`;
    } else if (hours > 0) {
      return `${hours} h ${minutes} m`;
    } else if (minutes > 0) {
      return `${minutes} m`;
    } else {
      return `${seconds} s`;
    }
  },

  convertMillisecondsToHoursAndMinutes(milliseconds) {
    const duration = moment.duration(milliseconds);
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    return `${hours} hours ${minutes} minutes`;
  },

  requiredDateFormat(date, format = 'DD-MM-YYYY') {
    return moment(date).format(format);
  },

  formatISOTo12HourClock(dateString) {
    return moment.tz(dateString, currentTimezone).format('LT');
  },

  UTCFormat(dateString) {
    return moment.utc(dateString).format();
  },

  getCurrentDate() {
    return moment().format('YYYY-MM-DD');
  },

  getCurrentTime() {
    return moment().format('hh-mm');
  },

  currentDateAndTime() {
    return moment().format('LLLL'); // Wednesday, November 1, 2023 4:25 PM
  },

  get90DaysAfterCurrentDate() {
    return moment().add(90, 'days').format('YYYY-MM-DD');
  },

  formatTime(timestamp) {
    return moment(timestamp).format('MM/DD/YYYY hh:mm:ss A');
  },

  getLocalTime(timestamp) {
    return moment(timestamp).format('HH:mm');
  },

  getAmPM(timestamp) {
    return moment(timestamp).format('hh:mm A');
  },

  formatDate(dateString) {
    return moment.tz(dateString, currentTimezone).format('LL');
  },

  formatDateAndTime(isoString) {
    return moment.tz(isoString, currentTimezone).format('LLL');
  },

  createUUID() {
    const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return pattern.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  updateLocale(locale) {
    moment.updateLocale(locale, {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'a sec', // Instead of "a few seconds"
      ss: '%d sec',
      m: 'a min',
      mm: '%d min',
      h: 'an hour',
      hh: '%d hours',
      d: 'a day',
      dd: '%d days',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    }
  });
  },

  timeAgoText(timestamp) {
    this.updateLocale('en');
    return moment(timestamp).fromNow();
  },

  timestampTo12HourFormat(timestamp) {
    return moment(timestamp).format('h.mm A');
  },

  toTitleCase: str => {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },
  toTitleCaseName: str => {
    return str.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  },

  timestampTOISO(timestamp) {
    return moment(timestamp).format();
  },

  secondsToMinutes(seconds){
    return Math.round(seconds/60)
  },

  secondsToDays(seconds){
    return Math.round(seconds / (60 * 60 * 24));
  },

  getNextDayLists(days) {
    const today = new Date();
    const daysList = [];
    for (let i = 0; i < days; i++) {
      const currentDate = moment(today).add(i, 'days');
      const dayName = currentDate.format('ddd');
      const monthName = currentDate.format('MMMM');
      const day = currentDate.format('DD');
      const year = currentDate.format('YYYY');
      const formattedDate = currentDate.format('YYYY-MM-DD');
      daysList.push({
        index: i + 1,
        date: formattedDate,
        day: day,
        daylabel: dayName,
        month: monthName,
        year: year,
      });
    }
    return daysList;
  },

  convertMinutesToHHMM(minutes) {
    const hours = Math.floor(minutes / 60);
    let minss = minutes % 60;
    minss = parseInt(minss);
    if (minss < 1) {
      return `${hours} Hrs`;
    } else if (hours < 1) {
      return `${minss} Mins`;
    } else {
      return `${hours} Hrs ${minss} Mins`;
    }
  },

  removeCountryCodeAndSpaces(phoneNumber) {
    var countryCodeAndSpacesPattern = /^(\+91\s?)?(\d[\s\d]*)$/;

    var cleanedNumber = phoneNumber.replace(
      countryCodeAndSpacesPattern,
      function (match, countryCode, digits) {
        return (countryCode ? countryCode : '') + digits.replace(/\s/g, '');
      },
    );

    var countryCodePattern = /^(\+91\s?)?/;

    cleanedNumber = cleanedNumber.replace(countryCodePattern, '');

    return cleanedNumber;
  },

  convertUTCtoComparisonAndDate(time) {
    // 2024-01-29T02:42:06.000Z to Today,Tomorrow or January 01
    const momentObj = moment(time);
    const currentDate = moment();
    let dateComparison;
    if (momentObj.isSame(currentDate, 'day')) {
      dateComparison = 'Today';
    } else if (momentObj.isSame(currentDate.clone().add(1, 'day'), 'day')) {
      dateComparison = 'Tomorrow';
    } else {
      dateComparison = momentObj.format('MMMM DD');
    }
    const formattedTime = momentObj.format('h:mm a');
    return [dateComparison, formattedTime];
  },

  getReadableTimeFromMs(time) {
    time = parseInt(time);
    const date = new Date(time);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    return `${day}/${month}/${year} ${formattedHours}:${minutes} ${ampm}`;
  },

  getTodaysStartEndTime() {
    const startOfDay = moment().startOf('day').valueOf();
    const endOfDay = moment().endOf('day').valueOf();
    return [startOfDay, endOfDay];
  },

  getYesterdaysStartEndTime() {
    const startOfYesterday = moment()
      .subtract(1, 'days')
      .startOf('day')
      .valueOf();
    const endOfYesterday = moment().subtract(1, 'days').endOf('day').valueOf();
    return [startOfYesterday, endOfYesterday];
  },

  getThisWeekStartEndTime() {
    const now = moment();
    const startOfWeek = moment().startOf('week').valueOf();
    let endOfWeek = moment().endOf('week').valueOf();
    // If the end of the week is in the future, set it to current date
    if (endOfWeek > now.valueOf()) {
      endOfWeek = moment().endOf('day').hour(23).minute(59).second(0).millisecond(0).valueOf();;
    }
    return [startOfWeek, endOfWeek];
  },

  getLastWeekStartEndTime() {
    const startOfLastWeek = moment()
      .subtract(1, 'weeks')
      .startOf('week')
      .valueOf();
    const endOfLastWeek = moment().subtract(1, 'weeks').endOf('week').valueOf();
    return [startOfLastWeek, endOfLastWeek];
  },

  getThisMonthStartEndTime() {
    const now = moment();
    const startOfMonth = moment().startOf('month').valueOf();
    let endOfMonth = moment().endOf('month').valueOf();
  
    // If the end of the month is in the future, set it to current date
    if (endOfMonth > now.valueOf()) {
      endOfMonth = moment().endOf('day').hour(23).minute(59).second(0).millisecond(0).valueOf();
    }
    return [startOfMonth, endOfMonth];
  },
  calculateDaysSince(selectedTimeInMs) {
    // Get the current time in milliseconds
    const currentTimeInMs = Date.now();
  
    // Calculate the difference in milliseconds
    const differenceInMs = currentTimeInMs - selectedTimeInMs;
  
    // Calculate the difference in days
    const differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24));
  
    return differenceInDays;
  },

  getDuration(arrivalTimeMs, startTime, type) {
    const currentTimeMs =type === 'arrival' ? Date.now() : startTime;
    const durationMs = arrivalTimeMs - currentTimeMs;
    if (durationMs < 0) {
      return 'Exceeded';
    }
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    if (hours < 1) {
      return `${minutes} minutes`;
    } else {
      return `${hours} hours, ${minutes} minutes`;
    }
  },

  getGreetingText() {
    const currentTime = moment();
    const currentHour = currentTime.hour();

    if (currentHour >= 0 && currentHour < 12) {
      return 'Good Morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Good Afternoon';
    } else if (currentHour >= 18 && currentHour < 23) {
      return 'Good Evening';
    } else {
      return 'Good Night';
    }
  },

  formatMinutesToDuration(totalMinutes) {
    const duration = moment.duration(totalMinutes, 'minutes');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
  
    if (totalMinutes >= 60) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  },

  formatSecondsToDuration(totalSeconds) {
    const duration = moment.duration(totalSeconds, 'seconds');
    const hours = Math.floor(duration.asHours());
    const minutes = duration.minutes();
    const seconds = duration.seconds();
  
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  },
  
  convertToRelativeTime(date) {
    return moment(date).fromNow();
  },
};
