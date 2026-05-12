### Step 3: Test the Ride-Booking Flow (REST APIs)
Now test the flow with authenticated tokens.

1. **Get Ride Estimation (Fare Calculation)** (POST):
   - URL: `{{base_url}}/publicrides/customer/getRideEstimation`
   - Headers: `Authorization: Bearer {{passenger_token}}`
   - Body (JSON): Provide source/destination coordinates, distance, duration, vehicle type. Backend calculates fare via FareEngine.
     ```
     {
       "coordinates": [12.9716, 77.5946],  // Example: Bangalore coords
       "distance": 10,  // in km
       "duration": 20,  // in minutes
       "zone": "residential",
       "vehicleType": "sedan"
     }
     ```
   - Send → Response includes `result` (fare range), `regionCode`, etc. Note the estimated fare.

2. **Book the Trip** (POST):
   - URL: `{{base_url}}/publicrides/customer/bookTrip`
   - Headers: `Authorization: Bearer {{passenger_token}}`
   - Body (JSON): Include source, destination, car (vehicleType), and fareAmount from estimation. This creates a PENDING trip and assigns drivers.
     ```
     {
       "source": {
         "coordinates": [12.9716, 77.5946],
         "address": "Source Address"
       },
       "destination": {
         "coordinates": [13.0827, 80.2707],
         "address": "Destination Address"
       },
       "vehicleType": "sedan",
       "minFare": 150,  // From estimation
       "regionCode": "default"
     }
     ```
   - Send → Response includes `tripId`. Trip status is PENDING; backend assigns drivers asynchronously.

### Step 4: Test Driver Accept/Reject (REST APIs)
Assume the trip is assigned to your test driver (backend logic handles assignment).

1. **Accept Ride** (POST):
   - URL: `{{base_url}}/publicrides/driver/acceptRide`
   - Headers: `Authorization: Bearer {{driver_token}}`
   - Body (JSON):
     ```
     {
       "tripId": "{{trip_id}}"  // From bookTrip response
     }
     ```
   - Send → Trip status changes to ACCEPTED. OTP generated for passenger.

2. **Reject/Cancel Ride** (POST) - If rejecting:
   - URL: `{{base_url}}/publicrides/driver/cancelTrip`
   - Headers: `Authorization: Bearer {{driver_token}}`
   - Body (JSON):
     ```
     {
       "tripId": "{{trip_id}}",
       "reason": "Not available"
     }
     ```
   - Send → Trip cancelled.

### Step 5: Test Real-Time WebSocket Connections
Postman supports WebSockets for real-time events. Create "WebSocket Request" in Postman.

1. **Connect Passenger WebSocket**:
   - URL: `ws://localhost:3000/publicrides/customer` (from SocketIOService namespaces).
   - Query Params: `accessToken={{passenger_token}}`
   - Connect → Listen for events like `driverAllocated` (when driver accepts), `passangerTripStatus`, etc.

2. **Connect Driver WebSocket**:
   - URL: `ws://localhost:3000/publicrides/driver`
   - Query Params: `accessToken={{driver_token}}`
   - Connect → Listen for `driverTripStatus` (trip assignment notifications).

3. **Simulate and Observe**:
   - After booking (Step 3.2), the driver should receive `driverTripStatus` event via WebSocket.
   - When driver accepts (Step 4.1), passenger receives `driverAllocated` event with driver info/OTP.
   - Use Postman's WebSocket console to send/receive messages. Events are emitted as JSON.

### Tips and Troubleshooting
- **Schemas/Validation**: Check `rideEstimationSchemaPublicrides` and `tripDataSchemaPublicrides` in your code for exact required fields.
- **Errors**: If APIs fail, check response messages (e.g., invalid token, trip not found).
- **Testing Multiple Users**: Use different Postman tabs/windows for passenger and driver.
- **Push Notifications**: If FCM tokens are set, you'll also get push notifications alongside sockets.
- **Logs**: Check server console for socket emissions (e.g., "Emitting driver trip status").
- **Full Flow**: Run in sequence: Auth → Estimate → Book → (Driver notified via socket) → Accept/Reject → (Passenger notified via socket).

If you encounter issues or need more details on specific schemas/events, share the error/response, and I can refine this!- Send → Trip cancelled.

### Step 5: Test Real-Time WebSocket Connections
Postman supports WebSockets for real-time events. Create "WebSocket Request" in Postman.

1. **Connect Passenger WebSocket**:
   - URL: `ws://localhost:3000/publicrides/customer` (from SocketIOService namespaces).
   - Query Params: `accessToken={{passenger_token}}`
   - Connect → Listen for events like `driverAllocated` (when driver accepts), `passangerTripStatus`, etc.

2. **Connect Driver WebSocket**:
   - URL: `ws://localhost:3000/publicrides/driver`
   - Query Params: `accessToken={{driver_token}}`
   - Connect → Listen for `driverTripStatus` (trip assignment notifications).

3. **Simulate and Observe**:
   - After booking (Step 3.2), the driver should receive `driverTripStatus` event via WebSocket.
   - When driver accepts (Step 4.1), passenger receives `driverAllocated` event with driver info/OTP.
   - Use Postman's WebSocket console to send/receive messages. Events are emitted as JSON.

### Tips and Troubleshooting
- **Schemas/Validation**: Check `rideEstimationSchemaPublicrides` and `tripDataSchemaPublicrides` in your code for exact required fields.
- **Errors**: If APIs fail, check response messages (e.g., invalid token, trip not found).
- **Testing Multiple Users**: Use different Postman tabs/windows for passenger and driver.
- **Push Notifications**: If FCM tokens are set, you'll also get push notifications alongside sockets.
- **Logs**: Check server console for socket emissions (e.g., "Emitting driver trip status").
- **Full Flow**: Run in sequence: Auth → Estimate → Book → (Driver notified via socket) → Accept/Reject → (Passenger notified via socket).

If you encounter issues or need more details on specific schemas/events, share the error/response, and I can refine this!