import {create} from 'zustand';

const useVehicleLocationStore = create((set) => ({

  currentVehicleType: 'suv',
  setCurrentVehicleType: (vehicleType) => set({ currentVehicleType: vehicleType }),
  // Array to store vehicle locations grouped by type
  vehicleLocations: {
    suv: [
      {
        id: 'suv1',
        latitude: 13.0827,
        longitude: 80.2707,
        heading: 45,
        status: 'available'
      },
      {
        id: 'suv2', 
        latitude: 11.0528,
        longitude: 77.0482,
        heading: 180,
        status: 'available'
      },
      {
        id: 'suv3',
        latitude: 11.0508,
        longitude: 77.0462,
        heading: 180,
        status: 'available'
      },
      {
        id: 'suv4',
        latitude: 11.0538,
        longitude: 77.0492,
        heading: 270,
        status: 'available'
      },
      {
        id: 'suv5',
        latitude: 11.0498,
        longitude: 77.0452,
        heading: 0,
        status: 'available'
      },
      {
        id: 'suv6',
        latitude: 11.0548,
        longitude: 77.0502,
        heading: 135,
        status: 'available'
      },
      {
        id: 'suv7',
        latitude: 11.0488,
        longitude: 77.0442,
        heading: 225,
        status: 'available'
      }
    ],
    hatchback: [
      {
        id: 'hatch1',
        latitude: 11.0523,
        longitude: 77.0477,
        heading: 45,
        status: 'available'
      },
      {
        id: 'hatch2',
        latitude: 11.0533,
        longitude: 77.0487,
        heading: 90,
        status: 'available'
      },
      {
        id: 'hatch3',
        latitude: 11.0513,
        longitude: 77.0467,
        heading: 180,
        status: 'available'
      },
      {
        id: 'hatch4',
        latitude: 11.0543,
        longitude: 77.0497,
        heading: 270,
        status: 'available'
      },
      {
        id: 'hatch5',
        latitude: 11.0503,
        longitude: 77.0457,
        heading: 0,
        status: 'available'
      },
      {
        id: 'hatch6',
        latitude: 11.0553,
        longitude: 77.0507,
        heading: 135,
        status: 'available'
      },
      {
        id: 'hatch7',
        latitude: 11.0493,
        longitude: 77.0447,
        heading: 225,
        status: 'available'
      }
    ],
    sedan: [
      {
        id: 'sedan1',
        latitude: 11.0515,
        longitude: 77.0469,
        heading: 45,
        status: 'available'
      },
      {
        id: 'sedan2',
        latitude: 11.0525,
        longitude: 77.0479,
        heading: 90,
        status: 'available'
      },
      {
        id: 'sedan3',
        latitude: 11.0505,
        longitude: 77.0459,
        heading: 180,
        status: 'available'
      },
      {
        id: 'sedan4',
        latitude: 11.0535,
        longitude: 77.0489,
        heading: 270,
        status: 'available'
      },
      {
        id: 'sedan5',
        latitude: 11.0495,
        longitude: 77.0449,
        heading: 0,
        status: 'available'
      },
      {
        id: 'sedan6',
        latitude: 11.0545,
        longitude: 77.0499,
        heading: 135,
        status: 'available'
      },
      {
        id: 'sedan7',
        latitude: 11.0485,
        longitude: 77.0439,
        heading: 225,
        status: 'available'
      }
    ],
    auto: [
      {
        id: 'auto1',
        latitude: 11.0520,
        longitude: 77.0474,
        heading: 45,
        status: 'available'
      },
      {
        id: 'auto2',
        latitude: 11.0530,
        longitude: 77.0484,
        heading: 90,
        status: 'available'
      },
      {
        id: 'auto3',
        latitude: 11.0510,
        longitude: 77.0464,
        heading: 180,
        status: 'available'
      },
      {
        id: 'auto4',
        latitude: 11.0540,
        longitude: 77.0494,
        heading: 270,
        status: 'available'
      },
      {
        id: 'auto5',
        latitude: 11.0500,
        longitude: 77.0454,
        heading: 0,
        status: 'available'
      },
      {
        id: 'auto6',
        latitude: 11.0550,
        longitude: 77.0504,
        heading: 135,
        status: 'available'
      },
      {
        id: 'auto7',
        latitude: 11.0490,
        longitude: 77.0444,
        heading: 225,
        status: 'available'
      }
    ]
  },

  // Set vehicle locations for a specific type
  setVehicleLocations: (vehicleType, locations) => set((state) => ({
    vehicleLocations: {
      ...state.vehicleLocations,
      [vehicleType]: locations
    }
  })),

  // Add single vehicle location
  addVehicleLocation: (vehicleType, location) => set((state) => ({
    vehicleLocations: {
      ...state.vehicleLocations,
      [vehicleType]: [...state.vehicleLocations[vehicleType], location]
    }
  })),

  // Remove vehicle location
  removeVehicleLocation: (vehicleType, locationId) => set((state) => ({
    vehicleLocations: {
      ...state.vehicleLocations,
      [vehicleType]: state.vehicleLocations[vehicleType].filter(loc => loc.id !== locationId)
    }
  })),

  // Update vehicle location
  updateVehicleLocation: (vehicleType, locationId, updatedLocation) => set((state) => ({
    vehicleLocations: {
      ...state.vehicleLocations,
      [vehicleType]: state.vehicleLocations[vehicleType].map(loc => 
        loc.id === locationId ? {...loc, ...updatedLocation} : loc
      )
    }
  })),

  // Clear all vehicle locations
  clearVehicleLocations: () => set({
    vehicleLocations: {
      suv: [],
      hatchback: [],
      sedan: [],
      auto: []
    }
  })
}));

export default useVehicleLocationStore;
