import { create } from 'zustand';

const useActingDriverMediaStore = create(set => ({
  // pre-trip
  preTripPhotos: { front: null, rear: null, leftSide: null, rightSide: null },
  setPreTripPhotos: photos => set({ preTripPhotos: photos }),
  preTripDone: false,
  setPreTripDone: done => set({ preTripDone: done }),
  pendingNavOpen: false,
  setPendingNavOpen: v => set({ pendingNavOpen: v }),

  // post-trip
  postTripPhotos: { front: null, rear: null, leftSide: null, rightSide: null },
  setPostTripPhotos: photos => set({ postTripPhotos: photos }),
  bills: [],
  setBills: bills => set({ bills }),
  postTripDone: false,
  setPostTripDone: done => set({ postTripDone: done }),

  // reset everything when trip ends
  reset: () => set({
    preTripPhotos: { front: null, rear: null, leftSide: null, rightSide: null },
    preTripDone: false,
    pendingNavOpen: false,
    postTripPhotos: { front: null, rear: null, leftSide: null, rightSide: null },
    bills: [],
    postTripDone: false,
  }),
}));

export default useActingDriverMediaStore;
