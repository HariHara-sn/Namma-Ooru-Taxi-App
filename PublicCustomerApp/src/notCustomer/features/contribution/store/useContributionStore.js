import { create } from 'zustand';

// Simple category list; could be replaced by API later
const DEFAULT_CATEGORIES = [
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'cafe', label: 'Cafe' },
  { id: 'shop', label: 'Shop' },
  { id: 'landmark', label: 'Landmark' },
  { id: 'hospital', label: 'Hospital' },
  { id: 'school', label: 'School' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'park', label: 'Park' },
  { id: 'atm', label: 'ATM' },
  { id: 'pharmacy', label: 'Pharmacy' },
  { id: 'other', label: 'Other' },
];

const useContributionStore = create((set, get) => ({
  lat: null,
  lon: null,
  placeName: '',
  address: '',
  category: DEFAULT_CATEGORIES[0].id,
  customCategory: '',
  categories: DEFAULT_CATEGORIES,
  submitting: false,

  setLocation: ({ lat, lon }) => set({ lat, lon }),
  setPlaceName: (placeName) => set({ placeName }),
  setAddress: (address) => set({ address }),
  setCategory: (category) => set({ category, customCategory: category === 'other' ? '' : '' }),
  setCustomCategory: (customCategory) => set({ customCategory }),

  reset: () => set({ lat: null, lon: null, placeName: '', address: '', category: DEFAULT_CATEGORIES[0].id, customCategory: '' }),

  submitContribution: async () => {
    const { lat, lon, placeName, address, category, customCategory } = get();
    if (lat == null || lon == null || !placeName || !address || !category) {
      return { success: false, message: 'Please fill all fields' };
    }
    if (category === 'other' && !customCategory.trim()) {
      return { success: false, message: 'Please enter custom category' };
    }
    set({ submitting: true });
    try {
      const payload = {
        location: { lat, lon },
        placeName,
        address,
        category: category === 'other' ? customCategory.trim() : category,
      };
      // TODO: Replace with real API call
      console.log('Contribution payload', payload);
      // Simulate async
      await new Promise(r => setTimeout(r, 800));
      set({ submitting: false });
      return { success: true, payload };
    } catch (e) {
      set({ submitting: false });
      return { success: false, message: 'Failed to submit' };
    }
  }
}));

export default useContributionStore;
