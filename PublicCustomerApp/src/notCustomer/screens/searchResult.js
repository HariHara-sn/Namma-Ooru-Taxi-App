import React,{useState,useContext} from 'react';
import { View, Text, SectionList ,TouchableOpacity,StyleSheet} from 'react-native';
import Feather from "react-native-vector-icons/Feather";
import GlobalContext from "../context/GlobalContext"
import { utils } from "../utils/Utils";
import useMapStore from "../features/map/store/useMapStore";
import { colors, Fonts } from "../constants/constants";
import { clearAllStateVectors } from '../components/Native/NESearch';
const transformData = (data) => {
    if (!data || Object.keys(data).length === 0) {
      return [];
    }
  
    // Define the desired order of sections
    const sectionOrder = ["fast_match","full_search","state","city","district","area", "street" ];
  
    // Convert the data into sections
    const sections = Object.entries(data)
      .filter(([key, value]) => key !== "matchedStrings" && value && value.length > 0)
      .map(([key, value]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        data: value.map((item) => {
          if (key === "area") {
            return {
              name: item?.name[0],
              distance: item?.distance,
              longitude: item?.longitude,
              latitude: item?.latitude,
            };
          } else if (key === "street") {
            return {
              name: item?.streetName[0],
              distance: item?.distance,
              longitude: item?.longitude,
              latitude: item?.latitude,
            };
          } else if (key === "city" || key === "district") {
            return {
              name: item?.name[0],
              distance: item?.distance,
              longitude: item?.longitude,
              latitude: item?.latitude,
            };
          } else if (key === "full_search") {
            return {
              name: item?.place_name[0],
              distance: item?.distance,
              longitude: item?.longitude,
              latitude: item?.latitude,
              address: item?.address,
              houseNumber: item?.houseNumber
            };
          } else if (key === "fast_match") {
            return {
              primaryText: item?.primaryText,
              primaryCategory: item?.primaryCategory,
              secondaryText: item?.secondaryText,
              secondaryCategory: item?.secondaryCategory,
              stateVectorForMatches: item?.stateVectorForMatches,
            };
          }
          return item;
        }),
      }));
  
    // Sort the sections based on the desired order
    return sections.sort(
      (a, b) => sectionOrder.indexOf(a.title.toLowerCase()) - sectionOrder.indexOf(b.title.toLowerCase())
    );
  };
