import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Entypo from "react-native-vector-icons/Entypo";
import PropTypes from 'prop-types';

import { colors, Fonts } from "../constants/constants";


const StateVectorConatiner = ({matchedStrings=[], removeStateVector}) => {

  const onVectorPress = (item) => {
    removeStateVector(item);
  };

  const stateVectorArray = matchedStrings?.filter((item) => item?.key !== "") || [];

  return stateVectorArray.length > 0 ? (
    <View style={styles.vectorContainer}>
      {stateVectorArray.map((item, index) =>
          <View key={index} style={styles.stateBtn}>
          <Text style={styles.stateText}>{item.text.charAt(0).toUpperCase() + item.text.slice(1)}</Text>
          <TouchableOpacity
            onPress={() => onVectorPress(item, index)}
          >
            <Entypo name="cross" size={22} style={styles.crossIcon} color={"black"} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  ) : null;
 
};

StateVectorConatiner.propTypes = {
  matchedStrings: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string,
    text: PropTypes.string
  })),
  removeStateVector: PropTypes.func.isRequired
};

export default StateVectorConatiner;

const styles = StyleSheet.create({
  vectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "90%",
    alignSelf: "center",
    marginBottom: 10,
    backgroundColor:'transparent',
    paddingTop:10,

    
  },
  stateBtn: {
    flexDirection: "row",

    paddingVertical: 1,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.grey_xlight,
    gap: 10,
  },
  stateText: {
    fontFamily: Fonts.regular,
    padding:3,
    paddingRight:0,
        color: colors.black,
  },
  crossIcon: {
    padding:2,
    paddingLeft:0
  }
});


