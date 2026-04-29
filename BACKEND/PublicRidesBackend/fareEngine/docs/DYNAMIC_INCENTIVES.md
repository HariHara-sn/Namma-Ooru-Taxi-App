# Dynamic Incentive System

The fare calculation system now supports **dynamic incentive types** that use the exact field names from the driver collection. This allows you to add new incentive rules in the database without restarting the service.

## 🎯 Key Features

- ✅ **No hardcoded incentive types** - Use exact field names from driver collection
- ✅ **Dynamic validation** - System validates field names automatically
- ✅ **Nested field support** - Use dot notation for nested fields (e.g., `liveStats.isOnline`)
- ✅ **Runtime configuration** - Add new rules without code changes
- ✅ **Automatic error handling** - Invalid field names return warnings

## 📋 Valid Field Names

### Basic Fields
- `rating` - Driver rating (number)
- `tripCountToday` - Today's trip count (number)
- `totalTripsAccepted` - Total accepted trips (number)
- `totalTripsRejected` - Total rejected trips (number)
- `totalTripsCompleted` - Total completed trips (number)
- `isTrusted` - Trusted driver status (boolean)
- `isActive` - Active driver status (boolean)
- `isVerified` - Verified driver status (boolean)

### Nested Fields (using dot notation)
- `liveStats.isOnline` - Online status (boolean)
- `liveStats.lastSeen` - Last seen timestamp (date)
- `earnings.totalEarnings` - Total earnings (number)
- `earnings.todayEarnings` - Today's earnings (number)
- `earnings.weeklyEarnings` - Weekly earnings (number)
- `earnings.monthlyEarnings` - Monthly earnings (number)
- `preferences.maxDistance` - Max distance preference (number)
- `preferences.minFare` - Min fare preference (number)

### Calculated Fields
- `acceptance_rate` - Calculated acceptance rate (number)
- `total_trips` - Total trips (calculated)
- `rejection_rate` - Calculated rejection rate (number)

## 🔧 API Endpoint

Get all valid incentive types:

```bash
GET /api/fare/incentive-types
```

Response:
```json
{
  "success": true,
  "data": {
    "validFields": ["rating", "tripCountToday", "liveStats.isOnline", ...],
    "fieldDescriptions": {
      "rating": {
        "description": "High rating",
        "type": "number",
        "example": 4.5
      },
      "liveStats.isOnline": {
        "description": "Online status",
        "type": "boolean",
        "example": true
      }
    },
    "usage": "Use these exact field names as incentive types in your fare configuration"
  }
}
```

## 📝 Configuration Examples

### Basic Incentive Rules

```json
{
  "incentives": {
    "driverIncentives": [
      {
        "type": "rating",
        "condition": ">= 4.5",
        "bonus": 5
      },
      {
        "type": "tripCountToday",
        "condition": ">= 10",
        "bonus": 3
      },
      {
        "type": "isTrusted",
        "condition": "== 1",
        "bonus": 5
      }
    ],
    "driverPenalties": [
      {
        "type": "rating",
        "condition": "< 3.0",
        "penalty": 10
      },
      {
        "type": "totalTripsRejected",
        "condition": "> 20",
        "penalty": 3
      }
    ]
  }
}
```

### Nested Field Examples

```json
{
  "incentives": {
    "driverIncentives": [
      {
        "type": "liveStats.isOnline",
        "condition": "== 1",
        "bonus": 2
      },
      {
        "type": "earnings.todayEarnings",
        "condition": ">= 1000",
        "bonus": 3
      },
      {
        "type": "earnings.weeklyEarnings",
        "condition": ">= 5000",
        "bonus": 5
      }
    ],
    "driverPenalties": [
      {
        "type": "liveStats.isOnline",
        "condition": "== 0",
        "penalty": 2
      }
    ]
  }
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

- **Numbers**: Direct comparison (e.g., `rating >= 4.5`)
- **Booleans**: Converted to 0/1 for comparison (e.g., `isTrusted == 1`)
- **Strings**: Converted to numbers if possible (e.g., `rating` string becomes number)
- **Nested Objects**: Accessed using dot notation (e.g., `liveStats.isOnline`)

## ⚠️ Error Handling

When an invalid field name is used:

1. **Warning logged**: `Invalid incentive type: invalid_field. Valid fields are: rating, tripCountToday, ...`
2. **Value returned**: `0` (no incentive/penalty applied)
3. **Service continues**: No crash, graceful degradation

## 🚀 Benefits

1. **No Code Changes**: Add new incentive rules by updating the fare configuration
2. **Database-Driven**: All driver fields are automatically available
3. **Type Safe**: Automatic validation prevents invalid field names
4. **Flexible**: Support for nested fields and calculated values
5. **Maintainable**: Clear separation between business logic and configuration

## 📊 Example Usage

```javascript
// This will work with any valid driver field
const incentiveRule = {
  type: "earnings.monthlyEarnings",  // Nested field
  condition: ">= 30000",
  bonus: 10
};

// This will log a warning and return 0
const invalidRule = {
  type: "invalidField",  // Invalid field
  condition: ">= 100",
  bonus: 5
};
```

## 🔄 Migration from Hardcoded Types

Old hardcoded types are still supported for backward compatibility:

- `acceptance_rate` → `acceptance_rate` (calculated field)
- `rating` → `rating` (direct field)
- `trip_count_today` → `tripCountToday` (direct field)
- `is_trusted` → `isTrusted` (direct field)
- `is_online` → `liveStats.isOnline` (nested field)

The system automatically maps old types to new field names while maintaining backward compatibility. 