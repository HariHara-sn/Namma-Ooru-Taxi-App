export function getRemainingPercentage(startTime, endTime) {
  const currentTime = Date.now();
  const totalDuration = endTime - startTime;
  const remainingTime = endTime - currentTime;

  const percentageRemaining = (remainingTime / totalDuration) * 100;
  const reversedPercentage = 100 - percentageRemaining;

  return Math.max(0, Math.min(reversedPercentage, 100));
}

export function calculateElapsedPercentage(startTime, endTime) {

  if (!startTime || !endTime) {
    return 0;
  }
  
  const now = new Date();

  function convertTo24Hour(time) {
    const [timeString, period] = time.split(" ");
    let [hours, minutes] = timeString.split(":").map(Number);

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    return { hours, minutes };
  }

  const start = convertTo24Hour(startTime);
  const end = convertTo24Hour(endTime);

  const startDate = new Date();
  startDate.setHours(start.hours, start.minutes, 0, 0);

  const endDate = new Date();
  endDate.setHours(end.hours, end.minutes, 0, 0);

  // Handle cases where the current time is before the start time or after the end time
  if (now < startDate) {
    return 0; // Before start time
  }

  if (now > endDate) {
    return 100; // After end time
  }

  const totalDuration = endDate - startDate;
  const elapsedTime = now - startDate;

  const percentage = (elapsedTime / totalDuration) * 100;

  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0 and 100
}
