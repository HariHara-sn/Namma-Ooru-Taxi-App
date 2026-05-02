import { create } from 'zustand';


const useDriverLocationStore = create((set) => ({
  // Driver location state with coordinates, angle, and maxspeed
  driverLocation: null,
  driverAngle: 0,
  driverMaxSpeed: null,
  
  
  // Update driver location with new data
  setDriverLocation: (location) => set({ driverLocation: location }),
  setDriverAngle: (angle) => set({ driverAngle: angle }),
  setDriverMaxSpeed: (maxSpeed) => set({ driverMaxSpeed: maxSpeed }),
  

  // Reset driver location to default values
  resetDriverLocation: () => set({
    driverLocation: null,
    driverAngle: null,
    driverMaxSpeed: null
  }),
}));

export default useDriverLocationStore;
