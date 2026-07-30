import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';
import { apiPost, apiGet } from '../utils/api';

interface Pet {
  id: string;
  name: string;
  species: string;
  breed?: string;
  profilePhotoUrl?: string;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

interface PostDateInvitationScreenProps {
  navigation: any;
}

export const PostDateInvitationScreen: React.FC<PostDateInvitationScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState<string | null>(null);
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiGet<Pet[]>('/api/pets/my').then(list => {
      setPets(list);
      if (list.length === 1) setSelectedPetId(list[0].id);
    }).catch(() => {});
  }, []);

  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to use your current location.');
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setLocationCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      const places = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      const p = places[0];
      const label = p
        ? [p.name, p.street, p.city].filter(Boolean).join(', ')
        : `${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`;
      setLocation(label);
    } catch (_) {
      Alert.alert('Error', 'Could not get your current location.');
    } finally {
      setLocating(false);
    }
  };

  const handlePost = async () => {
    if (!selectedPetId) { Alert.alert('Validation', 'Please select the pet going on the date.'); return; }
    if (!location.trim()) { Alert.alert('Validation', 'Please set a meeting location.'); return; }
    if (!selectedDate) { Alert.alert('Validation', 'Please select a date.'); return; }
    if (!selectedTime) { Alert.alert('Validation', 'Please select a time.'); return; }
    try {
      setSaving(true);
      await apiPost('/api/date/invitations', {
        hostPetId: selectedPetId,
        location: location.trim(),
        date: formatDate(selectedDate),
        time: formatTime(selectedTime),
        message: message.trim() || undefined,
        ...(locationCoords ? { latitude: locationCoords.latitude, longitude: locationCoords.longitude } : {}),
      });
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post date invitation');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <DateTimePickerModal
        isVisible={datePickerVisible}
        mode="date"
        minimumDate={new Date()}
        onConfirm={(d) => { setSelectedDate(d); setDatePickerVisible(false); }}
        onCancel={() => setDatePickerVisible(false)}
        display={Platform.OS === 'ios' ? 'inline' : 'default'}
        accentColor={COLORS.purple}
      />
      <DateTimePickerModal
        isVisible={timePickerVisible}
        mode="time"
        onConfirm={(d) => { setSelectedTime(d); setTimePickerVisible(false); }}
        onCancel={() => setTimePickerVisible(false)}
        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
        accentColor={COLORS.purple}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post a Date</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.formBody}>
          {/* Pet selector — single choice */}
          {pets.length > 0 && (
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>💕 Pet Going on the Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.petScrollContent}
              >
                {pets.map(pet => {
                  const selected = selectedPetId === pet.id;
                  return (
                    <TouchableOpacity
                      key={pet.id}
                      style={[styles.petChip, selected && styles.petChipActive]}
                      onPress={() => setSelectedPetId(selected ? null : pet.id)}
                      activeOpacity={0.8}
                    >
                      {pet.profilePhotoUrl ? (
                        <Image source={{ uri: pet.profilePhotoUrl }} style={styles.petChipPhoto} />
                      ) : (
                        <View style={[styles.petChipEmoji, selected && styles.petChipEmojiActive]}>
                          <Text style={styles.petChipEmojiText}>
                            {pet.species === 'CAT' ? '🐈' : '🐕'}
                          </Text>
                        </View>
                      )}
                      <View style={styles.petChipInfo}>
                        <Text style={[styles.petChipName, selected && styles.petChipNameActive]} numberOfLines={1}>
                          {pet.name}
                        </Text>
                        {pet.breed ? (
                          <Text style={styles.petChipBreed} numberOfLines={1}>{pet.breed}</Text>
                        ) : null}
                      </View>
                      {selected && <Text style={styles.petChipCheck}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📍 Meeting Location</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={location}
                onChangeText={(text) => { setLocation(text); setLocationCoords(null); }}
                placeholder="e.g. Central Park dog run"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.locateBtn}
                onPress={useCurrentLocation}
                disabled={locating}
                activeOpacity={0.7}
              >
                {locating
                  ? <ActivityIndicator size="small" color={COLORS.purple} />
                  : <Text style={styles.locateIcon}>📍</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📅 Date</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setDatePickerVisible(true)}>
              <Text style={selectedDate ? styles.selectText : styles.selectPlaceholder}>
                {selectedDate ? formatDate(selectedDate) : 'Select date'}
              </Text>
              <Text style={styles.selectArrow}>📅</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>🕐 Time</Text>
            <TouchableOpacity style={styles.selectInput} onPress={() => setTimePickerVisible(true)}>
              <Text style={selectedTime ? styles.selectText : styles.selectPlaceholder}>
                {selectedTime ? formatTime(selectedTime) : 'Select time'}
              </Text>
              <Text style={styles.selectArrow}>🕐</Text>
            </TouchableOpacity>
          </View>

          {/* Message */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>💬 Message (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Tell others about your pet and what you're looking for..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Tips for a great date</Text>
            <Text style={styles.tipText}>• Pick a neutral, pet-friendly spot for the first meeting</Text>
            <Text style={styles.tipText}>• Mention your pet's temperament in the message</Text>
            <Text style={styles.tipText}>• Keep vaccination info up to date on your pet profile</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.ctaButton, saving && { opacity: 0.6 }]} onPress={handlePost} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.ctaText}>💕 Post Date Invitation</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: {},
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: COLORS.purple, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  formBody: { padding: 20, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSub, marginBottom: 8 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput: { flex: 1 },
  locateBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.purpleLight,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateIcon: { fontSize: 20 },
  selectInput: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: { fontSize: 15, color: COLORS.text, flex: 1 },
  selectPlaceholder: { fontSize: 15, color: COLORS.textMuted, flex: 1 },
  selectArrow: { fontSize: 16, marginLeft: 8 },
  textArea: { height: 110, paddingTop: 12 },
  petScrollContent: { gap: 10, paddingVertical: 4 },
  petChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 130,
  },
  petChipActive: {
    borderColor: COLORS.purple,
    backgroundColor: COLORS.purpleLight,
  },
  petChipPhoto: { width: 40, height: 40, borderRadius: 20 },
  petChipEmoji: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: COLORS.border,
  },
  petChipEmojiActive: { backgroundColor: '#FFFFFF', borderColor: '#DDD6FE' },
  petChipEmojiText: { fontSize: 20 },
  petChipInfo: { flex: 1 },
  petChipName: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  petChipNameActive: { color: COLORS.purple },
  petChipBreed: { fontSize: 11, color: COLORS.textMuted, marginTop: 1 },
  petChipCheck: { fontSize: 14, color: COLORS.purple, fontWeight: '700' },
  tipCard: {
    backgroundColor: COLORS.purpleLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 6,
    marginTop: 8,
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: COLORS.purple, marginBottom: 4 },
  tipText: { fontSize: 13, color: COLORS.text, lineHeight: 20 },
  ctaContainer: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.purple,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
