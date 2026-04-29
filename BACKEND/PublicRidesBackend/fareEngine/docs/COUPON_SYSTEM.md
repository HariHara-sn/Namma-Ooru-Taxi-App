# 🎫 Enhanced Coupon System

The fare engine now supports an enhanced coupon system that ensures coupons are only utilized after successful trip completion.

## 🔄 Workflow

### 1. **Coupon Verification & Application**
- User applies coupon to trip for verification
- System checks if user is eligible for the coupon
- If valid, coupon is stored in trip collection (not tracked in passenger yet)
- Returns verification result with discount calculation

### 2. **Fare Calculation**
- Final fare calculation uses stored coupons from trip
- No need to pass coupons in fare calculation API
- System automatically applies stored coupons

### 3. **Trip Completion**
- During final fare calculation, passenger coupon usage is automatically updated
- Coupon usage is tracked in passenger collection only after successful trip completion
- Ensures coupons are only consumed for successful trips

## 📋 API Endpoints

### Coupon Verification & Application
```bash
POST /api/fare/trip/coupon/verify
{
  "tripId": "6871eede67b53fde8ca254e7",
  "couponCode": "LOYALTY_BONUS",
  "fare": 200,
  "regionCode": "default"
}
```

**Note**: This endpoint now uses the **dynamic coupon system** that comprehensively validates all coupon rules:
- Check if the coupon exists in `dynamicCouponRules`
- Validate passenger eligibility based on profile data
- Check validity periods (`validFrom`/`validTo`)
- Verify minimum fare requirements (`minFare`)
- Apply maximum discount limits (`maxDiscount`)
- Check usage limits (`usageLimit`)
- Apply passenger-specific conditions (e.g., `stats.totalTrips >= 20`)

### Get Applied Coupons
```bash
GET /api/fare/trip/coupon/applied?tripId=6871eede67b53fde8ca254e7
```

### Remove Coupon from Trip
```bash
DELETE /api/fare/trip/coupon/remove
{
  "tripId": "6871eede67b53fde8ca254e7",
  "couponCode": "FIRST_RIDE"
}
```

### Final Fare Calculation (Automatically Updates Coupon Usage)
```bash
POST /api/fare/trip/final
{
  "tripId": "6871eede67b53fde8ca254e7",
  "distance": 10,
  "duration": 20,
  "waitTime": 5,
  "zone": "business",
  "regionCode": "default"
}
```
**Note**: This endpoint automatically updates passenger coupon usage when coupons are applied.

### Get Available Coupons for Trip
```bash
GET /api/fare/trip/coupon/available?tripId=6871eede67b53fde8ca254e7&fare=200&regionCode=default
```

**Response includes**:
- `dynamicCoupons`: Passenger-specific dynamic coupons
- `staticCoupons`: Legacy static coupons (if any)
- `availableCoupons`: Combined list of all available coupons
- `passengerProfile`: Passenger profile data used for validation

## 🚀 Usage Examples

### 1. Apply Dynamic Coupon to Trip
```javascript
const { FareService } = getServices();

// Verify and apply dynamic coupon
const result = await FareService.verifyAndApplyCoupon({
  tripId: '6871eede67b53fde8ca254e7',
  couponCode: 'LOYALTY_BONUS', // Dynamic coupon based on passenger stats
  fare: 200,
  regionCode: 'default'
});

if (result.success) {
  console.log('Dynamic coupon applied:', result.data);
  console.log('Passenger field:', result.data.discountRule.passengerField);
  console.log('Condition:', result.data.discountRule.condition);
} else {
  console.log('Coupon error:', result.error);
}
```

### 2. Calculate Final Fare (Automatically Updates Coupon Usage)
```javascript
// No need to pass coupons - uses stored coupons from trip
// Automatically updates passenger coupon usage when coupons are applied
const fareResult = await FareService.calculateFareFromTrip({
  tripId: '6871eede67b53fde8ca254e7',
  distance: 10,
  duration: 20,
  waitTime: 5,
  zone: 'business'
});
```

## 🗄️ Database Changes

### Trip Collection
Added `coupons` field to store applied coupon codes:
```javascript
{
  _id: ObjectId,
  driverId: String,
  vehicleId: String,
  userId: String,
  passangers: [String],
  coupons: [String], // NEW: Array of applied coupon codes
  status: String,
  // ... other fields
}
```

