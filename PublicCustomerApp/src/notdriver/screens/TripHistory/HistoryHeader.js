import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Modal, Dimensions } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons'
import AntDesign from 'react-native-vector-icons/AntDesign'
import moment from 'moment';
import { DateTimeFormatter } from '../../../common/utils/DateTimeFormatter';
import CustomeCalender from '../../../common/components/CustomeCalender';
import { Colors, Fonts } from '../../../common/constants/constants';
import CustomDropdown from '../../../common/components/CustomDropdown';
import { lines } from '../../../common/styles/flexStyle';
import { useTranslation } from 'react-i18next';

const DRIVER_TARGETS = {
  day: { trips: 20, distance: 120, duration: 12, earnings: 3000 },
  week: { trips: 140, distance: 840, duration: 84, earnings: 21000 },
  month: { trips: 600, distance: 3600, duration: 360, earnings: 90000 },
};

const tabBtns = [
  { id: 1, name: 'Today', method: DateTimeFormatter.getTodaysStartEndTime, target: DRIVER_TARGETS.day, title: 'today' },
  { id: 2, name: 'Yesterday', method: DateTimeFormatter.getYesterdaysStartEndTime, target: DRIVER_TARGETS.day, title: 'yesterday' },
  { id: 3, name: 'This Week', method: DateTimeFormatter.getThisWeekStartEndTime, target: DRIVER_TARGETS.week, title: 'this_week' },
  { id: 4, name: 'Last Week', method: DateTimeFormatter.getLastWeekStartEndTime, target: DRIVER_TARGETS.week, title: 'last_week' },
  { id: 5, name: 'This Month', method: DateTimeFormatter.getThisMonthStartEndTime, target: DRIVER_TARGETS.month, title: 'this_month' },
];

const tripStatus = [
  { label: 'All', value: 'ALL' },
  { label: 'Completed', value: 'COMPLETED' },
  { label: 'Cancelled', value: 'CANCELLED' },
  // { label: 'Diverged', value: 'DIVERGED' },
];

function getTimes(startDate, endDate) {
  let time;
  if (startDate && endDate) {
    const startdateString = `${startDate + 'T00:00:00'}`;
    const enddateString = `${endDate + 'T23:59:59'}`;
    const startTimestamp = moment(startdateString).valueOf();
    const endTimestamp = moment(enddateString).valueOf();
    time = { stratTime: startTimestamp, endTime: endTimestamp };
  } else {
    time = {
      stratTime: new Date(startDate).setHours(0, 0, 0, 0),
      endTime: new Date(startDate).setHours(23, 59, 59, 999)
    }
  }
  // console.log(time, "TIMETIME")
  return time;
}

