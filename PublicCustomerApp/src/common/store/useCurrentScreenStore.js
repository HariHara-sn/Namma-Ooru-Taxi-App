import {create} from 'zustand';

const useCurrentScreenStore = create(set => ({
  currentScreen: 'Map',
  prevScreen: 'Map',
  showBottomTabs:true,
  setShowBottomTabs:bool => set({ showBottomTabs:bool}),
  setCurrentScreen: currentScreen => {
    set(state => ({ prevScreen: state.currentScreen, currentScreen }));
  },
  reset: () => {
    set({currentScreen: 'Map', prevScreen: 'Map'});
  }
}));

export default useCurrentScreenStore;