export const SearchResultV2 = (props) => {
    const MAX_ITEMS_TO_SHOW = 5;
    const { searchTxt, search_data, selectedCallBack } = props;
    
    const sections = transformData(search_data?.searchData);
    console.log("sections",sections)
   
    const [expandedSections, setExpandedSections] = useState({});

  const { themeValue } = useContext(GlobalContext);
  const styles = searchTabsStyles(themeValue);
  const {stateVector,setStateVector} = useMapStore()
  const getAddress = (item) => {
    const address = item.address?.filter(addr => addr?.trim())?.map(addr => addr.charAt(0).toUpperCase() + addr.slice(1)).join(', ') || '';
    return address;
  };
  
    const toggleSectionExpand = (sectionTitle) => {
        setExpandedSections((prev) => ({
          ...prev,
          [sectionTitle]: !prev[sectionTitle],
        }));
      };
    
      const onSelectItem = (item, title) => {
        if (title === "Fast_match") {
          selectedCallBack(item.stateVectorForMatches, 'Fast_match')
          setStateVector(search_data?.searchData?.matchedStrings);
        } else {
          clearAllStateVectors()
          const newItem = {
            name: item.name,
            longitude:item.latitude,
            latitude:item.longitude,
            address:getAddress(item),
            distance: item.distance,
          };
     
          selectedCallBack(newItem,title);
        }
      };

     
      const highlightText = (text, highlight) => {
        // text = text?.charAt(0).toUpperCase() + text?.slice(1)
        if (!highlight.trim()) {
          return <Text style={styles.itemText}>{text}</Text>;
        }
      
        const safeText = text ? String(text) : "";
      
        const regex = new RegExp(`(${highlight})`, "gi");
        const parts = safeText.split(regex);
      
        return (
          <Text style={styles.itemText}>
            {parts.map((part, index) =>
              part.toLowerCase() === highlight.toLowerCase() ? (
                <Text key={index} style={styles.highlightText}>
                  {part}
                </Text>
              ) : (
                part
              )
            )}
          </Text>
        );
      };



    const renderItem = ({ item, section: { title } }) => {
        return (
          <TouchableOpacity
            onPress={() => onSelectItem(item, title)}
            style={styles.item}
          >
            {item.houseNumber && !item?.place_name ? (
               <View style={{ width: "80%" }}>
                 <Text style={[styles.itemText]}>
                    {highlightText(item.houseNumber, searchTxt)}{','}{highlightText(item.address, searchTxt)}
                  </Text> 
               </View>
            ) : (
              <View style={{ width: "80%" }}>
              {title === "Fast_match" ? (
                item.secondaryText ? (
                  <>
                  <Text style={[styles.itemText]}>
                    {highlightText(item.primaryText, searchTxt)}
                  </Text> 
                  <Text style={[styles.itemText]}>{item.primaryCategory}</Text>
                  <View style={styles.secondaryItemView}>
                    <Feather
                      name="corner-down-right"
                      size={22}
                      color={colors.font_black}
                    />
                    <Text style={styles.itemText}>
                      {highlightText(item.secondaryText, searchTxt)}
                    </Text>
                  </View>
                </>
                ) : (
                  <>
                   <Text style={[styles.itemText]}>
                    {highlightText(item.primaryText, searchTxt)}
                  </Text>
                  <Text style={[styles.itemText]}>{item.primaryCategory}</Text>
                  </>
                )
              ) : (
                <>
                  <Text style={[styles.itemText]}>
                    {highlightText(item.name.charAt(0).toUpperCase() + item.name.slice(1), searchTxt)}
                  </Text>
                  {item.address ? (
                    <Text style={styles.itemSubText}>{item.address?.filter(addr => addr?.trim())?.map(addr => addr.charAt(0).toUpperCase() + addr.slice(1)).join(', ') || ''}</Text>
                  ) : null}
                </>
              )}
            </View>
            )}
           
            <View
              style={{
                width: "20%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {item.distance ? (
                <Text style={styles.itemSubText}>
                  {utils.metersToKilometers(item.distance).toFixed(2)} km
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
        );
      };
    
      const sectionTitles = (title) => {
         switch(title) {
          case 'Fast_match' :
           return "Suggestions"
            case 'Full_search' :
              return "POI"
               case 'State' :
                return 'Region'
                 default :
                  return title
         }
      }
    
      const renderSectionHeader = ({ section }) => {
        let newTitle = sectionTitles(section.title);
        const hasHouseNumber = section.data.some((item) => item?.houseNumber);
    
        if (hasHouseNumber) {
          newTitle = `Address`; // Custom logic for the title
        }
        return (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{newTitle}</Text>
          </View>
        );
      };
    
      const renderSectionFooter = ({ section: { title, data } }) => {
        const isExpanded = expandedSections[title];
        return data.length < 5 ? null : (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => toggleSectionExpand(title)}
          >
            <Text style={styles.showMoreButtonText}>
              {isExpanded ? "Show Less" : "Show More"}
            </Text>
          </TouchableOpacity>
        );
      };

   
 
    return (
        <SectionList
        stickySectionHeadersEnabled
        keyExtractor={(item, index) => item + index}
        sections={sections.map((section) => {
          const isExpanded = expandedSections[section.title];
          return {
            ...section,
            data: isExpanded
              ? section?.data
              : section?.data?.slice(0, MAX_ITEMS_TO_SHOW),
          };
        })}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        renderSectionFooter={renderSectionFooter}
      />
      );
  
};

const searchTabsStyles = (theme) =>
    StyleSheet.create({
      sectionHeader: {
        backgroundColor: colors.grey_xlight,
        padding: 10,
        paddingHorizontal:20
      },
      sectionHeaderText: {
        fontFamily: Fonts.bold,
        fontSize: 16,
        color: colors.font_black,
      },
      item: {
        padding: 10,
        paddingHorizontal:20,
        borderBottomWidth: 1,
        borderBottomColor: "#ccc",
        flexDirection: "row",
        width: "100%",
      },
      itemText: {
        fontSize: 17,
        fontFamily: Fonts.light,
        color: colors.font_black,
      },
      highlightText: {
        fontFamily: Fonts.medium,
        fontSize: 18,
      },
      itemSubText: {
        fontSize: 12,
        fontFamily: Fonts.regular,
        color: colors.grey_dark,
      },
      showMoreButton: {
        alignItems: "center",
        paddingVertical: 15,
      },
      showMoreButtonText: {
        fontFamily: Fonts.medium,
        color: colors.font_black,
        fontSize: 18,
      },
      secondaryItemView: {
        flexDirection: "row",
        paddingVertical: 10,
        left: 20,
      },
    });


