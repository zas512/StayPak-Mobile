import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, Platform, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usersApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { User, UserRole } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { user, refreshUser } = useAuth();
  const router = useRouter();

  const [profile, setProfile] = useState<Partial<User> & { password?: string; confirmPassword?: string; cnicNumber?: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingCnic, setIsUploadingCnic] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cnicPreview, setCnicPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'cnic' | 'notifications' | 'danger'>('profile');

  const fetchProfile = async () => {
    try {
      const response = await usersApi.getMe();
      if (response.data.success && response.data.data) {
        const u = response.data.data;
        setProfile({
          fullName: u.fullName,
          phone: u.phone,
          cnicNumber: u.cnicNumber || '',
        });
        setAvatarPreview(u.avatarUrl || null);
        setCnicPreview(u.cnicDocUrl || null);
      }
    } catch (error: any) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};
    if (!profile.fullName?.trim()) newErrors.fullName = 'Full name is required';
    if (profile.phone && !/^03\d{9}$/.test(profile.phone)) newErrors.phone = 'Enter a valid Pakistani phone number (e.g., 03001234567)';
    if (profile.cnicNumber && !/^\d{5}-\d{7}-\d{1}$/.test(profile.cnicNumber)) newErrors.cnicNumber = 'CNIC format: 12345-1234567-1';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};
    if (!profile.password) newErrors.password = 'New password is required';
    else if (profile.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/[A-Z]/.test(profile.password)) newErrors.password = 'Must contain at least one uppercase letter';
    else if (!/[a-z]/.test(profile.password)) newErrors.password = 'Must contain at least one lowercase letter';
    else if (!/\d/.test(profile.password)) newErrors.password = 'Must contain at least one number';
    if (profile.password !== profile.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) return;
    setIsSaving(true);
    try {
      const { password, confirmPassword, ...data } = profile;
      const response = await usersApi.updateProfile(data);
      if (response.data.success) {
        Alert.alert('Saved', 'Profile updated successfully');
        await refreshUser();
        fetchProfile();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) return;
    setIsChangingPassword(true);
    try {
      const response = await usersApi.changePassword({
        currentPassword: '', // Would need current password input
        newPassword: profile.password!,
      });
      if (response.data.success) {
        Alert.alert('Success', 'Password changed successfully');
        setProfile({ ...profile, password: '', confirmPassword: '' });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const pickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarPreview(result.assets[0].uri);
      setIsUploadingAvatar(true);
      try {
        const formData = new FormData();
        formData.append('avatar', {
          uri: result.assets[0].uri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        } as any);
        const response = await usersApi.uploadAvatar(formData);
        if (response.data.success) {
          Alert.alert('Success', 'Avatar updated');
          await refreshUser();
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to upload avatar');
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const pickCnic = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setCnicPreview(result.assets[0].uri);
      setIsUploadingCnic(true);
      try {
        const formData = new FormData();
        formData.append('cnicDoc', {
          uri: result.assets[0].uri,
          name: 'cnic.jpg',
          type: 'image/jpeg',
        } as any);
        const response = await usersApi.uploadCnicDoc(formData);
        if (response.data.success) {
          Alert.alert('Submitted', 'CNIC document submitted for verification');
          await refreshUser();
        }
      } catch (error: any) {
        Alert.alert('Error', error.response?.data?.message || 'Failed to upload CNIC');
      } finally {
        setIsUploadingCnic(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'This action is irreversible. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await usersApi.deleteAccount();
              Alert.alert('Account deleted', 'Your account has been deleted');
              // AuthContext would handle logout
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete account');
            }
          },
        },
      ]
    );
  };

  const formatRole = (role: UserRole) => {
    switch (role) {
      case 'host': return 'Host';
      case 'both': return 'Host & Guest';
      default: return 'Guest';
    }
  };

  const sections = [
    { key: 'profile', label: 'Profile', icon: 'person-outline' },
    { key: 'security', label: 'Security', icon: 'lock-closed-outline' },
    { key: 'cnic', label: 'CNIC Verification', icon: 'card-outline' },
    { key: 'notifications', label: 'Notifications', icon: 'notifications-outline' },
    { key: 'danger', label: 'Danger Zone', icon: 'warning-outline' },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          {Array.from({ length: 5 }).map((_, i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back-outline" size={28} color={theme === 'dark' ? '#f1f5f9' : '#111827'} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Settings</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Current User Info */}
        <View style={styles.userInfo}>
          <Avatar source={avatarPreview ? { uri: avatarPreview } : user?.avatarUrl ? { uri: user.avatarUrl } : undefined} name={user?.fullName || 'User'} size="lg" />
          <View style={styles.userInfoText}>
            <Text style={[styles.userName, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{user?.fullName}</Text>
            <Text style={[styles.userEmail, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{user?.email}</Text>
            <View style={styles.userRole}>
              <Badge variant={user?.role === 'host' ? 'success' : user?.role === 'both' ? 'info' : 'outline'} size="xs">
                {formatRole(user?.role || 'guest')}
              </Badge>
              {user?.isCnicVerified && (
                <Badge variant="success" size="xs">
                  <Ionicons name="shield-checkmark-outline" size={10} color="#ffffff" style={{ marginRight: 4 }} />
                  CNIC Verified
                </Badge>
              )}
            </View>
          </View>
        </View>

        {/* Section Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.key}
                onPress={() => setActiveSection(section.key as any)}
                style={[
                  styles.tab,
                  activeSection === section.key && styles.tabActive,
                ]}
              >
                <Ionicons name={section.icon as any} size={20} color={activeSection === section.key ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#9ca3af' : '#6b7280')} />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: activeSection === section.key ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#9ca3af' : '#6b7280'),
                      fontWeight: activeSection === section.key ? '600' : '500',
                    },
                  ]}
                >
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={[styles.tabIndicator, { backgroundColor: activeSection === 'danger' ? '#ef4444' : (theme === 'dark' ? '#34d399' : '#059669') }]} />
        </View>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <Card style={styles.formCard}>
            <CardSection title="Personal Information" style={styles.formSectionTitle}>
              <Input
                label="Full Name"
                placeholder="Enter your full name"
                value={profile.fullName || ''}
                onChangeText={(text) => setProfile({ ...profile, fullName: text })}
                error={errors.fullName}
                autoCapitalize="words"
              />
              <Input
                label="Email"
                placeholder="you@example.com"
                value={user?.email || ''}
                editable={false}
                helperText="Email cannot be changed"
              />
              <Input
                label="Phone Number"
                placeholder="03001234567"
                value={profile.phone || ''}
                onChangeText={(text) => setProfile({ ...profile, phone: text })}
                error={errors.phone}
                keyboardType="phone-pad"
              />
              <View style={styles.avatarSection}>
                <Text style={[styles.avatarLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Profile Photo</Text>
                <TouchableOpacity onPress={pickAvatar} style={styles.avatarButton}>
                  {avatarPreview || user?.avatarUrl ? (
                    <Image source={{ uri: avatarPreview || user!.avatarUrl! }} style={styles.avatarImage} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                    </View>
                  )}
                  {isUploadingAvatar && <View style={styles.avatarLoading} />}
                </TouchableOpacity>
              </View>
              <Button title="Save Changes" variant="primary" onPress={handleSaveProfile} loading={isSaving} style={styles.saveButton} />
            </CardSection>
          </Card>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <Card style={styles.formCard}>
            <CardSection title="Change Password" style={styles.formSectionTitle}>
              <Input
                label="New Password"
                placeholder="Enter new password"
                value={profile.password || ''}
                onChangeText={(text) => setProfile({ ...profile, password: text })}
                secureTextEntry
                error={errors.password}
                autoComplete="new-password"
              />
              <Input
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={profile.confirmPassword || ''}
                onChangeText={(text) => setProfile({ ...profile, confirmPassword: text })}
                secureTextEntry
                error={errors.confirmPassword}
                autoComplete="new-password"
              />
              <View style={styles.passwordRequirements}>
                <Text style={[styles.reqTitle, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Password must contain:</Text>
                {[
                  { test: profile.password?.length >= 8, text: 'At least 8 characters' },
                  { test: /[A-Z]/.test(profile.password || ''), text: 'One uppercase letter' },
                  { test: /[a-z]/.test(profile.password || ''), text: 'One lowercase letter' },
                  { test: /\d/.test(profile.password || ''), text: 'One number' },
                ].map((req, i) => (
                  <View key={i} style={styles.reqItem}>
                    <Ionicons
                      name={req.test ? 'checkmark-circle' : 'ellipse-outline'}
                      size={16}
                      color={req.test ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#64748b' : '#9ca3af')}
                    />
                    <Text style={[styles.reqText, { color: req.test ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#9ca3af' : '#6b7280') }]}>{req.text}</Text>
                  </View>
                ))}
              </View>
              <Button title="Change Password" variant="primary" onPress={handleChangePassword} loading={isChangingPassword} style={styles.saveButton} />
            </CardSection>
          </Card>
        )}

        {/* CNIC Verification Section */}
        {activeSection === 'cnic' && (
          <Card style={styles.formCard}>
            <CardSection title="CNIC Verification" style={styles.formSectionTitle}>
              <View style={styles.cnicStatus}>
                {user?.isCnicVerified ? (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
                    <View>
                      <Text style={[styles.verifiedTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>CNIC Verified</Text>
                      <Text style={[styles.verifiedSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                        Your identity has been verified. You can host properties and access all features.
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.unverifiedBadge}>
                    <Ionicons name="shield-outline" size={24} color={theme === 'dark' ? '#f59e0b' : '#f59e0b'} />
                    <View>
                      <Text style={[styles.verifiedTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Not Verified</Text>
                      <Text style={[styles.verifiedSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                        Verify your CNIC to host properties and build trust with guests.
                      </Text>
                    </View>
                  </View>
                )}
              </View>

              {!user?.isCnicVerified && (
                <>
                  <Input
                    label="CNIC Number"
                    placeholder="12345-1234567-1"
                    value={profile.cnicNumber || ''}
                    onChangeText={(text) => setProfile({ ...profile, cnicNumber: text })}
                    error={errors.cnicNumber}
                    autoCapitalize="none"
                  />
                  <View style={styles.cnicUpload}>
                    <Text style={[styles.avatarLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>CNIC Document</Text>
                    <TouchableOpacity onPress={pickCnic} style={styles.cnicButton}>
                      {cnicPreview ? (
                        <Image source={{ uri: cnicPreview }} style={styles.cnicImage} />
                      ) : (
                        <View style={styles.cnicPlaceholder}>
                          <Ionicons name="document-text-outline" size={28} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                          <Text style={[styles.cnicPlaceholderText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Upload CNIC photo</Text>
                        </View>
                      )}
                      {isUploadingCnic && <View style={styles.avatarLoading} />}
                    </TouchableOpacity>
                    <Text style={[styles.cnicNote, { color: theme === 'dark' ? '#64748b' : '#9ca3af' }]}>
                      Upload a clear photo of your CNIC (front side). This will be reviewed by our team.
                    </Text>
                  </View>
                </>
              )}
            </CardSection>
          </Card>
        )}

        {/* Notifications Section */}
        {activeSection === 'notifications' && (
          <Card style={styles.formCard}>
            <CardSection title="Push Notifications" style={styles.formSectionTitle}>
              <ToggleSetting label="Booking updates" description="Get notified about booking confirmations and changes" defaultValue />
              <ToggleSetting label="Messages" description="Receive notifications for new messages" defaultValue />
              <ToggleSetting label="Reviews" description="Get notified when you receive a review" defaultValue />
              <ToggleSetting label="Promotions" description="Receive special offers and promotions" defaultValue={false} />
            </CardSection>
          </Card>
        )}

        {/* Danger Zone */}
        {activeSection === 'danger' && (
          <Card style={styles.formCard}>
            <CardSection title="Danger Zone" style={styles.formSectionTitle}>
              <Text style={[styles.dangerText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Once you delete your account, there is no going back. All your data, bookings, listings, and messages will be permanently deleted.
              </Text>
              <Button title="Delete Account" variant="danger" onPress={handleDeleteAccount} style={styles.deleteButton} />
            </CardSection>
          </Card>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// Toggle Setting Component
const ToggleSetting = ({ label, description, defaultValue = true }: { label: string; description: string; defaultValue?: boolean }) => {
  const { theme } = useTheme();
  const [value, setValue] = useState(defaultValue);

  return (
    <TouchableOpacity onPress={() => setValue(!value)} style={styles.toggleRow}>
      <View style={styles.toggleInfo}>
        <Text style={[styles.toggleLabel, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{label}</Text>
        <Text style={[styles.toggleDesc, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{description}</Text>
      </View>
      <View style={[styles.toggleTrack, { backgroundColor: value ? (theme === 'dark' ? '#34d399' : '#059669') : (theme === 'dark' ? '#374151' : '#e5e7eb') }]}>
        <View style={[styles.toggleThumb, { transform: [{ translateX: value ? 22 : 0 }] }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonCard: { backgroundColor: '#ffffff', borderRadius: 16, height: 120, padding: 16 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  headerSpacer: { width: 44 },
  userInfo: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 14 },
  userInfoText: { flex: 1, minWidth: 0 },
  userName: { fontSize: 18, fontWeight: '600', fontFamily: 'System' },
  userEmail: { fontSize: 13, fontFamily: 'System', marginTop: 2 },
  userRole: { flexDirection: 'row', gap: 6, marginTop: 6 },
  tabsContainer: { backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, paddingVertical: 8 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  tabActive: { backgroundColor: theme => theme === 'dark' ? '#064e3b' : '#ecfdf5' },
  tabLabel: { fontSize: 13, fontFamily: 'System' },
  tabIndicator: { height: 2, marginHorizontal: 16, marginBottom: -1 },
  formCard: { marginHorizontal: 16, marginTop: 16, padding: 0 },
  formSectionTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System', paddingHorizontal: 16, paddingTop: 16 },
  avatarSection: { marginTop: 8 },
  avatarLabel: { fontSize: 13, fontWeight: '500', fontFamily: 'System', marginBottom: 8 },
  avatarButton: { width: 80, height: 80, borderRadius: 16, borderWidth: 1, borderColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  avatarImage: { width: '100%', height: '100%', borderRadius: 16 },
  avatarPlaceholder: { alignItems: 'center', gap: 8 },
  avatarLoading: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  passwordRequirements: { marginTop: 12, gap: 6 },
  reqTitle: { fontSize: 12, fontWeight: '500', fontFamily: 'System' },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reqText: { fontSize: 12, fontFamily: 'System' },
  saveButton: { marginTop: 16, width: '100%' },
  cnicStatus: { paddingVertical: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: '#ecfdf5', borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  unverifiedBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, backgroundColor: '#fffbeb', borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  verifiedTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  verifiedSubtext: { fontSize: 13, fontFamily: 'System', marginTop: 4, lineHeight: 18 },
  cnicUpload: { marginTop: 16 },
  cnicButton: { aspectRatio: 1.586, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden' },
  cnicImage: { width: '100%', height: '100%', borderRadius: 12 },
  cnicPlaceholder: { alignItems: 'center', gap: 8 },
  cnicPlaceholderText: { fontSize: 14, fontFamily: 'System' },
  cnicNote: { fontSize: 12, fontFamily: 'System', marginTop: 8 },
  dangerText: { fontSize: 14, fontFamily: 'System', lineHeight: 22, marginBottom: 16 },
  deleteButton: { width: '100%' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  toggleInfo: { flex: 1 },
  toggleLabel: { fontSize: 15, fontWeight: '500', fontFamily: 'System' },
  toggleDesc: { fontSize: 13, fontFamily: 'System', marginTop: 2 },
  toggleTrack: { width: 52, height: 28, borderRadius: 14, justifyContent: 'center', padding: 2 },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 2 },
  bottomSpacer: { height: 40 },
});