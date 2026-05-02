import { create } from 'zustand';

export const useRideHistoryStore = create((set, get) => ({
    Rides: [],
    isLoading: false,
    error: null,

    setRides: (rides) => set({ Rides: rides }),
    setIsLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    setRide: (ride) => set((state) => ({ Rides: [ride, ...state.Rides] })),

    clearRides: () => set({ Rides: [] }),
    getRideById: (id) => {
        const rides = get().Rides;
        return rides.find((ride) => ride._id === id); 
  },
}));
