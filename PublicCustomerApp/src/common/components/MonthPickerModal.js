import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, FlatList } from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import { Colors, Fonts } from '../constants/constants';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const MonthPickerModal = ({ visible, onClose, onSelectMonth, selectedMonth }) => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthIndex = now.getMonth();
  const [year, setYear] = useState(currentYear);

  // Build the set of allowed (year, month) combos — last 3 months including current
  const allowedMonths = new Set();
  for (let i = 0; i < 3; i++) {
    const d = new Date(currentYear, currentMonthIndex - i, 1);
    allowedMonths.add(`${d.getFullYear()}-${d.getMonth()}`);
  }

  const months = MONTH_NAMES.map((name, index) => {
    const start = new Date(year, index, 1);
    const end = new Date(year, index + 1, 0, 23, 59, 59, 999);
    const isAllowed = allowedMonths.has(`${year}-${index}`);
    return { id: index, name, startTime: start.getTime(), endTime: end.getTime(), disabled: !isAllowed };
  });

  const handleSelect = (month) => {
    if (month.disabled) return;
    onSelectMonth({ name: month.name, startTime: month.startTime, endTime: month.endTime, year });
    onClose();
  };

  const renderItem = ({ item }) => {
    const isSelected = selectedMonth?.name === item.name && selectedMonth?.year === year;
    return (
      <TouchableOpacity
        style={[styles.monthItem, isSelected && styles.selectedMonth, item.disabled && styles.disabledMonth]}
        onPress={() => handleSelect(item)}
        disabled={item.disabled}
      >
        <Text style={[styles.monthText, isSelected && styles.selectedMonthText, item.disabled && styles.disabledText]}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => setYear(y => y - 1)}
              style={styles.arrowBtn}
              disabled={!months.some(m => !m.disabled && year - 1 === new Date(m.startTime).getFullYear()) && ![...allowedMonths].some(k => Number(k.split('-')[0]) === year - 1)}
            >
              <AntDesign name="left" size={20} color={[...allowedMonths].some(k => Number(k.split('-')[0]) === year - 1) ? Colors.black : Colors.grey_dark} />
            </TouchableOpacity>
            <Text style={styles.yearText}>{year}</Text>
            <TouchableOpacity
              onPress={() => { if (year < currentYear) setYear(y => y + 1); }}
              style={styles.arrowBtn}
              disabled={year >= currentYear}
            >
              <AntDesign name="right" size={20} color={year >= currentYear ? Colors.grey_dark : Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <AntDesign name="closecircleo" size={22} color={Colors.black} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={months}
            numColumns={3}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            contentContainerStyle={styles.grid}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '85%',
    paddingBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  arrowBtn: {
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  yearText: {
    fontSize: 18,
    fontFamily: Fonts.semi_bold,
    color: Colors.black,
    minWidth: 60,
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    right: 14,
    padding: 4,
  },
  grid: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  monthItem: {
    flex: 1,
    margin: 6,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  selectedMonth: {
    backgroundColor: Colors.periwinkle,
  },
  disabledMonth: {
    opacity: 0.35,
  },
  monthText: {
    fontSize: 13,
    fontFamily: Fonts.regular,
    color: Colors.black,
  },
  selectedMonthText: {
    color: Colors.white,
    fontFamily: Fonts.medium,
  },
  disabledText: {
    color: Colors.grey_dark,
  },
});

export default MonthPickerModal;
