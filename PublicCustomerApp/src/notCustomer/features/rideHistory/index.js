import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Dimensions, StyleSheet } from 'react-native';

import MyRidesScreen from './screens/MyRidesScreen';
import UpcomingRidesScreen from './screens/UpcomingRidesScreen';
import { useTranslation } from 'react-i18next';
import NavBar from '../../components/NavBar';
import { useStackScreenStore } from '../../store/useStackScreenStore';
import { Fonts ,colors} from '../../constants/constants';

const SCREEN_WIDTH = Dimensions.get('window').width;

const RideHistory = ({setScreen=false}) => {
    const { t } = useTranslation();
    const {setStackScreen} = useStackScreenStore();
	const [activeIndex, setActiveIndex] = useState(setScreen==='upcoming' ? 1 : 0);
	const translateX = useRef(new Animated.Value(0)).current;
	const sliderX = useRef(new Animated.Value(0)).current;

    const HandleBackBtn = () => {
        setStackScreen('Home');
    }

    


    

    const TAB_CONTAINER_WIDTH = SCREEN_WIDTH * 0.8; // 80% of screen width
    const SINGLE_TAB_WIDTH = TAB_CONTAINER_WIDTH / 2; // Width of one tab

    useEffect(() => {
        Animated.spring(translateX, { 
            toValue: -activeIndex * SCREEN_WIDTH, 
            useNativeDriver: true,
            friction: 8,
            tension: 50
        }).start();
        
        Animated.spring(sliderX, { 
            toValue: activeIndex * SINGLE_TAB_WIDTH,
            useNativeDriver: true,
            friction: 8,
            tension: 50
        }).start();
    }, [activeIndex, translateX, sliderX]);

	return (
        <>
        <NavBar withBg onBackPress={HandleBackBtn} title={t('your_rides')} paddingBottom={10} marginBottom={10} />
		<View style={styles.container}>
            
			{/* <View style={styles.tabs}>
                <Animated.View 
                    style={[
                        styles.slider, 
                        { transform: [{ translateX: sliderX }] }
                    ]} 
                />
                <View style={styles.tabsRow}>
                    <TouchableOpacity 
                        style={styles.tab} 
                        onPress={() => setActiveIndex(0)}
                    >
                        <Text style={[styles.tabText, activeIndex === 0 && styles.activeText]}>
                            Ride History
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.tab} 
                        onPress={() => setActiveIndex(1)}
                    >
                        <Text style={[styles.tabText, activeIndex === 1 && styles.activeText]}>
                            Upcoming
                        </Text>
                    </TouchableOpacity>
                </View>
			</View> */}

			<Animated.View style={[styles.pager, { width: SCREEN_WIDTH * 2, transform: [{ translateX }] }]}>
				<View style={{ width: SCREEN_WIDTH }}>
					<MyRidesScreen />
				</View>

				<View style={{ width: SCREEN_WIDTH }}>
					<UpcomingRidesScreen />
				</View>
			</Animated.View>
		</View>
        </>
	);
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#ffffffff', 
        width: '100%', 
     
    },
    tabs: { 
        position: 'relative',
        width: '80%',
        alignSelf: 'center',
        backgroundColor: colors.grey_xdark,
        borderRadius: 30,
        marginBottom: 15,
        
        overflow: 'hidden'
    },
    tabsRow: {
        flexDirection: 'row',
        position: 'relative',
        zIndex: 1
    },
    tab: { 
        width: '50%',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 8
    },
    tabText: { 
        color: '#000000ff', 
        fontSize: 16 ,
        fontFamily: Fonts.regular
    },
    activeText: { 
        color: '#fff', 
        fontWeight: '600' 
    },
    slider: { 
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: '50%',
        backgroundColor: '#000000ff',
        borderRadius: 30,
        zIndex: 0
    },
    pager: { 
        
        flexDirection: 'row', 
        flex: 1 
    }
});

export default RideHistory;
