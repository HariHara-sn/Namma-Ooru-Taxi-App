/* eslint-disable react/react-in-jsx-scope */
/* eslint-disable camelcase */

import Male from '../../common/assets/icons/male.svg'
import Female from '../../common/assets/icons/female.svg'
import Auto from '../../common/assets/icons/auto.svg'
import HatchBack from '../../common/assets/icons/hatchback.svg'
import Sedan from '../../common/assets/icons/sedan.svg'
import SUV from '../../common/assets/icons/suv.svg'
import MotorBike from '../../common/assets/icons/motorbike.svg'
import OnWayTrip from '../../notCustomer/assets/image/svgIcons/onWayTrip.svg';
import RoundTrip from '../../notCustomer/assets/image/svgIcons/roundTrip.svg';
import StopsTrip from '../../notCustomer/assets/image/svgIcons/stopsTrip.svg';

import ThingsA from '../../notdriver/assets/icons/thingsA.svg';
import ThingsB from '../../notdriver/assets/icons/thingsB.svg';
import ThingsC from '../../notdriver/assets/icons/thingsC.svg';
import ThingsD from '../../notdriver/assets/icons/thingsD.svg';

export const filters = [
  {
    id: 1,
    category: 'engine',
    filters: [
      {
        id: 0,
        name: 'All',
        title: "all"
      },
      {
        id: 1,
        name: 'On',
        title: "on"
      },
      {
        id: 2,
        name: 'Off',
        title: "off"
      },
      {
        id: 3,
        name: 'Idle',
        title: "idle"
      },
    ],
  },
  {
    id: 3,
    category: 'status',
    filters: [
      {
        id: 0,
        name: 'All',
        title: "all"
      },
      {
        id: 1,
        name: 'online',
        title: "online"
      },
      {
        id: 2,
        name: 'offline',
        title: "offline"
      },
    ],
  },
];

export const tabBtns = [
  {
    id: 1,
    name: 'Device Information',
    title: "device_information"
  },
  {
    id: 2,
    name: 'Attributes',
    title: "attributes"
  },
  {
    id: 3,
    name: 'Additional Details',
    title: "addi_details"
  },
  {
    id: 4,
    name: 'Upload Image',
    title: "upload_img"
  },
  {
    id: 5,
    name: 'Submit',
    title: "submit"
  },
];

 export const tripType = [
  {
    id: 1,
    name: 'One Way',
    icon: <OnWayTrip />,
    value:'one_way'
  },
  {
    id: 2,
    name: 'Round Trip',
    icon: <RoundTrip />,
    value:'round_trip',
  },
  {
    id: 3,
    name: 'Add Five Stops',
    icon: <StopsTrip />,
    value:'round_trip',
  },
];

export const rideType = [
  {
    id: 1,
    translationKey: 'pickup_now',
    name: 'Pickup Now',
    value:'instant',
    disabled: false
  },
  {
    id: 2,
    translationKey: 'schedule',
    name: 'Schedule',
    value:'schedule',
    disabled: false,
    comingSoon: false
  }
];


export const device_type = [
  {
    id: 1,
    name: 'Vehicle',
    title: "vehicle"
  },
  // {
  //   id: 2,
  //   name: 'asset',
  // },
];

export const documentsList = [
  {
    id: "aadhar",
    name: "aadhar_card",
  },
  {
    id: "panCard",
    name: "pan_card",
  }
]


export const relay_type = [
  {
    id:1,
    name:"No",
    title:'no'
  },
  {
    id:2,
    name:"Yes",
    title:'yes'
  }
]

export const vehicle_type = [
  {
    id: 1,
    name: 'Car',
    title: 'car'
  },
  {
    id: 2,
    name: 'Bike',
    title: 'bike'
  },
  {
    id: 3,
    name: 'Truck',
    title: 'truck'
  },
  {
    id: 4,
    name: 'Bus',
    title: 'bus'
  },
  {
    id: 5,
    name: 'Auto',
    title: 'auto'
  },
  {
    id: 6,
    name: 'Other',
    title: 'other'
  },
];


