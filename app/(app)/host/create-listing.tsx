import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView, TouchableOpacity, Alert, Platform, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { listingsApi } from '@/services/api';
import { Card, CardSection } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Listing, PropertyType, Amenity } from '@/types';
import * as ImagePicker from 'expo-image-picker';

export default function CreateListingScreen() {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    propertyType: 'apartment' as PropertyType,
    address: '',
    city: '',
    area: '',
    latitude: '',
    longitude: '',
    pricePerNight: '',
    cleaningFee: '',
    maxGuests: '1',
    bedrooms: '1',
    bathrooms: '1',
    amenities: [] as Amenity[],
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allAmenities: { key: Amenity; label: string; icon: string }[] = [
    { key: 'wifi', label: 'WiFi', icon: 'wifi-outline' },
    { key: 'air_conditioning', label: 'Air Conditioning', icon: 'snow-outline' },
    { key: 'heating', label: 'Heating', icon: 'flame-outline' },
    { key: 'kitchen', label: 'Kitchen', icon: 'restaurant-outline' },
    { key: 'washer', label: 'Washer', icon: 'shirt-outline' },
    { key: 'dryer', label: 'Dryer', icon: 'shirt-outline' },
    { key: 'parking', label: 'Free Parking', icon: 'car-outline' },
    { key: 'pool', label: 'Pool', icon: 'water-outline' },
    { key: 'hot_tub', label: 'Hot Tub', icon: 'water-outline' },
    { key: 'gym', label: 'Gym', icon: 'dumbbell-outline' },
    { key: 'tv', label: 'TV', icon: 'tv-outline' },
    { key: 'workspace', label: 'Workspace', icon: 'laptop-outline' },
    { key: 'breakfast', label: 'Breakfast', icon: 'cafe-outline' },
    { key: 'essentials', label: 'Essentials', icon: 'checkmark-circle-outline' },
    { key: 'first_aid_kit', label: 'First Aid Kit', icon: 'medkit-outline' },
    { key: 'fire_extinguisher', label: 'Fire Extinguisher', icon: 'flame-outline' },
    { key: 'smoke_alarm', label: 'Smoke Alarm', icon: 'alert-circle-outline' },
    { key: 'carbon_monoxide_alarm', label: 'CO Alarm', icon: 'alert-circle-outline' },
  ];

  const propertyTypes: { value: PropertyType; label: string }[] = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'villa', label: 'Villa' },
    { value: 'farmhouse', label: 'Farmhouse' },
    { value: 'guesthouse', label: 'Guesthouse' },
    { value: 'hotel', label: 'Hotel' },
    { value: 'resort', label: 'Resort' },
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.area.trim()) newErrors.area = 'Area/Neighborhood is required';
    if (!formData.pricePerNight || parseFloat(formData.pricePerNight) <= 0) newErrors.pricePerNight = 'Valid price per night is required';
    if (!formData.maxGuests || parseInt(formData.maxGuests) <= 0) newErrors.maxGuests = 'Max guests must be at least 1';
    if (!formData.bedrooms || parseInt(formData.bedrooms) <= 0) newErrors.bedrooms = 'Bedrooms must be at least 1';
    if (!formData.bathrooms || parseInt(formData.bathrooms) <= 0) newErrors.bathrooms = 'Bathrooms must be at least 1';
    if (photos.length === 0) newErrors.photos = 'At least one photo is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('propertyType', formData.propertyType);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('area', formData.area);
      if (formData.latitude) formDataToSend.append('latitude', formData.latitude);
      if (formData.longitude) formDataToSend.append('longitude', formData.longitude);
      formDataToSend.append('basePrice', formData.pricePerNight);
      formDataToSend.append('cleaningFee', formData.cleaningFee || '0');
      formDataToSend.append('maxGuests', formData.maxGuests);
      formDataToSend.append('bedrooms', formData.bedrooms);
      formDataToSend.append('bathrooms', formData.bathrooms);
      formDataToSend.append('amenities', JSON.stringify(formData.amenities));

      // Add photos
      photos.forEach((photo, index) => {
        formDataToSend.append('photos', {
          uri: photo,
          type: 'image/jpeg',
          name: `photo_${index}.jpg`,
        } as any);
      });

      const response = await listingsApi.create(formDataToSend);
      if (response.data.success) {
        Alert.alert('Success', 'Listing created successfully!');
        router.back();
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pickImages = async () => {
    if (photos.length >= 10) {
      Alert.alert('Limit reached', 'Maximum 10 photos allowed');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 10 - photos.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setPhotos(prev => [...prev, ...result.assets!.map(a => a.uri)]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const toggleAmenity = (amenity: Amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
        <View style={styles.authRequired}>
          <Ionicons name="lock-closed-outline" size={64} color={theme === 'dark' ? '#475569' : '#d1d5db'} />
          <Text style={[styles.authTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Sign in to create listing</Text>
          <Button title="Sign in" variant="primary" onPress={() => router.push('/login')} style={styles.authButton} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme === 'dark' ? '#03120c' : '#fafafa' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back-outline" size={28} color={theme === 'dark' ? '#f1f5f9' : '#111827'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme === 'dark' ? '#f1f5f9' : '#111827' }]}>Create Listing</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photos */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Photos</Text>
            <View style={styles.photoGrid}>
              {photos.map((photo, index) => (
                <View key={index} style={styles.photoItem}>
                  <Image source={{ uri: photo }} style={styles.photoImage} />
                  <TouchableOpacity onPress={() => removePhoto(index)} style={styles.photoRemove}>
                    <Ionicons name="close" size={18} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              ))}
              {photos.length < 10 && (
                <TouchableOpacity onPress={pickImages} style={styles.photoAdd}>
                  <Ionicons name="add" size={32} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />
                  <Text style={[styles.photoAddText, { color: theme === 'dark' ? '#9ca3af' : '#6b7280' }]}>Add photos</Text>
                </TouchableOpacity>
              )}
            </View>
            {errors.photos && <Text style={[styles.errorText, { color: '#ef4444' }]}>{errors.photos}</Text>}
            <Text style={[styles.photoHint, { color: theme === 'dark' ? '#64748b' : '#9ca3af' }]}>Maximum 10 photos. Recommended: 1920x1080</Text>
          </CardSection>
        </Card>

        {/* Basic Info */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Basic Information</Text>
            <Input
              label="Listing Title"
              value={formData.title}
              onChangeText={(text: string) => setFormData({ ...formData, title: text })}
              error={errors.title}
              autoCapitalize="words"
            />
            <Input
              label="Description"
              value={formData.description}
              onChangeText={(text: string) => setFormData({ ...formData, description: text })}
              error={errors.description}
              multiline
              numberOfLines={5}
              autoCapitalize="sentences"
            />
            <Input
              label="Property Type"
              value={propertyTypes.find(t => t.value === formData.propertyType)?.label || ''}
              editable={false}
              onPress={() => {}}
              rightElement={<Ionicons name="chevron-down-outline" size={20} color={theme === 'dark' ? '#9ca3af' : '#6b7280'} />}
            />
            <Picker
              selectedValue={formData.propertyType}
              onValueChange={(value: string) => setFormData({ ...formData, propertyType: value as PropertyType })}
              mode="dropdown"
              style={styles.picker}
              itemStyle={styles.pickerItem}
            >
              {propertyTypes.map((type) => (
                <Picker.Item key={type.value} label={type.label} value={type.value} />
              ))}
            </Picker>
          </CardSection>
        </Card>

        {/* Location */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Location</Text>
            <Input
              label="Address"
              value={formData.address}
              onChangeText={(text: string) => setFormData({ ...formData, address: text })}
              error={errors.address}
              autoCapitalize="words"
            />
            <View style={styles.locationRow}>
              <Input
                label="City"
                value={formData.city}
                onChangeText={(text: string) => setFormData({ ...formData, city: text })}
                error={errors.city}
                autoCapitalize="words"
                style={styles.halfInput}
              />
              <Input
                label="Area/Neighborhood"
                value={formData.area}
                onChangeText={(text: string) => setFormData({ ...formData, area: text })}
                error={errors.area}
                autoCapitalize="words"
                style={styles.halfInput}
              />
            </View>
            <View style={styles.coordsRow}>
              <Input
                label="Latitude (optional)"
                value={formData.latitude}
                onChangeText={(text: string) => setFormData({ ...formData, latitude: text })}
                keyboardType="decimal-pad"
                style={styles.halfInput}
              />
              <Input
                label="Longitude (optional)"
                value={formData.longitude}
                onChangeText={(text: string) => setFormData({ ...formData, longitude: text })}
                keyboardType="decimal-pad"
                style={styles.halfInput}
              />
            </View>
          </CardSection>
        </Card>

        {/* Pricing */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Pricing</Text>
            <View style={styles.pricingRow}>
              <Input
                label="Price per Night (PKR)"
                value={formData.pricePerNight}
                onChangeText={(text: string) => setFormData({ ...formData, pricePerNight: text })}
                error={errors.pricePerNight}
                keyboardType="numeric"
                style={styles.halfInput}
              />
              <Input
                label="Cleaning Fee (PKR, optional)"
                value={formData.cleaningFee}
                onChangeText={(text: string) => setFormData({ ...formData, cleaningFee: text })}
                keyboardType="numeric"
                style={styles.halfInput}
              />
            </View>
          </CardSection>
        </Card>

        {/* Capacity */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Capacity</Text>
            <View style={styles.capacityRow}>
              <Input
                label="Max Guests"
                value={formData.maxGuests}
                onChangeText={(text: string) => setFormData({ ...formData, maxGuests: text })}
                error={errors.maxGuests}
                keyboardType="numeric"
                style={styles.thirdInput}
              />
              <Input
                label="Bedrooms"
                value={formData.bedrooms}
                onChangeText={(text: string) => setFormData({ ...formData, bedrooms: text })}
                error={errors.bedrooms}
                keyboardType="numeric"
                style={styles.thirdInput}
              />
              <Input
                label="Bathrooms"
                value={formData.bathrooms}
                onChangeText={(text: string) => setFormData({ ...formData, bathrooms: text })}
                error={errors.bathrooms}
                keyboardType="numeric"
                style={styles.thirdInput}
              />
            </View>
          </CardSection>
        </Card>

        {/* Amenities */}
        <Card style={styles.formCard}>
          <CardSection style={styles.formSectionTitle}>
            <Text style={styles.sectionTitleText}>Amenities</Text>
            <View style={styles.amenitiesGrid}>
              {allAmenities.map((amenity) => (
                <TouchableOpacity
                  key={amenity.key}
                  onPress={() => toggleAmenity(amenity.key)}
                  style={[
                    styles.amenityItem,
                    formData.amenities.includes(amenity.key) && styles.amenitySelected,
                  ]}
                >
                  <Ionicons name={amenity.icon as any} size={20} color={formData.amenities.includes(amenity.key) ? '#ffffff' : (theme === 'dark' ? '#9ca3af' : '#6b7280')} />
                  <Text style={[styles.amenityLabel, { color: formData.amenities.includes(amenity.key) ? '#ffffff' : (theme === 'dark' ? '#e5e7eb' : '#1f2937') }]}>{amenity.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </CardSection>
        </Card>

        {/* Submit */}
        <Button title={isSubmitting ? 'Creating...' : 'Create Listing'} variant="primary" onPress={handleSubmit} loading={isSubmitting} style={styles.submitButton} />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  authRequired: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 },
  authTitle: { fontSize: 20, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  authButton: { marginTop: 8, width: '80%' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', fontFamily: 'System', textAlign: 'center' },
  headerSpacer: { width: 44 },
  formCard: { marginHorizontal: 16, marginTop: 16, padding: 0 },
  formSectionTitle: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitleText: { fontSize: 16, fontWeight: '600', fontFamily: 'System' },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  photoItem: { position: 'relative', width: 80, height: 80, borderRadius: 12, overflow: 'hidden' },
  photoImage: { width: '100%', height: '100%' },
  photoRemove: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  photoAdd: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: '#e5e7eb', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', gap: 6 },
  photoAddText: { fontSize: 11, fontFamily: 'System', textAlign: 'center' },
  photoHint: { fontSize: 12, fontFamily: 'System', paddingHorizontal: 16, paddingBottom: 16 },
  locationRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  halfInput: { flex: 1 },
  coordsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  pricingRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16 },
  capacityRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  thirdInput: { flex: 1 },
  picker: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  pickerItem: { fontFamily: 'System' },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingBottom: 16 },
  amenityItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#ffffff' },
  amenitySelected: { backgroundColor: '#059669', borderColor: '#059669' },
  amenityLabel: { fontSize: 13, fontFamily: 'System' },
  errorText: { fontSize: 12, fontFamily: 'System', paddingHorizontal: 16, marginTop: 4 },
  submitButton: { marginHorizontal: 16, marginTop: 16, marginBottom: 16, width: 'auto' },
  bottomSpacer: { height: 20 },
});