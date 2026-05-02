import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Colors } from '../../../common/constants/constants';

const CategoryIcon = ({ category, isFastMatch }) => {
  switch (category) {
    case 'hotel':
      return <Icon name="hotel" size={22} color={Colors.dark} />;
    case 'airport':
      return <Icon name="local-airport" size={22} color={Colors.dark} />;
    case 'railway_station':
      return <Icon name="railway_station" size={22} color={Colors.dark} />;
    case 'bus station':
      return <FontAwesome name="bus" size={22} color={Colors.dark} />;
    case 'hospital':
      return <FontAwesome name="hospital" size={22} color={Colors.dark} />;
    case 'school':
      return <FontAwesome name="school" size={18} color={Colors.dark} />;
    case 'university':
      return <Icon name="school" size={22} color={Colors.dark} />;
    case 'college':
      return <Icon name="school" size={22} color={Colors.dark} />;
    case 'government_office':
      return <FontAwesome name="building" size={22} color={Colors.dark} />;
    case 'station':
      return <FontAwesome name="building" size={22} color={Colors.dark} />;
    case 'police station':
      return <MaterialCommunityIcons name="police-badge" size={22} color={Colors.dark} />;
    case 'fire station':
      return <MaterialCommunityIcons name="fire-station" size={22} color={Colors.dark} />;
    case 'police':
      return <MaterialCommunityIcons name="police-badge" size={22} color={Colors.dark} />;
    case 'restaurant':
      return <FontAwesome name="utensils" size={20} color={Colors.dark} />;
    case 'fast food':
      return <FontAwesome name="utensils" size={20} color={Colors.dark} />;
    case 'cafe':
      return <FontAwesome name="coffee" size={18} color={Colors.dark} />;
    case 'hostel':
      return <FontAwesome name="building" size={22} color={Colors.dark} />;
    case 'library':
      return <MaterialCommunityIcons name="library" size={22} color={Colors.dark} />;
    case 'bar':
      return <FontAwesome name="beer" size={22} color={Colors.dark} />;
    case 'night club':
      return <FontAwesome name="music" size={22} color={Colors.dark} />;
    case 'parking':
      return <MaterialCommunityIcons name="parking" size={22} color={Colors.dark} />;
    case 'bank':
      return <MaterialCommunityIcons name="bank" size={22} color={Colors.dark} />;
    case 'shopping_mall':
      return <FontAwesome name="shopping-bag" size={22} color={Colors.dark} />;
    case 'supermarket':
      return <FontAwesome name="shopping-bag" size={22} color={Colors.dark} />;
    case 'grocery_store':
      return <FontAwesome name="shopping-bag" size={22} color={Colors.dark} />;
    case 'department_store':
      return <FontAwesome name="shopping-bag" size={22} color={Colors.dark} />;
    case 'mall':
      return <FontAwesome name="shopping-bag" size={18} color={Colors.dark} />;
    case 'shopping_center':
      return <FontAwesome name="shopping-bag" size={22} color={Colors.dark} />;
    case 'taxi':
      return <FontAwesome name="taxi" size={22} color={Colors.dark} />;
    default:
      return <Icon
      name="location-on"
      size={22}
      color={isFastMatch ? Colors.grey_dark : Colors.dark}
    />
  }
};

CategoryIcon.propTypes = {
  category: PropTypes.string,
  isFastMatch: PropTypes.bool,
  isFromHistory: PropTypes.bool,
};

CategoryIcon.defaultProps = {
  category: '',
  isFastMatch: false,
  isFromHistory: false,
};

export default CategoryIcon; 