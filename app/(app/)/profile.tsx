import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, RefreshControl, ImageBackground } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { usersApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Badge } from '@/components/Badge';
import { Avatar } from '@/components/Avatar';
import { User, UserRole } from '@/types';

export default function ProfileScreen() {
  const { theme } = useTheme();
  const { user, isAuthenticated, logout, refreshUser } = useAuth();
  const router = useRouter();

  const [stats, setStats] = useState({
    upcomingTrips: 0,
    pastTrips: 0,
    listings: 0,
    reviews: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const response = await usersApi.getProfileStats();
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error: any) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchStats();
    refreshUser();
    setIsRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.authContent}>
          <View style={styles.authCard}>
            <Ionicons name="person-circle-outline" size={80} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
            <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Welcome to StayPak</Text>
            <Text style={[styles.authSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
              Sign in to manage your trips, listings, and messages.
            </Text>
            <View style={styles.authButtons}>
              <Button title="Sign in" variant="primary" onPress={() => router.push('/login')} style={styles.authButton} />
              <Button title="Create account" variant="outline" onPress={() => router.push('/register')} style={styles.authButton} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <View style={styles.skeletonHeader} />
          <View style={styles.skeletonStats} />
          <View style={styles.skeletonActions} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  const isHost = user?.role === 'host' || user?.role === 'both';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} colors={[theme === 'dark' ? '#34d399' : '#059669']} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.headerSection}>
          <ImageBackground
            source={{ uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400' }}
            style={styles.headerBackground}
            imageStyle={styles.headerBackgroundImage}
          >
            <View style={styles.headerOverlay}>
              <View style={styles.headerContent}>
                <Avatar
                  source={user?.avatarUrl ? { uri: user.avatarUrl } : undefined}
                  name={user?.fullName || 'User'}
                  size="xl"
                />
                <View style={styles.headerInfo}>
                  <Text style={styles.headerName}>{user?.fullName}</Text>
                  <View style={styles.headerMeta}>
                    <Text style={styles.headerEmail}>{user?.email}</Text>
                    <View style={styles.roleBadge}>
                      <Badge variant={user?.role === 'host' ? 'success' : user?.role === 'both' ? 'info' : 'outline'} size="sm">
                        {user?.role === 'host' ? 'Host' : user?.role === 'both' ? 'Host & Guest' : 'Guest'}
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
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.upcomingTrips}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Upcoming trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.pastTrips}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Past trips</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.listings}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>{isHost ? 'Listings' : 'Saved'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>{stats.reviews}</Text>
            <Text style={[styles.statLabel, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Reviews</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity onPress={() => router.push('/trips')} style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="bag-handle-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Your trips</Text>
              <Text style={[styles.actionSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                View upcoming and past bookings
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>

          {isHost && (
            <TouchableOpacity onPress={() => router.push('/host/dashboard')} style={styles.actionCard}>
              <View style={styles.actionIconContainer}>
                <Ionicons name="home-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
              </View>
              <View style={styles.actionInfo}>
                <Text style={[styles.actionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Host dashboard</Text>
                <Text style={[styles.actionSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                  Manage your listings and bookings
                </Text>
              </View>
              <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={() => router.push('/messages')} style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="chatbubble-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Messages</Text>
              <Text style={[styles.actionSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Chat with hosts and guests
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/profile/settings')} style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <Ionicons name="settings-outline" size={24} color={theme === 'dark' ? '#34d399' : '#059669'} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Settings</Text>
              <Text style={[styles.actionSubtext, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>
                Profile, security, notifications
              </Text>
            </View>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>
        </View>

        {/* Help & Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Help & Support</Text>
          <TouchableOpacity onPress={() => router.push('/help')} style={styles.helpItem}>
            <Ionicons name="help-circle-outline" size={22} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.helpText, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Help Center</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/safety')} style={styles.helpItem}>
            <Ionicons name="shield-outline" size={22} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.helpText, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Safety Center</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/terms')} style={styles.helpItem}>
            <Ionicons name="document-text-outline" size={22} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.helpText, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Terms of Service</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/privacy')} style={styles.helpItem}>
            <Ionicons name="lock-closed-outline" size={22} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
            <Text style={[styles.helpText, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Privacy Policy</Text>
            <Ionicons name="chevron-forward-outline" size={20} color={theme === 'dark' ? '#64748b' : '#9ca3af'} />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.dangerSection}>
          <Button title="Sign out" variant="danger" onPress={logout} style={styles.dangerButton} />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  authContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 },
  authCard: { alignItems: 'center', gap: 16, padding: 24 },
  authTitle: { fontSize: 24, fontWeight: '700', fontFamily: 'System', textAlign: 'center' },
  authSubtext: { fontSize: 15, fontFamily: 'System', textAlign: 'center', lineHeight: 22 },
  authButtons: { flexDirection: 'row', gap: 12, width: '100%', marginTop: 8 },
  authButton: { flex: 1 },
  loadingContent: { paddingHorizontal: 16, paddingTop: 16, gap: 16 },
  skeletonHeader: { height: 200, borderRadius: 0, backgroundColor: '#e5e7eb', marginHorizontal: -16, marginTop: -16 },
  skeletonStats: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, gap: 12 },
  skeletonActions: { paddingHorizontal: 16, gap: 12 },
  headerSection: { marginHorizontal: -16, marginTop: -16 },
  headerBackground: { height: 200, justifyContent: 'flex-end' },
  headerBackgroundImage: { opacity: 0.3 },
  headerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  headerContent: { flexDirection: 'row', alignItems: 'flex-end', padding: 20, gap: 16 },
  headerInfo: { flex: 1, minWidth: 0 },
  headerName: { color: '#ffffff', fontSize: 24, fontWeight: '700', fontFamily: 'System' },
  headerMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  headerEmail: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'System' },
  roleBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 20 },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 28, fontWeight: '700', fontFamily: 'System' },
  statLabel: { fontSize: 12, fontFamily: 'System', textAlign: 'center', marginTop: 4 },
  actionsSection: { paddingHorizontal: 16, gap: 12, marginBottom: 24 },
  actionCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 16, padding: 16, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  actionIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1, minWidth: 0 },
  actionTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  actionSubtext: { fontSize: 13, fontFamily: 'System', marginTop: 2 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '700', fontFamily: 'System', marginBottom: 12 },
  helpItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 14 },
  helpText: { flex: 1, fontSize: 16, fontFamily: 'System' },
  dangerSection: { paddingHorizontal: 16, paddingBottom: 16 },
  dangerButton: { width: '100%' },
  bottomSpacer: { height: 20 },
});