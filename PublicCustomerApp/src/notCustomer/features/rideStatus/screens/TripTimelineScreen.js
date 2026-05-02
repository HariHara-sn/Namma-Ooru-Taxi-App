import React, { useMemo, useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NavBar from '../../../components/NavBar';
import { useStackScreenStore } from '../../../store/useStackScreenStore';
import { Fonts } from '../../../constants/constants';
import useCurrentRideInfoStore from '../store/useCurrentRideInfoStore';
import SearchAPI from '../../../controllers/NEMap/Search';

const EVENT_CONFIG = {
  harshBreaking: {
    label: 'Hard Brake',
    icon: 'car-outline',
    color: '#EF4444',
    bg: '#FEF2F2',
    border: '#FECACA',
    dot: '#EF4444',
  },
  harshAcceleration: {
    label: 'Hard Acceleration',
    icon: 'flash-outline',
    color: '#F59E0B',
    bg: '#FFFBEB',
    border: '#FDE68A',
    dot: '#F59E0B',
  },
  harshCornering: {
    label: 'Hard Cornering',
    icon: 'navigate-outline',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    border: '#DDD6FE',
    dot: '#8B5CF6',
  },
  overspeeding: {
    label: 'Overspeeding',
    icon: 'speedometer-outline',
    color: '#DC2626',
    bg: '#FFF1F2',
    border: '#FECDD3',
    dot: '#DC2626',
  },
};

const formatTime = (isoString) => {
  if (!isoString) return '--';
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return '--';
  }
};

const TripTimelineScreen = () => {
  const { goBack } = useStackScreenStore();
  const harshDriving = useCurrentRideInfoStore(s => s.harshDriving);
  const [locationNames, setLocationNames] = useState({});
  const searchRef = useRef(new SearchAPI());

  const events = useMemo(() => {
    if (!harshDriving) return [];
    const all = [];
    Object.entries(harshDriving).forEach(([type, items]) => {
      if (!Array.isArray(items)) return;
      items.forEach(item => {
        all.push({ type, ...item });
      });
    });
    all.sort((a, b) => new Date(a.time) - new Date(b.time));
    return all;
  }, [harshDriving]);

  useEffect(() => {
    if (events.length === 0) return;

    let cancelled = false;

    const pending = events.filter(e => {
      if (!e.location) return false;
      const key = `${e.location.lat},${e.location.lon}`;
      return !(key in locationNames);
    });
    if (pending.length === 0) return;

    // Mark all pending as loading
    const loading = {};
    pending.forEach(e => { loading[`${e.location.lat},${e.location.lon}`] = null; });
    setLocationNames(prev => ({ ...prev, ...loading }));

    const uniqueKeys = [...new Set(pending.map(e => `${e.location.lat},${e.location.lon}`))];

    // Process sequentially to avoid overwhelming native Geocoder
    const fetchSequential = async () => {
      for (const key of uniqueKeys) {
        if (cancelled) break;
        const [lat, lon] = key.split(',').map(Number);
        try {
          const result = await searchRef.current.reverseGeocode(lon, lat);
          const name = result?.placeName || (result?.address?.length > 0 ? result.address[0] : null);
          if (!cancelled) {
            setLocationNames(prev => ({ ...prev, [key]: name || `${lat.toFixed(5)}, ${lon.toFixed(5)}` }));
          }
        } catch {
          if (!cancelled) {
            setLocationNames(prev => ({ ...prev, [key]: `${lat.toFixed(5)}, ${lon.toFixed(5)}` }));
          }
        }
        // Small delay between requests to avoid Geocoder overload
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    };

    fetchSequential();

    return () => { cancelled = true; };
  }, [events]);

  return (
    <View style={styles.container}>
      <NavBar withBg title="Trip Timeline" onBackPress={goBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={56} color="#86EFAC" />
            <Text style={styles.emptyTitle}>Smooth Ride!</Text>
            <Text style={styles.emptySubtitle}>No harsh driving events recorded for this trip.</Text>
          </View>
        ) : (
          <>
            <Text style={styles.summaryText}>{events.length} event{events.length !== 1 ? 's' : ''} recorded</Text>
            <View style={styles.timeline}>
              {events.map((event, index) => {
                const cfg = EVENT_CONFIG[event.type] || {
                  label: event.type,
                  icon: 'alert-circle-outline',
                  color: '#6B7280',
                  bg: '#F9FAFB',
                  border: '#E5E7EB',
                  dot: '#6B7280',
                };
                const isLast = index === events.length - 1;
                return (
                  <View key={`${event.type}-${index}`} style={styles.timelineRow}>
                    {/* Left: dot + line */}
                    <View style={styles.lineCol}>
                      <View style={[styles.dot, { backgroundColor: cfg.dot }]} />
                      {!isLast && <View style={[styles.line, { backgroundColor: cfg.dot + '40' }]} />}
                    </View>

                    {/* Right: event card */}
                    <View style={[styles.eventCard, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>
                      <View style={styles.eventHeader}>
                        <View style={[styles.iconCircle, { backgroundColor: cfg.color + '20' }]}>
                          <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                        </View>
                        <Text style={[styles.eventLabel, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={styles.eventTime}>{formatTime(event.time)}</Text>
                      </View>
                      {event.details ? (
                        <Text style={styles.eventDetail}>{event.details}</Text>
                      ) : null}
                      {event.location ? (
                        <View style={styles.locationRow}>
                          <Icon name="location-on" size={11} color="#9CA3AF" />
                          {(() => {
                            const key = `${event.location.lat},${event.location.lon}`;
                            const name = locationNames[key];
                            if (!(key in locationNames)) {
                              return <ActivityIndicator size={10} color="#9CA3AF" style={{ marginLeft: 2 }} />;
                            }
                            return (
                              <Text style={styles.locationText} numberOfLines={2}>{name}</Text>
                            );
                          })()}
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },
  summaryText: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
  },
  timeline: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 0,
  },
  lineCol: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: 14,
    zIndex: 1,
  },
  line: {
    width: 2,
    flex: 1,
    minHeight: 16,
    marginTop: 2,
  },
  eventCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventLabel: {
    fontFamily: Fonts.medium,
    fontSize: 13,
    flex: 1,
  },
  eventTime: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  eventDetail: {
    fontFamily: Fonts.regular,
    fontSize: 12,
    color: '#374151',
    marginLeft: 34,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 34,
  },
  locationText: {
    fontFamily: Fonts.regular,
    fontSize: 11,
    color: '#9CA3AF',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: Fonts.semi_bold,
    fontSize: 18,
    color: '#111827',
  },
  emptySubtitle: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default TripTimelineScreen;
