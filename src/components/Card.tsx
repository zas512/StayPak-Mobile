import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
  elevation?: number;
  border?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = 2,
  border = false,
  padding = 'md',
}) => {
  const { theme } = useTheme();

  const paddingValues = {
    none: 0,
    sm: 12,
    md: 16,
    lg: 20,
  };

  const backgroundColor = theme === 'dark' ? '#0f172a' : '#ffffff';
  const borderColor = theme === 'dark' ? '#1e293b' : '#e5e7eb';
  const shadowColor = theme === 'dark' ? '#000' : '#000';

  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor: border ? borderColor : 'transparent',
          borderWidth: border ? 1 : 0,
          elevation,
          shadowColor,
          shadowOffset: { width: 0, height: elevation === 0 ? 0 : 1 },
          shadowOpacity: theme === 'dark' ? 0.3 : 0.1,
          shadowRadius: elevation * 2,
          padding: paddingValues[padding],
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.95}
    >
      {children}
    </Component>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  style?: any;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, subtitle, action, style }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.headerContent}>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.headerSubtitle, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{subtitle}</Text>
        )}
      </View>
      {action}
    </View>
  );
};

interface CardSectionProps {
  children: React.ReactNode;
  style?: any;
  divider?: boolean;
  title?: string;
}

export const CardSection: React.FC<CardSectionProps> = ({ children, style, divider = false, title }) => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.section,
        divider && styles.sectionDivider,
        {
          borderTopColor: theme === 'dark' ? '#1e293b' : '#e5e7eb',
        },
        style,
      ]}
    >
      {title && (
        <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{title}</Text>
      )}
      {children}
    </View>
  );
};

interface CardFooterProps {
  children: React.ReactNode;
  style?: any;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  return <View style={[styles.footer, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'System',
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: 'System',
    marginTop: 2,
  },
  section: {
    marginHorizontal: -16,
    marginVertical: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionDivider: {
    borderTopWidth: 1,
    paddingTop: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'System',
    marginBottom: 12,
  },
  footer: {
    marginTop: 8,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});