export const fuel_type = [
  {
    id: 1,
    name: 'Petrol',
    title: 'petrol'
  },
  {
    id: 2,
    name: 'Diesel',
    title: 'diesel'
  },
  {
    id: 3,
    name: 'CNG',
    title: 'cng'
  },
  {
    id: 4,
    name: 'Petrol + CNG',
    title: 'petrol_cng'
  },
  {
    id: 5,
    name: 'Electric',
    title: 'electric'
  },
  {
    id: 6,
    name: 'Hybrid',
    title: 'hybrid'
  },
];


export const kilometerReportType = [
  {
    id: 1,
    name: 'All Devices',
    title: "all_devices"
  },
  {
    id: 2,
    name: 'Individual Devices',
    title: "individual_devices"
  },
];

const getYearsArray = () => {
  const currentYear = new Date().getFullYear();
  const yearsArray = [];
  let id = 1;
  for (let year = currentYear; year >= 1980; year--) {
    yearsArray.push({ id: id++, title: year.toString(), name: year.toString()});
  }   
  return yearsArray;
};

export const genderData = [
  {
    id:1,
    name:'male',
    // icon:< Male />,
    value:'male'
  },{
    id:2,
    name:'female',
    // icon:< Female />,
    value:'female'
  },{
    id:3,
    name:'prefer_not_to_say',
    // icon:< Male />,
    value:'prefer_not_to_say'
  }

]

export const vehicleList = [
  {
    id:1,
    title:'Auto Rickshaw',
    name:'AUTO',
    image: <Auto />
  },
  {
    id:2,
    title:'HatchBack',
    name:'HATCHBACK',
    image: <HatchBack />
  },
  {
    id:3,
    title:'Sedan',
    name:'SEDAN',
    image: <Sedan />
  },
  {
    id:4,
    title:'SUV',
    name:'SUV',
    image: <SUV />
  },
  {
    id:5,
    title:'Motor Bike',
    name:'BIKE',
    image: <MotorBike />  
  },
  {
    id:6,
    title:'Electric',
    name:'ELECTRIC_SEDAN',
    image: <Sedan />
  }, 
  {
    id:7,
    title:'Electric Hatchback',
    name:'ELECTRIC_HATCHBACK',
    image: <HatchBack />
  },
  {
    id:8,
    title:'Electric SUV',
    name:'ELECTRIC_SUV',
    image: <SUV />
  },
  {
    id:9,
    title:'Electric Auto',
    name:'ELECTRIC_AUTO',
    image: <Auto />
  },
]

const generateMileageArray = () => {
  const arrayOfObjects = [];
  let id = 0;
  for (let i = 0; i <= 100; i += 10) {
    const name = `${i}-${i + 10}`;
    arrayOfObjects.push({ id: id++, name });
  }
  return arrayOfObjects;
};

export const years = getYearsArray();

export const mileageData = generateMileageArray();

export const dateFilterOptions = [
  {
    id: 1,
    name: "Today",
    title: "today"
  },
  {
    id: 2,
    name: "Yesterday",
    title: "yesterday"
  },
  {
    id: 3,
    name: "This week",
    title: "this_week"
  },
  {
    id: 4,
    name: "Last week",
    title: "last_week"
  },
  {
    id: 5,
    name: "This Month",
    title: "this_month"
  }
];


export const permissionData = {
  backgroundLocation: "NOT requires background location permission to continuously track your location, even when the app is closed or not in use. This ensures uninterrupted tracking for accurate traking records.",
  overlay: "Display Over Other Apps this permission is required to display the overlay over other apps. This ensures drivers can promptly respond to new ride requests. The overlay is not used for advertising or unrelated content.\n go to Settings > Apps > Special app access (or Advanced > Special app access) \n > Appear on top > NOT > toggle on"
}