const HistoryHeader = ({ onDateRangeSelect, onTripStatusChange, isEarnings }) => {
  const {t} = useTranslation()
  const [selectedTab, setSelectedTab] = useState(1);
  const [prevSelectedTab, setPrevSelectedTab] = useState(1);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDates, setSelectedDates] = useState([]);
  const [customDateRange, setCustomDateRange] = useState(null);

  // Centralized function to clear selected dates and related state
  const clearSelectedDates = () => {
    setSelectedDates([]);
    setCustomDateRange(null);
    setStartDate('');
    setEndDate('');
  };

  const handleTabPress = (tab) => {
    setPrevSelectedTab(tab.id);
    setSelectedTab(tab.id);
    clearSelectedDates();
    const dateRange = tab.method();
    if (onDateRangeSelect) {
      onDateRangeSelect({ dateRange, maxStats: tab.target });
    }
  };

  const handleSelect = (item) => {
    if (onTripStatusChange) {
      onTripStatusChange(item.value);
    }
  };

  const setMultipleDates = day => {
    if (!startDate && !endDate) {
      setStartDate(day.dateString);
      setEndDate(day.dateString);
    } else if (startDate && endDate && day.dateString <= endDate) {
      setStartDate(day.dateString);
      setEndDate(day.dateString);
    } else if (startDate && endDate && day.dateString >= startDate) {
      setEndDate(day.dateString);
    } else {
      setStartDate(day.dateString);
    }
  };

  const handleDateChange = (day) => {
    setMultipleDates(day);
  };

  const handleConfirmDateSelection = () => {
    if (startDate && endDate) { 

      setCustomDateRange({
        start: new Date(startDate),
        end: new Date(endDate)
      });
      
      // Clear selected tab
      setSelectedTab(null);
      
      if (onDateRangeSelect) {
        onDateRangeSelect({ 
          dateRange: [getTimes(startDate, endDate).stratTime, getTimes(startDate, endDate).endTime], 
          maxStats: DRIVER_TARGETS.day 
        });
      }
    }
    setIsModalVisible(false);
   
  };

  const openModal = () => {
    setIsModalVisible(true);
  };

  const closeModal = () => {
    setIsModalVisible(false);
    clearSelectedDates();
    setSelectedTab(prevSelectedTab);
    // Clear custom date range when tab is selected
    const prevTab = tabBtns.find(tab => tab.id === prevSelectedTab) || tabBtns[0];
    const dateRange = prevTab.method();
    if (onDateRangeSelect) {
      onDateRangeSelect({ dateRange, maxStats: prevTab.target });
    }
  };

  const formatDateRange = () => {
    if (customDateRange) {
      const startStr = customDateRange.start.toLocaleDateString();
      const endStr = customDateRange.end.toLocaleDateString();
      return `${startStr} - ${endStr}`;
    }
    return null;
  };

  const renderCalendar = () => {
    return (
      <View style={styles.calendarContainer}>
        <ScrollView 
          contentContainerStyle={styles.calendarScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <CustomeCalender
            startDate={startDate}
            endDate={endDate}
            onDateChange={handleDateChange}
            isSelectMultipleDates={true}
            minDate={new Date(new Date().setDate(new Date().getDate() - 90))
              .toISOString()
              .slice(0, 10)}
          />
          <View style={lines.plainLine} />
        </ScrollView>
        <TouchableOpacity
          onPress={handleConfirmDateSelection}
          style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>{t('confirm')}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{ marginVertical: 10 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {tabBtns.map((tab) => {
          const isSelected = selectedTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => handleTabPress(tab)}
              style={[styles.tabButton, isSelected && styles.selectedTab]}
            >
              <Text style={[styles.tabText, isSelected && styles.selectedTabText]}>
                {t(tab.title)}
              </Text>
            </TouchableOpacity>
          );
        })}
        {/* Custom Date Range Display */}
        {customDateRange && (
          <TouchableOpacity
            style={[styles.tabButton, styles.customDateTab]}
            onPress={openModal}
          >
            <Text style={[styles.tabText, styles.customDateText]}>
              {formatDateRange()}
            </Text>
            <MaterialIcons name="edit" size={14} color={Colors.periwinkle} style={{ marginLeft: 5 }} />
          </TouchableOpacity>
        )}
      </ScrollView>
      {!isEarnings && (
         <View style={styles.filterBtnContainer}>
         <View style={styles.dropdownContainer}>
           <CustomDropdown
             data={tripStatus} 
             placeholder={t('select_status')} 
             onChange={handleSelect} 
             initialValue="ALL"
           />
         </View>
         <TouchableOpacity
           style={styles.calendarBtn}
           onPress={openModal}>
            {
                 customDateRange ? (
                       <Text style={[styles.tabText, styles.customDateText,]}>{formatDateRange()}</Text>
                 ) : (
                   <Text style={[styles.tabText]}>{t('select_date_range')}</Text>
                 )
               }
           <MaterialIcons name="calendar-today" size={16} color={Colors.black} />
         </TouchableOpacity>
       </View>
      )}
     
      
      {/* Calendar Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}>
                <AntDesign name="closecircleo" size={24} color={Colors.black} />
              </TouchableOpacity>
            </View>
            {renderCalendar()}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  selectedTab: {
    backgroundColor: Colors.periwinkle,
    elevation: 1
  },
  customDateTab: {
    backgroundColor: Colors.periwinkle_light,
    borderWidth: 1,
    borderColor: Colors.periwinkle,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    color: '#888',
    fontFamily: Fonts.regular,
  },
  selectedTabText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
    fontSize: 14
  },
  customDateText: {
    color: Colors.periwinkle,
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  filterBtnContainer: {
    width: '90%',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    marginTop: 10
  },
  dropdownContainer: {
    width: '50%',
  },
  calendarBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 5,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width:'50%',
    
  },
  calendarBtnTxt: {
    fontSize: 12,
    color: '#888',
    fontFamily: Fonts.regular,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    width: '90%',
    maxHeight: '80%',
    minHeight: '75%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.black,
    fontFamily: Fonts.medium,
  },
  closeButton: {
    padding: 5,
  },
  calendarContainer: {
    flex: 1,
    paddingHorizontal: 10,
  },
  calendarScrollContent: {
    flexGrow: 1,
    paddingBottom: 80, // Space for confirm button
  },
  confirmButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.periwinkle,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: Fonts.medium,
  },
  statusFilterBtn: {
    minWidth: '0%',
    backgroundColor: '#f5f5f5',
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 5,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row'
  },
  statusFilterBtnTxt: {
    fontSize: 12,
    color: '#888',
    fontFamily: Fonts.regular,
  }
});

export default HistoryHeader;
