const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('../index');

/**
 * Test: Verify that trip/final calculation automatically updates passenger coupon usage
 */
async function testCouponUpdate() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/locationTracking');
    console.log('✅ Connected to MongoDB');

    // 2. Initialize fare engine
    await initializeFareEngine(mongoose.connection);
    console.log('✅ Fare engine initialized');

    // 3. Get services
    const { FareService } = getServices();

    // 4. Create a sample passenger with coupon usage tracking
    const Passenger = require('../models/Passenger');
    const samplePassenger = new Passenger({
      username: 'testuser',
      phone: '+919876543210',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      stats: {
        totalTrips: 5,
        completedTrips: 4,
        totalSpent: 500,
        averageRating: 4.2
      },
      membership: {
        level: 'bronze',
        points: 50
      },
      isActive: true,
      isBlocked: false
    });
    
    const savedPassenger = await samplePassenger.save();
    console.log('✅ Sample passenger created:', savedPassenger._id.toString());

    // 5. Create a sample trip with applied coupon
    const Trip = require('../models/Trip');
    const sampleTrip = new Trip({
      driverId: 'DRIVER001',
      vehicleId: 'VEHICLE001',
      userId: savedPassenger._id.toString(),
      passangers: [savedPassenger._id.toString()],
      status: 'accepted',
      coupons: ['FIRST_RIDE'] // Applied coupon
    });
    
    const savedTrip = await sampleTrip.save();
    console.log('✅ Sample trip created with coupon:', savedTrip._id.toString());

    // 6. Check passenger coupon usage before final fare calculation
    console.log('\n📊 Passenger coupon usage BEFORE final fare calculation:');
    const passengerBefore = await Passenger.findByObjectId(savedPassenger._id.toString());
    console.log('Coupon usage count:', passengerBefore.couponUsage.length);
    console.log('Applied coupons in trip:', savedTrip.getAppliedCoupons());

    // 7. Calculate final fare (this should automatically update passenger coupon usage)
    console.log('\n💰 Calculating final fare...');
    const finalFare = await FareService.calculateFareFromTrip({
      tripId: savedTrip._id.toString(),
      distance: 10,
      duration: 20,
      waitTime: 5,
      zone: 'business'
    });

    if (finalFare.success) {
      console.log('✅ Final fare calculated successfully');
      console.log('Final fare:', finalFare.data.fare);
      console.log('Applied coupons:', finalFare.data.breakdown.appliedCoupons);
    } else {
      console.log('❌ Final fare calculation failed:', finalFare.error);
    }

    // 8. Check passenger coupon usage after final fare calculation
    console.log('\n📊 Passenger coupon usage AFTER final fare calculation:');
    const passengerAfter = await Passenger.findByObjectId(savedPassenger._id.toString());
    console.log('Coupon usage count:', passengerAfter.couponUsage.length);
    
    if (passengerAfter.couponUsage.length > 0) {
      console.log('✅ Coupon usage was automatically updated!');
      console.log('Updated coupon usage:', passengerAfter.couponUsage[0]);
    } else {
      console.log('❌ Coupon usage was not updated');
    }

    // 9. Verify the coupon usage details
    if (passengerAfter.couponUsage.length > 0) {
      const usage = passengerAfter.couponUsage[0];
      console.log('\n📋 Coupon usage details:');
      console.log('- Coupon code:', usage.couponCode);
      console.log('- Used at:', usage.usedAt);
      console.log('- Fare amount:', usage.fareAmount);
      console.log('- Discount amount:', usage.discountAmount);
      console.log('- Trip ID:', usage.tripId);
    }

    console.log('\n✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Error in test:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testCouponUpdate();
}

module.exports = { testCouponUpdate }; 