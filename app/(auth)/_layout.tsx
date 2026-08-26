import React from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useTheme } from '@/context/ThemeContext';

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="login" />
        <Stack.Screen name="register" />
        <Stack.Screen name="forgot-password" />
      </Stack>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});