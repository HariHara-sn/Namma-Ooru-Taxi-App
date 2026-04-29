

module.exports = function (deviceId) {

    return [
        {
            $match: {
                _id: deviceId
            }
        },
        {
            $lookup: {
                from: "groups",
                let: { deviceId: "$_id" },
                pipeline: [
                    { $unwind: "$devices" },
                    {
                        $match: {
                            $expr: {
                                $eq: ["$$deviceId", "$devices.deviceId"] // Adjusted for array of objects with deviceId
                            }
                        }
                    },
                    { $project: { geofences: "$geofences.geofenceId" } } // Project to transform structure if needed
                ],
                as: "groupData"
            }
        },
        { $unwind: "$groupData" },
        {
            $group: {
                _id: "$_id",
                deviceGeofences: { $push: "$geofences" }, // Keep as is for device geofences
                groupGeofences: { $push: "$groupData.geofences" } // Push group geofences to create an array of arrays
            }
        },
        {
            $project: {
                _id: 1,
                deviceGeofences: {
                    $reduce: {
                        input: "$deviceGeofences",
                        initialValue: [],
                        in: { $concatArrays: ["$$value", "$$this"] } // Flatten the array of arrays
                    }
                },
                groupGeofences: {
                    $reduce: {
                        input: "$groupGeofences",
                        initialValue: [],
                        in: { $concatArrays: ["$$value", "$$this"] } // Flatten the array of arrays
                    }
                }
            }
        },
        {
            $lookup: {
                from: "geofences",
                let: { deviceGeofences: "$deviceGeofences", groupGeofences: "$groupGeofences" },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$deviceGeofences"] } } }
                ],
                as: "matchingDeviceGeofences"
            }
        },
        {
            $lookup: {
                from: "geofences",
                let: { groupGeofences: "$groupGeofences" },
                pipeline: [
                    { $match: { $expr: { $in: ["$_id", "$$groupGeofences"] } } }
                ],
                as: "matchingGroupGeofences"
            }
        },
        {
            $project: {
                _id: 1,
                deviceGeofences: 1,
                groupGeofences: 1,
                matchingDeviceGeofences: 1,
                matchingGroupGeofences: 1
            }
        }
    ]
}