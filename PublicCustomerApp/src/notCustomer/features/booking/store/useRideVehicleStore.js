import { create } from 'zustand';


const useRideVehicleStore = create((set,get) => ({
  // State
  availableVehicles: null,
  selectedVehicle: null,

  // Actions
  setAvailableVehicles: (vehicles) => {
    set({ availableVehicles: vehicles });
  },

  setSelectedVehicle: (vehicle) => {
    set({ selectedVehicle: vehicle });
  },

  clearSelectedVehicle: () => {
    set({ selectedVehicle: null });
  },

  clearAvailableVehicles: () => {
    set({ availableVehicles: [] });
  },

  resetVehicleStore: () => {
    set({ 
      availableVehicles: [], 
      selectedVehicle: null 
    });
  },
}));

export default useRideVehicleStore;
