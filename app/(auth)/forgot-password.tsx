import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = () => {
    if (!email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address');
      return false;
    }
    setError(null);
    return true;
  };

  const handleResetPassword = async () => {
    if (!validateEmail()) return;
    setIsLoading(true);
    try {
      const response = await authApi.forgotPassword(email);
      if (response.data.success) {
        setIsEmailSent(true);
      } else {
        setError(response.data.message || 'Failed to send reset email');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (isEmailSent) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }]}>
            <Ionicons name="mail-open-outline" size={40} color={theme === 'dark' ? '#34d399' : '#059669'} />
          </View>
          <Text style={[styles.successTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Check your email</Text>
          <Text style={[styles.successText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
            We've sent a password reset link to {email}. Please check your inbox.
          </Text>
          <View style={styles.successActions}>
            <Button title="Open email app" variant="primary" onPress={() => {}} style={styles.successButton} />
            <Button title="Back to login" variant="outline" onPress={() => router.replace('/login')} style={styles.successButton} />
          </View>
          <TouchableOpacity onPress={handleResetPassword} style={styles.resendLink}>
            <Text style={[styles.resendText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Didn't receive the email? <Text style={{ color: theme === 'dark' ? '#34d399' : '#059669', fontWeight: '600' }}>Resend</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          {/* Back Button */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name={Platform.OS === 'ios' ? 'chevron-back' : 'chevron-back-outline'} size={28} color={theme === 'dark' ? '#f1f5f9' : '#111827'} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.iconCircle, { backgroundColor: theme === 'dark' ? '#064e3b' : '#ecfdf5' }]}>
              <Ionicons name="key-outline" size={40} color={theme === 'dark' ? '#34d399' : '#059669'} />
            </View>
            <Text style={[styles.title, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Reset your password</Text>
            <Text style={[styles.subtitle, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>
          </View>

          {/* Form */}
          <Card style={styles.formCard}>
            <View style={styles.formContent}>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                error={error}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
              />
              <Button title={isLoading ? 'Sending...' : 'Send Reset Link'} variant="primary" onPress={handleResetPassword} loading={isLoading} style={styles.submitButton} />
            </View>
          </Card>

          {/* Back to Login */}
          <TouchableOpacity onPress={() => router.replace('/login')} style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Back to </Text>
            <Text style={[styles.loginLink, { color: theme === 'dark' ? '#34d399' : '#059669' }]}>Sign in</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 40, flexGrow: 1 },
  backButton: { padding: 8, marginBottom: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', fontFamily: 'System', textAlign: 'center' },
  subtitle: { fontSize: 14, fontFamily: 'System', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  formCard: { padding: 24 },
  formContent: { gap: 16 },
  submitButton: { marginTop: 8, width: '100%' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, fontFamily: 'System' },
  loginLink: { fontSize: 14, fontFamily: 'System', fontWeight: '600' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, gap: 16 },
  successIcon: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'System', textAlign: 'center' },
  successText: { fontSize: 14, fontFamily: 'System', textAlign: 'center', lineHeight: 22 },
  successActions: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  successButton: { flex: 1 },
  resendLink: { marginTop: 24 },
  resendText: { fontSize: 13, fontFamily: 'System', textAlign: 'center' },
});