export const multiLanguages = [
  {
    title: "English",
    code: "en",
    flag: "🇺🇸"
  },
  {
    title: "Tamil",
    code: "ta",
    flag: "🇮🇳"
  },
  {
    title: "Malayalam",
    code: "ml",
    flag: "🇮🇳"
  },
  {
      title: "Punjabi",
      code: "pa",
      flag: "🇮🇳"
  },
  {
    title: "Telugu",
    code: "te",
    flag: "🇮🇳"
  },
  {
    title: "Bengali",
    code: "bn",
    flag: "🇮🇳"
  },
  {
    title: "Kannada",
    code: "kn",
    flag: "🇮🇳"
  },
  {
    title: "Hindi",
    code: "hi",
    flag: "🇮🇳"
  },
  {
    title: "French",
    code: "fr",
    flag: "🇫🇷"
  },
  {
    title:"Portuguese",
    code: "pt",
    flag: "🇵🇹"
  },
  {
    title:"Italian",
    code: "it",
    flag: "🇮🇹"
  },
  {
    title:"German",
    code: "de",
    flag: "🇩🇪"
  },
  {
    title:"Swedish",
    code: "sv",
    flag: "🇸🇪"
  },
  {
    title:"Korean",
    code: "ko",
    flag: "🇰🇷"
  },
  {
    title:"Russian",
    code: "ru",
    flag: "🇷🇺"
  },
  {
    title:"Japanese",
    code: "ja",
    flag: "🇯🇵"
  },
  {
    title:"Chinese",
    code: "zh",
    flag: "🇨🇳"  
  },
  {
    title:"Arabic",
    code: "ar",
    flag: "🇸🇦"
  },
  {
    title:"Spanish",
    code: "es",
    flag: "🇪🇸"
  },
  {
    title:"Vietnamese",
    code: "vi",
    flag: "🇻🇳"
  },
  {
    title:"Brazil",
    code: "pt-BR",
    flag: "🇧🇷"
  },
  {
    title:"Indonesian",
    code: "id",
    flag: "🇮🇩"
  },
  {
    title:"phillipines",
    code: "fil",
    flag: "🇵🇭"
  },
];

export const indianSUVBrands = [
  { name: 'Maruti Suzuki', models: ['Brezza', 'Ertiga', 'XL6', 'Grand Vitara'] },
  { name: 'Hyundai', models: ['Venue', 'Creta', 'Alcazar', 'Tucson'] },
  { name: 'Tata Motors', models: ['Nexon', 'Harrier', 'Safari', 'Punch'] },
  { name: 'Mahindra', models: ['Scorpio', 'XUV700', 'XUV300', 'Thar', 'Bolero', 'XUV500', 'TUV300'] },
  { name: 'Honda', models: ['WR-V', 'CR-V', 'Elevate'] },
  { name: 'Toyota', models: ['Fortuner', 'Urban Cruiser', 'Hyryder'] },
  { name: 'Kia', models: ['Seltos', 'Sonet', 'Carens'] },
  { name: 'MG', models: ['Hector', 'Astor', 'Gloster', 'ZS EV'] },
  { name: 'Renault', models: ['Kiger', 'Duster', 'Captur'] },
  { name: 'Nissan', models: ['Magnite', 'Kicks', 'Terrano'] },
  { name: 'Skoda', models: ['Kushaq', 'Kodiaq'] },
  { name: 'Volkswagen', models: ['Taigun', 'Tiguan'] },
  { name: 'Ford', models: ['EcoSport', 'Endeavour'] },
  { name: 'Jeep', models: ['Compass', 'Wrangler', 'Meridian', 'Grand Cherokee'] }
];

export const indianSedanBrands = [
  { name: 'Maruti Suzuki', models: ['Dzire', 'Ciaz'] },
  { name: 'Hyundai', models: ['Verna', 'Aura', 'Elantra'] },
  { name: 'Tata Motors', models: ['Tigor'] },
  { name: 'Honda', models: ['City', 'Amaze', 'Civic'] },
  { name: 'Toyota', models: ['Camry', 'Yaris', 'Corolla Altis'] },
  { name: 'Skoda', models: ['Slavia', 'Octavia', 'Superb', 'Rapid'] },
  { name: 'Volkswagen', models: ['Virtus', 'Vento'] },
  { name: 'Ford', models: ['Aspire'] }
];

