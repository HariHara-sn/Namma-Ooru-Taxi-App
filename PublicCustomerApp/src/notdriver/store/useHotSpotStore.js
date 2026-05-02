import {create} from 'zustand';

const useHotSpotStore = create(set => ({
  hotSportMarkers: [],
  setHotSpotMarkers: hotSportMarkers => {
    set({hotSportMarkers});
  },
}));

export default useHotSpotStore;
