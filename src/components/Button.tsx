import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: any;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  testID,
}) => {
  const { theme } = useTheme();

  const baseStyles = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: size === 'sm' ? 6 : size === 'lg' ? 12 : 8,
    paddingHorizontal: size === 'sm' ? 12 : size === 'lg' ? 24 : 16,
    paddingVertical: size === 'sm' ? 8 : size === 'lg' ? 16 : 12,
    gap: 8,
    ...(fullWidth && { width: '100%' }),
  };

  const variantStyles = {
    primary: {
      backgroundColor: theme === 'dark' ? '#059669' : '#059669',
    },
    secondary: {
      backgroundColor: theme === 'dark' ? '#047857' : '#047857',
    },
    outline: {
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      borderColor: theme === 'dark' ? '#059669' : '#059669',
    },
    ghost: {
      backgroundColor: 'transparent',
    },
    danger: {
      backgroundColor: theme === 'dark' ? '#ef4444' : '#ef4444',
    },
  };

  const textStyles = {
    primary: { color: '#ffffff' },
    secondary: { color: '#ffffff' },
    outline: { color: theme === 'dark' ? '#34d399' : '#059669' },
    ghost: { color: theme === 'dark' ? '#34d399' : '#059669' },
    danger: { color: '#ffffff' },
  };

  const fontSizes = {
    sm: 13,
    md: 15,
    lg: 17,
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        baseStyles,
        variantStyles[variant],
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'ghost' ? (theme === 'dark' ? '#34d399' : '#059669') : '#ffffff'}
        />
      ) : (
        <>
          {leftIcon && <View>{leftIcon}</View>}
          <Text
            style={[
              styles.text,
              textStyles[variant],
              { fontSize: fontSizes[size] },
            ]}
          >
            {title}
          </Text>
          {rightIcon && <View>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
    fontFamily: 'System',
  },
  disabled: {
    opacity: 0.5,
  },
});