const REASONS = Object.freeze({
    // --- PASSENGER REASONS (1-30) ---
    // Issues with the Driver/Vehicle
    1: 'driver_taking_too_long',
    2: 'driver_driving_away_from_pickup',
    3: 'driver_asked_to_cancel',
    4: 'driver_not_responding',
    5: 'driver_vehicle_mismatch', 
    6: 'driver_driver_mismatch', 
    7: 'driver_rude_or_unprofessional',
    8: 'vehicle_condition_unsafe_or_unclean',
    9: 'driver_refused_destination',
    

    // Passenger Personal Reasons
    10: 'booked_by_mistake',
    11: 'changed_mind',
    12: 'wait_time_too_long',
    13: 'wrong_pickup_location_set',
    14: 'found_another_ride',
    15: 'price_too_high',
    16: 'trip_no_longer_needed',
    17: 'luggage_issue',
    

    // --- DRIVER REASONS (31-60) ---
    // Issues with the Passenger
});

const DRIVER_REASONS = Object.freeze({
    'D01': 'reached_destination', 
    'D02': 'rider_unreachable',
    'D03': 'pickup_incorrect_or_far',
    'D04': 'destination_too_far',
    'D05': 'drop_changed', 
    'D06': 'payment_issue', 
    'D07': 'vehicle_issue', 
    'D08': 'personal_emergency', 
    'D09': 'traffic_or_weather',
    'D10': 'other'
})

const REASON_CODE = REASONS;

const REASON_CODE_DRIVERS = DRIVER_REASONS

const REASON_NUMBER = Object.freeze(
    Object.fromEntries(
        Object.entries(REASONS).map(([code, reason]) => [reason, Number(code)])
    )
);

const DRIVER_REASON_NUMBER = Object.freeze(
    Object.fromEntries(
        Object.entries(REASONS).map(([code, reason]) => [reason, Number(code)])
    )
);

/**
 * Get reason text by number code.
 * @param {number} statusOrCode
 * @param {number} [code]
 * @returns {string|null}
 */
function getCancelReason(statusOrCode, code) {
    const resolvedCode = typeof statusOrCode === 'number' ? statusOrCode : code;
    
    if (typeof resolvedCode !== 'number') return null;
    
    return REASONS[resolvedCode] ?? null; 
}

/**
 * Get number code by reason text.
 * @param {string|number} statusOrReason
 * @param {string} [reason]
 * @returns {number|null}
 */
function getCancelCode(statusOrReason, reason) {
    const resolvedReason = typeof statusOrReason === 'string' ? statusOrReason : reason;
    
    if (typeof resolvedReason !== 'string') return null;
    
    return REASON_NUMBER[resolvedReason] ?? null;
}

module.exports = {
    REASONS,
    REASON_CODE,
    REASON_NUMBER,
    getCancelReason,
    getCancelCode,
    DRIVER_REASONS,
    REASON_CODE_DRIVERS,
    DRIVER_REASON_NUMBER
};