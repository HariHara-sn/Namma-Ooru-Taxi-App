import { create } from 'zustand';

const defaultStyles = {
  
  width: "100%",
  height: "100%",
 
};

const defaultMapButtonStyle = {
  right: 16,
  top: "12%",
};

const useMapStyleStore = create((set) => ({
  defaultStyle: defaultStyles,
  mapbuttonStyle: defaultMapButtonStyle,
  isMapButtonVisible: true,
  // Method to update the map style
  setMapStyle: (newStyle) => set({ defaultStyle: {...newStyle } }),

  // Method to reset to default
  resetMapStyle: () => set({ defaultStyle: defaultStyles }),
 

  setMapButtonStyle: (newStyle) => set({ mapbuttonStyle: {...newStyle } }),

  setIsMapButtonVisible: (value) => set({ isMapButtonVisible: value }),
  
}));

export default useMapStyleStore;
