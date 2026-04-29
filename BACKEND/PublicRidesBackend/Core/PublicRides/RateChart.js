const VehicleType = require("./VehicleType");

module.exports = {
    [VehicleType.SEDAN]: {
        baseRate: 100,
        perKmRate: 10,
        minimumFare: 100,
        extraKmRate: 5,
        extraMinRate: 1
    },
    [VehicleType.SUV]: {
        baseRate: 150,
        perKmRate: 15,
        minimumFare: 150,
        extraKmRate: 10,
        extraMinRate: 2
    },
    [VehicleType.AUTO]: {
        baseRate: 200,
        perKmRate: 20,
        minimumFare: 200,
        extraKmRate: 15,
        extraMinRate: 3
    },
    [VehicleType.HATCHBACK]: {
        baseRate: 120,
        perKmRate: 12,
        minimumFare: 120,
        extraKmRate: 8,
        extraMinRate: 2
    },
    [VehicleType.BIKE]: {
        baseRate: 100,
        perKmRate: 10,
        minimumFare: 100,
        extraKmRate: 5,
        extraMinRate: 1
    },
   
}