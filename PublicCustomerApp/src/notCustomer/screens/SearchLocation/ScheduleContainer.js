import {ScrollView, Text, TouchableOpacity, View} from 'react-native';
import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import {colors} from '../../constants/constants';
import {utils} from '../../utils/Utils';
import DatePicker from 'react-native-date-picker';
import {scheduleContainerStyles} from '../../styles/AddLocationStyles';
import {showNotification} from '../../components/NotificationManger';
import useRideBookingInfo from '../../features/booking/store/useRideBookingInfo';

const ScheduleContainer = props => {
  const { t } = useTranslation();
  const {
    oncloseDateTime,
    onConfirmDateTime,
    isUpdate,
    scheduleTime,
    scheduleDate,
  } = props;
  const fiveDaysWithDayNames = utils.getNextDayLists(5);
  const {setScheduleDateTime} = useRideBookingInfo();

  const filteredData = fiveDaysWithDayNames.filter(item => {
    const itemDate = (
      typeof item.date === 'string' ? new Date(item.date) : item.date
    )
      .toISOString()
      .split('T')[0];
    return itemDate === scheduleDate;
  });

  const [selectedDate, setSelectedDate] = useState(
    isUpdate ? filteredData[0] : fiveDaysWithDayNames[0],
  );
  const [selectedTime, setSelectedTime] = useState(
    isUpdate ? scheduleTime : new Date(),
  );

  const onSelectDate = item => {
    setSelectedDate(item);
  };

  const onDateChange = time => {
    setSelectedTime(time);
  };

  const onConfirm = () => {
    const _selectedTime = new Date(selectedTime);
    const currentTime = new Date();
    
    // Create a combined date-time by setting the selected time on the selected date
    const selectedDateTime = new Date(selectedDate.date);
    selectedDateTime.setHours(_selectedTime.getHours());
    selectedDateTime.setMinutes(_selectedTime.getMinutes());
    selectedDateTime.setSeconds(0);
    selectedDateTime.setMilliseconds(0);
    
    if (selectedDateTime < currentTime) {
      showNotification(
        t('invalid_date_time'),
        t('please_select_time_greater'),
        'warning',
      );
    } else {
      setScheduleDateTime({date: selectedDate.date, time: selectedTime});
      onConfirmDateTime();
    }
  };

  const isToday = utils.isToday(selectedDate.date);
  const minTime = isToday ? new Date() : null;

  return (
    <ScrollView style={scheduleContainerStyles.container}>
      <Text style={scheduleContainerStyles.containerTitle}>
        {t('schedule_a_trip')}
      </Text>
      <View style={scheduleContainerStyles.selectedDateContainer}>
        <Text style={scheduleContainerStyles.yearTxt}>
          {new Date(selectedDate.date).toDateString()}
        </Text>
        <Text style={scheduleContainerStyles.timeTxt}>
          - {utils.timestampTo12HourFormat(selectedTime)} -
        </Text>
      </View>
      <Text style={scheduleContainerStyles.yearTxt}>
        {utils.currentMonthNameAndYear()}
      </Text>
      <View>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 10 }}
          style={{ flexGrow: 0 }}
        >
          {fiveDaysWithDayNames.map(item => (
            <TouchableOpacity
              key={item.index}
              style={[
                scheduleContainerStyles.listCards,
                {
                  backgroundColor:
                    selectedDate.index === item.index
                      ? colors.violet
                      : colors.grey_xdark,
                  width: 60,
                  height: 70,
                },
              ]}
              onPress={() => onSelectDate(item)}>
              <Text
                style={[
                  scheduleContainerStyles.listCardsTxt,
                  {
                    color:
                      selectedDate.index === item.index
                        ? colors.white
                        : colors.black,
                  },
                ]}>
                {item.day}
              </Text>
              <Text
                style={[
                  scheduleContainerStyles.listCardsTxt,
                  {
                    color:
                      selectedDate.index === item.index
                        ? colors.white
                        : colors.black,
                  },
                ]}>
                {item.day_label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <View style={scheduleContainerStyles.datePickerContainer}>
        <DatePicker
          mode="time"
          theme="light"
          date={selectedTime}
          is24hourSource="locale"
          onDateChange={onDateChange}
          minimumDate={minTime}
        />
      </View>
      <View style={scheduleContainerStyles.btnComponent}>
        <TouchableOpacity
          style={scheduleContainerStyles.confrmBtn}
          onPress={oncloseDateTime}>
          <Text style={scheduleContainerStyles.confrmBtnTxt}>{t('cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            scheduleContainerStyles.confrmBtn,
            {backgroundColor: colors.black},
          ]}
          onPress={() => onConfirm()}>
                      <Text
              style={[
                scheduleContainerStyles.confrmBtnTxt,
                {color: colors.white},
              ]}>
              {t('confirm')}
            </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

ScheduleContainer.propTypes = {
  oncloseDateTime: PropTypes.func.isRequired,
  onConfirmDateTime: PropTypes.func.isRequired,
  isUpdate: PropTypes.bool,
  scheduleTime: PropTypes.instanceOf(Date),
  scheduleDate: PropTypes.string,
};

export default ScheduleContainer;
