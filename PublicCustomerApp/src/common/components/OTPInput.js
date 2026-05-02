// components/OTPInput.js
import React, {useEffect, useMemo, useRef, useState} from 'react';
import {TextInput, StyleSheet, Pressable, Platform} from 'react-native';
import PropTypes from 'prop-types';

const OTPInput = ({
  inputCount = 6,
  value,
  onChange,
  onComplete,
  autoFocus = true,
  containerStyle,
  inputStyle,
  focusedBorderColor = '#2785ff',
  tintColor, // array or single color; applied to borders
  keyboardType = 'number-pad',
  textContentType = 'oneTimeCode',
  autoComplete = 'sms-otp',
  secureTextEntry = false,
  editable = true,
}) => {
  const inputsRef = useRef([]);
  const [internal, setInternal] = useState(Array(inputCount).fill(''));
  const backspaceHandledRef = useRef(false);
  const isControlled = typeof value === 'string';
  const digits = useMemo(() => {
    if (isControlled) {
      const chars = (value || '').slice(0, inputCount).split('');
      if (chars.length < inputCount) {
        return chars.concat(Array(inputCount - chars.length).fill(''));
      }
      return chars;
    }
    if (internal.length !== inputCount) {
      const normalized = Array(inputCount).fill('');
      internal.slice(0, inputCount).forEach((char, idx) => {
        normalized[idx] = char || '';
      });
      return normalized;
    }
    return internal;
  }, [value, internal, inputCount, isControlled]);

  // Normalize tint colors
  const tintArray = useMemo(() => {
    if (!tintColor) return Array(inputCount).fill(undefined);
    if (Array.isArray(tintColor)) return tintColor.slice(0, inputCount);
    return Array(inputCount).fill(tintColor);
  }, [tintColor, inputCount]);

  // Autofocus first box
  useEffect(() => {
    if (!autoFocus || !editable) return;
    const t = setTimeout(() => {
      inputsRef.current[0]?.focus?.();
    }, 50);
    return () => clearTimeout(t);
  }, [autoFocus, editable]);

  // Helpers
  const commit = (next) => {
    const safeNext = next.slice(0, inputCount).map((char) => char || '');
    const joined = safeNext.join('');
    if (!isControlled) setInternal(safeNext);
    onChange?.(joined);
    if (joined.length === inputCount) onComplete?.(joined);
  };

  const setCharAt = (idx, char) => {
    const next = digits.slice(0, inputCount);
    next[idx] = char;
    commit(next);
  };

  const handleChange = (text, index) => {
    // Skip if backspace was already handled by onKeyPress
    if (backspaceHandledRef.current && (text || '').length === 0) {
      backspaceHandledRef.current = false;
      return;
    }

    const onlyDigits = (text || '').replace(/[^0-9]/g, '');
    const currentDigit = digits[index] || '';

    // Ignore non-digit input without clearing existing value
    if ((text || '').length > 0 && onlyDigits.length === 0) {
      inputsRef.current[index]?.setNativeProps?.({ text: currentDigit });
      return;
    }
    
    // Handle backspace/empty text - this is the PRIMARY handler for backspace
    if (onlyDigits.length === 0 && currentDigit.length > 0) {
      // Field had a value and is now empty - clear it immediately
      inputsRef.current[index]?.setNativeProps?.({ text: '' });
      setCharAt(index, '');
      return;
    }
    
    // Field is empty and text is also empty - user pressed backspace on empty field
    if (onlyDigits.length === 0 && currentDigit.length === 0 && index > 0) {
      // Move to previous field and clear it if it has value
      const prevIndex = index - 1;
      if (digits[prevIndex]) {
        // Clear previous field immediately
        inputsRef.current[prevIndex]?.setNativeProps?.({ text: '' });
        setCharAt(prevIndex, '');
        inputsRef.current[prevIndex]?.focus?.();
      } else {
        // Previous is also empty, just move focus
        inputsRef.current[prevIndex]?.focus?.();
      }
      return;
    }
    
    // If somehow we got empty text but the above cases didn't catch it
    if (onlyDigits.length === 0) {
      setCharAt(index, '');
      return;
    }

    // PASTE CASE: user pasted entire code or multiple digits
    if ((text || '').length > 1 && onlyDigits.length > 1) {
      // Prevent brief flash of full code in the first box
      if (index === 0) {
        inputsRef.current[index]?.setNativeProps?.({ text: '' });
      }
      const next = Array(inputCount).fill('');
      for (let i = 0; i < inputCount; i++) {
        next[i] = onlyDigits[i] || '';
      }
      commit(next);
      // focus last filled or last
      const last = Math.min(onlyDigits.length, inputCount) - 1;
      inputsRef.current[last]?.focus?.();
      return;
    }

    // Single digit
    setCharAt(index, onlyDigits);
    // move to next
    if (index < inputCount - 1) {
      inputsRef.current[index + 1]?.focus?.();
    } else {
      // Last box – blur to trigger autofill suggestions to hide
      inputsRef.current[index]?.blur?.();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      // If current field has a value, clear it immediately
      // This handles the case where onKeyPress fires reliably (like when text is selected)
      if (digits[index]) {
        // Force clear immediately, bypassing any selection state
        inputsRef.current[index]?.setNativeProps?.({ text: '' });
        setCharAt(index, '');
        backspaceHandledRef.current = true;
      } else if (index > 0) {
        // Field is empty, move to previous
        const prevIndex = index - 1;
        inputsRef.current[prevIndex]?.focus?.();
        // If previous has value, clear it immediately (single backspace clears previous too)
        if (digits[prevIndex]) {
          requestAnimationFrame(() => {
            inputsRef.current[prevIndex]?.setNativeProps?.({ text: '' });
            setCharAt(prevIndex, '');
            backspaceHandledRef.current = true;
          });
        }
      }
    } else if (e.nativeEvent.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus?.();
    } else if (e.nativeEvent.key === 'ArrowRight' && index < inputCount - 1) {
      inputsRef.current[index + 1]?.focus?.();
    }
  };

  const handleFocus = (index) => {
    // Place cursor at end on Android (cosmetic)
    if (Platform.OS === 'android') {
      setTimeout(() => inputsRef.current[index]?.setNativeProps?.({selection: {start: 1, end: 1}}), 0);
    }
  };

  const borderTint = (index, focused) => {
    const base = tintArray[index];
    if (focused) return focusedBorderColor || base || styles.input.borderColor;
    return base || styles.input.borderColor;
  };

  return (
    <Pressable
      onPress={() => inputsRef.current.find(i => i && i.isFocused && i.isFocused()) ? null : inputsRef.current[0]?.focus?.()}
      style={[styles.container, containerStyle]}
      accessibilityRole="adjustable"
      accessibilityLabel="One Time Password input"
      accessibilityHint={`Enter ${inputCount}-digit code`}
    >
      {Array.from({length: inputCount}).map((_, index) => (
        <Box
          key={index}
          index={index}
          value={digits[index] || ''}
          inputRef={(r) => (inputsRef.current[index] = r)}
          onChangeText={(t) => handleChange(t, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          keyboardType={keyboardType}
          textContentType={textContentType}
          autoComplete={autoComplete}
          inputStyle={inputStyle}
          focusedBorderColor={focusedBorderColor}
          borderTintProvider={(focused) => borderTint(index, focused)}
          secureTextEntry={secureTextEntry}
          editable={editable}
          maxLength={index === 0 ? inputCount : 1}
          // Autofill hints mainly respected on the *first* input for iOS
          importantForAutofill={index === 0 ? 'yes' : 'no'}
          autoFocus={autoFocus && index === 0}
        />
      ))}
    </Pressable>
  );
};

const Box = ({
  value,
  inputRef,
  onChangeText,
  onKeyPress,
  onFocus,
  keyboardType,
  textContentType,
  autoComplete,
  inputStyle,
  borderTintProvider,
  secureTextEntry,
  editable,
  importantForAutofill,
  autoFocus,
  maxLength,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <TextInput
      ref={inputRef}
      value={value}
      onChangeText={onChangeText}
      onKeyPress={onKeyPress}
      onFocus={() => { setFocused(true); onFocus?.(); }}
      onBlur={() => setFocused(false)}
      keyboardType={keyboardType}
      textContentType={textContentType}
      autoComplete={autoComplete}
      autoCapitalize="none"
      autoCorrect={false}
      maxLength={maxLength}
      secureTextEntry={secureTextEntry}
      editable={editable}
      importantForAutofill={importantForAutofill}
      autoFocus={autoFocus}
      style={[
        styles.input,
        { borderColor: borderTintProvider(focused) },
        inputStyle,
      ]}
      // iOS hint for code autofill
      // Android 13+ also respects 'sms-otp' / 'oneTimeCode'
      inputMode="numeric"
      // Prevent iOS from showing predictive bar
      contextMenuHidden
      selectTextOnFocus={Platform.OS === 'ios'}
      // Visually center the digit
    />
  );
};

Box.propTypes = {
  value: PropTypes.string,
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  onChangeText: PropTypes.func,
  onKeyPress: PropTypes.func,
  onFocus: PropTypes.func,
  keyboardType: PropTypes.string,
  textContentType: PropTypes.string,
  autoComplete: PropTypes.string,
  inputStyle: PropTypes.any,
  borderTintProvider: PropTypes.func,
  secureTextEntry: PropTypes.bool,
  editable: PropTypes.bool,
  importantForAutofill: PropTypes.string,
  autoFocus: PropTypes.bool,
  maxLength: PropTypes.number,
};

OTPInput.propTypes = {
  inputCount: PropTypes.number,
  value: PropTypes.string,
  onChange: PropTypes.func,
  onComplete: PropTypes.func,
  autoFocus: PropTypes.bool,
  containerStyle: PropTypes.any,
  inputStyle: PropTypes.any,
  focusedBorderColor: PropTypes.string,
  tintColor: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
  keyboardType: PropTypes.string,
  textContentType: PropTypes.string,
  autoComplete: PropTypes.string,
  secureTextEntry: PropTypes.bool,
  editable: PropTypes.bool,
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  input: {
    width: 40,
    height: 60,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    textAlign: 'center',
    fontSize: 20,
    color: 'black',
  },
});

export default OTPInput;
