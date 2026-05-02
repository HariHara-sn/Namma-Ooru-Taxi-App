import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React from "react";
import Entypo from "react-native-vector-icons/Entypo";
import { useMapMarkerStore } from "../../../common/store/useMapMarkerStore";
import { Colors, Fonts } from "../../../common/constants/constants";



const StateVectorConatiner = (props) => {
  const { stateVector, setStateVector } = useMapMarkerStore();
  const { stateVectorArr, removeStateVector } = props;

  const onVectorPress = (item) => {
    removeStateVector(item);
  };

  const stateVectorArray = stateVectorArr?.filter((item) => item.text !== "");

  return stateVectorArray ? (
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

export default StateVectorConatiner;

const styles = StyleSheet.create({
  vectorContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    width: "100%",
    alignSelf: "center",
    paddingVertical:5,
    backgroundColor:Colors.white
  },
  stateBtn: {
    flexDirection: "row",
    margin: 2,
    paddingVertical: 5,
    paddingHorizontal: 5,
    borderRadius: 8,
    backgroundColor: Colors.grey_xlight,
    gap: 10,
  },
  stateText: {
    fontFamily: Fonts.regular,
    padding:3,
    paddingRight:0,
    color: Colors.black,
  },
  crossIcon: {
    padding:2,
    paddingLeft:0
  }
});
