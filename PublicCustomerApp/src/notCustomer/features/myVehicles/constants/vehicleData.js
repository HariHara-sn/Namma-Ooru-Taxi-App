export const VEHICLE_TYPE_OPTIONS = [
  { "label": "Hatchback", "value": "hatchback" },
  { "label": "Sedan", "value": "sedan" },
  { "label": "SUV", "value": "suv" },
  { "label": "Executive Sedan", "value": "exsedan" },
  { "label": "MUV", "value": "muv" },
  { "label": "Luxury", "value": "luxury" },
];

export const VEHICLE_TYPE_ICON = {
  hatchback: "car-sport-outline",
  sedan: "car-outline",
  suv: "car",
  exsedan: "car-sport",
  muv: "bus-outline",
  luxury: "diamond-outline",
};

export const FUEL_TYPE_OPTIONS = [
  { "label": "Petrol", "value": "petrol" },
  { "label": "Diesel", "value": "diesel" },
  { "label": "CNG", "value": "cng" },
  { "label": "Electric", "value": "electric" },
  { "label": "Hybrid", "value": "hybrid" },
  { "label": "LPG", "value": "lpg" },
];

export const TRANSMISSION_OPTIONS = [
  { "label": "Manual", "value": "manual" },
  { "label": "Automatic", "value": "automatic" },
  { "label": "AMT", "value": "amt" },
  { "label": "CVT", "value": "cvt" },
  { "label": "DCT", "value": "dct" },
];

export const MAKES_IN_INDIA = [
  "Maruti Suzuki", "Hyundai", "Tata", "Mahindra", "Honda", "Toyota",
  "Kia", "MG", "Renault", "Nissan", "Volkswagen", "Skoda", "Jeep",
  "Citroën", "BMW", "Mercedes-Benz", "Audi", "Volvo", "Land Rover",
  "Lexus", "Porsche", "Mini", "Isuzu", "Force", "Others",
];

export const MODELS_BY_MAKE = {
  "Maruti Suzuki": ["Alto", "S-Presso", "Celerio", "WagonR", "Swift", "Baleno", "Dzire", "Ignis", "Ciaz", "Ertiga", "XL6", "Brezza", "Grand Vitara", "Fronx", "Jimny", "Invicto", "Others"],
  "Hyundai": ["Santro", "Grand i10 Nios", "i20", "Aura", "Verna", "Creta", "Venue", "Alcazar", "Tucson", "Ioniq 5", "Exter", "Others"],
  "Tata": ["Tiago", "Tigor", "Altroz", "Punch", "Nexon", "Harrier", "Safari", "Nexon EV", "Tiago EV", "Tigor EV", "Curvv", "Others"],
  "Mahindra": ["Bolero", "Bolero Neo", "Scorpio", "Scorpio N", "XUV300", "XUV400", "XUV700", "Thar", "Thar Roxx", "Marazzo", "BE 6", "XEV 9e", "Others"],
  "Honda": ["Amaze", "City", "City Hybrid", "Elevate", "WR-V", "Jazz", "Others"],
  "Toyota": ["Glanza", "Urban Cruiser Hyryder", "Rumion", "Innova Crysta", "Innova HyCross", "Fortuner", "Camry", "Vellfire", "Hilux", "Others"],
  "Kia": ["Seltos", "Sonet", "Carens", "EV6", "EV9", "Others"],
  "MG": ["Hector", "Hector Plus", "Astor", "Gloster", "ZS EV", "Comet EV", "Windsor EV", "Others"],
  "Renault": ["Kwid", "Triber", "Kiger", "Duster", "Others"],
  "Nissan": ["Magnite", "Others"],
  "Volkswagen": ["Polo", "Vento", "Virtus", "Taigun", "Tiguan", "Others"],
  "Skoda": ["Rapid", "Octavia", "Superb", "Kushaq", "Slavia", "Kodiaq", "Others"],
  "Jeep": ["Compass", "Meridian", "Wrangler", "Grand Cherokee", "Others"],
  "Citroën": ["C3", "C3 Aircross", "eC3", "Basalt", "Others"],
  "BMW": ["1 Series", "2 Series", "3 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "i4", "iX", "Others"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "S-Class", "GLA", "GLB", "GLC", "GLE", "GLS", "EQB", "Others"],
  "Audi": ["A3", "A4", "A6", "Q2", "Q3", "Q5", "Q7", "Q8", "e-tron", "Others"],
  "Volvo": ["S60", "S90", "XC40", "XC60", "XC90", "C40", "Others"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover", "Range Rover Sport", "Range Rover Evoque", "Others"],
  "Lexus": ["ES", "NX", "RX", "LX", "UX", "Others"],
  "Porsche": ["Cayenne", "Macan", "Panamera", "Taycan", "911", "Others"],
  "Mini": ["Cooper", "Countryman", "Clubman", "Others"],
  "Isuzu": ["D-Max", "MU-X", "Others"],
  "Force": ["Gurkha", "Trax", "Others"],
  "Others": ["Others"],
};

export const YEAR_OPTIONS = Array.from({ length: 50 }, (_, i) => String(new Date().getFullYear() - i));

export const ADVANCED_FEATURES = [
  { "label": "Advanced Driver Assistance Systems (ADAS)", "value": "adas" },
  { "label": "Adaptive Cruise Control (ACC)", "value": "acc" },
  { "label": "Automatic Emergency Braking (AEB)", "value": "aeb" },
  { "label": "Anti-lock Braking System (ABS)", "value": "abs" },
  { "label": "Electronic Stability Control (ESC)", "value": "esc" },
  { "label": "Traction Control System (TCS)", "value": "tcs" },
  { "label": "Hill Start Assist", "value": "hill_start_assist" },
  { "label": "Hill Descent Control", "value": "hill_descent_control" },
  { "label": "Lane Keep Assist", "value": "lane_keep_assist" },
  { "label": "Lane Departure Warning", "value": "lane_departure_warning" },
  { "label": "Blind Spot Monitor", "value": "blind_spot_monitor" },
  { "label": "Drive Modes (Eco/Sport)", "value": "drive_modes" },
];
