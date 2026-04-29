const express = require('express');
const FareController = require('../controllers/FareController');
const TripFareController = require('../controllers/TripFareController');
const CouponController = require('../controllers/CouponController');
const DynamicCouponController = require('../controllers/DynamicCouponController');

const router = express.Router();

// Health check
router.get('/health', FareController.healthCheck);

// Get fare range estimate
router.get('/range', FareController.getFareRange);

// Calculate pre-final fare (estimate before trip starts)
router.post('/pre-final', FareController.calculatePreFinalFare);

// Calculate final fare
router.post('/final', FareController.calculateFinalFare);

// Apply coupon to fare
router.post('/apply-coupon', FareController.applyCoupon);

// Get cancellation fee
router.post('/cancel', FareController.getCancellationFee);

// Get available coupons
router.get('/coupons', FareController.getAvailableCoupons);

// Get driver incentives
router.get('/driver-incentives', FareController.getDriverIncentives);

// Get surge multiplier
router.get('/surge', FareController.getSurgeMultiplier);

// Get available vehicle types
router.get('/vehicle-types', FareController.getAvailableVehicleTypes);

// Get fare configuration
router.get('/config/:regionCode?', FareController.getFareConfig);

// Get valid incentive types
// router.get('/incentive-types', FareController.getValidIncentiveTypes);

// Trip-based fare calculation routes (modular approach)
router.post('/trip/final', TripFareController.calculateFareFromTrip);
router.post('/trip/pre-final', TripFareController.calculatePreFinalFareFromTrip);
router.post('/trip/multi-passenger', TripFareController.calculateMultiPassengerFare);
router.get('/trip/passengers', TripFareController.getTripPassengers);

// Coupon management routes for trips
router.post('/trip/coupon/verify', CouponController.verifyAndApplyCoupon);
router.get('/trip/coupon/applied', CouponController.getAppliedCoupons);
router.delete('/trip/coupon/remove', CouponController.removeCouponFromTrip);
router.get('/trip/coupon/available', CouponController.getAvailableCouponsForTrip);

// Dynamic coupon routes
router.get('/dynamic-coupons/available', DynamicCouponController.getAvailableDynamicCoupons);
router.get('/dynamic-coupons/all', DynamicCouponController.getAllAvailableCoupons);
router.get('/dynamic-coupons/passenger-fields', DynamicCouponController.getValidPassengerFields);
router.get('/dynamic-coupons/stats', DynamicCouponController.getDynamicCouponStats);

module.exports = router; 