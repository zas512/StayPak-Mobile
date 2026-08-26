import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: any;
  dot?: boolean;
}

const variantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: '#f3f4f6',
    text: '#374151',
    border: '#e5e7eb',
  },
  success: {
    bg: '#ecfdf5',
    text: '#059669',
    border: '#a7f3d0',
  },
  warning: {
    bg: '#fffbeb',
    text: '#d97706',
    border: '#fcd34d',
  },
  danger: {
    bg: '#fef2f2',
    text: '#dc2626',
    border: '#fecaca',
  },
  info: {
    bg: '#eff6ff',
    text: '#2563eb',
    border: '#bfdbfe',
  },
  outline: {
    bg: 'transparent',
    text: '#374151',
    border: '#d1d5db',
  },
};

const darkVariantColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  default: {
    bg: '#1e293b',
    text: '#e5e7eb',
    border: '#334155',
  },
  success: {
    bg: '#064e3b',
    text: '#34d399',
    border: '#065f46',
  },
  warning: {
    bg: '#451a03',
    text: '#fbbf24',
    border: '#78350f',
  },
  danger: {
    bg: '#450a0a',
    text: '#f87171',
    border: '#7f1d1d',
  },
  info: {
    bg: '#1e3a5f',
    text: '#60a5fa',
    border: '#1e40af',
  },
  outline: {
    bg: 'transparent',
    text: '#e5e7eb',
    border: '#475569',
  },
};

const sizeStyles = {
  sm: { paddingHorizontal: 6, paddingVertical: 2, fontSize: 10, borderRadius: 4, dotSize: 6 },
  md: { paddingHorizontal: 8, paddingVertical: 3, fontSize: 11, borderRadius: 6, dotSize: 7 },
  lg: { paddingHorizontal: 10, paddingVertical: 4, fontSize: 12, borderRadius: 8, dotSize: 8 },
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  style,
  dot = false,
}) => {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? darkVariantColors[variant] : variantColors[variant];
  const sizes = sizeStyles[size];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === 'outline' ? 1 : 0,
          paddingHorizontal: sizes.paddingHorizontal,
          paddingVertical: sizes.paddingVertical,
          borderRadius: sizes.borderRadius,
        },
        style,
      ]}
    >
      {dot && (
        <View
          style={[
            styles.dot,
            { backgroundColor: colors.text, width: sizes.dotSize, height: sizes.dotSize, borderRadius: sizes.dotSize / 2 },
          ]}
        />
      )}
      <Text
        style={[
          styles.text,
          { color: colors.text, fontSize: sizes.fontSize },
        ]}
      >
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  text: {
    fontWeight: '600',
    fontFamily: 'System',
  },
  dot: {},
});