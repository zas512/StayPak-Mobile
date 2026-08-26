import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { authApi } from '@/services/api';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';

export default function RegisterScreen() {
  const { theme } = useTheme();
  const { register } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Enter a valid email address';
    if (formData.phone && !/^03\d{9}$/.test(formData.phone)) newErrors.phone = 'Enter a valid Pakistani phone number (e.g., 03001234567)';
    if (!formData.password) newErrors.password = 'Password is required';
    else {
      if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
      else if (!/[A-Z]/.test(formData.password)) newErrors.password = 'Must contain at least one uppercase letter';
      else if (!/[a-z]/.test(formData.password)) newErrors.password = 'Must contain at least one lowercase letter';
      else if (!/\d/.test(formData.password)) newErrors.password = 'Must contain at least one number';
    }
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.termsAccepted) newErrors.terms = 'You must accept the Terms of Service and Privacy Policy';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setIsLoading(true);
    try {
      await register({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
      });
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.response?.data?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const result = await authApi.getGoogleAuthUrl();
      if (result.data.success && result.data.data?.authUrl) {
        Alert.alert(
          'Google Sign Up',
          'This would normally redirect to Google OAuth for registration.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to initiate Google registration');
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
              Create your account to start exploring
            </Text>
          </View>

          {/* Register Form */}
          <Card style={styles.formCard}>
            <View style={styles.formContent}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.fullName}
                onChangeText={(text) => setFormData({ ...formData, fullName: text })}
                error={errors.fullName}
                autoCapitalize="words"
                leftIcon="person-outline"
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon="mail-outline"
              />
              <Input
                label="Phone Number (Optional)"
                placeholder="03001234567"
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                error={errors.phone}
                keyboardType="phone-pad"
                leftIcon="call-outline"
              />
              <Input
                label="Password"
                placeholder="Create a password"
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                error={errors.password}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
                rightIcon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowPassword(!showPassword)}
              />
              <Input
                label="Confirm Password"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                error={errors.confirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoComplete="new-password"
                leftIcon="lock-closed-outline"
                rightIcon={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                onRightIconPress={() => setShowConfirmPassword(!showConfirmPassword)}
              />

              {/* Password Strength Indicator */}
              {formData.password && (
                <View style={styles.passwordStrength}>
                  <View style={styles.strengthBars}>
                    {[1, 2, 3, 4].map((level) => (
                      <View
                        key={level}
                        style={[
                          styles.strengthBar,
                          {
                            backgroundColor:
                              getPasswordStrength(formData.password) >= level
                                ? getStrengthColor(getPasswordStrength(formData.password), theme)
                                : theme === 'dark'
                                ? '#374151'
                                : '#e5e7eb',
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.strengthLabel, { color: getStrengthColor(getPasswordStrength(formData.password), theme) }]}>
                    {getStrengthLabel(getPasswordStrength(formData.password))}
                  </Text>
                </View>
              )}

              {/* Terms */}
              <TouchableOpacity onPress={() => setFormData({ ...formData, termsAccepted: !formData.termsAccepted })} style={styles.termsRow}>
                <View
                  style={[
                    styles.checkbox,
                    formData.termsAccepted && styles.checkboxChecked,
                    { backgroundColor: formData.termsAccepted ? (theme === 'dark' ? '#34d399' : '#059669') : 'transparent' },
                    { borderColor: formData.termsAccepted ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#64748b' : '#d1d5db') },
                  ]}
                >
                  {formData.termsAccepted && <Ionicons name="checkmark" size={16} color="#ffffff" />}
                </View>
                <Text style={[styles.termsText, { color: theme === 'dark' ? '#e5e7eb' : '#374151' }]}>
                  I agree to the
                  <Text style={[styles.termsLink, { color: theme === 'dark' ? '#34d399' : '#059669' }]}> Terms of Service</Text>
                  {' '}and{' '}
                  <Text style={[styles.termsLink, { color: theme === 'dark' ? '#34d399' : '#059669' }]}> Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
              {errors.terms && <Text style={[styles.errorText, { color: '#ef4444' }]}>{errors.terms}</Text>}

              <Button title={isLoading ? 'Creating account...' : 'Create Account'} variant="primary" onPress={handleRegister} loading={isLoading} style={styles.registerButton} />

              {/* Divider */}
              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={[styles.dividerText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Register */}
              <Button
                title="Sign up with Google"
                variant="outline"
                onPress={handleGoogleRegister}
                leftIcon={<Ionicons name="logo-google" size={20} color={theme === 'dark' ? '#34d399' : '#059669'} />}
                style={styles.googleButton}
              />
            </View>
          </Card>

          {/* Login Link */}
          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/login')}>
              <Text style={[styles.loginLink, { color: theme === 'dark' ? '#34d399' : '#059669' }]}> Sign in</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  return strength;
};

const getStrengthColor = (strength: number, theme: string) => {
  switch (strength) {
    case 1: return '#ef4444';
    case 2: return '#f59e0b';
    case 3: return '#3b82f6';
    case 4: return '#059669';
    default: return theme === 'dark' ? '#374151' : '#e5e7eb';
  }
};

const getStrengthLabel = (strength: number) => {
  switch (strength) {
    case 0: return '';
    case 1: return 'Weak';
    case 2: return 'Fair';
    case 3: return 'Good';
    case 4: return 'Strong';
    default: return '';
  }
};

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
  passwordStrength: { marginTop: -8, gap: 4 },
  strengthBars: { flexDirection: 'row', gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: 'System', fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 2 },
  checkboxChecked: { },
  termsText: { fontSize: 13, fontFamily: 'System', lineHeight: 20, flex: 1 },
  termsLink: { fontWeight: '600' },
  errorText: { fontSize: 12, fontFamily: 'System', marginLeft: 30 },
  registerButton: { marginTop: 8, width: '100%' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  dividerText: { fontSize: 13, fontFamily: 'System', fontWeight: '500' },
  googleButton: { width: '100%' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  loginText: { fontSize: 14, fontFamily: 'System' },
  loginLink: { fontSize: 14, fontFamily: 'System', fontWeight: '600' },
});