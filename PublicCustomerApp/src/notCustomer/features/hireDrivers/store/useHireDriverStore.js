import { create } from 'zustand';

export const useHireDriverStore = create((set) => ({
  tripType: 'hireDriver',
  source: '',
  destination: '',
  scheduleType: 'now', // 'now', 'later'
  scheduleDateTime: null,
  selectedCar: null,
  
  setTripType: (type) => set({ tripType: type }),
  setSource: (src) => set({ source: src }),
  setDestination: (dest) => set({ destination: dest }),
  setScheduleType: (type) => set({ scheduleType: type }),
  setScheduleDateTime: (date) => set({ scheduleDateTime: date }),
  setSelectedCar: (car) => set({ selectedCar: car }),
  
  resetForm: () => set({
    source: '',
    destination: '',
    scheduleType: 'now',
    scheduleDateTime: null,
    selectedCar: null,
  })
}));
