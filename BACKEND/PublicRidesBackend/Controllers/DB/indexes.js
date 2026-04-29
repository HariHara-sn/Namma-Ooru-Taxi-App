const indexes = {
    drivers: [
        { homeLocation: "2dsphere" },
        { location: "2dsphere" }
    ],
    ocrlog: [
        { driverId: 1 }
    ]
};

module.exports = {
    indexes
};
