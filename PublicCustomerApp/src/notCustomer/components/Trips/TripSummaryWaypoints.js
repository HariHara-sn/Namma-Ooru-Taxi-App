import React, { useState, useEffect } from 'react';
import { View, Text, Image } from 'react-native';

import SearchAPI from '../../controllers/NEMap/Search';
import { TripSummaryStyle } from '../../styles/Trips/TripSummary';
import { utils } from '../../utils/Utils';

import MarkerImage from '../../assets/image/Trips/Summary/Marker.svg';
import EndMarkerImage from '../../assets/image/Trips/Summary/EndMarker.svg';
import StartMarkerImage from '../../assets/image/Trips/Summary/StartMarker.webp';

const TripSummaryWaypoints = () => {

    let tripDetails = {
        start_time: "2022-11-06T10:15",
        startLocationName: "Start Location",
        end_time: "2022-11-06T10:15",
        endLocationName: "End Location",
        waypoints: [
            {
                location: {
                    x: 77.5946,
                    y: 12.9716
                },
                arrival_time: "2022-11-06T10:15",
                employee_details: [
                    {
                        name: "Employee 1"
                    }
                ]
            },
            {
                location: {
                    x: 77.5946,
                    y: 12.9716
                },
                arrival_time: "2022-11-06T10:15",
                employee_details: [
                    {
                        name: "Employee 2"
                    }
                ]
            }
        ],
        trip_type: "pickup"

    }


    const [locations, setLocations] = useState([]);
    const searchAPI = new SearchAPI();

    useEffect(() => {
        loadLocations();
    }, []);

    const getLocationInfo = (location) => {
        return new Promise((resolve, reject) => {
            searchAPI.reverseGeocode([location['x'], location['y']], true)
                .then((startLocationName) => {
                    resolve(startLocationName);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    };

    const loadLocations = async () => {
        const { waypoints, trip_type } = tripDetails;
        const locationPromises = waypoints.map(async (location, index) => {
            let last = waypoints.length - 1 === index;

            if ((trip_type === 'pickup' && last) || (trip_type === 'drop' && index === 0)) {
                return null;
            }

            const locationInfo = await getLocationInfo(location.location);
            return { ...location, locationInfo };
        });

        const resolvedLocations = await Promise.all(locationPromises);
        setLocations(resolvedLocations.filter(location => location !== null));
    };

    const renderLocations = () => {
        return locations.map((data, index) => (
            <View style={[TripSummaryStyle.location]} key={index}>
                <Text style={TripSummaryStyle.name}>
                    {data.employee_details && data.employee_details[0]?.name || `wayPoint- ${index + 1}`}
                </Text>
                <Text style={TripSummaryStyle.address}>{data.locationInfo}</Text>
                <Text style={TripSummaryStyle.time}>{utils.formatDateAndTime(data.arrival_time)}</Text>
                <MarkerImage style={TripSummaryStyle.marker} />
            </View>
        ));
    };

    return (
        <View style={TripSummaryStyle.locations}>
            <View style={[TripSummaryStyle.location]}>
                <Text style={TripSummaryStyle.name}>Start Location</Text>
                <Text style={TripSummaryStyle.address}>{tripDetails.startLocationName}</Text>
                <Text style={TripSummaryStyle.time}>{utils.formatDateAndTime(tripDetails.start_time)}</Text>
                <Image source={StartMarkerImage} style={TripSummaryStyle.marker} />
            </View>
            {renderLocations()}
            <View style={[TripSummaryStyle.location, { borderLeftColor: 'transparent' }]}>
                <Text style={TripSummaryStyle.name}>End Location</Text>
                <Text style={TripSummaryStyle.address}>{tripDetails.endLocationName}</Text>
                <Text style={TripSummaryStyle.time}>{utils.formatDateAndTime(tripDetails.end_time || new Date())}</Text>
                <EndMarkerImage style={TripSummaryStyle.marker} />
            </View>
        </View>
    );
};

export default TripSummaryWaypoints;
