import {create} from 'zustand';

export const useStackScreenStore = create((set, get) => ({
  stackScreen: [{ name: 'Home', params: null }],
  
  setStackScreen: (screenName, params = null) => {
    const currentStack = get().stackScreen;
    const currentScreenName = currentStack[currentStack.length - 1].name;
    
    // Only add to stack if the screen name is different from current screen
    if (currentScreenName !== screenName) {
      const newStack = [...currentStack, { name: screenName, params }];
      set({stackScreen: newStack});
    }
  },


  getCurrentScreenName: () => {
    const stack = get().stackScreen;
    return stack[stack.length - 1].name;
  },
  
  goBack: (params) => {

    // console.log('goBack..............................',params);
    const stack = get().stackScreen;
    if(stack.length > 1){
      const arr = stack.slice(0, -1);
      arr[arr.length-1] = {
        ...arr[arr.length-1],
        params: { ...(arr[arr.length-1].params || {}), fromBack: true },
      };

      
      set({stackScreen: arr});
    }
    else{
      set({stackScreen: [{ name: 'Home', params: null }]});
    }
  },
  goBackToScreen:(screenName, params = null)=>{
    const stack = get().stackScreen;
  
    
    // Find the index of the target screen in the stack
    const targetIndex = stack.findIndex(screen => screen.name === screenName);
    
    if(targetIndex !== -1){
      // Screen found in stack
      // Remove all screens after the target screen and update its params
      const newStack = stack.slice(0, targetIndex + 1);
      
      // Update the params of the target screen if params are provided
      if(params !== null){
        newStack[targetIndex] = { ...newStack[targetIndex], params };
      }
      
      console.log('newStack',JSON.stringify(newStack))
      
      set({stackScreen: newStack});
    }
    else{
      // Screen not found in stack, go back to home
      const currentStack = get().stackScreen;
     const currentScreenName = currentStack[currentStack.length - 1].name;
    
    // Only add to stack if the screen name is different from current screen
      if (currentScreenName !== screenName) {
        const newStack = [...currentStack, { name: screenName, params }];
        set({stackScreen: newStack});
      }
      
    }
  },
  
  reset: () => {
    set({stackScreen: [{ name: 'Home', params: null }]});
  },

  getCurrentScreen: () => {
    const stack = get().stackScreen;
    return stack[stack.length - 1];
  },

  showSocialMediaModal: false,
  setShowSocialMediaModal: (value) => { set({ showSocialMediaModal: value }); }

  
}));