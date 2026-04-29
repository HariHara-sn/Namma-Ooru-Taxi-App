
const Mongo = require('../Controllers/DB/Mongo');

const SERVINGAREAS = 'servingareas';
class RegionalOffices {

    /**
     * Get serving area by coordinates (point-in-polygon check)
     * @param {Array} coordinates - [longitude, latitude] coordinates to check
     * @returns {Promise<Object|null>} The serving area object or null if not found
     */
    static async getRegionalOffice(coordinates) {
        try {
            
            // Try a simple geospatial query first
            const simpleQuery = await Mongo.findOne(SERVINGAREAS, {
                polygon: { $geoIntersects: { $geometry: { type: "Point", coordinates: coordinates } } },
                isActive: true
            });

            if (!simpleQuery) {
                console.log("No serving area found with simple geospatial query");
                return null;
            }

            console.log("Found serving area with simple query:", simpleQuery.name);

            // Now try the full aggregation pipeline
            const pipeline = [
                {
                    $match: {
                        polygon: {
                            $geoIntersects: {
                                $geometry: {
                                    type: "Point",
                                    coordinates: coordinates
                                }
                            }
                        },
                        isActive: true
                    }
                },

                {
                    $addFields: {
                        regionalOfficeObjectId: "$regionalOffice"
                    }
                },
                
                {
                    $lookup: {
                        from: 'regionaloffices',
                        localField: 'regionalOfficeObjectId',
                        foreignField: '_id',
                        as: 'regionalOffice'
                    }
                },
                {
                    $unwind: {
                        path: '$regionalOffice',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'fareconfigs',
                        localField: 'regionalOffice.fareConfig',
                        foreignField: '_id',
                        as: 'fareConfig'
                    }
                },
                {
                    $unwind: {
                        path: '$fareConfig',
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $project: {
                        _id: 1,
                        regionalOffice: 1,
                        fareConfig: 1
                    }
                }
               
            ];
              
            
          
            const servingArea = await Mongo.aggregate(SERVINGAREAS, pipeline);
            
            if(!servingArea || servingArea.length === 0){
                console.log("No results from first aggregation pipeline, trying to get regional office directly...");
                
                // Try to get regional office directly from the serving area
                if (simpleQuery && simpleQuery.regionalOffice) {
                    console.log("Getting regional office directly from serving area");
                    
                    // Get regional office by ID
                    const regionalOffice = await Mongo.findOne('regionaloffices', {
                        _id: simpleQuery.regionalOffice,
                        isActive: true
                    });
                    
                    if (regionalOffice) {
                        // Get fare config
                        const fareConfig = await Mongo.findOne('fareconfigs', {
                            _id: regionalOffice.fareConfig,
                            isActive: true
                        });
                        
                        return {
                            _id: simpleQuery._id,
                            regionalOffice: regionalOffice,
                            fareConfig: fareConfig
                        };
                    }
                }
                
                console.log("Direct regional office lookup failed, trying second pipeline...");
                
                // Second pipeline with different approach
                const secondPipeline = [
                    {
                        $match: {
                            polygon: {
                                $geoIntersects: {
                                    $geometry: {
                                        type: "Point",
                                        coordinates: coordinates
                                    }
                                }
                            },
                            isActive: true
                        }
                    },
                    {
                        $addFields: {
                            regionalOfficeObjectId: { $toObjectId: "$regionalOffice" }
                        }
                    },
                    {
                        $lookup: {
                            from: 'regionaloffices',
                            localField: 'regionalOfficeObjectId',
                            foreignField: '_id',
                            as: 'regionalOffice'
                        }
                    },
                    
                    {
                        $project: {
                            _id: 1,
                            regionalOffice: 1,
                            fareConfig: 1
                        }
                    }
                ];
                
                const secondServingArea = await Mongo.aggregate(SERVINGAREAS, secondPipeline);
                
                if(secondServingArea && secondServingArea.length > 0){
                    console.log("Second pipeline successful");
                    return secondServingArea[0];
                }
                
                console.log("Second pipeline failed, trying individual queries...");
                
                // Final fallback: Get regional office ID directly from the simple query
                if (simpleQuery && simpleQuery.regionalOffice) {
                    console.log("Using individual queries fallback");
                    
                    // Get regional office by ID
                    const regionalOffice = await Mongo.findOne('regionaloffices', {
                        _id: simpleQuery.regionalOffice,
                        isActive: true
                    });
                    
                    if (regionalOffice) {
                        // Get fare config
                        const fareConfig = await Mongo.findOne('fareconfigs', {
                            _id: regionalOffice.fareConfig,
                            isActive: true
                        });
                        
                        return {
                            _id: simpleQuery._id,
                            regionalOffice: regionalOffice,
                            fareConfig: fareConfig
                        };
                    }
                }
                
                return null;
            }

            return servingArea[0];
        } catch (error) {
            console.error('Error getting regional office:', error);
            return null;
        }
    }


    
}

module.exports = RegionalOffices;