export const indianHatchbackBrands = [
  { name: 'Maruti Suzuki', models: ['Swift', 'Baleno', 'Alto', 'WagonR', 'Celerio', 'S-Presso', 'Ignis'] },
  { name: 'Hyundai', models: ['i10', 'i20', 'Grand i10 Nios'] },
  { name: 'Tata Motors', models: ['Tiago', 'Altroz', 'Bolt'] },
  { name: 'Mahindra', models: ['KUV100'] },
  { name: 'Honda', models: ['Jazz', 'Brio'] },
  { name: 'Toyota', models: ['Glanza'] },
  { name: 'Renault', models: ['Kwid'] },
  { name: 'Volkswagen', models: ['Polo'] },
  { name: 'Ford', models: ['Figo', 'Freestyle'] }
];

export const indianBikeBrands = [
  { name: 'Hero', models: ['Splendor', 'HF Deluxe', 'Passion', 'Glamour', 'Xtreme', 'Xpulse', 'Pleasure', 'Destini', 'Maestro'] },
  { name: 'Honda', models: ['Activa', 'Shine', 'Unicorn', 'SP', 'Dio', 'Hornet', 'CB', 'Dream', 'Livo', 'X-Blade'] },
  { name: 'Bajaj', models: ['Pulsar', 'Platina', 'CT', 'Avenger', 'Dominar', 'Chetak'] },
  { name: 'TVS', models: ['Apache', 'Jupiter', 'XL', 'Ntorq', 'Radeon', 'Sport', 'Star City', 'Raider', 'iQube'] },
  { name: 'Royal Enfield', models: ['Classic', 'Bullet', 'Meteor', 'Himalayan', 'Continental GT', 'Interceptor', 'Hunter'] },
  { name: 'Yamaha', models: ['FZ', 'R15', 'MT', 'Fascino', 'Ray ZR', 'Aerox', 'FZS', 'RayZR'] },
  { name: 'Suzuki', models: ['Access', 'Gixxer', 'Burgman', 'Intruder', 'Hayabusa', 'V-Strom'] },
  { name: 'KTM', models: ['Duke', 'RC', 'Adventure', '390', '250', '200', '125'] },
  { name: 'Jawa', models: ['Jawa', 'Forty Two', 'Perak', '42 Bobber'] },
  { name: 'Kawasaki', models: ['Ninja', 'Z', 'Versys', 'Vulcan', 'W800'] },
  { name: 'Triumph', models: ['Street Triple', 'Tiger', 'Trident', 'Rocket', 'Bonneville', 'Speed Twin'] },
  { name: 'Harley-Davidson', models: ['Street', 'Sportster', 'Fat Boy', 'Iron', 'Forty-Eight', 'Pan America'] },
  { name: 'BMW', models: ['G 310', 'F 900', 'R 1250', 'S 1000', 'K 1600'] },
  { name: 'Ola Electric', models: ['S1', 'S1 Pro'] },
  { name: 'Ather', models: ['450X', '450 Plus'] }
];

export const indianAutoRickshawBrands = [
  { name: 'Bajaj', models: ['RE', 'Maxima', 'Compact', 'Qute'] },
  { name: 'Piaggio', models: ['Ape', 'Ape City', 'Ape Auto DX', 'Ape Xtra'] },
  { name: 'Mahindra', models: ['Alfa', 'Treo', 'e-Alfa Mini', 'Jeeto'] },
  { name: 'TVS', models: ['King', 'King Deluxe', 'King Duramax'] },
  { name: 'Atul', models: ['Gem', 'Shakti', 'Elite'] },
  { name: 'Lohia', models: ['Humsafar', 'Comfort', 'Narain'] },
  { name: 'Kinetic', models: ['Safar', 'DX'] },
  { name: 'Force', models: ['Minidor', 'Trax'] },
  { name: 'Omega Seiki', models: ['Rage+', 'Stream'] }
];


