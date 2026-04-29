class DriverDueDate {
    static calculateNextDueDate(driverDueDate) {
        const now = new Date();
  
        switch (driverDueDate.type) {
        case "day": {
            // { type: "day", value: "4" } → always +N days
            const days = Number(driverDueDate.value);
            if (Number.isNaN(days)) return null;
            const result = new Date(now);
            result.setDate(now.getDate() + days);
            return result.getTime();
        }
  
        case "weekly": {
            // { type: "weekly", value: "wednesday" } → always NEXT week's target day
            const weekdays = {
                sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
                thursday: 4, friday: 5, saturday: 6,
            };
            const target = weekdays[String(driverDueDate.value).toLowerCase()];
            if (target === null) return null;
  
            const current = now.getDay();
            let diff = target - current;
  
            // ensure it's always in *next week*
            if (diff <= 0) diff += 7;
            else diff += 7; // even if future in this week, push it out
  
            const result = new Date(now);
            result.setDate(now.getDate() + diff);
            return result.getTime();
        }
  
        case "monthly": {
            // { type: "monthly", value: "20" } → always next month
            const day = Number(driverDueDate.value);
            if (!Number.isInteger(day) || day <= 0) return null;
  
            const result = new Date(now);
            result.setDate(1); // safe base
            result.setMonth(result.getMonth() + 1); // always next month
            const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
            result.setDate(Math.min(day, lastDay));
            return result.getTime();
        }
  
        default:
            return null;
        }
    }
}
  
module.exports = DriverDueDate;
  