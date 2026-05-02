// LangText.js
import React from 'react';
import { Text, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import { languageFontRatio } from '../../constants/constants';
import { colors } from '../../constants/constants';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const AdaptiveText = ({ style, color, children, ...props }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || 'en';
  const ratio = languageFontRatio[lang] || 1;


  let baseFontSize = Math.min(screenWidth, screenHeight) * 0.045; // slightly larger for better readability

  // Extract color and fontSize from style array or object
  let extractedColor, extractedFontSize;
  if (Array.isArray(style)) {
    style.forEach(s => {
      if (s && s.color && !extractedColor) extractedColor = s.color;
      if (s && s.fontSize && !extractedFontSize) extractedFontSize = s.fontSize;
    });
  } else if (style) {
    if (style.color) extractedColor = style.color;
    if (style.fontSize) extractedFontSize = style.fontSize;
  }
  color = extractedColor || color;

  let fontSize = extractedFontSize || baseFontSize;
  if (style && style.fontSize) fontSize = style.fontSize;
 
  // Merge final style
  const mergedStyle = [
    style,
    { fontSize: fontSize * ratio },
    { color: color || colors.black },
  ];

  return (
    <Text style={mergedStyle} allowFontScaling={false} {...props}>
      {children}
    </Text>
  );
};

export default AdaptiveText;