export const indianElectricSedanBrands = [
  { name: 'Tata Motors', models: ['Tigor EV'] },
  { name: 'BMW', models: ['i7', 'i4'] },
  { name: 'Audi', models: ['e-tron GT'] },
  { name: 'Mercedes-Benz', models: ['EQS'] },
  { name: 'BYD', models: ['Seal'] },
];


export const indianElectricHatchbackBrands = [
  { name: 'Tata Motors', models: ['Tiago EV'] },
  { name: 'MG Motor', models: ['Comet EV'] },
  { name: 'Citroen', models: ['eC3'] },
  { name: 'Vayve Mobility', models: ['Eva'] },
  { name: 'PMV', models: ['EaS E'] },
  { name: 'Strom Motors', models: ['R3'] },
  { name: 'MINI', models: ['Cooper SE'] },
];


export const indianElectricSUVBrands = [
  { name: 'Tata Motors', models: ['Nexon EV', 'Punch EV', 'Harrier EV', 'Curvv EV'] },
  { name: 'Mahindra', models: ['XUV400 EV', 'BE 6', 'XEV 9e'] },
  { name: 'MG Motor', models: ['ZS EV', 'Windsor EV', 'M9'] },
  { name: 'Hyundai', models: ['Creta Electric'] },
  { name: 'BYD', models: ['Atto 3', 'Sealion 7'] },
  { name: 'Kia', models: ['EV6'] },
  { name: 'VinFast', models: ['VF6', 'VF7'] },
  { name: 'BMW', models: ['iX1'] },
  { name: 'Volvo', models: ['EX30'] },
];


export const indianElectricAutoRickshawBrands = [
  { name: 'Mahindra', models: ['Treo Yaari', 'E-Alfa mini'] },
  { name: 'Piaggio', models: ['Ape E City FX'] },
  { name: 'YC Electric', models: ['Yatri Super', 'Yatri', 'Yatri Deluxe'] },
  { name: 'Kinetic', models: ['Safar Smart'] },
  { name: 'Atul', models: ['Elite Plus'] },
  { name: 'Saarthi', models: ['DLX', 'Shavak E Auto', 'E Cab'] },
  { name: 'Star Electrika', models: ['A1'] },
  { name: 'Mini Metro', models: ['E Rickshaw'] },
  { name: 'JSA', models: ['E Rickshaw'] },
  { name: 'E-Ashwa', models: ['E Rickshaw'] },
  { name: 'Hooghly Motors', models: ['Butterfly E-Rickshaw'] },
];


export const carColorList =[
  {
    "name": "White",
    "hex": "#FFFFFF",
  },
  {
    "name": "Silver",
    "hex": "#C0C0C0",
  },
  {
    "name": "Grey",
    "hex": "#808080",
  },
  {
    "name": "Black",
    "hex": "#000000",
  },
  {
    "name": "Blue",
    "hex": "#0033A0",
  },
  {
    "name": "Red",
    "hex": "#C00000",
  },
  {
    "name": "Brown",
    "hex": "#5C4033",
  },
  {
    "name": "Beige",
    "hex": "#F5F5DC",
  },
  {
    "name": "Green",
    "hex": "#228B22",
  },
  {
    "name": "Gold",
    "hex": "#D4AF37",
  },
  {
    "name": "Orange",
    "hex": "#FF6600",
  }
]

export const ThingsToKnowData = [
  {
    id: 1,
    desc: "identify_our_customers_as_they_call_and_speak_politely_with_them",
    image: <ThingsA />
  },
  {
    id: 2,
    desc: "call_customer_before_starting_or_cancelling_the_trip",
    image: <ThingsB />
  },
  {
    id: 3,
    desc: "ask_the_reasonable_price_for_the_trip_and_become_a_preferred_driver_for_your_customers_preferred_driver_have_more_priority_that_others",
    image: <ThingsC />
  },
  {
    id: 4,
    desc: "ratings_are_the_key_to_more_commitment_make_sure_you_get_a_good_rating",
    image: <ThingsD />
  }
]
