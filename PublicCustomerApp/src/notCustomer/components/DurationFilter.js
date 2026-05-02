import { ScrollView, Text, TextInput, TouchableOpacity, View, Modal } from 'react-native';
import React, { useRef, useState, useCallback, useEffect } from 'react';
import { durationFilterStyle } from '../styles/DurationFilterStyle';
import CalenderIcon from '../assets/image/calender.svg'
import DatePicker from 'react-native-date-picker';
import { Fonts, colors } from '../constants/constants';
import { utils } from '../utils/Utils';
import { useTranslation } from 'react-i18next';
import AdaptiveText from './Common/AdaptiveText';

const DurationFilter = ({ options, callback }) => {
    
    const { t } = useTranslation();
    
    const [Options, setOptions] = useState(options || [
       
        {
            id: 'today',
            title: 'Today',
        },
        {
            id: 'week',
            title: 'This Week',
        },
        {
            id: 'all',
            title: 'All',
        },
        {
            id: 'custom',
            type: 'custom',
            icon: CalenderIcon,
        }
    ]);

    const [ActiveOption, setActiveOption] = useState(Options[0]?.id);
    const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [customStartDate, setCustomStartDate] = useState(new Date());
    const [customEndDate, setCustomEndDate] = useState(new Date());
    const [datePickerMode, setDatePickerMode] = useState('start'); // 'start' or 'end'

    const HandleHeaderClick = (id) => {
        setActiveOption(id);

        if (id === 'custom') {
            setShowCustomDatePicker(true);
            return;
        }

        if (id === 'all') {
            // For 'all', don't send any date filters
            callback(id, null, null);
        } else {
            let { start, end } = utils.getEasyDate(id);
            callback(id, start, end);
        }
    }

    const handleCustomDateConfirm = () => {
        setShowCustomDatePicker(false);
        
        // Convert dates to timestamps in milliseconds
        const startTimestamp = customStartDate.getTime();
        
        // Set end date to end of day (23:59:59)
        const endOfDay = new Date(customEndDate);
        endOfDay.setHours(23, 59, 59, 999);
        const endTimestampWithTime = endOfDay.getTime();
        
        callback('custom', startTimestamp, endTimestampWithTime);
    }

    const handleCustomDateCancel = () => {
        setShowCustomDatePicker(false);
    }

    const openDatePicker = (mode) => {
        setDatePickerMode(mode);
        setShowDatePicker(true);
    }

    const handleDateChange = (date) => {
        if (datePickerMode === 'start') {
            setCustomStartDate(date);
        } else {
            setCustomEndDate(date);
        }
        setShowDatePicker(false);
    }

    const handleDatePickerCancel = () => {
        setShowDatePicker(false);
    }

    const formatDate = (date) => {
        const day = date.getDate().toString().padStart(2, '0');
        const monthNames = [
            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
        ];
        const month = monthNames[date.getMonth()];
        const year = date.getFullYear();
        return `${day} ${month} ${year}`;
    }

    return (
        <>
            <View style={durationFilterStyle.container}>
                <View style={durationFilterStyle.containerItems}>
                    {Options.map((item, index) => (
                        item.type && item.type == 'custom' ?
                            <TouchableOpacity
                                style={durationFilterStyle.containerItemIcon}
                                key={`duration-filter-${index}`}
                                onPress={() => HandleHeaderClick(item.id)}
                            >
                                <item.icon
                                    width={20}
                                    height={20}
                                />
                                <View
                                    style={[
                                        durationFilterStyle.containerItemSpan,
                                        ActiveOption == item.id ? durationFilterStyle.containerItemAciveSpan : {}
                                    ]}
                                ></View>
                            </TouchableOpacity>
                            :
                            <TouchableOpacity
                                style={durationFilterStyle.containerItem}
                                key={`duration-filter-${index}`}
                                onPress={() => HandleHeaderClick(item.id)}
                            >
                                <AdaptiveText
                                    style={[
                                        durationFilterStyle.containerItemLabel,
                                        ActiveOption == item.id ? durationFilterStyle.containerItemActiveLabel : {}
                                    ]}
                                >{t(item.id)}</AdaptiveText>
                                <View
                                    style={[
                                        durationFilterStyle.containerItemSpan,
                                        ActiveOption == item.id ? durationFilterStyle.containerItemAciveSpan : {}
                                    ]}
                                ></View>
                            </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Custom Date Picker Modal */}
            <Modal
                visible={showCustomDatePicker}
                transparent={true}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <AdaptiveText style={styles.modalTitle}>{t('select_date_range')}</AdaptiveText>
                        
                        <View style={styles.dateSelectionContainer}>
                            <View style={styles.dateInputContainer}>
                                <AdaptiveText style={styles.dateLabel}>{t('from')} </AdaptiveText>
                                <TouchableOpacity 
                                    style={styles.dateButton}
                                    onPress={() => openDatePicker('start')}
                                >
                                    <AdaptiveText style={styles.dateButtonText}>
                                        {formatDate(customStartDate)}
                                    </AdaptiveText>
                                </TouchableOpacity>
                            </View>
                            <AdaptiveText style={{fontSize: 16, fontFamily: Fonts.medium, color: colors.black, textAlign: 'center'}}>
                                    {t('to')}
                            </AdaptiveText>
                            
                            <View style={styles.dateInputContainer}>
                                <AdaptiveText style={styles.dateLabel}>{t('to')}</AdaptiveText>
                                <TouchableOpacity 
                                    style={styles.dateButton}
                                    onPress={() => openDatePicker('end')}
                                >
                                    <AdaptiveText style={styles.dateButtonText}>
                                        {formatDate(customEndDate)}
                                    </AdaptiveText>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={styles.buttonContainer}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={handleCustomDateCancel}
                            >
                                <AdaptiveText style={styles.cancelButtonText}>{t('cancel')}</AdaptiveText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.confirmButton}
                                onPress={handleCustomDateConfirm}
                            >
                                <AdaptiveText style={styles.confirmButtonText} color="white">{t('confirm')}</AdaptiveText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Date Picker */}
            <DatePicker
                modal
                open={showDatePicker}
                date={datePickerMode === 'start' ? customStartDate : customEndDate}
                mode="date"
                onConfirm={handleDateChange}
                onCancel={handleDatePickerCancel}
                maximumDate={new Date()}
            />
        </>
    )
}

const styles = {
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 350,
        shadowColor: colors.black,
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontFamily: Fonts.medium,
        color: colors.black,
        textAlign: 'center',
        marginBottom: 20,
    },
    dateSelectionContainer: {
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        alignItems: 'center',
    },
    dateInputContainer: {
        marginBottom: 16,
        flex: 1,
    },
    dateLabel: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: colors.black,
        marginBottom: 8,
        paddingLeft: 10,
    },
    dateButton: {
        borderWidth: 1,
        borderColor: colors.grey_light,
        borderRadius: 8,
        padding: 12,
        backgroundColor: colors.white,
    },
    dateButtonText: {
        fontSize: 16,
        fontFamily: Fonts.regular,
        color: colors.black,
        textAlign: 'center',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: colors.grey_light,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: colors.black,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: colors.black,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontFamily: Fonts.medium,
        color: "white",
    },
};

export default DurationFilter;