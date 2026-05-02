import {create} from 'zustand';

const useSelectedVehicleStore = create(set => ({
  selectedVehicle: null,
  setSelectedVehicle: selectedVehicle => set({selectedVehicle : selectedVehicle})
  
}));

export default useSelectedVehicleStore;
