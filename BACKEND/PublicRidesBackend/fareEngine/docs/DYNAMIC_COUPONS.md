# 🎫 Dynamic Coupon System

The fare engine now supports **dynamic coupon types** that use the exact field names from the passenger collection. This system has **replaced the old static `discountRules`** with a more flexible `dynamicCouponRules` system that includes validity periods (`validFrom` and `validTo`) and passenger-based conditions.

## 🔄 Migration from Old System

The old `discountRules` have been **completely replaced** by `dynamicCouponRules` which provide:

- ✅ **Validity periods** - `validFrom` and `validTo` fields for time-based restrictions
- ✅ **Passenger-based conditions** - Dynamic rules based on passenger behavior
- ✅ **Backward compatibility** - Legacy `discountRules` still supported for migration
- ✅ **Enhanced flexibility** - More sophisticated coupon logic

## 🎯 Key Features

## 🎯 Key Features

- ✅ **No hardcoded coupon types** - Use exact field names from passenger collection
- ✅ **Dynamic validation** - System validates field names automatically
- ✅ **Nested field support** - Use dot notation for nested fields (e.g., `stats.totalTrips`)
- ✅ **Runtime configuration** - Add new rules without code changes
- ✅ **Automatic error handling** - Invalid field names return warnings
- ✅ **Passenger profile analysis** - Automatic calculation of derived metrics

## 📋 Valid Passenger Fields

### Basic Fields
- `username` - Passenger username (string)
- `phone` - Phone number (string)
- `email` - Email address (string)
- `name` - Passenger name (string)
- `isActive` - Active status (boolean)
- `isBlocked` - Blocked status (boolean)

### Stats Fields
- `stats.totalTrips` - Total number of trips (number)
- `stats.completedTrips` - Number of completed trips (number)
- `stats.cancelledTrips` - Number of cancelled trips (number)
- `stats.totalSpent` - Total amount spent (number)
- `stats.averageRating` - Average rating given (number)
- `stats.totalRating` - Total rating points (number)
- `stats.ratingCount` - Number of ratings given (number)

### Membership Fields
- `membership.level` - Membership level (string: bronze, silver, gold, platinum)
- `membership.points` - Loyalty points earned (number)
- `membership.joinDate` - Membership join date (date)
- `membership.lastTripDate` - Last trip date (date)

### Preferences Fields
- `preferences.preferredPaymentMethod` - Preferred payment method (string)
- `preferences.language` - Language preference (string)
- `preferences.notifications.push` - Push notification preference (boolean)
- `preferences.notifications.email` - Email notification preference (boolean)
- `preferences.notifications.sms` - SMS notification preference (boolean)

### Calculated Fields
- `completion_rate` - Calculated completion rate (number)
- `total_spent` - Total amount spent (calculated)
- `days_since_last_trip` - Days since last trip (calculated)
- `membership_duration_days` - Membership duration in days (calculated)

## 🔧 API Endpoints

### Get Available Dynamic Coupons
```bash
GET /api/fare/dynamic-coupons/available?passengerId=user123&fare=300&regionCode=default
```

Response:
```json
{
  "success": true,
  "data": {
    "passengerId": "user123",
    "fare": 300,
    "dynamicCoupons": [
      {
        "code": "LOYALTY_BONUS",
        "type": "percentage",
        "value": 15,
        "maxDiscount": 100,
        "minFare": 200,
        "discount": 45,
        "condition": "stats.totalTrips >= 20",
        "description": "Loyalty bonus for frequent riders: 15% off",
        "passengerField": "stats.totalTrips"
      }
    ],
    "passengerProfile": {
      "totalTrips": 25,
      "completedTrips": 23,
      "totalSpent": 1500,
      "averageRating": 4.5,
      "membershipLevel": "gold",
      "membershipPoints": 150,
      "completionRate": 92,
      "daysSinceLastTrip": 3,
      "membershipDuration": 365,
      "isActive": true,
      "isBlocked": false
    },
    "totalEligibleCoupons": 1
  }
}
```

### Get All Available Coupons (Static + Dynamic)
```bash
GET /api/fare/dynamic-coupons/all?passengerId=user123&fare=300&regionCode=default
```

### Get Valid Passenger Fields
```bash
GET /api/fare/dynamic-coupons/passenger-fields?regionCode=default
```

### Get Dynamic Coupon Statistics
```bash
GET /api/fare/dynamic-coupons/stats?passengerId=user123&regionCode=default
```

## 📝 Configuration Examples

### Validity Period Fields

All dynamic coupon rules now support optional `validFrom` and `validTo` fields:

- **`validFrom`** - Date when the coupon becomes valid (optional)
- **`validTo`** - Date when the coupon expires (optional)

If not specified, the coupon is always valid. Dates should be in ISO format: `"YYYY-MM-DD"`

### Basic Dynamic Coupon Rules

```json
{
  "dynamicCouponRules": [
    {
      "code": "LOYALTY_BONUS",
      "type": "percentage",
      "value": 15,
      "maxDiscount": 100,
      "minFare": 200,
      "passengerField": "stats.totalTrips",
      "condition": "stats.totalTrips >= 20",
      "description": "Loyalty bonus for frequent riders",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    },
    {
      "code": "HIGH_SPENDER",
      "type": "fixed",
      "value": 50,
      "maxDiscount": 50,
      "minFare": 300,
      "passengerField": "stats.totalSpent",
      "condition": "stats.totalSpent >= 1000",
      "description": "High spender reward",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    }
  ]
}
```

