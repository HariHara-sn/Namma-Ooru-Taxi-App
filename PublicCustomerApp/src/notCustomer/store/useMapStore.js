import { create } from 'zustand';

const useMapStore = create((set) => ({
    key: 1,

    mapShown: false,
    setMapShown: mapShown => set({ mapShown }),

    userLocation: null,
    setUserLocation: loc => set({ userLocation: loc }),

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
    
    directionReadyCallback: null,
    setDirectionReadyCallback: (directionReadyCallback) => set({ directionReadyCallback }),

    directionPoints: null,
    setDirectionPoints: (directionPoints) => set({ directionPoints }),

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

    onMapCenterChanged: null,
    setOnMapCenterChanged: callback => set({ onMapCenterChanged: callback }),

    mapMoving: true,
    setMapMoving: mapMoving => set({ mapMoving }),

    stateVector: null,
    setStateVector: (newState) => set({ stateVector: newState }),

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
    }
}));

export default useMapStore;
