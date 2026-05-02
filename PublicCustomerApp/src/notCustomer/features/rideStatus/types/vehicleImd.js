import React from 'react';
import { Image, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AutoIcon from '../../../assets/vehicle/AUTO.webp';
import BikeIcon from '../../../assets/vehicle/BIKE.webp';
import SuvIcon from '../../../assets/vehicle/SUV.webp';
import SedanIcon from '../../../assets/vehicle/SEDAN.webp';
import HatchbackIcon from '../../../assets/vehicle/HATCHBACK.webp';
import ExSedanIcon from '../../../assets/vehicle/ExSEDAN.webp';
import ElectricAutoIcon from '../../../assets/vehicle/ELECTRIC_AUTO.webp';
import ElectricBikeIcon from '../../../assets/vehicle/BIKE.webp';
import ElectricHatchbackIcon from '../../../assets/vehicle/HATCHBACK.webp';
import ElectricSedanIcon from '../../../assets/vehicle/SEDAN.webp';
import ElectricSuvIcon from '../../../assets/vehicle/SUV.webp';

export const getVehicleImage = (type,style,usedScreen=null) => {
  
    switch(type){
        case 'AUTO':
            return <Image source={AutoIcon} style={style} />
        case 'BIKE':
            return <Image source={BikeIcon} style={style} />
        case 'SUV':
            return <Image source={SuvIcon} style={style} />
        case 'SEDAN':
            return <Image source={SedanIcon} style={style} />
        case 'HATCHBACK':
            return <Image source={HatchbackIcon} style={style} />
        case 'EX_SEDAN':
            return <Image source={ExSedanIcon} style={style} />
        case 'ELECTRIC_AUTO':
            return <View ><Image source={ElectricAutoIcon} style={style} /><Icon name="bolt" size={30} color="#00770d" style={{position:'absolute',top:usedScreen=="ratingScreen"?-10:10,left:usedScreen!=="ratingScreen"?-20:-10}}/></View>
        case 'ELECTRIC_BIKE':
            return <View ><Image source={ElectricBikeIcon} style={style} /><Icon name="bolt" size={30} color="#00770d" style={{position:'absolute',top:usedScreen=="ratingScreen"?-10:10,left:usedScreen!=="ratingScreen"?-20:-10}}/></View>
        case 'ELECTRIC_HATCHBACK':
                return <View ><Image source={ElectricHatchbackIcon} style={style} /><Icon name="bolt" size={30} color="#00770d" style={{position:'absolute',top:usedScreen=="ratingScreen"?-10:10,left:usedScreen!=="ratingScreen"?-20:-10}}/></View>
        case 'ELECTRIC_SEDAN':
            return <View ><Image source={ElectricSedanIcon} style={style} /><Icon name="bolt" size={30} color="#00770d" style={{position:'absolute',top:usedScreen=="ratingScreen"?-10:10,left:usedScreen!=="ratingScreen"?-20:-10}}/></View>
        case 'ELECTRIC_SUV':
            return <View ><Image source={ElectricSuvIcon} style={style} /><Icon name="bolt" size={30} color="#00770d" style={{position:'absolute',top:usedScreen=="ratingScreen"?-10:10,left:usedScreen!=="ratingScreen"?-20:-10}}/></View>
        default:
            return <Image source={AutoIcon} style={style} />
    }
}