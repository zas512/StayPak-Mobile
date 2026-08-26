import React, { forwardRef } from 'react';
import { TextInput, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

interface InputProps extends React.TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  secureTextEntry?: boolean;
  containerStyle?: any;
  inputStyle?: any;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      secureTextEntry = false,
      containerStyle,
      inputStyle,
      onChangeText,
      value,
      ...props
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [isSecure, setIsSecure] = React.useState(secureTextEntry);
    const [isFocused, setIsFocused] = React.useState(false);

    const borderColor = error
      ? (theme === 'dark' ? '#f87171' : '#ef4444')
      : isFocused
      ? (theme === 'dark' ? '#34d399' : '#059669')
      : theme === 'dark'
      ? '#374151'
      : '#d1d5db';

    const backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
    const textColor = theme === 'dark' ? '#f1f5f9' : '#111827';
    const placeholderColor = theme === 'dark' ? '#6b7280' : '#9ca3af';
    const labelColor = theme === 'dark' ? '#e5e7eb' : '#374151';
    const errorColor = theme === 'dark' ? '#f87171' : '#ef4444';
    const helperColor = theme === 'dark' ? '#9ca3af' : '#6b7280';

    const handleRightIconPress = () => {
      if (secureTextEntry && rightIcon) {
        setIsSecure(!isSecure);
      }
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && (
          <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        )}
        <View
          style={[
            styles.inputWrapper,
            {
              borderColor,
              backgroundColor,
            },
          ]}
        >
          {leftIcon && (
            <View style={styles.iconContainer}>
              {leftIcon}
            </View>
          )}
          <TextInput
            ref={ref}
            style={[
              styles.input,
              {
                color: textColor,
                paddingLeft: leftIcon ? 0 : undefined,
              },
              inputStyle,
            ]}
            secureTextEntry={isSecure}
            onChangeText={onChangeText}
            value={value}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholderTextColor={placeholderColor}
            {...props}
          />
          {secureTextEntry && (
            <TouchableOpacity onPress={handleRightIconPress} style={styles.iconContainer}>
              <Ionicons
                name={isSecure ? 'eye-off-outline' : 'eye-outline'}
                size={22}
                color={theme === 'dark' ? '#6b7280' : '#9ca3af'}
              />
            </TouchableOpacity>
          )}
          {rightIcon && !secureTextEntry && (
            <View style={styles.iconContainer}>{rightIcon}</View>
          )}
        </View>
        {(error || helperText) && (
          <Text style={[styles.helperText, { color: error ? errorColor : helperColor }]}>
            {error || helperText}
          </Text>
        )}
      </View>
    );
  }
);

Input.displayName = 'Input';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'System',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  iconContainer: {
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'System',
    paddingVertical: 0,
  },
  helperText: {
    fontSize: 12,
    fontFamily: 'System',
  },
});