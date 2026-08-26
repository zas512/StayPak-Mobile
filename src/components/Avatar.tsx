import React from 'react';
import { Image, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface AvatarProps {
  source?: { uri: string } | number;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  style?: any;
  borderWidth?: number;
  borderColor?: string;
}

const sizeMap = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
};

export const Avatar: React.FC<AvatarProps> = ({
  source,
  name,
  size = 'md',
  style,
  borderWidth = 0,
  borderColor,
}) => {
  const { theme } = useTheme();
  const dimension = typeof size === 'number' ? size : sizeMap[size];
  const fontSize = dimension * 0.35;

  const bgColors = [
    '#059669', '#0d9488', '#0891b2', '#0284c7',
    '#2563eb', '#4f46e5', '#7c3aed', '#9333ea',
    '#c026d3', '#db2777', '#e11d48', '#f43f5e',
  ];

  const getColorFromName = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return bgColors[Math.abs(hash) % bgColors.length];
  };

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  const bgColor = name ? getColorFromName(name) : (theme === 'dark' ? '#374151' : '#d1d5db');
  const textColor = '#ffffff';

  if (source) {
    return (
      <Image
        source={source}
        style={[
          styles.avatar,
          { width: dimension, height: dimension, borderRadius: dimension / 2 },
          borderWidth && { borderWidth, borderColor: borderColor || (theme === 'dark' ? '#374151' : '#e5e7eb') },
          style,
        ]}
      />
    );
  }

  return (
    <View
      style={[
        styles.avatar,
        {
          width: dimension,
          height: dimension,
          borderRadius: dimension / 2,
          backgroundColor: bgColor,
          borderWidth,
          borderColor: borderColor || 'transparent',
        },
        style,
      ]}
    >
      <Text style={[styles.initials, { fontSize, color: textColor }]}>{initials}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '600',
    fontFamily: 'System',
  },
});