import React from 'react';
import {Calendar} from 'react-native-calendars';
import PropTypes from 'prop-types';
import { Colors } from '../constants/constants';
import { Fonts } from '../constants/constants';


const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  const currentDate = new Date(startDate);
  const end = new Date(endDate);
  while (currentDate <= end) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  return dates;
};

const CustomeCalender = ({startDate, endDate, onDateChange, isSelectMultipleDates, minDate, maxDate, initialDate, extraMarkedDates}) => {
    
  const handleDayPress = day => {
    onDateChange(day);
  };

  const markedDates = {
    ...(extraMarkedDates || {}),
    [startDate]: {startingDay: true, selected: true, color: Colors.periwinkle, selectedColor: Colors.periwinkle},
    [endDate]: {endingDay: true,selected: true, color: Colors.periwinkle},
    ...getDatesBetween(startDate, endDate).reduce((acc, date) => {
      acc[date] = {color: Colors.periwinkle, selected: true,};
      return acc;
    }, {}),
  };

  return (
    <Calendar
      key={initialDate || 'default'}
      onDayPress={handleDayPress}
      markedDates={markedDates}
      theme={{
        todayTextColor: '#7d5fff',
        dayTextColor: '#2d4150',
        arrowColor: 'black',
        textDayFontFamily: Fonts.regular,
        textMonthFontFamily: Fonts.regular,
        textDayHeaderFontFamily: Fonts.light,
        textDayFontSize: 14,
        textMonthFontSize: 12,
        textDayHeaderFontSize: 12,
      }}
      markingType={isSelectMultipleDates ? 'period' : 'dot'}
      maxDate={maxDate || new Date().toISOString().slice(0, 10)}
      minDate={minDate}
      current={initialDate}
      hideArrows={!!(minDate && maxDate)}
    />
  );
};

export default CustomeCalender;

CustomeCalender.propTypes = {
  startDate: PropTypes.string,
  endDate: PropTypes.string,
  onDateChange: PropTypes.func.isRequired,
  minDate: PropTypes.string,
  maxDate: PropTypes.string,
  initialDate: PropTypes.string,
  isSelectMultipleDates: PropTypes.bool,
  extraMarkedDates: PropTypes.object,
};

CustomeCalender.defaultProps = {
  startDate: '',
  endDate: '',
  minDate:'',
  maxDate: '',
  initialDate: '',
  isSelectMultipleDates: false,
  extraMarkedDates: {},
};
