const mongoose = require('mongoose');
const Driver = require('../models/Driver');
const Vehicle = require('../models/Vehicle');
const Passenger = require('../models/Passenger');

// Sample driver data
const sampleDrivers = [
  {
    driverId: 'DRIVER001',
    name: 'John Doe',
    phone: '9876543210',
    email: 'john.doe@example.com',
    password: 'hashedPassword123',
    rating: 4.5,
    tripCountToday: 8,
    totalTripsAccepted: 150,
    totalTripsRejected: 10,
    totalTripsCompleted: 145,
    isTrusted: true,
    isActive: true,
    isVerified: true,
    vehicleId: 'VEHICLE001',
    liveStats: {
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    preferences: {
      preferredZones: ['business', 'airport'],
      maxDistance: 50,
      minFare: 50
    },
    earnings: {
      totalEarnings: 45000,
      todayEarnings: 1200,
      weeklyEarnings: 8500,
      monthlyEarnings: 32000
    }
  },
  {
    driverId: 'DRIVER002',
    name: 'Jane Smith',
    phone: '9876543211',
    email: 'jane.smith@example.com',
    password: 'hashedPassword456',
    rating: 4.2,
    tripCountToday: 5,
    totalTripsAccepted: 89,
    totalTripsRejected: 8,
    totalTripsCompleted: 85,
    isTrusted: false,
    isActive: true,
    isVerified: true,
    vehicleId: 'VEHICLE002',
    liveStats: {
      isOnline: false,
      lastSeen: new Date(Date.now() - 3600000), // 1 hour ago
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    preferences: {
      preferredZones: ['residential'],
      maxDistance: 30,
      minFare: 30
    },
    earnings: {
      totalEarnings: 28000,
      todayEarnings: 800,
      weeklyEarnings: 5200,
      monthlyEarnings: 21000
    }
  },
  {
    driverId: 'DRIVER003',
    name: 'Mike Johnson',
    phone: '9876543212',
    email: 'mike.johnson@example.com',
    password: 'hashedPassword789',
    rating: 4.8,
    tripCountToday: 12,
    totalTripsAccepted: 200,
    totalTripsRejected: 5,
    totalTripsCompleted: 195,
    isTrusted: true,
    isActive: true,
    isVerified: true,
    vehicleId: 'VEHICLE003',
    liveStats: {
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    preferences: {
      preferredZones: ['residential', 'business'],
      maxDistance: 40,
      minFare: 40
    },
    earnings: {
      totalEarnings: 38000,
      todayEarnings: 1500,
      weeklyEarnings: 9500,
      monthlyEarnings: 35000
    }
  },
  {
    driverId: 'DRIVER004',
    name: 'Sarah Wilson',
    phone: '9876543213',
    email: 'sarah.wilson@example.com',
    password: 'hashedPassword101',
    rating: 4.0,
    tripCountToday: 3,
    totalTripsAccepted: 45,
    totalTripsRejected: 12,
    totalTripsCompleted: 40,
    isTrusted: false,
    isActive: true,
    isVerified: true,
    vehicleId: 'VEHICLE004',
    liveStats: {
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    preferences: {
      preferredZones: ['residential'],
      maxDistance: 20,
      minFare: 20
    },
    earnings: {
      totalEarnings: 15000,
      todayEarnings: 300,
      weeklyEarnings: 2500,
      monthlyEarnings: 12000
    }
  },
  {
    driverId: 'DRIVER005',
    name: 'Raj Kumar',
    phone: '9876543214',
    email: 'raj.kumar@example.com',
    password: 'hashedPassword202',
    rating: 4.3,
    tripCountToday: 6,
    totalTripsAccepted: 78,
    totalTripsRejected: 15,
    totalTripsCompleted: 70,
    isTrusted: true,
    isActive: true,
    isVerified: true,
    vehicleId: 'VEHICLE005',
    liveStats: {
      isOnline: true,
      lastSeen: new Date(),
      currentLocation: {
        latitude: 19.0760,
        longitude: 72.8777
      }
    },
    preferences: {
      preferredZones: ['residential', 'business'],
      maxDistance: 25,
      minFare: 25
    },
    earnings: {
      totalEarnings: 22000,
      todayEarnings: 600,
      weeklyEarnings: 4200,
      monthlyEarnings: 18000
    }
  }
];

// Sample vehicle data
const sampleVehicles = [
  {
    _id: 'VEHICLE001',
    driverId: 'DRIVER001',
    fuel: 'petrol',
    make: 'suzuki',
    model: 'dzire',
    type: 'SEDAN',
    year: '2020',
    ownerId: '',
    available: true,
    color: 'white',
    regNo: 'MH12AB1234'
  },
  {
    _id: 'VEHICLE002',
    driverId: 'DRIVER002',
    fuel: 'petrol',
    make: 'honda',
    model: 'city',
    type: 'SUV',
    year: '2019',
    ownerId: '',
    available: true,
    color: 'silver',
    regNo: 'MH12CD5678'
  },
  {
    _id: 'VEHICLE003',
    driverId: 'DRIVER003',
    fuel: 'petrol',
    make: 'maruti',
    model: 'swift',
    type: 'HATCHBACK',
    year: '2021',
    ownerId: '',
    available: true,
    color: 'red',
    regNo: 'MH12EF9012'
  },
  {
    _id: 'VEHICLE004',
    driverId: 'DRIVER004',
    fuel: 'petrol',
    make: 'honda',
    model: 'activa',
    type: 'BIKE',
    year: '2022',
    ownerId: '',
    available: true,
    color: 'black',
    regNo: 'MH12GH3456'
  },
  {
    _id: 'VEHICLE005',
    driverId: 'DRIVER005',
    fuel: 'petrol',
    make: 'bajaj',
    model: 're',
    type: 'AUTO',
    year: '2018',
    ownerId: '',
    available: true,
    color: 'yellow',
    regNo: 'MH12IJ7890'
  }
];

// Sample passenger data
const samplePassengers = [
  {
    username: 'hari',
    phone: '9999999951',
    email: 'hariTestC@gmail.com',
    password: 'U2FsdGVkX1+7S+fqA4nAurfmC9qa1ydy4Oeay4BkxcmkE/WcI1RBjFrjVmTUxQ7d',
    name: 'hari',
    createdBy: '6780bd905418f3a88889adb0',
    profile: {
      isVerified: true
    },
    stats: {
      totalTrips: 25,
      completedTrips: 23,
      cancelledTrips: 2,
      totalSpent: 3500,
      averageRating: 4.3,
      totalRating: 107,
      ratingCount: 25
    },
    membership: {
      level: 'silver',
      points: 150,
      joinDate: new Date('2024-01-15'),
      lastTripDate: new Date()
    },
    couponUsage: [
      {
        couponCode: 'WELCOME50',
        usedAt: new Date('2024-01-20'),
        fareAmount: 200,
        discountAmount: 50,
        tripId: 'TRIP001',
        regionCode: 'default'
      },
      {
        couponCode: 'FIRST25',
        usedAt: new Date('2024-01-25'),
        fareAmount: 150,
        discountAmount: 25,
        tripId: 'TRIP002',
        regionCode: 'default'
      }
    ],
    rideGroups: [],
    fcmTokens: [
      {
        token: 'fcm_token_123',
        deviceId: 'device_001',
        platform: 'android',
        isActive: true,
        lastUsed: new Date()
      }
    ],
    preferences: {
      preferredPaymentMethod: 'card',
      language: 'en',
      notifications: {
        push: true,
        email: true,
        sms: false
      }
    },
    isActive: true,
    isBlocked: false
  },
  {
    username: 'alice',
    phone: '9999999952',
    email: 'alice@example.com',
    password: 'hashedPassword789',
    name: 'Alice Johnson',
    createdBy: '6780bd905418f3a88889adb0',
    profile: {
      isVerified: true
    },
    stats: {
      totalTrips: 12,
      completedTrips: 10,
      cancelledTrips: 2,
      totalSpent: 1800,
      averageRating: 4.1,
      totalRating: 41,
      ratingCount: 10
    },
    membership: {
      level: 'bronze',
      points: 75,
      joinDate: new Date('2024-02-01'),
      lastTripDate: new Date(Date.now() - 86400000) // 1 day ago
    },
    couponUsage: [
      {
        couponCode: 'NEWUSER20',
        usedAt: new Date('2024-02-05'),
        fareAmount: 120,
        discountAmount: 20,
        tripId: 'TRIP003',
        regionCode: 'default'
      }
    ],
    rideGroups: [],
    fcmTokens: [],
    preferences: {
      preferredPaymentMethod: 'cash',
      language: 'en',
      notifications: {
        push: true,
        email: false,
        sms: false
      }
    },
    isActive: true,
    isBlocked: false
  }
];

async function seedSampleData() {
  try {
    console.log('🌱 Starting to seed sample data...');
    
    // Clear existing data
    await Driver.deleteMany({});
    await Vehicle.deleteMany({});
    await Passenger.deleteMany({});
    console.log('🗑️  Cleared existing data');
    
    // Insert sample vehicles
    const vehicles = await Vehicle.insertMany(sampleVehicles);
    console.log(`✅ Inserted ${vehicles.length} vehicles`);
    
    // Insert sample drivers
    const drivers = await Driver.insertMany(sampleDrivers);
    console.log(`✅ Inserted ${drivers.length} drivers`);
    
    // Insert sample passengers
    const passengers = await Passenger.insertMany(samplePassengers);
    console.log(`✅ Inserted ${passengers.length} passengers`);
    
    console.log('\n📊 Sample Data Summary:');
    console.log('Vehicles:');
    vehicles.forEach(vehicle => {
      console.log(`  - ${vehicle.make} ${vehicle.model} (${vehicle._id}) - Type: ${vehicle.type} - Driver: ${vehicle.driverId}`);
    });
    
    console.log('\nDrivers:');
    drivers.forEach(driver => {
      console.log(`  - ${driver.name} (${driver.driverId}) - Rating: ${driver.rating} - Vehicle: ${driver.vehicleId}`);
    });
    
    console.log('\nPassengers:');
    passengers.forEach(passenger => {
      console.log(`  - ${passenger.name} (${passenger.username}) - Trips: ${passenger.stats.totalTrips}`);
    });
    
    console.log('\n🎉 Sample data seeding completed successfully!');
    console.log('\n💡 You can now test the API with these sample IDs:');
    console.log('Driver IDs: DRIVER001, DRIVER002, DRIVER003, DRIVER004, DRIVER005');
    console.log('Vehicle IDs: VEHICLE001, VEHICLE002, VEHICLE003, VEHICLE004, VEHICLE005');
    console.log('Vehicle Types: SEDAN, SUV, HATCHBACK, BIKE, AUTO');
    console.log('Passenger IDs: hari, alice');
    console.log('Object IDs: Use the _id values from the database');
    
  } catch (error) {
    console.error('❌ Error seeding sample data:', error);
  } finally {
    // Close the connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the seeding function
if (require.main === module) {
  // Connect to MongoDB
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/fare_engine';
  
  mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log('🔌 Connected to MongoDB');
    return seedSampleData();
  }).catch(error => {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  });
}

module.exports = { seedSampleData }; 