// Location type definition
export interface Location {
  // Required properties
  address: string;
  name: string;
  latitude: number;
  longitude: number;
  
  // Optional properties
  type?: string;
  distance?: number;
  label?: string;
}

// Location type constants (moved from JSON to TypeScript)
export const LocationTypes = {
  START_LOCATION: "START_LOCATION",
  DESTINATION_LOCATION: "DESTINATION_LOCATION", 
  WAYPOINT_LOCATION: "WAYPOINT_LOCATION"
} as const;

export type LocationType = typeof LocationTypes[keyof typeof LocationTypes];

// Example usage type for the provided data
export type LocationWithDistance = Location & {
  distance: number;
};

// Type for location without distance (when distance is not available)
export type LocationWithoutDistance = Omit<Location, 'distance'>; 