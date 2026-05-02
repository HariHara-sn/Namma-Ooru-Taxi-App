/* eslint-disable react/no-children-prop */
import {ActivityIndicator, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import React, { useEffect, useState} from 'react';

import TotalTrips from '../../notdriver/assets/icons/totalTrips.svg';
import StatusModal from './StatusModal';
import useUserStore from '../../common/store/useUserStore';
import APIRequest from '../../common/APIRequest';
import { DateTimeFormatter } from '../../common/utils/DateTimeFormatter';
import { Colors, Fonts } from '../../common/constants/constants';
import TotalEarnings from '../../notdriver/assets/icons/totalEarnings.svg';

const HomeHeader = ({shouldShowDueAlert}) => {
  const [summaryModal, setSummaryModal] = useState(false);
  const {userInfo} = useUserStore()
   const [startDate, endDate] = DateTimeFormatter.getTodaysStartEndTime()
   const [PaymentsLoading, setPaymentsLoading] = useState(false)
   const [totalEarnings,setTotalEarnings] = useState(0)
   const [totalTrips, setTotalTrips] = useState(0)

  const fetchPayments = async (pageNum = 1) => {
    try {
      setPaymentsLoading(true);
      const api = new APIRequest();  
      const response = await api.request(
        `/publicrides/payments/driver/get-Payments?page=${pageNum}&limit=${0}&tripStatus=${'all'}&startTime=${startDate}&endTime=${endDate}`, 
        'GET', 
        {},
        userInfo?.token
      );
      if (response.success) {
        setTotalEarnings(response?.totalEarnings)
        setTotalTrips(response?.count)
      }
    } catch (error) {
      console.error('Error fetching trips:', error);
    } finally {
      setPaymentsLoading(false);
    }
  }

  useEffect(()=>{
    fetchPayments()
  },[])

  const renderSummaryModal = () => {
    return (
      <StatusModal
        isVisible={summaryModal}
        animationType="fade"
        onClose={() => {
          setSummaryModal(false);
        }}
        additionalContainerStyles={{alignItems: ''}}
        onBackDropPress={()=>setSummaryModal(false)}
        children={
          <View>
            <TouchableOpacity
              style={[headerStyles.amntBtn, {position: 'relative'}]}
              onPress={() => setSummaryModal(true)}>
              <Text style={headerStyles.amntBtnTxt}>
                <Text style={{color: Colors.yellow}}>₹</Text>{totalEarnings ? totalEarnings?.toFixed(2) : 0}
                {/* <Text style={{fontSize: 10}}>00</Text> */}
              </Text>
            </TouchableOpacity>
            <Text style={headerStyles.summaryTxt}>Today Summary</Text>
            <View style={headerStyles.summaryContainer}>
              <View style={headerStyles.summaryCard}>
                   <TotalTrips />
                    <Text style={headerStyles.valueTxt}>{totalTrips}</Text>
                    <Text style={headerStyles.nameTxt}>{'Today Trips'}</Text>
                  </View>
                   <View style={headerStyles.summaryCard}>
                   <TotalEarnings />
                    <Text style={headerStyles.valueTxt}>{'₹'}{totalEarnings ? totalEarnings?.toFixed(2) : 0}</Text>
                    <Text style={headerStyles.nameTxt}>{'Today Earnings'}</Text>
                  </View>
            </View>
            <TouchableOpacity onPress={()=>setSummaryModal(false)}>
              <Text style={headerStyles.viewDetail}>Close</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  };

  return (
    <>
      <View style={headerStyles.container}>
          <TouchableOpacity
            style={[headerStyles.amntBtn,{marginTop: shouldShowDueAlert ? 150 : 15}]}
            disabled={PaymentsLoading}
            onPress={() => setSummaryModal(true)}>
              {PaymentsLoading ? <ActivityIndicator /> : <Text style={headerStyles.amntBtnTxt}>
              <Text style={{color: Colors.yellow}}>₹{' '}</Text>{totalEarnings ? totalEarnings?.toFixed(2) : 0}
            </Text>}
          </TouchableOpacity>
      </View>
      {renderSummaryModal()}
    </>
  );
};

export default HomeHeader;

const headerStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    alignSelf: 'center',
  },
  amntBtn: {
    alignSelf: 'center',
    position: 'absolute',
    paddingVertical: 2,
    paddingHorizontal: 20,
    backgroundColor: Colors.black,
    borderRadius: 30,
    marginTop: 15,
  },
  amntBtnTxt: {
    fontFamily: Fonts.light,
    color: Colors.white,
    fontSize: 20,
  },
  mapIconContainer: {
    position: 'absolute',
    alignSelf: 'flex-end',
    gap: 10,
    top:10,
    right:10
  },
  NotificationBtn: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: 50,
  },
  summaryTxt: {
    fontFamily: Fonts.medium,
    fontSize: 16,
    color: Colors.black,
    marginTop: 10,
    textAlign: 'center',
  },
  summaryContainer: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.white_dirt,
    alignSelf: 'center',
    flexWrap: 'wrap',
    marginTop: 15,
    rowGap: 1,
    columnGap:1,
    justifyContent: 'space-between',
  },
  summaryCard: {
    backgroundColor: Colors.white,
    width: '49%',
    paddingVertical: 10,
    gap: 5,
    paddingLeft: 10,
    alignItems:'center',
    flexGrow:1
  },
  valueTxt: {
    fontFamily: Fonts.semi_bold,
    fontSize: 24,
    color: Colors.black,
  },
  nameTxt: {
    fontFamily: Fonts.light,
    fontSize: 16,
    color: Colors.black,
    textAlign:'center'
  },
  viewDetail: {
    textAlign: 'center',
    top: 10,
    color: Colors.skyBlue,
    fontSize: 16,
    fontFamily: Fonts.regular,
  },
  title:{
    fontFamily:Fonts.regular,
    color:Colors.black,
    fontSize:16,
    alignSelf:'center',
    position:'absolute',
    top:25
  }
});
