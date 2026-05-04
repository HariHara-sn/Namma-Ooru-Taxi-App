import { StyleSheet, Text, View } from 'react-native'
import React, { useState } from 'react'
import EarningsTab from './EarningsTab';
import ReportTab from './ReportTab';
import TransactionTab from './TransactionTab';
import WorkHistoryTab from './WorkHistoryTab';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import TopTabs from '../../../common/components/TopTabs';
import { useTranslation } from 'react-i18next';

const DriverEarnings = () => {
  const {t} = useTranslation();
  const [sectionTab, setSectionTab] = useState('earnings');
  const [activeTab, setActiveTab] = useState('earnings');
  const sectionTabs = [
    { key: 'earnings', title: 'earnings' },
    { key: 'workHistory', title: 'Work History' }
  ];

  const tabs = [
    { key: 'earnings', title: 'earnings' },
    { key: 'reports', title: 'history' },
    { key: 'transactions', title: 'transactions' }
  ];

  const renderTabContent = () => {
    if (sectionTab === 'workHistory') {
      return <WorkHistoryTab />;
    }

    switch (activeTab) {
      case 'earnings':
        return <EarningsTab />;
      case 'reports':
        return <ReportTab />;
      case 'transactions':
        return <TransactionTab />;
      default:
        return <EarningsTab />;
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerContainer}>
       <Text style={styles.headerTitle}>{t('earnings')}</Text>
      </View>
      <TopTabs
        tabs={sectionTabs}
        activeTab={sectionTab}
        setActiveTab={setSectionTab}
        containerStyle={styles.sectionTabsContainer}
        tabStyle={styles.sectionTab}
        activeTabStyle={styles.sectionActiveTab}
        textStyle={styles.sectionTabText}
        activeTextStyle={styles.sectionActiveTabText}
      />
      {sectionTab === 'earnings' && (
        <TopTabs
          tabs={tabs}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          containerStyle={styles.innerTabsContainer}
          tabStyle={styles.innerTab}
          activeTabStyle={styles.innerActiveTab}
          textStyle={styles.innerTabText}
          activeTextStyle={styles.innerActiveTabText}
        />
      )}
      {renderTabContent()}
    </View>
  )
}

export default DriverEarnings

const styles = StyleSheet.create({
    screen :{
        flex:1,
        backgroundColor:Colors.white
    },
      headerContainer:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center',
        paddingHorizontal:10,
        borderBottomWidth:1,
        borderBottomColor:Colors.grey,
        width:'90%',
        alignSelf:'center',
        paddingVertical:20
      },
      headerTitle:{
        fontSize:20,
        color:Colors.black,
        fontFamily:Fonts.medium,
        textAlign:'center',
      },
      sectionTabsContainer: {
        marginTop: 12,
        marginBottom: 6,
        borderWidth: 1,
        borderColor: Colors.periwinkle_light,
        backgroundColor: Colors.periwinkle_light,
      },
      sectionTab: {
        paddingVertical: 10,
      },
      sectionActiveTab: {
        backgroundColor: Colors.periwinkle,
        elevation: 0,
        shadowOpacity: 0,
      },
      sectionTabText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: Colors.violet,
      },
      sectionActiveTabText: {
        color: Colors.white,
        fontFamily: Fonts.semi_bold,
      },
      innerTabsContainer: {
        marginTop: 4,
        marginBottom: 4,
        backgroundColor: Colors.white,
        padding: 2,
      },
      innerTab: {
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
        borderRadius: 0,
        paddingVertical: 8,
      },
      innerActiveTab: {
        backgroundColor: Colors.white,
        borderBottomColor: Colors.periwinkle,
        elevation: 0,
        shadowOpacity: 0,
      },
      innerTabText: {
        fontSize: 12,
        color: Colors.grey_dark,
      },
      innerActiveTabText: {
        color: Colors.periwinkle,
        fontFamily: Fonts.medium,
      }
})

