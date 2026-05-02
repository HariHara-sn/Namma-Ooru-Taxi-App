export const utils = {
  getStartEndOfDayInMilliseconds: date => {
    const startOfDay = new Date(date);
    const endOfDay = new Date(date);

    startOfDay.setHours(0, 0, 0, 0);
    endOfDay.setHours(23, 59, 59, 999);

    const startDayMilliseconds = startOfDay.getTime();
    const endDayMilliseconds = endOfDay.getTime();
    return { startDayMilliseconds, endDayMilliseconds };
  },
  formatToLocalString: date => {
    const dateString = new Date(date).toLocaleDateString();
    return dateString;
  },
  getUniqueString: () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  },
  getDurationFromMilliseconds: (milliseconds) => {
    if (milliseconds < 0) return null;
    const seconds = Math.floor((milliseconds / 1000) % 60);
    const minutes = Math.floor((milliseconds / (1000 * 60)) % 60);
    const hours = Math.floor((milliseconds / (1000 * 60 * 60)) % 24);
    const days = Math.floor(milliseconds / (1000 * 60 * 60 * 24));

    if (days === 0) return `${hours} Hrs ${minutes} Mins `
    if (hours === 0) return `${minutes} Mins`
    if (minutes < 1) return null
    return `${days} Days ${hours} Hrs ${minutes} Mins`;
  },
  getTokenExpiry: (token) => {
    const parts = token.split('.')
    const decoded = JSON.parse(atob(parts[1]))
    const expiryTime = decoded.exp * 1000
    return expiryTime
  },
  getRandomColor: () => {
    // Generate random values for red, green, and blue components
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);

    // Convert the decimal values to hexadecimal and format them
    const hexR = r.toString(16).padStart(2, '0');
    const hexG = g.toString(16).padStart(2, '0');
    const hexB = b.toString(16).padStart(2, '0');

    // Concatenate the hexadecimal values to form a color code
    return `#${hexR}${hexG}${hexB}`;

  },
  getCurrentDateDDMMYYYY: () => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0'); // Get the day and pad with leading zero if needed
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Get the month (add 1 since it's zero-based) and pad with leading zero if needed
    const year = now.getFullYear(); // Get the full year
    const hours = String(now.getHours()).padStart(2, '0'); // Get the hours and pad with leading zero if needed
    const minutes = String(now.getMinutes()).padStart(2, '0'); // Get the minutes and pad with leading zero if needed
    const seconds = String(now.getSeconds()).padStart(2, '0'); // Get the seconds and pad with leading zero if needed

    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
  },
  getDateAndTimeFromMilliseconds: (milliseconds) => {
    const date = new Date(milliseconds);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2); // Use last two digits of the year
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strHours = String(hours).padStart(2, '0');

    return `${day}-${month}-${year} ${strHours}:${minutes} ${ampm}`;
  },
  capitalize:(string) =>{
    return string.charAt(0).toUpperCase() + string.slice(1);
  },
  limitedString:(string,length)=>{
    if (string.length > length) {
      return string.slice(0, length) + '...';
    } else {
      return string;
    }
  },
  metersPerSecondToKnots: (metersPerSecond) =>{
    const conversionFactor = 1.94384;
    return metersPerSecond * conversionFactor;
  },
  removeCommasAndCurrencySymbol:(amount)=>{
    return String(amount).slice(1).replace(/,/g, '').split('.')[0];
  },
  
  metersToKilometers(meters) {
    return meters / 1000;
   },

   getWindDirection:(deg)=>{
    if (deg >= 337.5 || deg < 22.5) return "North";
    if (deg >= 22.5 && deg < 67.5) return "North-East";
    if (deg >= 67.5 && deg < 112.5) return "East";
    if (deg >= 112.5 && deg < 157.5) return "South-East";
    if (deg >= 157.5 && deg < 202.5) return "South";
    if (deg >= 202.5 && deg < 247.5) return "South-West";
    if (deg >= 247.5 && deg < 292.5) return "West";
    if (deg >= 292.5 && deg < 337.5) return "North-West";
   }
};
