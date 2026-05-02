import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import React from 'react';
import { Colors, Fonts } from '../constants/constants';
import { useTranslation } from 'react-i18next';


const TopTabs = ({ tabs, activeTab, setActiveTab, containerStyle, tabStyle, activeTabStyle, textStyle, activeTextStyle }) => {
    const {t} = useTranslation()

    const styles = StyleSheet.create({
        container: {
            flexDirection: 'row',
            backgroundColor: Colors.pale_grey_two,
            borderRadius: 10,
            padding: 5,
            marginHorizontal: 10,
            marginVertical: 10,
            marginTop:10,
            ...containerStyle
        },
        tab: {
            flex: 1,
            paddingVertical: 5,
            paddingHorizontal: 5,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            ...tabStyle
        },
        activeTab: {
            backgroundColor: Colors.white,
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: 2,
            },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
            ...activeTabStyle
        },
        tabText: {
            fontSize: 12,
            fontFamily: Fonts.light,
            color: Colors.black,
            textAlign: 'center',
            ...textStyle
        },
        activeTabText: {
            color: Colors.periwinkle,
            fontFamily: Fonts.regular,
            ...activeTextStyle
        }
    });

    return (
        <View style={styles.container}>
            {tabs.map((tab, index) => (
                <TouchableOpacity
                    key={tab.key}
                    style={[
                        styles.tab,
                        activeTab === tab.key && styles.activeTab
                    ]}
                    onPress={() => setActiveTab(tab.key)}
                >
                    <Text style={[
                        styles.tabText,
                        activeTab === tab.key && styles.activeTabText
                    ]}>
                        {(t(tab.title) || tab.title)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default TopTabs;