### Trip Model Methods
- `addCoupon(couponCode)` - Add coupon to trip
- `removeCoupon(couponCode)` - Remove coupon from trip
- `getAppliedCoupons()` - Get all applied coupons

## 🔧 Service Changes

### CouponVerificationService
New service to handle:
- Coupon verification and application to trips
- Managing applied coupons in trip collection
- Updating passenger coupon usage after trip completion

### PromoService Updates
- Added `trackUsage` parameter to control when to track usage
- Coupons are not tracked immediately when applied to trip
- Only tracked after successful trip completion

### TripFareService Updates
- Removed `coupons` parameter from fare calculation methods
- Automatically uses stored coupons from trip collection
- Automatically updates passenger coupon usage during final fare calculation
- No need to pass coupons in API calls

## 📊 Response Examples

### Dynamic Coupon Verification Response
```json
{
  "success": true,
  "data": {
    "tripId": "6871eede67b53fde8ca254e7",
    "couponCode": "LOYALTY_BONUS",
    "discount": 45,
    "finalFare": 155,
    "discountRule": {
      "code": "LOYALTY_BONUS",
      "type": "percentage",
      "value": 15,
      "passengerField": "stats.totalTrips",
      "condition": "stats.totalTrips >= 20",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    },
    "message": "Dynamic coupon verified and applied to trip"
  }
}
```

### Available Coupons Response
```json
{
  "success": true,
  "data": {
    "tripId": "6871eede67b53fde8ca254e7",
    "availableCoupons": [
      {
        "code": "LOYALTY_BONUS",
        "type": "percentage",
        "value": 15,
        "maxDiscount": 100,
        "minFare": 200,
        "discount": 45,
        "passengerField": "stats.totalTrips",
        "condition": "stats.totalTrips >= 20",
        "validFrom": "2024-01-01",
        "validTo": "2025-12-31"
      }
    ],
    "dynamicCoupons": [...],
    "staticCoupons": [...],
    "appliedCoupons": ["LOYALTY_BONUS"],
    "passengerProfile": {
      "totalTrips": 25,
      "completedTrips": 23,
      "totalSpent": 1500,
      "averageRating": 4.5,
      "membershipLevel": "gold"
    }
  }
}
```

### Update Usage Response
```json
{
  "success": true,
  "data": {
    "tripId": "6871eede67b53fde8ca254e7",
    "updatedCoupons": [
      {
        "code": "FIRST_RIDE",
        "discount": 36,
        "finalFare": 144
      }
    ],
    "message": "Coupon usage updated after successful trip"
  }
}
```

## 🎯 Benefits

1. **Comprehensive Validation**: All dynamic coupon rules are properly validated including `maxDiscount`, `minFare`, and `usageLimit`
2. **Dynamic Validation**: Coupons are validated based on passenger profile and behavior
3. **Prevents Coupon Waste**: Coupons are only consumed after successful trips
4. **Better User Experience**: Users can apply coupons before trip starts
5. **Accurate Tracking**: Coupon usage is automatically tracked during final fare calculation
6. **Flexible Management**: Easy to add/remove coupons from trips
7. **Automatic Application**: No need to pass coupons in fare calculations
8. **Automatic Updates**: Passenger coupon usage is updated automatically during final fare calculation
9. **Passenger-Specific**: Coupons are personalized based on passenger data
10. **Time-Based Validity**: Support for `validFrom` and `validTo` periods

## 🔄 Migration Notes

### For Existing Code
- Remove `coupons` parameter from trip-based fare calculation calls
- Use new coupon verification endpoints instead of direct coupon application
- Final fare calculation automatically updates passenger coupon usage
- Update coupon codes to use dynamic coupon codes (e.g., `LOYALTY_BONUS` instead of `FIRST_RIDE`)

### API Changes
- Trip-based fare calculation APIs no longer accept `coupons` parameter
- New coupon management endpoints for trip-specific operations
- Coupon usage is now managed separately from fare calculation
- `verifyAndApplyCoupon` now uses dynamic coupon validation
- All coupons are validated against passenger profile data

This enhanced system ensures that coupons are only utilized when trips are successfully completed, providing better control and user experience. 