import { create } from 'zustand';

export const useMapMarkerStore = create(set => ({
  key: 1,
  boundKey: 1,

  userLocation: null,
  setUserLocation: loc => set({ userLocation: loc }),

  mapMarkers: [],
  setMapMarkers: markers => {
    set({ mapMarkers: markers });
  },

  onSearchResults: null,
  setOnSearchResults: onSearchResults => {
      set({ onSearchResults });
  },

  stateVector: null,
  setStateVector: (newState) => set({ stateVector: newState }),

  geometriesType: '',
  setGeometriesType: geometriesType => set({ geometriesType }),

  geoFenceMeters: 100,
  setGeoFenceMeters: geoFenceMeters => set({ geoFenceMeters }),

  geometries: [],
  setGeometries: geometries => set({ geometries }),

  mapReady: false,
  setMapReady: mapReady => set({ mapReady }),

  markerClickCallback: null,
  setMarkerClickCallback: callback => set({ markerClickCallback: callback }),

  mapClickCallback: null,
  setMapClickCallback: callback => set({ mapClickCallback: callback }),

  mapDblclickCallback: null,
  setMapDblclickCallback: callback => set({ mapDblclickCallback: callback }),

  resizeMapOnMarkerUpdate: true,
  setResizeMapOnMarkerUpdate: resizeMapOnMarkerUpdate => set({ resizeMapOnMarkerUpdate }),

  setMapBounds: (bounds) => set(state => {
    const newBoundKey = state.boundKey + 1;
    return { mapBounds: [...bounds, newBoundKey], boundKey: newBoundKey };
  }),
  mapBounds: null,

  removeMarker: (id) => {
    set(state => {
      const newMarkers = state.mapMarkers.filter(marker => marker.id !== id)
      return { mapMarkers: newMarkers }
    })
  },
  addMarker: (marker) => {
    set(state => {
      return { mapMarkers: [...state.mapMarkers, marker] }
    })
  },
  mapLocation: {
    lat: 13.067439,
    lng: 80.237617,
    zoom: 15
  },
  setMapLocation: mapLocation => {
    set(state => {
      const newKey = state.key + 1;
      return {
        mapLocation: { ...mapLocation, key: newKey },
        key: newKey
      };
    });
  },

  directionReadyCallback : null,
  setDirectionReadyCallback : (directionReadyCallback) => set({ directionReadyCallback }),

  directionPoints: null,
  directionKey: 0,
  // setDirectionPoints: (directionPoints) => set({ directionPoints }),
   setDirectionPoints: (directionPoints) => set(state => {
        if (directionPoints === null) {
            return { directionPoints: null };
        }
        const newDirectionKey = state.directionKey + 1;
        const payloadArray = Array.isArray(directionPoints)
            ? directionPoints
            : [directionPoints];
        return { directionPoints: [...payloadArray, newDirectionKey], directionKey: newDirectionKey };
    }),

  directionResponse: null,
  setDirectionResponse: (directionResponse) => set({ directionResponse }),

  startNavigation: false,
  setStartNavigation: (startNavigation) => set({ startNavigation }),

  disduration: null,
  setDisduration: (disduration) => set({ disduration }),

  onMapCenterChanged: null,
  setOnMapCenterChanged: callback => set({ onMapCenterChanged: callback }),

  onMapRotationChanged: null,
  setOnMapRotationChanged: callback => set({ onMapRotationChanged: callback }),

  mapMoving: true,
  setMapMoving: mapMoving => set({ mapMoving }),

  routeLoading: {"loading": true, "message": "initialState", "error": false},
  setRouteLoading: routeLoading => set({ routeLoading }),

  nativeError: null,
  setNativeError: nativeError => set({ nativeError }),

  navigationError: null,
  setNavigationError: navigationError => set({ navigationError }),

  routeNotFound: null,
  setRouteNotFound: routeNotFound => set({ routeNotFound }),

  reset: () => {
    set({
      mapMarkers: [],
      key: 1,
      mapLocation: { lat: 13.067439, lng: 80.237617, zoom: 15 },
      geometries: [],
      geometriesType: '',
      geoFenceMeters: 100,
      mapReady: false,
      markerClickCallback: null,
      mapClickCallback: null,
      mapDblclickCallback: null,
      resizeMapOnMarkerUpdate: true,
      mapBounds: null,
      routeLoading: false,
      nativeError: null,
      navigationError: null,
    });
  }
}));
