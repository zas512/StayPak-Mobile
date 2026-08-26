import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function LoginScreen() {
  const { theme } = useTheme();
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = 'Enter a valid email address';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await login(email, password);
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await authApi.getGoogleAuthUrl();
      if (result.data.success && result.data.data?.authUrl) {
        // In real app, this would open web browser
        // For demo, show the URL
        Alert.alert(
          'Google Login',
          'This would normally redirect to Google OAuth. For demo, you can use the auth code from the URL.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Simulate',
              onPress: async () => {
                try {
                  const tokenResult = await authApi.handleGoogleCallback('demo_auth_code');
                  if (tokenResult.data.success) {
                    await login(email, password);
                    router.replace('/(app)');
                  }
                } catch (err) {
                  Alert.alert('Error', 'Google login failed');
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate Google login');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }]}>
              <Ionicons name="home" size={40} color={theme === 'dark' ? '#34d399' : '#059669'} />
            </View>
            <Text style={[styles.logoText, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>StayPak</Text>
            <Text style={[styles.subtitle, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Welcome back to your home away from home
            </Text>
          </View>

          {/* Login Form */}
          <Card style={styles.formCard}>
            <View style={styles.formContent}>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
              />
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="password"
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />

              <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Forgot password?</Text>
              </TouchableOpacity>

              <Button title={isLoading ? 'Signing in...' : 'Sign in'} variant="primary" onPress={handleLogin} loading={isLoading} style={styles.loginButton} />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Login */}
              <Button
                title="Continue with Google"
                variant="outline"
                onPress={handleGoogleLogin}
                leftIcon={<Ionicons name="logo-google" size={20} color={theme === 'dark' ? '#34d399' : '#059669'} />}
                style={styles.googleButton}
              />
            </View>
          </Card>

          {/* Sign Up Link */}
          <View style={styles.signupContainer}>
            <Text style={[styles.signupText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={[styles.signupLink, { color: theme === 'dark' ? '#34d399' : '#059669' }]}> Sign up</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  logoText: { fontSize: 32, fontWeight: '700', fontFamily: 'System' },
  subtitle: { fontSize: 14, fontFamily: 'System', marginTop: 8, textAlign: 'center' },
  formCard: { padding: 24 },
  formContent: { gap: 16 },
  forgotPassword: { alignItems: 'flex-end', marginTop: -8 },
  forgotPasswordText: { fontSize: 13, fontFamily: 'System', fontWeight: '500' },
  loginButton: { marginTop: 8, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { fontSize: 13, fontFamily: 'System', fontWeight: '500' },
  googleButton: { width: '100%' },
  signupContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  signupText: { fontSize: 14, fontFamily: 'System' },
  signupLink: { fontSize: 14, fontFamily: 'System', fontWeight: '600' },
});