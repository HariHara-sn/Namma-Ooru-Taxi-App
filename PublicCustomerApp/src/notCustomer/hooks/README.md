# Custom Hooks

This directory contains custom React hooks for the PublicCustomerApp.

## Available Hooks

### useRideMatching

A custom hook that manages ride matching status and integrates with the ride matching socket service.

#### Features

- **Socket Management**: Automatically initializes and manages the ride matching socket connection
- **Status Tracking**: Tracks matching status (searching, success, failed, cancelled)
- **Driver Information**: Stores and provides access to driver details and location
- **Retry Logic**: Provides retry functionality for failed matching attempts
- **State Management**: Integrates with Zustand store for persistent state

#### Usage

```javascript
import useRideMatching from '../hooks/useRideMatching';

const MyComponent = () => {
  const {
    // State
    status,
    message,
    driverName,
    driverLocation,
    
    // Computed states
    isMatchingActive,
    isMatchingFailed,
    isDriverFound,
    
    // Methods
    startMatching,
    stopMatching,
    retryMatching,
    resetMatching,
    getMatchingStatus,
  } = useRideMatching();

  const handleBookRide = async (tripId) => {
    const success = await startMatching(tripId);
    if (success) {
      console.log('Ride matching started successfully');
    }
  };

  const handleRetry = async (tripId) => {
    const success = await retryMatching(tripId);
    if (success) {
      console.log('Ride matching retry started');
    }
  };

  const handleCancel = () => {
    stopMatching();
  };

  return (
    <View>
      {isMatchingActive && (
        <Text>Searching for drivers...</Text>
      )}
      
      {isMatchingFailed && (
        <Button onPress={() => handleRetry(tripId)} title="Retry" />
      )}
      
      {isDriverFound && (
        <Text>Driver found: {driverName}</Text>
      )}
    </View>
  );
};
```

#### API Reference

##### State Properties

- `status`: Current matching status ('searching', 'success', 'failed', 'cancelled', null)
- `message`: Status message for display
- `driverName`: Name of the assigned driver (if found)
- `driverLocation`: Object with `latitude` and `longitude` of driver location

##### Computed States

- `isMatchingActive`: Boolean indicating if matching is currently active
- `isMatchingFailed`: Boolean indicating if matching failed
- `isDriverFound`: Boolean indicating if a driver was found

##### Methods

- `initializeSocket()`: Initialize the socket connection (called automatically)
- `startMatching(tripId, passengerId?)`: Start the ride matching process
- `stopMatching()`: Stop the current matching process
- `retryMatching(tripId)`: Retry the matching process for a trip
- `resetMatching()`: Reset all matching state
- `getMatchingStatus()`: Get complete matching status object

#### Integration with Existing Components

The hook is already integrated with:

1. **SearchLoader Component**: Uses the hook for retry functionality and status display
2. **Booking Service**: Uses the hook to start matching after successful booking

#### Socket Events

The hook automatically listens for these socket events:

- `matching_update`: Updates matching status and driver information
- `connect`: Handles successful socket connection
- `connect_error`: Handles connection errors
- `disconnect`: Handles socket disconnection

### useDebounce

A hook that debounces function calls to prevent excessive API calls.

### useCustomBackHandler

A hook that handles custom back button behavior in React Native.

### useQuery

A hook that provides query functionality with success and error callbacks.

## Usage Guidelines

1. **Import hooks at the top of your component**:
   ```javascript
   import useRideMatching from '../hooks/useRideMatching';
   ```

2. **Use hooks at the beginning of your component**:
   ```javascript
   const MyComponent = () => {
     const { status, startMatching } = useRideMatching();
     // ... rest of component
   };
   ```

3. **Handle loading and error states**:
   ```javascript
   if (isMatchingActive) {
     return <LoadingSpinner />;
   }
   
   if (isMatchingFailed) {
     return <ErrorMessage message={message} />;
   }
   ```

4. **Clean up on component unmount** (handled automatically by the hook)

## Best Practices

- Always check the return values of async methods
- Use the computed states (`isMatchingActive`, `isMatchingFailed`, etc.) for conditional rendering
- Handle errors gracefully with try-catch blocks
- Use the `getMatchingStatus()` method when you need the complete status object
- Reset matching state when starting a new booking flow 