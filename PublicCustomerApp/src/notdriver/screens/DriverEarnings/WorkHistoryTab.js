import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Modal } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import APIRequest from '../../../common/APIRequest';
import useUserStore from '../../../common/store/useUserStore';
import MonthPickerModal from '../../../common/components/MonthPickerModal';
import CustomeCalender from '../../../common/components/CustomeCalender';
import { Colors, colors, Fonts } from '../../../common/constants/constants';
import { useTranslation } from 'react-i18next';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

const formatTime = (timestamp) => {
    const d = new Date(timestamp);
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${ampm}`;
};

const formatDuration = (fromTs, toTs) => {
    const diffMs = toTs - fromTs;
    const totalMin = Math.floor(diffMs / 60000);
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0 && mins > 0) return `${hrs}h ${mins}m`;
    if (hrs > 0) return `${hrs}h`;
    return `${mins}m`;
};

const formatDateLabel = (dateStr) => {
    const [y, m, d] = dateStr.split('-');
    const date = new Date(Number(y), Number(m) - 1, Number(d));
    const day = date.getDate();
    const month = MONTH_NAMES[date.getMonth()].slice(0, 3);
    const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    return `${weekday}, ${day} ${month}`;
};

const toLocalDateStr = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const WorkHistoryTab = () => {
    const { t } = useTranslation();
    const { userInfo } = useUserStore();

    const now = new Date();
    const currentMonthIndex = now.getMonth();
    const currentYear = now.getFullYear();
    const defaultStart = new Date(currentYear, currentMonthIndex, 1).getTime();
    const defaultEnd = new Date(currentYear, currentMonthIndex + 1, 0, 23, 59, 59, 999).getTime();

    const [startDate, setStartDate] = useState(defaultStart);
    const [endDate, setEndDate] = useState(defaultEnd);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [filterDate, setFilterDate] = useState(null); // 'YYYY-MM-DD' or null
    const [workLog, setWorkLog] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedMonth, setSelectedMonth] = useState({
        name: MONTH_NAMES[currentMonthIndex],
        year: currentYear,
    });

    const fetchWorkHistory = async () => {
        setLoading(true);
        try {
            const api = new APIRequest();
            const response = await api.request(
                `/publicrides/driver/v2/getWorkLog?from=${startDate}&to=${endDate}`,
                'POST',
                null,
                userInfo.token,
            );
            if (response.success && response.workLog?.length > 0) {
                setWorkLog(response.workLog[0]);
            } else {
                setWorkLog(null);
            }
        } catch (error) {
            console.error('Error fetching work history:', error);
            setWorkLog(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWorkHistory();
    }, [startDate, endDate]);

    const handleMonthSelect = (month) => {
        setStartDate(month.startTime);
        setEndDate(month.endTime);
        setSelectedMonth({ name: month.name, year: month.year });
        setFilterDate(null);
    };

    const handleDateSelect = (day) => {
        setFilterDate(day.dateString);
        setShowDatePicker(false);
    };

    const formatMinutesDisplay = (mins) => {
        const h = Math.floor(mins / 60);
        const m = Math.round(mins % 60);
        if (h > 0 && m > 0) return `${h}h ${m}m`;
        if (h > 0) return `${h}h`;
        return `${m}m`;
    };

    // Merge dailyOnlineMinutes and dailyOnlineHours so every date shows up
    const dailyMap = { ...workLog?.dailyOnlineHours };
    if (workLog?.dailyOnlineMinutes) {
        Object.entries(workLog.dailyOnlineMinutes).forEach(([date, mins]) => {
            dailyMap[date] = mins; // minutes take precedence
        });
    }
    const allDailyEntries = Object.entries(dailyMap).sort(([a], [b]) => b.localeCompare(a));
    const dailyEntries = filterDate
        ? allDailyEntries.filter(([date]) => date === filterDate)
        : allDailyEntries;
    const isMinutes = !!workLog?.dailyOnlineMinutes;

    // Disable future dates & mark past no-data days red
    const todayStr = toLocalDateStr(Date.now());
    const monthEndStr = toLocalDateStr(endDate);
    const calendarMaxStr = monthEndStr > todayStr ? todayStr : monthEndStr;
    const datesWithData = new Set(Object.keys(dailyMap));
    const noDataMarks = {};
    const loopDate = new Date(startDate);
    while (true) {
        const ds = toLocalDateStr(loopDate.getTime());
        if (ds > calendarMaxStr) break;
        if (!datesWithData.has(ds)) {
            noDataMarks[ds] = { marked: true, dotColor: '#e74c3c' };
        }
        loopDate.setDate(loopDate.getDate() + 1);
    }

    const sessionsByDate = {};
    if (workLog?.workingHours) {
        workLog.workingHours.forEach((session) => {
            const dateKey = new Date(session.from).toISOString().slice(0, 10);
            if (!sessionsByDate[dateKey]) sessionsByDate[dateKey] = [];
            sessionsByDate[dateKey].push(session);
        });
    }

    return (
        <View style={styles.container}>
            <View style={styles.filterRow}>
                <TouchableOpacity style={styles.monthSelector} onPress={() => setShowMonthPicker(true)}>
                    <MaterialIcons name="calendar-month" size={20} color={Colors.periwinkle} />
                    <Text style={styles.monthText}>
                        {selectedMonth.name} {selectedMonth.year}
                    </Text>
                    <MaterialIcons name="arrow-drop-down" size={22} color={Colors.black} />
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.dateFilterBtn, filterDate && styles.dateFilterBtnActive]}
                    onPress={() => setShowDatePicker(true)}
                >
                    <MaterialIcons name="event" size={20} color={filterDate ? Colors.white : Colors.periwinkle} />
                    {filterDate ? (
                        <Text style={styles.dateFilterTextActive}>{formatDateLabel(filterDate)}</Text>
                    ) : (
                        <Text style={styles.dateFilterText}>{t('select_date') || 'Select Date'}</Text>
                    )}
                </TouchableOpacity>

                {filterDate && (
                    <TouchableOpacity style={styles.clearBtn} onPress={() => setFilterDate(null)}>
                        <Ionicons name="close-circle" size={22} color={Colors.warm_grey} />
                    </TouchableOpacity>
                )}
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={Colors.periwinkle} style={styles.loader} />
            ) : !workLog ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="time-outline" size={48} color={Colors.grey_dark} />
                    <Text style={styles.emptyText}>{t('no_work_history_found')}</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Summary Card */}
                    <View style={styles.summaryCard}>
                        <View style={styles.summaryRow}>
                            <View style={styles.summaryItem}>
                                <Ionicons name="time" size={22} color={Colors.green_online} />
                                <Text style={styles.summaryLabel}>{t('total_online_hours')}</Text>
                                <Text style={styles.summaryValue}>
                                    {workLog.totalOnlineMinutes != null
                                        ? formatMinutesDisplay(workLog.totalOnlineMinutes)
                                        : `${workLog.totalOnlineHours ?? 0}h`}
                                </Text>
                            </View>
                            <View style={styles.summaryDivider} />
                            <View style={styles.summaryItem}>
                                <MaterialIcons name="date-range" size={22} color={Colors.periwinkle} />
                                <Text style={styles.summaryLabel}>{t('active_days')}</Text>
                                <Text style={styles.summaryValue}>{dailyEntries.length}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Daily Breakdown */}
                    {dailyEntries.map(([date, value]) => {
                        const sessions = sessionsByDate[date] || [];
                        const onlineSessions = sessions.filter((s) => s.status === 'online');
                        const displayValue = isMinutes ? formatMinutesDisplay(value) : `${value}h`;
                        return (
                            <View key={date} style={styles.dayCard}>
                                <View style={styles.dayHeader}>
                                    <Text style={styles.dayDate}>{formatDateLabel(date)}</Text>
                                    <View style={styles.dayHoursBadge}>
                                        <Ionicons name="time-outline" size={14} color={Colors.green_online} />
                                        <Text style={styles.dayHoursText}>{displayValue}</Text>
                                    </View>
                                </View>

                                {onlineSessions.length > 0 && (
                                    <View style={styles.sessionsContainer}>
                                        {onlineSessions.map((session, idx) => (
                                            <View key={idx} style={styles.sessionRow}>
                                                <View style={styles.timelineDot} />
                                                {idx < onlineSessions.length - 1 && <View style={styles.timelineLine} />}
                                                <View style={styles.sessionInfo}>
                                                    <Text style={styles.sessionTime}>
                                                        {formatTime(session.from)} – {formatTime(session.to)}
                                                    </Text>
                                                    <Text style={styles.sessionDuration}>
                                                        {formatDuration(session.from, session.to)}
                                                    </Text>
                                                </View>
                                            </View>
                                        ))}
                                    </View>
                                )}
                            </View>
                        );
                    })}
                </ScrollView>
            )}

            <MonthPickerModal
                visible={showMonthPicker}
                onClose={() => setShowMonthPicker(false)}
                onSelectMonth={handleMonthSelect}
                selectedMonth={selectedMonth}
            />

            {/* Date Picker Modal */}
            <Modal visible={showDatePicker} transparent animationType="fade">
                <TouchableOpacity
                    style={styles.dateModalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowDatePicker(false)}
                >
                    <View style={styles.dateModalContent}>
                        <TouchableOpacity style={styles.calendarCloseBtn} onPress={() => setShowDatePicker(false)}>
                            <Ionicons name="close" size={22} color={Colors.black} />
                        </TouchableOpacity>
                        <CustomeCalender
                            startDate={filterDate || ''}
                            endDate={filterDate || ''}
                            onDateChange={handleDateSelect}
                            isSelectMultipleDates={false}
                            minDate={toLocalDateStr(startDate)}
                            maxDate={calendarMaxStr}
                            initialDate={toLocalDateStr(startDate)}
                            extraMarkedDates={noDataMarks}
                        />
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginVertical: 10,
        paddingHorizontal: 14,
    },
    monthSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 6,
    },
    monthText: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    dateFilterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 12,
        backgroundColor: '#f5f5f5',
        gap: 6,
    },
    dateFilterBtnActive: {
        backgroundColor: Colors.periwinkle,
    },
    dateFilterText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    dateFilterTextActive: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: Colors.white,
    },
    clearBtn: {
        padding: 4,
    },
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dateModalContent: {
        width: '90%',
        backgroundColor: Colors.white,
        borderRadius: 16,
        padding: 10,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    calendarCloseBtn: {
        alignSelf: 'flex-end',
        padding: 6,
    },
    loader: {
        marginTop: 40,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 60,
        gap: 10,
    },
    emptyText: {
        fontSize: 14,
        fontFamily: Fonts.regular,
        color: Colors.grey_dark,
    },
    scrollContent: {
        paddingHorizontal: 14,
        paddingBottom: 100,
    },
    /* Summary */
    summaryCard: {
        backgroundColor: Colors.white,
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
    },
    summaryRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    summaryItem: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
    },
    summaryDivider: {
        width: 1,
        height: 40,
        backgroundColor: Colors.grey,
    },
    summaryLabel: {
        fontSize: 11,
        fontFamily: Fonts.regular,
        color: Colors.warm_grey,
        textAlign: 'center',
    },
    summaryValue: {
        fontSize: 20,
        fontFamily: Fonts.semi_bold,
        color: Colors.black,
    },
    /* Day Card */
    dayCard: {
        backgroundColor: Colors.white,
        borderRadius: 12,
        padding: 14,
        marginBottom: 10,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
    },
    dayHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dayDate: {
        fontSize: 14,
        fontFamily: Fonts.medium,
        color: Colors.black,
    },
    dayHoursBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.green_xxlight,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
        gap: 4,
    },
    dayHoursText: {
        fontSize: 13,
        fontFamily: Fonts.medium,
        color: Colors.green_online,
    },
    /* Sessions timeline */
    sessionsContainer: {
        marginTop: 12,
        marginLeft: 4,
    },
    sessionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 10,
        position: 'relative',
    },
    timelineDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: Colors.green_online,
        marginTop: 4,
        zIndex: 1,
    },
    timelineLine: {
        position: 'absolute',
        left: 4,
        top: 14,
        bottom: -10,
        width: 2,
        backgroundColor: Colors.green_xxlight,
    },
    sessionInfo: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginLeft: 12,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#f5f5f5',
    },
    sessionTime: {
        fontSize: 13,
        fontFamily: Fonts.regular,
        color: Colors.black,
    },
    sessionDuration: {
        fontSize: 12,
        fontFamily: Fonts.medium,
        color: Colors.periwinkle,
    },
});

export default WorkHistoryTab;


