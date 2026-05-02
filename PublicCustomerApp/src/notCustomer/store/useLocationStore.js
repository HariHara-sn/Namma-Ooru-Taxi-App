import {create} from 'zustand';

 const initialDirections = [
    {id: 1, name: 'Start', location: [], locationName: ''},
    {id: 2, name: 'End', location: [], locationName: ''},
  ]

const useLocationStore = create(set => ({
  location: null,
  setLocation: location => set({location}),

  directions: initialDirections,
  setDirections: setDirection => set({directions: setDirection}),

  currentLocationName: '',
  setCurrentLocationName: locationName=>set({currentLocationName: locationName}),

  selectedInput: null,
  setSelectedInput: selectedInput=>set({selectedInput}),
  
}));

export default useLocationStore;
