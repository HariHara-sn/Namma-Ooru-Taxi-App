/* eslint-disable camelcase */
import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FlatList, View, Text, TouchableOpacity } from 'react-native';

import { onBoardingSlides } from '../../../notCustomer/constants/JsonData';
import { onBoardingStyles } from '../../../notCustomer/styles/SplashStyles';
import { width } from '../../../notCustomer/utils/Utils';
import { DataStore } from '../../../notCustomer/controllers/DataStore';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

const Slide = ({ data }) => {
  const { t } = useTranslation();
  return (
    <View style={onBoardingStyles.slide}>
      <View style={[onBoardingStyles.slideImageContainer]}>
        {data.image}
      </View>
      <Text style={onBoardingStyles.slideTitle}>{t(data.title)}</Text>
      <Text style={onBoardingStyles.slideSubtitle}>{t(data.description)}</Text>
    </View>
  );
};

Slide.propTypes = {
  data: PropTypes.object,
};

function Pagination({ index, length }) {
  const progress = (index + 1) / length;
  const progressWidth = `${progress * 100}%`;

  return (
    <View style={onBoardingStyles.pagination} pointerEvents="none">
      <View style={onBoardingStyles.paginationSliderInactive}>
        <View
          style={[
            onBoardingStyles.paginationSliderActive,
            { width: progressWidth },
          ]}
        />
      </View>
    </View>
  );
}

Pagination.propTypes = {
  index: PropTypes.number,
  length: PropTypes.number,
};

export default function OnBoarding() {
  const navigation = useNavigation()
  const { t } = useTranslation();
  const totalSlides = onBoardingSlides.length;
  const [index, setIndex] = useState(0);
  const indexRef = useRef(index);
  const flatListRef = useRef(null);

  indexRef.current = index;

  const handleDone = useCallback(() => {
    DataStore.storeData('onBoarding', 'onBoardingDone')
    navigation.navigate('LoginScreen')
  }, [navigation]);

  const handleNext = useCallback(() => {
    const nextIndex = index + 1;
    if (nextIndex < totalSlides) {
      flatListRef.current.scrollToIndex({ index: nextIndex });
    }
    if (nextIndex === totalSlides) {
      handleDone();
    }
  }, [index, totalSlides, handleDone]);

  const onScroll = useCallback(event => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const scroll_index = event.nativeEvent.contentOffset.x / slideSize;
    const roundIndex = Math.round(scroll_index);

    const distance = Math.abs(roundIndex - scroll_index);

    const isNoMansLand = distance > 0.4;

    if (roundIndex !== indexRef.current && !isNoMansLand) {
      setIndex(roundIndex);
    }
  }, []);

  const renderItem = useCallback(function renderItem({ item }) {
    return <Slide data={item} />;
  }, []);

  return (
    <View style={onBoardingStyles.onboardContainer}>
      {/* <View style={onBoardingStyles.skipBtn}>
        {index !== onBoardingSlides.length - 1 && (
          <TouchableOpacity onPress={() => handleDone()}>
            <Text testID="skip" style={onBoardingStyles.skipBtnText}>
              Skip
            </Text>
          </TouchableOpacity>
        )}
      </View> */}
      <FlatList
        ref={flatListRef}
        data={onBoardingSlides}
        style={onBoardingStyles.carousel}
        contentContainerStyle={{ alignItems: 'center' }}
        renderItem={renderItem}
        pagingEnabled
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={onScroll}
        initialNumToRender={3}
        maxToRenderPerBatch={1}
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        windowSize={1}
        keyExtractor={useCallback(s => String(s.id), [])}
        getItemLayout={useCallback(
          (_, ind) => ({
            ind,
            length: width,
            offset: ind * width,
          }),
          [],
        )}
      />
      <Pagination index={index} length={onBoardingSlides.length} />
      <TouchableOpacity
        style={onBoardingStyles.nextBtn}
        onPress={() => handleNext()}>
        <Text testID="next" style={onBoardingStyles.nextText}>
          {index === onBoardingSlides.length - 1 ? t('get_started') : t('next')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
