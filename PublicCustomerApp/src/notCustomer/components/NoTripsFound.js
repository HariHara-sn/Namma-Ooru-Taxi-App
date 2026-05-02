
import React, { useState } from 'react';
import { View, Text, Image } from 'react-native';

import NoTripsFoundImg from '../assets/image/emptyTrips.png'


const NoTripsFound = ({ text }) => {

    const [message, setMessage] = useState(text || "No Trips Found");

    return (
        <View style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'white', padding: 20 }}>
            <Image
                source={NoTripsFoundImg}
                style={{ width: 300, height: 500 }}
            />
            <Text style={{ fontSize: 20, color: '#a9a9a9',fontFamily:"regular"}}>{message}</Text>
        </View>
    )

}


export default NoTripsFound;
