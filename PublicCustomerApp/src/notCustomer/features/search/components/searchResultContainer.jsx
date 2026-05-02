import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SectionList } from 'react-native';
import PropTypes from 'prop-types';
import { colors, Fonts } from '../../../constants/constants';
import { height, utils } from '../../../utils/Utils';
import CategoryIcon from '../../../components/Common/CategoryIcon';


const getPrimaryName = (item) => {
  if (!item) return '';
  if (item.primaryText) return item.primaryText;
  if (typeof item.placeName === 'string') return item.placeName;
  if (Array.isArray(item.placeName) && item.placeName.length > 0) return item.placeName[0];
  if (Array.isArray(item.name) && item.name.length > 0) return item.name[0];
  if (item.name) return item.name;
  if (Array.isArray(item.place_name) && item.place_name.length > 0) return item.place_name[0];
  return '';
};

const getCategory = (item) => {
  if (!item) return '';
  if (typeof item.category === 'string') return item.category;
  if (Array.isArray(item.category) && item.category.length > 0) return item.category[0];
  if (item.primaryCategory) return item.primaryCategory;
  return '';
};

const captitalizeFirstLetter = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};


const getFormattedAddress = (address) => {
  if (!address) return '';
  let finalAddress = "";
  address.forEach(addr => {
    if(addr.trim() !== ""){
      finalAddress += captitalizeFirstLetter(addr) + ", ";
    }
  });
  // Remove the last trailing comma and space, if present
  if (finalAddress.endsWith(", ")) {
    finalAddress = finalAddress.slice(0, -2);
  }
  return finalAddress;
};


// const buildSections = (input) => {
//   if (!Array.isArray(input) || input.length === 0) return [];
//   const looksLikeSections = input.every(s => s && typeof s === 'object' && Object.prototype.hasOwnProperty.call(s, 'data'));
//   if (looksLikeSections) {
//     return input.map(s => ({
//       ...s,
//       data: Array.isArray(s.data) ? s.data : [],
//     }));
//   }
//   return [{ title: 'results', data: input }];
// };

const formatDistanceKm = (meters) => {
  if (!meters && meters !== 0) return '';
  const km = utils.metersToKilometers(Number(meters));
  if (Number.isNaN(km)) return '';
  return `${km.toFixed(1)} km`;
};

const SearchResultContainer = ({ data, onItemPress }) => {


  const onLocationNamePress = (item) => {

  

    const name = getPrimaryName(item);
    const distance = formatDistanceKm(item.distance);
    const longitude = item.pos?.[0] || item.longitude;
    const latitude = item.pos?.[1] || item.latitude;
    const address = getFormattedAddress(item.address) || "";
    const sectionType = item?.stateVectorForMatches ? "fast_match" : "full_search";
    const stateVectorForMatches = item?.stateVectorForMatches;
  
    const searchdata= {
      name,
      distance,
      longitude,
      latitude,
      address,
      label: getCategory(item),
      sectionType,
      stateVectorForMatches,
    };

    onItemPress(searchdata);
  }
  const renderItem = ({ item}) => {
    const name = getPrimaryName(item);
    if (!name) return null;

    

    const category = getCategory(item);
    const distance = formatDistanceKm(item.distance);


    const isFastMatch = item?.sectionType === 'fast_match' || item?.stateVectorForMatches?true:false;
    
    const hasAddress = Array.isArray(item?.address) && item.address.some(addr => typeof addr === 'string' && addr.trim() !== "");
  
    return (
      <TouchableOpacity onPress={() => onLocationNamePress(item)} style={styles.item}>
        <View style={styles.leftIconWrap}>
          <View style={styles.leftIconCircle}>
             <CategoryIcon category={category} isFastMatch={isFastMatch} />
          </View>
        </View>

        <View style={styles.middleContent}>
          <Text numberOfLines={1} style={[styles.nameText, isFastMatch && {color: colors.grey_dark}]}> 
            {name}
          </Text>
          {isFastMatch && <Text style={styles.fastMatchText}>Suggestion</Text>}
          {hasAddress && <Text numberOfLines={1} style={styles.addressText}>{getFormattedAddress(item.address)}</Text>}
        </View>

        <View style={styles.rightContent}>
          {(!!category) && <Text numberOfLines={1} style={styles.categoryChip}>{category}</Text>}
          {/* {!!distance && <Text style={styles.distanceText}>{distance}</Text>} */}
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => {
    if(title === 'full_search' || title === 'unifiedSearchData' || title === 'fast_match'){
      return null
    }
    return (
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    );
  };



  const sections = data;


  return  (
        <SectionList
          sections={sections}
          keyExtractor={(item, index) => `${getPrimaryName(item)}-${index}`}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
        />
      )
  
};

SearchResultContainer.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object),
  onItemPress: PropTypes.func,
  searchDataType: PropTypes.string,
};

SearchResultContainer.defaultProps = {
  data: [],
  onItemPress: undefined,
  searchDataType: 'fullSearchData',
};

const styles = StyleSheet.create({
  listContent: {
    backgroundColor: colors.white,
    paddingBottom:height*0.3,
    borderRadius:10,
  },
  sectionHeader: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    backgroundColor: colors.grey_xlight,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontFamily: Fonts.regular,
    color: colors.black,
    paddingRight: 5,
    textTransform: 'capitalize',
  },
  item: {
    paddingVertical: 10,
    paddingHorizontal: 0,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  separator: {
    height: 1,
    backgroundColor: colors.grey_xlight,
  },
  leftIconWrap: {
    padding: 10,
    marginRight: 5,
  },
  leftIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 50,
    backgroundColor: colors.grey_light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleContent: {
    flex: 1,
    paddingRight: 10,
    gap: 3,
  },
  nameText: {
    fontSize: 16,
    fontFamily: Fonts.light,
    color: colors.font_black,
    textTransform: 'capitalize',
  },
  rightContent: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    gap: 8,
    paddingRight: 10,
  },
  categoryChip: {
    fontSize: 12,
    fontFamily: Fonts.medium,
    color: colors.blue,
    backgroundColor: '#ecf6ff',
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    textTransform: 'capitalize',
    maxWidth: 120,
  },
  distanceText: {
    fontSize: 12,
    fontFamily: Fonts.regular,
    color: colors.grey_dark,
    paddingRight: 5,
  },
  fastMatchText: {
    fontSize: 16,
    fontFamily: Fonts.regular,
    color: colors.grey_dark,
    paddingRight: 5,
  },
  addressText: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: colors.grey_dark,
    paddingRight: 5,
  }
  

});

export default SearchResultContainer;
