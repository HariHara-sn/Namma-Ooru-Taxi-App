import {create} from 'zustand';

export const useStackScreenStore = create((set, get) => ({
  stackScreen: ['Home'],
  setStackScreen: stackScreen => {
    const arr = [];
    arr.push(...get().stackScreen, stackScreen);
    set({stackScreen: arr});
  },
  goBack: () => {
    if(get().stackScreen.length > 1){
      const arr = get().stackScreen.slice(0, -1);
      set({stackScreen: arr});
    }
    else{
      set({stackScreen: ['Home']});
    }
  },

  showStats: false,
  setShowStats: showStats => {
    set({showStats});
  },
  reset: () => {
    set({stackScreen: ['Home']});
  }
}));