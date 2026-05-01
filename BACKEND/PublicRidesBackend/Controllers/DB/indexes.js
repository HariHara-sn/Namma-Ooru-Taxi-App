const indexes = {
    drivers: [
        { homeLocation: "2dsphere" },
        { location: "2dsphere" }
    ],
    ocrlog: [
        { driverId: 1 }
    ],
    passengerGarageVehicles: [
        { passengerId: 1 },
        { regNo: 1 }
    ]
};

module.exports = {
    indexes
};
