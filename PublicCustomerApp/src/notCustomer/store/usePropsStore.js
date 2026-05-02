import { create } from 'zustand';

const usePropsStore = create((set) => ({
  pickedLocation: null,
  setPickedLocation: (value) => set({ pickedLocation: value }),
}));

export default usePropsStore;