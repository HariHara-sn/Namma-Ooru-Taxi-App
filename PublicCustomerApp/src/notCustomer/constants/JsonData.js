import React from 'react';
import OnBoardA from '../assets/image/onboarding/onboardA.svg';
import OnBoardB from '../assets/image/onboarding/onboardB.svg';
import OnBoardC from '../assets/image/onboarding/onboardC.svg';

import OnWayTrip from '../assets/image/svgIcons/onWayTrip.svg';
import RoundTrip from '../assets/image/svgIcons/roundTrip.svg';
import StopsTrip from '../assets/image/svgIcons/stopsTrip.svg';

export const languages = [
  {
    id: 1,
    name: 'English',
    name_en: 'English',
    code: 'en',
  },
  {
    id: 2,
    name: 'தமிழ்',
    name_en: 'Tamil',
    code: 'ta',
  },
 
  {
    id: 3,
    name: 'हिन्दी',
    name_en: 'Hindi',
    code: 'hi',
  },
  {
    id: 4,
    name: 'ಕನ್ನಡ',
    name_en: 'Kannada',
    code: 'kn',
  },
  {
    id: 5,
    name: 'മലയാളം',
    name_en: 'Malayalam',
    code: 'ml',
  },
 
  {
    id: 6 ,
    name: 'తెలుగు',
    name_en: 'Telugu',
    code: 'te',
  }
];

export const onBoardingSlides = [
  {
    id: 1,
    title: 'quick_and_easy_bookings',
    image: <OnBoardA />,
    description: 'quick_and_easy_bookings_description',
  },
  {
    id: 2,
    title: 'set_your_destination',
    image: <OnBoardB />,
    description: 'set_your_destination_description',
  },
  {
    id: 3,
    title: 'track_your_ride',
    image: <OnBoardC />,
    description: 'track_your_ride_description',
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

// export const getVehicleDetailsById = (id) => {
//   switch (id) {
//     case 'MOTORBIKE':
//       return {
//         name: 'Motor Bike',
//         image: require('../assets/image/vehicle/bike.png'),
//         capacity: 1
//       };
//     case 'AUTO':
//       return {
//         name: 'Auto Rickshaw',
//         image: require('../assets/image/vehicle/auto.png'),
//         capacity: 3
//       };
//     case 'HATCHBACK':
//       return {
//         name: 'Hatchback',
//         image: require('../assets/image/vehicle/hatchback.png'),
//         capacity: 3
//       };
//     case 'SEDAN':
//       return {
//         name: 'Sedan',
//         image: require('../assets/image/vehicle/sedan.png'),
//         capacity: 4
//       };
//     case 'SUV':
//       return {
//         name: 'SUV',
//         image: require('../assets/image/vehicle/suv.png'),
//         capacity: 4
//       };
//     case 'LUXURY_SEDAN':
//       return {
//         name: 'Luxury Sedan',
//         image: require('../assets/image/vehicle/luxsedan.png'),
//         capacity: 5
//       };
//     default:
//       return null; // or handle as needed, e.g., return a default vehicle
//   }
// };