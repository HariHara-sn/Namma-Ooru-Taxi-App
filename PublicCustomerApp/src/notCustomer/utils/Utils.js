import { Dimensions } from 'react-native';
import moment from 'moment';
import 'moment-timezone';
import locationTask from '../controllers/GetCurrentLocation';

const currentTimezone = moment.tz.guess();

export const { width } = Dimensions.get('window');
export const { height } = Dimensions.get('window');

export const utils = {
  // getVehicleTypeImage: (type) => {
  //   if (type == '1') return require('../assets/image/vehicle/auto_left.png')
  //   else if (type == '2') return require('../assets/image/vehicle/bike_left.png')
  //   else if (type == '3') return require('../assets/image/vehicle/hatchback.png')
  //   else if (type == '4') return require('../assets/image/vehicle/sedan.png')
  //   else if (type == '5' || type == 'car') return require('../assets/image/vehicle/suv_left.png')
  //   else if (type == '6') return require('../assets/image/vehicle/luxsedan_left.png')
  // },

  /**
   * Check if a trip has exceeded its estimated final arrival time with an offset.
   * Times can be ISO strings, numbers (ms/seconds), or Date.
   * Logic: if now > (finalArrivalTime + offsetMinutes) → true
   * Falls back to bookingTime when pickupArrivalTime is missing, but the check is based on finalArrivalTime.
   * @param {Date|string|number|null} bookingTime
   * @param {Date|string|number|null} pickupArrivalTime - stops[0]?.arrivalTime
   * @param {Date|string|number|null} finalArrivalTime - trip arrivalTime or estArrivalTime
   * @param {number} offsetMinutes - grace period in minutes (default 10)
   * @returns {boolean}
   */
  isTripOverEstimatedDuration(bookingTime, pickupArrivalTime, finalArrivalTime, offsetMinutes = 60) {
    /**
     * Normalize a value into a moment instance when possible.
     * Handles Date, moment, ISO strings, milliseconds and seconds.
     */
    const toMoment = (input) => {
      if (input === null || input === undefined || input === '') return null;

      if (moment.isMoment(input)) {
        return input.clone();
      }

      if (input instanceof Date) {
        return moment(input);
      }

      if (typeof input === 'number' && Number.isFinite(input)) {
        if (input >= 1e12) { // milliseconds since epoch
          return moment(input);
        }
        if (input >= 1e9) { // seconds since epoch
          return moment(input * 1000);
        }
        return null; // treat small numbers as durations elsewhere
      }

      if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed === '') return null;
        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) {
          if (asNumber >= 1e12) {
            return moment(asNumber);
          }
          if (asNumber >= 1e9) {
            return moment(asNumber * 1000);
          }
          // fall through to duration handling in caller
          return null;
        }
        const parsed = moment(trimmed);
        return parsed.isValid() ? parsed : null;
      }

      const parsed = moment(input);
      return parsed.isValid() ? parsed : null;
    };

    const pickup = toMoment(pickupArrivalTime) || toMoment(bookingTime);
    const baseTime = pickup || toMoment(bookingTime);

    let finalArr = toMoment(finalArrivalTime);

    if (!finalArr) {
      const durationMinutes = Number(finalArrivalTime);
      if (
        Number.isFinite(durationMinutes) &&
        durationMinutes >= 0 &&
        baseTime &&
        baseTime.isValid()
      ) {
        finalArr = baseTime.clone().add(durationMinutes, 'minutes');
      }
    }

    if (!finalArr || !finalArr.isValid()) return false;

    // Optional: ensure we only consider after pickup start
    if (pickup && pickup.isValid() && moment().isBefore(pickup)) return false;

    const offset = Number(offsetMinutes);
    const threshold = finalArr.clone().add(Number.isFinite(offset) ? offset : 0, 'minutes');

    return moment().isAfter(threshold);
  },

  capitalizeFirstLetter: (string) => {
    if(!string) return ""
    return string.charAt(0).toUpperCase() + string.slice(1);
  },

  /**
   * Returns true if the current time is beyond the feedback window
   * that starts at `droppedAt` and lasts `offset` minutes.
   * In other words: now > droppedAt + offsetMinutes → true.
   * Accepts Date | ISO/string | number (ms or seconds) | moment.
   * Invalid or missing inputs return false.
   * @param {Date|string|number|import('moment').Moment|null} droppedAt
   * @param {number} offset - minutes (default 20)
   * @returns {boolean}
   */
  isTripDroppedBeyondFeedbackWindow: (droppedAt, offset = 20) => {
    if (droppedAt === null || droppedAt === undefined || droppedAt === '') return false;

    const toMoment = (input) => {
      if (input === null || input === undefined || input === '') return null;
      if (moment.isMoment(input)) return input.clone();
      if (input instanceof Date) return moment(input);
      if (typeof input === 'number' && Number.isFinite(input)) {
        if (input >= 1e12) return moment(input);        // ms
        if (input >= 1e9) return moment(input * 1000);  // seconds
        return null;
      }
      if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed === '') return null;
        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) {
          if (asNumber >= 1e12) return moment(asNumber);
          if (asNumber >= 1e9) return moment(asNumber * 1000);
          return null;
        }
        const parsed = moment(trimmed);
        return parsed.isValid() ? parsed : null;
      }
      const parsed = moment(input);
      return parsed.isValid() ? parsed : null;
    };

    const dropped = toMoment(droppedAt);
    if (!dropped || !dropped.isValid()) return false;

    const minutes = Number(offset);
    const safeOffset = Number.isFinite(minutes) && minutes >= 0 ? minutes : 20;
    const threshold = dropped.clone().add(safeOffset, 'minutes');

    return moment().isAfter(threshold);
  },


  formatArrayAddress: (array) => {
    if (typeof array === 'string') {
      // Remove trailing comma and spaces if present
      return array.replace(/,\s*$/, '');
    }

    // Filter out empty strings and capitalize each item
    const filtered = array
      .filter(item => item && item.trim() !== "")
      .map(item => utils.capitalizeFirstLetter(item.trim()));
    return filtered.join(', ');
  },

  getFormatedHeader: (currentLocationName) => {
   
    const name =
      currentLocationName?.placeName ||
      null;
    

    

    if (name && currentLocationName.address) {
      const formattedAddress = `${utils.capitalizeFirstLetter(name)}, ${utils.formatArrayAddress(currentLocationName.address)}`;
      
      return formattedAddress;
    } else if (name) {
      return utils.capitalizeFirstLetter(name);
    } else if (currentLocationName?.address){
      return utils.formatArrayAddress(currentLocationName.address)
    }

    return currentLocationName;
  },
  getRideStatus: (status) => {
 
    if (status == 'COMPLETED') return 'ride_completed'
    if (status == 'PAYMENT_COMPLETED') return 'ride_completed'
    else if (status == 'DIVERGED') return 'ride_diverged'
    else if (status == 'CANCELLED') return 'ride_cancelled'
    else if (status == 'failed') return 'ride_cancelled'
    else if (status == 'PENDING') return 'ride_cancelled'
    else if (status == 'MATCHED') return 'ride_matched'
    else if (status == 'ACCEPTED') return 'ride_accepted'
    else if (status == 'PICKEDUP') return 'ride_picked_up'
    else ""
  },
  getShortRideStatus: (status) => {
    if (status == 'COMPLETED') return 'COMPLETED'
    if (status == 'PAYMENT_COMPLETED') return 'COMPLETED'
    else if (status == 'DIVERGED') return 'DIVERGED'
    else if (status == 'CANCELLED') return 'CANCELLED'
    else if (status == 'failed') return 'DRIVER NOT FOUND'
    else if (status == 'PENDING') return 'DRIVER NOT FOUND'
    else if (status == 'MATCHED') return 'MATCHED'
    else if (status == 'ACCEPTED') return 'ACCEPTED'
    else if (status == 'PICKEDUP') return 'PICKED UP'
  },
  metersToKilometers(meters) {
    return meters / 1000;
   },
  getVehicleTypeLabel(type) {
    if (type == '1') return 'Auto'
    else if (type == '2') return 'BiKe'
    else if (type == '3') return 'Hatchback'
    else if (type == '4') return 'Sedan'
    else if (type == '5' || type == 'car') return 'SUV'
    else if (type == '6') return 'Luxury Sedan'

  },  
  convertToRelativeTime: (date) => {
    return moment(date).fromNow();
  },
  getEasyDate(duration) {

    let [start, end] = [undefined, undefined]

    // "2022-11-06T10:15"

    if (duration == 'tomorrow') {

      let date_Obj = new Date()
      let yyyy = date_Obj.getFullYear();
      let mm = date_Obj.getMonth() + 1;
      let dd = date_Obj.getDate() + 1;

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;

      start = ([yyyy, mm, dd].join('-')) + 'T00:00'
      end = ([yyyy, mm, dd].join('-')) + 'T23:59'
    }
    else if (duration == 'today') {

      let date_Obj = new Date()
      let yyyy = date_Obj.getFullYear();
      let mm = date_Obj.getMonth() + 1;
      let dd = date_Obj.getDate();

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;

      start = ([yyyy, mm, dd].join('-')) + 'T00:00'
      end = ([yyyy, mm, dd].join('-')) + 'T23:59'
    }
    else if (duration == 'yesterday') {

      let date_Obj = new Date()
      let yyyy = date_Obj.getFullYear();
      let mm = date_Obj.getMonth() + 1;
      let dd = date_Obj.getDate() - 1;

      if (dd < 10) dd = '0' + dd;
      if (mm < 10) mm = '0' + mm;

      start = ([yyyy, mm, dd].join('-')) + 'T00:00'
      end = ([yyyy, mm, dd].join('-')) + 'T23:59'
    }
    else if (duration == 'week') {

      let date_Obj = new Date()
      let firstday = new Date(date_Obj.setDate(date_Obj.getDate() - date_Obj.getDay()))
      let lastday = new Date(date_Obj.setDate(date_Obj.getDate() - date_Obj.getDay() + 6))

      {
        let yyyy = firstday.getFullYear();
        let mm = firstday.getMonth() + 1;
        let dd = firstday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        start = ([yyyy, mm, dd].join('-')) + 'T00:00'

      }
      {
        let yyyy = lastday.getFullYear();
        let mm = lastday.getMonth() + 1;
        let dd = lastday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        end = ([yyyy, mm, dd].join('-')) + 'T23:59'

      }
    }
    else if (duration == 'month') {

      let date_Obj = new Date()
      let firstday = new Date(date_Obj.getFullYear(), date_Obj.getMonth(), 1)
      let lastday = new Date(date_Obj.getFullYear(), date_Obj.getMonth() + 1, 0)

      {
        let yyyy = firstday.getFullYear();
        let mm = firstday.getMonth() + 1;
        let dd = firstday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        start = ([yyyy, mm, dd].join('-')) + 'T00:00'

      }
      {
        let yyyy = lastday.getFullYear();
        let mm = lastday.getMonth() + 1;
        let dd = lastday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        end = ([yyyy, mm, dd].join('-')) + 'T23:59'

      }
    }
    else if (duration == 'year') {

      let date_Obj = new Date()
      let firstday = new Date(date_Obj.getFullYear(), 0, 1)
      let lastday = new Date(date_Obj.getFullYear(), 12, 0)

      {
        let yyyy = firstday.getFullYear();
        let mm = firstday.getMonth() + 1;
        let dd = firstday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        start = ([yyyy, mm, dd].join('-')) + 'T00:00'

      }
      {
        let yyyy = lastday.getFullYear();
        let mm = lastday.getMonth() + 1;
        let dd = lastday.getDate();

        if (dd < 10) dd = '0' + dd;
        if (mm < 10) mm = '0' + mm;

        end = ([yyyy, mm, dd].join('-')) + 'T23:59'

      }
    }

    return { start, end }
  },
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
  formateDate: (date, seperator = '-') => {

    let dateObj = new Date(date);

    let dd = dateObj.getDate();
    let mm = dateObj.getMonth() + 1;
    let yyyy = dateObj.getFullYear();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    return [dd, mm, yyyy].join(seperator);

  },
  getDateObj: (date) => {

   


    date = date || new Date();

    return new Date(date);
  },

  isEmptyObject(obj) {
  // First, ensure the input is a non-null object
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return false; // Not a plain object or is null/array
  }
  return Object.keys(obj).length === 0;
},
  formateDateLabel: (ms, format = 'local') => {
    // format: 'local' (default) or 'utc'
    let date;
    if (format === 'utc') {
      date = new Date(ms);
    } else {
      date = new Date(ms);
    }

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    let weekday, day, month, year, hours, minutes, ampm;

    if (format === 'utc') {
      weekday = weekdays[date.getUTCDay()];
      day = String(date.getUTCDate()).padStart(2, '0');
      month = months[date.getUTCMonth()];
      year = String(date.getUTCFullYear()).slice(-2);
      hours = date.getUTCHours();
      minutes = String(date.getUTCMinutes()).padStart(2, '0');
    } else {
      weekday = weekdays[date.getDay()];
      day = String(date.getDate()).padStart(2, '0');
      month = months[date.getMonth()];
      year = String(date.getFullYear()).slice(-2);
      hours = date.getHours();
      minutes = String(date.getMinutes()).padStart(2, '0');
    }

    ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;

    // Add ITC (Indian Time) label if format is 'itc'
    let label = `${weekday}, ${day} ${month} ${year} . ${hours}:${minutes} ${ampm}`;
    if (format === 'itc') {
      // Convert to IST (Indian Standard Time, UTC+5:30)
      const istDate = new Date(date.getTime() + (330 * 60000 - date.getTimezoneOffset() * 60000));
      const istWeekday = weekdays[istDate.getUTCDay()];
      const istDay = String(istDate.getUTCDate()).padStart(2, '0');
      const istMonth = months[istDate.getUTCMonth()];
      const istYear = String(istDate.getUTCFullYear()).slice(-2);
      let istHours = istDate.getUTCHours();
      const istMinutes = String(istDate.getUTCMinutes()).padStart(2, '0');
      const istAmpm = istHours >= 12 ? 'PM' : 'AM';
      istHours = istHours % 12 || 12;
      label = `${istWeekday}, ${istDay} ${istMonth} ${istYear} . ${istHours}:${istMinutes} ${istAmpm} ITC`;
    }

    return label;
  },
  getInvoiceFormat(invoiceFormat){
    const feeUIFormat = []
    

    if(invoiceFormat?.rideCost){
      let obj = {
        "key": "rideCost",
        "value": invoiceFormat?.rideCost
      }
      if(invoiceFormat?.tax && invoiceFormat?.tax?.length > 0){
        obj.tax = invoiceFormat?.tax
      }
      feeUIFormat.push(obj)
    }

    if(invoiceFormat?.fees && invoiceFormat?.fees?.length > 0){
      invoiceFormat?.fees.forEach(fee => {
        let obj = {
          "key": fee?.key,
          "value": fee?.value
        }
        feeUIFormat.push(obj)
      })
    }
    if(invoiceFormat?.feeswithTax && invoiceFormat?.feeswithTax?.length > 0){
      invoiceFormat?.feeswithTax.forEach(fee => {
        let obj = {
          "key": fee?.key,
          "value": fee?.value
        }
        if(fee?.tax && fee?.tax?.length > 0){
          obj.tax = fee?.tax
        }
        feeUIFormat.push(obj)
      })
    }

    return feeUIFormat
  },
  getFareBreakdown(fareDetails){
    
    if (!fareDetails?.breakdown) return [];
    
    const breakdown = fareDetails.breakdown;
    const fareBreakdown = [];
    
    // Add subtotal
    if (breakdown.subtotal) {
      fareBreakdown.push({
        name: 'Trip Bill',
        amount: breakdown.subtotal
      });
    }
    
    // Add fees
    if (breakdown.fees?.breakdown) {
      Object.entries(breakdown.fees.breakdown).forEach(([key, value]) => {
        fareBreakdown.push({
          name: key === 'platformFee' ? 'Platform Fee' : 
                key === 'gst' ? 'GST' : 
                key === 'convenienceFee' ? 'Convenience Fee' : key,
          amount: value
        });
      });
    }
    
    // Add taxes
    if (breakdown.taxes?.breakdown) {
      Object.entries(breakdown.taxes.breakdown).forEach(([key, value]) => {
        fareBreakdown.push({
          name: key,
          amount: value
        });
      });
    }
    
    // Add other adjustments
    if (breakdown.surgeAdjustment) {
      fareBreakdown.push({
        name: 'Surge Adjustment',
        amount: breakdown.surgeAdjustment
      });
    }
    
    if (breakdown.lowPerformancePenalty) {
      fareBreakdown.push({
        name: 'Performance Penalty',
        amount: breakdown.lowPerformancePenalty
      });
    }
    
    return fareBreakdown;
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

  currentDateAndTime() {
    return moment().format('LLLL'); // Wednesday, November 1, 2023 4:25 PM
  },

  currentMonthNameAndYear() {
    return moment().format('MMMM YYYY');
  },

  get90DaysAfterCurrentDate() {
    return moment().add(90, 'days').format('YYYY-MM-DD');
  },

  formatDate(dateString, format = 'DD MMM YYYY') {
    return moment(dateString).format(format || 'DD MMM YY');
  },

  formatDateAndTime(isoString) {
    isoString = isoString ? new Date(isoString) : new Date();
    return moment.tz(isoString, currentTimezone).format('LLL');
  },

  isToday(date) {
    return moment(date).isSame(new Date(), 'day');
  },

  createUUID() {
    const pattern = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    return pattern.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  timestampTo12HourFormat(timestamp) {
    const time = moment(timestamp);
    const hour = time.format('h');
    const minute = time.format('mm');
    const ampm = time.format('a').toUpperCase();
    
    return `${hour}.${minute} ${ampm}`;
  },

  toTitleCase: str => {
 
    return str?.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  },
  toTitleCaseName: str => {
    return str?.replace(/\w\S*/g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1);
    });
  },

  timestampTOISO(timestamp) {
    
    return moment(timestamp).format();
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
      const formattedDate = currentDate;
      daysList.push({
        index: i + 1,
        date: formattedDate,
        day: day,
        day_label: dayName,
        month: monthName,
        year: year,
      });
    }
    return daysList;
  },

  convertMinutesTo_HHMM(minutes) {
    const hours = Math.floor(minutes / 60);
    let minss = minutes % 60;
    minss = parseInt(minss);
    if (minss < 1) return `${hours} Hrs`;
    else if (hours < 1) return `${minss} Mins`;
    else return `${hours} Hrs ${minss} Mins`;
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

  formatAddressName: (address) => {
    if (address.locationFrom === "MAP") {
      return utils.getFormatedHeader(address);
    } else if (address.locationFrom === "SEARCH") {
      let str = `${address.name},${address.address}`;
      // Remove trailing comma if present
      str = str.replace(/,+\s*$/, '');
      return str.charAt(0).toUpperCase() + str.slice(1);
    } else {
      return utils.getFormatedHeader(address);
    }
  },

  formatISOToHumanReadable(isoString, format = 'DD MMM YYYY') {
    if (!isoString) return '';
    
    // Handle ISO date strings like "2025-12-31T00:00:00.000Z"
    const momentObj = moment(isoString);
    
    if (!momentObj.isValid()) {
      console.warn('Invalid ISO date string:', isoString);
      return '';
    }
    
    // Convert to local timezone and format
    return momentObj.tz(currentTimezone).format(format);
  },

  getTimeAfterMinutes(minutes) {
    if (!minutes || minutes < 0) {
      console.warn('Invalid minutes provided:', minutes);
      return '';
    }
    
    // Get current time and add the specified minutes
    const futureTime = moment().add(minutes, 'minutes');
    
    // Format as 12-hour time with AM/PM
    return futureTime.format('h:mm A');
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

  // Format various date inputs to: "DD MMM YY . hh:mm AM" in local timezone
  // Accepts Date | number (ms or seconds) | string (ISO)
  formatScheduleDateTimeLabel(input) {
    if (!input) return '';
    let m;
    if (input instanceof Date) {
      m = moment(input);
    } else if (typeof input === 'number') {
      let ms = input;
      // If it looks like seconds, convert to ms
      if (ms < 1e12) ms = ms * 1000;
      m = moment(ms);
    } else {
      m = moment(input);
    }
    if (!m.isValid()) return '';
    return m.tz(currentTimezone).format('DD MMM YY . hh:mm A');
  },

  formatMinutesToReadable(minutes) {
    if (!minutes || minutes < 0) {
      console.warn('Invalid minutes provided:', minutes);
      return '0 Min';
    }
    
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      
      if (remainingMinutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${remainingMinutes} Min`;
      }
    } else {
      if (minutes === 1) {
        return '1 Min';
      }
      return `${minutes} Mins`;
    }
  },
  // Expects location as [lon, lat]
  getBoundingBoxFromLocation(location, bufferMeters = 200) {
    if (
      !Array.isArray(location) ||
      location.length !== 2 ||
      !Number.isFinite(location[0]) ||
      !Number.isFinite(location[1])
    ) return null;
    return utils.getBoundingBox([location], bufferMeters);
  },
  getBoundsForPoint(lon, lat, bufferMeters = 200){
    if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
    return utils.getBoundingBox([[lon, lat]], bufferMeters)
  },
  getBoundingBox(coordinates, bufferMeters = 200){
    // Guard: coordinates must be an array with at least 1 valid [lon, lat] entry
    if (!Array.isArray(coordinates) || coordinates.length < 1) return null;
    const valid = coordinates.filter(coord => Array.isArray(coord) && Number.isFinite(coord[0]) && Number.isFinite(coord[1]));
    if (valid.length < 1) return null;

    // Single-point case: create a small padded bbox around the point
    if (valid.length === 1) {
      const [lon, lat] = valid[0];
      const metersPerDegLat = 111320; // approximate
      const metersPerDegLon = 111320 * Math.max(0.000001, Math.cos((lat * Math.PI) / 180)); // avoid division by zero near poles
      const dLat = bufferMeters / metersPerDegLat;
      const dLon = bufferMeters / metersPerDegLon;
      return [lon - dLon, lat - dLat, lon + dLon, lat + dLat]
    }

    const minLat = Math.min(...valid.map(coord => coord[1]));
    const maxLat = Math.max(...valid.map(coord => coord[1]));
    const minLon = Math.min(...valid.map(coord => coord[0]));
    const maxLon = Math.max(...valid.map(coord => coord[0]));
    if (!Number.isFinite(minLat) || !Number.isFinite(maxLat) || !Number.isFinite(minLon) || !Number.isFinite(maxLon)) return null;
    return [minLon, minLat, maxLon, maxLat]
  },

  /**
   * Get current user location
   * @returns {Promise<Array>} - Returns [longitude, latitude] or null if error
   */
  getCurrentUserLocation: async () => {
    try {
      const position = await locationTask.getCurrentLocation();
      if (position && position.coords) {
        return [position.coords.longitude, position.coords.latitude];
      }
      return null;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  },

  debounce: (fn, wait = 300) => {
    let t;
    return (...args) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  },

  /**
   * Calculate distance in meters between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in meters
   */
  calculateDistanceInMeters: (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  },
  
  /**
   * Clean text by trimming, collapsing extra spaces, preserving line breaks,
   * and removing spaces before common punctuation.
   * @param {string} text
   * @returns {string}
   */
  cleanText: (text) => {
    if (text === undefined || text === null) return '';
    let s = String(text);

    // Normalize newlines to \n
    s = s.replace(/\r\n?/g, '\n');
    // Collapse runs of horizontal whitespace to a single space
    s = s.replace(/[ \t]+/g, ' ');
    // Trim spaces around newlines
    s = s.replace(/ *\n */g, '\n');
    // Limit excessive blank lines to at most one empty line
    s = s.replace(/\n{3,}/g, '\n\n');
    // Remove spaces before punctuation like ", . ! ? ;"
    s = s.replace(/\s+([.,!?;])(?=\s|$)/g, '$1');

    return s.trim();
  },
};
