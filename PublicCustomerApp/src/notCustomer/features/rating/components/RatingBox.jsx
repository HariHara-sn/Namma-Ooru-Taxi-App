import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropTypes from 'prop-types';
import { Fonts, colors } from '../../../constants/constants';
import { useTranslation } from 'react-i18next';
import AdaptiveText from '../../../components/Common/AdaptiveText';
const RatingBox = ({ onRatingSubmit, title , description, isSubmitting }) => {
  const {t} = useTranslation();
  const [rating, setRating] = useState(0);
  const [comments, setComments] = useState('');
  const [warning, setWarning] = useState('');

  const handleStarPress = (starIndex) => {
    setRating(starIndex + 1);
  };

  const handleSubmit = () => {
    if (onRatingSubmit && !isSubmitting && rating > 0) {
      onRatingSubmit({
        rating,
        comment: comments.trim()
      });
    }
  };

  // Enforce comment length and line count limits before updating state
  const handleCommentChange = (text) => {
    const lines = text.split(/\r?\n/);
    const exceedsLines = lines.length > 40;
    const limitedLines = exceedsLines ? lines.slice(0, 40) : lines;
    let nextText = limitedLines.join('\n');

    const sanitizedText = text.replace(/\r/g, '');
    const exceedsCharacters = sanitizedText.length > 300;
    if (nextText.length > 300) {
      nextText = nextText.slice(0, 300);
    }

    setWarning(exceedsLines || exceedsCharacters ? 'Maximum 300 characters and 40 lines allowed.' : '');
    setComments(nextText);
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <TouchableOpacity
          key={i}
          onPress={() => handleStarPress(i)}
          style={styles.starContainer}
        >
          <Icon
            name={i < rating ? 'star' : 'star-border'}
            size={32}
            color={i < rating ? '#FFD700' : '#D3D3D3'}
          />
        </TouchableOpacity>
      );
    }
    return stars;
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Title */}
        <AdaptiveText style={styles.title}>{t('how_is_your_trips')}</AdaptiveText>
        
        {/* Dotted line */}
        <View style={styles.dottedLine} />
        
        {/* Description */}
        <AdaptiveText style={styles.description}>{t('your_feedback_will_help_us_improving_driving_experience_better')}</AdaptiveText>
        
        {/* Star Rating */}
        <View style={styles.starsContainer}>
          {renderStars()}
        </View>
        
        {/* Comments Input */}
        <TextInput
          style={styles.commentsInput}
          placeholder={t('comments_optional')}
          placeholderTextColor={colors.grey_dark}
          value={comments}
          onChangeText={handleCommentChange}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        {warning ? (
          <AdaptiveText style={styles.warningText}>{warning}</AdaptiveText>
        ) : null}
        
        {/* Submit Button */}
     
      </View>

      <TouchableOpacity 
          style={[
            styles.submitButton,
            (rating === 0 || isSubmitting) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={rating === 0 || isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <AdaptiveText style={styles.submitButtonText}>{t('submit')}</AdaptiveText>
          )}
      </TouchableOpacity>
    </View>
  );
};

RatingBox.propTypes = {
  onRatingSubmit: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
  isSubmitting: PropTypes.bool,
};

RatingBox.defaultProps = {
    title: 'how_is_your_trips',
  description: 'your_feedback_will_help_us_improving_driving_experience_better',
  isSubmitting: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    borderWidth: 0.5,
    borderColor: colors.grey_dark,
    marginBottom: 15,
  },
  title: {
    fontSize: 20,
    fontFamily:Fonts.medium,
    color: colors.black_primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  dottedLine: {
    height: 1,
   
    marginBottom: 16,
    marginHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: colors.grey_dark,
    borderStyle: 'dashed',
  },
  description: {
    fontSize: 14,
    color: colors.black_primary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    fontFamily:Fonts.regular
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  starContainer: {
    marginHorizontal: 4,
  },
  commentsInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: colors.black,
    minHeight: 80,
   
  
  },
  submitButton: {
    backgroundColor: '#237b53',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontFamily:Fonts.medium
  },
  warningText: {
    color: '#E57373',
    fontSize: 12,
    marginTop: 8,
    fontFamily: Fonts.regular,
  },
});

export default RatingBox;
