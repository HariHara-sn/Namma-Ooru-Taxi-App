import { create } from 'zustand';

const useMapStore = create((set) => ({
    key: 1,

    mapShown: false,
    setMapShown: mapShown => set({ mapShown }),

    userLocation: null,
    setUserLocation: callback => set({ userLocation: callback }),

    mapMarkers: [],
    setMapMarkers: markers => set({ mapMarkers: markers }),

    searchUnit: "",
    setSearchUnit: searchUnit => set({ searchUnit }),

    searchPOI: null,
    setSearchPOI: searchPOI => set({ searchPOI }),

    onSearchResults: null,
    setOnSearchResults: onSearchResults => {
        set({ onSearchResults });
    },

    searchPOIError: null,
    setSearchPOIError: searchPOIError => {
        set({ searchPOIError });
    },

    searchPOIResults: null,
    setSearchPOIResults: searchPOIResults => set({ searchPOIResults }),

    startNavigation: false,
    setStartNavigation: (startNavigation) => set({ startNavigation }),
     
    disduration: null,
    setDisduration: (disduration) => set({ disduration }),

    devices: [],
    setDevices: devices => set({ devices: [...devices] }),

    geometriesType: '',
    setGeometriesType: geometriesType => set({ geometriesType }),
    
    directionReady: null,
    setDirectionReady: (callback) => set({ directionReady: callback }),

    directionPoints: null,
    directionKey: 0,
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

    geoFenceMeters: 100,
    setGeoFenceMeters: geoFenceMeters => set({ geoFenceMeters }),

    geometries: [],
    setGeometries: geometries => set({ geometries }),

    mapReady: false,
    setMapReady: mapReady => set({ mapReady }),

    routeLoading: false,
    setRouteLoading: routeLoading => set({ routeLoading }),

    mapBounds: [],
    boundKey: 0,
    setMapBounds: (bounds) => set(state => {
        const newBoundKey = state.boundKey + 1;
        return { mapBounds: [...bounds, newBoundKey], boundKey: newBoundKey };
      }),

    markerClickCallback: null,
    setMarkerClickCallback: callback => set({ markerClickCallback: callback }),

    mapClickCallback: null,
    setMapClickCallback: callback => set({ mapClickCallback: callback }),

    mapDblclickCallback: null,
    setMapDblclickCallback: callback => set({ mapDblclickCallback: callback }),

    onMapCenterChanged: null,
    setOnMapCenterChanged: callback => set({ onMapCenterChanged: callback }),

    onMapRotationChanged: null,
    setOnMapRotationChanged: callback => set({ onMapRotationChanged: callback }),

    mapMoving: true,
    setMapMoving: mapMoving => set({ mapMoving }),

    stateVector: null,
    setStateVector: (newState) => set({ stateVector: newState }),

    vehicleMarkers: [],
    setVehicleMarkers: (vehicleMarkers) => set({ vehicleMarkers }),

    mode: 'light',
    setMode: mode => {
        set({ mode })
        console.log('Mode set', mode)
    },

    loading: false,
    setLoading: loading => set({ loading }),

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

    reset: () => {
        set({
            mapMarkers: [],
            key: 1,
            mapLocation: { lat: 13.067439, lng: 80.237617, zoom: 15 }
        });
    },

    routeRetryCount : 0,
    setRouteRetryCount: (routeRetryCount) => set({ routeRetryCount }),

}));

export default useMapStore;
