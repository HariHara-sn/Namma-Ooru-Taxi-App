const mongoose = require('mongoose');
const { initializeFareEngine, getServices } = require('../index');

/**
 * Test: Verify that verifyAndApplyCoupon properly validates all dynamic coupon rules
 */
async function testDynamicCouponValidation() {
  try {
    // 1. Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/locationTracking');
    console.log('✅ Connected to MongoDB');

    // 2. Initialize fare engine
    await initializeFareEngine(mongoose.connection);
    console.log('✅ Fare engine initialized');

    // 3. Get services
    const { FareService } = getServices();

    // 4. Create a sample passenger with good stats for dynamic coupons
    const Passenger = require('../models/Passenger');
    const samplePassenger = new Passenger({
      username: 'testuser',
      phone: '+919876543210',
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User',
      stats: {
        totalTrips: 25, // Should qualify for LOYALTY_BONUS (>= 20)
        completedTrips: 23,
        totalSpent: 1500, // Should qualify for HIGH_SPENDER (>= 1000)
        averageRating: 4.5,
        totalRating: 90,
        ratingCount: 20
      },
      membership: {
        level: 'gold',
        points: 150
      },
      isActive: true,
      isBlocked: false
    });
    
    const savedPassenger = await samplePassenger.save();
    console.log('✅ Sample passenger created:', savedPassenger._id.toString());

    // 5. Create a sample trip
    const Trip = require('../models/Trip');
    const sampleTrip = new Trip({
      driverId: 'DRIVER001',
      vehicleId: 'VEHICLE001',
      userId: savedPassenger._id.toString(),
      passangers: [savedPassenger._id.toString()],
      status: 'accepted'
    });
    
    const savedTrip = await sampleTrip.save();
    console.log('✅ Sample trip created:', savedTrip._id.toString());

    // 6. Test 1: Valid coupon with all conditions met
    console.log('\n🧪 Test 1: Valid LOYALTY_BONUS coupon (all conditions met)');
    const validCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: 'LOYALTY_BONUS',
      fare: 300, // Above minFare of 200
      regionCode: 'default'
    });
    
    if (validCoupon.success) {
      console.log('✅ Valid coupon applied successfully');
      console.log('Discount:', validCoupon.data.discount);
      console.log('Final fare:', validCoupon.data.finalFare);
      console.log('Max discount limit:', validCoupon.data.discountRule.maxDiscount);
      console.log('Min fare requirement:', validCoupon.data.discountRule.minFare);
    } else {
      console.log('❌ Valid coupon failed:', validCoupon.error);
    }

    // 7. Test 2: Coupon with fare below minimum
    console.log('\n🧪 Test 2: LOYALTY_BONUS coupon with fare below minimum (should fail)');
    const lowFareCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: 'LOYALTY_BONUS',
      fare: 150, // Below minFare of 200
      regionCode: 'default'
    });
    
    if (!lowFareCoupon.success) {
      console.log('✅ Correctly rejected low fare coupon:', lowFareCoupon.error);
    } else {
      console.log('❌ Should have rejected low fare coupon');
    }

    // 8. Test 3: Coupon with usage limit
    console.log('\n🧪 Test 3: HIGH_SPENDER coupon (should respect usage limit)');
    
    // First, add some coupon usage to the passenger
    await savedPassenger.addCouponUsage({
      couponCode: 'HIGH_SPENDER',
      fareAmount: 300,
      discountAmount: 50,
      usedAt: new Date()
    });
    
    const usageLimitCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: 'HIGH_SPENDER',
      fare: 300,
      regionCode: 'default'
    });
    
    if (!usageLimitCoupon.success) {
      console.log('✅ Correctly rejected due to usage limit:', usageLimitCoupon.error);
    } else {
      console.log('❌ Should have rejected due to usage limit');
    }

    // 9. Test 4: Invalid coupon code
    console.log('\n🧪 Test 4: Invalid coupon code (should fail)');
    const invalidCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: 'INVALID_COUPON',
      fare: 300,
      regionCode: 'default'
    });
    
    if (!invalidCoupon.success) {
      console.log('✅ Correctly rejected invalid coupon:', invalidCoupon.error);
    } else {
      console.log('❌ Should have rejected invalid coupon');
    }

    // 10. Test 5: Coupon with passenger condition not met
    console.log('\n🧪 Test 5: Create passenger with low stats and test condition');
    const lowStatsPassenger = new Passenger({
      username: 'lowstatsuser',
      phone: '+919876543211',
      email: 'lowstats@example.com',
      password: 'password123',
      name: 'Low Stats User',
      stats: {
        totalTrips: 5, // Below LOYALTY_BONUS requirement (>= 20)
        completedTrips: 4,
        totalSpent: 200,
        averageRating: 3.5
      },
      membership: {
        level: 'bronze',
        points: 20
      },
      isActive: true,
      isBlocked: false
    });
    
    const savedLowStatsPassenger = await lowStatsPassenger.save();
    
    const lowStatsTrip = new Trip({
      driverId: 'DRIVER002',
      vehicleId: 'VEHICLE002',
      userId: savedLowStatsPassenger._id.toString(),
      passangers: [savedLowStatsPassenger._id.toString()],
      status: 'accepted'
    });
    
    const savedLowStatsTrip = await lowStatsTrip.save();
    
    const conditionFailCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedLowStatsTrip._id.toString(),
      couponCode: 'LOYALTY_BONUS',
      fare: 300,
      regionCode: 'default'
    });
    
    if (!conditionFailCoupon.success) {
      console.log('✅ Correctly rejected due to passenger condition:', conditionFailCoupon.error);
    } else {
      console.log('❌ Should have rejected due to passenger condition');
    }

    // 11. Test 6: Check max discount limit
    console.log('\n🧪 Test 6: Test max discount limit with high fare');
    const highFareCoupon = await FareService.verifyAndApplyCoupon({
      tripId: savedTrip._id.toString(),
      couponCode: 'LOYALTY_BONUS',
      fare: 1000, // 15% of 1000 = 150, but maxDiscount is 100
      regionCode: 'default'
    });
    
    if (highFareCoupon.success) {
      console.log('✅ High fare coupon applied');
      console.log('Calculated discount:', highFareCoupon.data.discount);
      console.log('Max discount limit:', highFareCoupon.data.discountRule.maxDiscount);
      if (highFareCoupon.data.discount <= highFareCoupon.data.discountRule.maxDiscount) {
        console.log('✅ Discount correctly limited to maxDiscount');
      } else {
        console.log('❌ Discount should be limited to maxDiscount');
      }
    } else {
      console.log('❌ High fare coupon failed:', highFareCoupon.error);
    }

    console.log('\n✅ All dynamic coupon validation tests completed!');

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
  testDynamicCouponValidation();
}

module.exports = { testDynamicCouponValidation }; 