### Membership-Based Rules

```json
{
  "dynamicCouponRules": [
    {
      "code": "GOLD_MEMBER",
      "type": "percentage",
      "value": 25,
      "maxDiscount": 150,
      "minFare": 150,
      "passengerField": "membership.level",
      "condition": "membership.level == gold",
      "description": "Gold membership reward",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    },
    {
      "code": "PLATINUM_MEMBER",
      "type": "percentage",
      "value": 30,
      "maxDiscount": 200,
      "minFare": 200,
      "passengerField": "membership.level",
      "condition": "membership.level == platinum",
      "description": "Platinum membership reward",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    }
  ]
}
```

### Behavior-Based Rules

```json
{
  "dynamicCouponRules": [
    {
      "code": "RETURN_CUSTOMER",
      "type": "percentage",
      "value": 10,
      "maxDiscount": 30,
      "minFare": 100,
      "passengerField": "days_since_last_trip",
      "condition": "days_since_last_trip >= 7",
      "description": "Return customer reward",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    },
    {
      "code": "COMPLETION_BONUS",
      "type": "fixed",
      "value": 20,
      "maxDiscount": 20,
      "minFare": 100,
      "passengerField": "stats.completedTrips",
      "condition": "stats.completedTrips >= 10",
      "description": "Completion bonus for reliable riders",
      "validFrom": "2024-01-01",
      "validTo": "2025-12-31"
    }
  ]
}
```

## 🎮 Condition Operators

Supported operators for conditions:

- `>=` - Greater than or equal
- `<=` - Less than or equal
- `>` - Greater than
- `<` - Less than
- `==` - Equal to
- `!=` - Not equal to

## 🔍 Field Type Handling

The system automatically handles different field types:

- **Numbers**: Direct comparison (e.g., `stats.totalTrips >= 20`)
- **Strings**: Direct comparison (e.g., `membership.level == gold`)
- **Booleans**: Converted to 0/1 for comparison (e.g., `isActive == 1`)
- **Dates**: Converted to days since (e.g., `membership.joinDate >= 30`)
- **Nested Objects**: Accessed using dot notation (e.g., `stats.totalSpent >= 1000`)

## ⚠️ Error Handling

When an invalid field name is used:

1. **Warning logged**: `Invalid passenger field: invalid_field. Valid fields are: stats.totalTrips, membership.level, ...`
2. **Value returned**: `0` (no coupon applied)
3. **Service continues**: No crash, graceful degradation

## 🚀 Benefits

1. **No Code Changes**: Add new coupon rules by updating the fare configuration
2. **Database-Driven**: All passenger fields are automatically available
3. **Type Safe**: Automatic validation prevents invalid field names
4. **Flexible**: Support for nested fields and calculated values
5. **Maintainable**: Clear separation between business logic and configuration
6. **Personalized**: Coupons based on actual passenger behavior and profile

## 📊 Example Usage

```javascript
// This will work with any valid passenger field
const dynamicCouponRule = {
  code: "LOYALTY_BONUS",
  type: "percentage",
  value: 15,
  maxDiscount: 100,
  minFare: 200,
  passengerField: "stats.totalTrips",
  condition: "stats.totalTrips >= 20",
  description: "Loyalty bonus for frequent riders"
};

// This will log a warning and return 0
const invalidRule = {
  code: "INVALID_COUPON",
  type: "percentage",
  value: 10,
  passengerField: "invalidField",  // Invalid field
  condition: "invalidField >= 100",
  description: "Invalid coupon"
};
```

## 🔄 Migration from Static Coupons

Static coupons are still supported for backward compatibility:

- `FIRST_RIDE` → Static coupon (usage-based)
- `WEEKEND_OFF` → Static coupon (time-based)
- `LOYALTY_BONUS` → Dynamic coupon (behavior-based)
- `HIGH_SPENDER` → Dynamic coupon (spending-based)

The system automatically combines both static and dynamic coupons when getting all available coupons.

## 📈 Passenger Profile Analysis

The system automatically calculates derived metrics:

- **Completion Rate**: `(completedTrips / totalTrips) * 100`
- **Days Since Last Trip**: `currentDate - lastTripDate`
- **Membership Duration**: `currentDate - joinDate`
- **Total Spent**: Sum of all trip fares
- **Average Rating**: `totalRating / ratingCount`

## 🎯 Use Cases

### Loyalty Programs
- Reward frequent riders with percentage discounts
- Bonus for high completion rates
- Points-based rewards

### Behavioral Targeting
- Return customer incentives
- High spender rewards
- Rating-based bonuses

### Membership Tiers
- Gold/Platinum member benefits
- Tier-specific discounts
- Membership duration rewards

### Seasonal Campaigns
- New user bonuses
- Holiday-specific rewards
- Time-based incentives

This dynamic system ensures that coupons are personalized based on actual passenger behavior and profile data, providing a more engaging and rewarding experience. 