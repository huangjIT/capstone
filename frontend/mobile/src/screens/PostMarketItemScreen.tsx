import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';
import { apiPost, apiPut, apiDelete } from '../utils/api';
import { uploadImage } from '../utils/uploadImage';
import { MarketItem, categoryEmoji } from './MarketplaceScreen';

const CATEGORIES = [
  { key: 'TOY', label: '🧸 Toy' },
  { key: 'CARRIER', label: '🎒 Carrier' },
  { key: 'FOOD', label: '🥫 Food' },
  { key: 'ACCESSORY', label: '🦴 Accessory' },
  { key: 'OTHER', label: '📦 Other' },
];

const CONDITIONS = [
  { key: 'NEW', label: 'New' },
  { key: 'LIKE_NEW', label: 'Like New' },
  { key: 'GOOD', label: 'Good' },
  { key: 'FAIR', label: 'Fair' },
];

interface PostMarketItemScreenProps {
  navigation: any;
  route: any;
}

export const PostMarketItemScreen: React.FC<PostMarketItemScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const existing: MarketItem | undefined = route?.params?.item;
  const isEdit = !!existing;

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(existing?.photoUrl ?? null);
  const [name, setName] = useState(existing?.name ?? '');
  const [category, setCategory] = useState(existing?.category ?? 'TOY');
  const [condition, setCondition] = useState(existing?.condition ?? 'GOOD');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [originalPrice, setOriginalPrice] = useState(existing?.originalPrice != null ? String(existing.originalPrice) : '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [location, setLocation] = useState(existing?.location ?? '');
  const [locationCoords, setLocationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [isSold, setIsSold] = useState(existing?.status === 'SOLD');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (confirmVisible) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }
  }, [confirmVisible]);

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo library access in Settings.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setPhotoUri(result.assets[0].uri);
  };

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

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Validation', 'Item name is required.'); return; }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) { Alert.alert('Validation', 'Please enter a valid price.'); return; }
    try {
      setSaving(true);
      let finalPhotoUrl = photoUrl;
      if (photoUri) {
        finalPhotoUrl = await uploadImage(photoUri, 'market');
      }
      const body = {
        name: name.trim(),
        category,
        condition,
        price: priceNum,
        ...(originalPrice.trim() && !isNaN(parseFloat(originalPrice)) ? { originalPrice: parseFloat(originalPrice) } : {}),
        description: description.trim() || undefined,
        location: location.trim() || undefined,
        ...(locationCoords ? { latitude: locationCoords.latitude, longitude: locationCoords.longitude } : {}),
        ...(finalPhotoUrl ? { photoUrl: finalPhotoUrl } : {}),
        ...(isEdit ? { status: isSold ? 'SOLD' : 'ACTIVE' } : {}),
      };
      if (isEdit) {
        await apiPut(`/api/market/items/${existing!.id}`, body);
      } else {
        await apiPost('/api/market/items', body);
      }
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save item');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setConfirmVisible(false);
    try {
      setDeleting(true);
      await apiDelete(`/api/market/items/${existing!.id}`);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete item');
    } finally {
      setDeleting(false);
    }
  };

  const displayPhoto = photoUri ?? photoUrl;

  return (
    <View style={styles.container}>
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
          <Text style={styles.headerTitle}>{isEdit ? 'Edit Item' : 'Sell an Item'}</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.formBody}>
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.photoBox} onPress={pickPhoto} activeOpacity={0.8}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.photoImage} />
              ) : (
                <>
                  <Text style={styles.photoEmoji}>{categoryEmoji(category)}</Text>
                  <Text style={styles.photoHint}>📷 Add Photo</Text>
                </>
              )}
            </TouchableOpacity>
            {displayPhoto ? (
              <TouchableOpacity onPress={pickPhoto}>
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Name */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>🏷 Item Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Pet Carrier Bag"
              placeholderTextColor={COLORS.textMuted}
            />
          </View>

          {/* Category */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📂 Category</Text>
            <View style={styles.chipWrap}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, category === c.key && styles.chipActive]}
                  onPress={() => setCategory(c.key)}
                >
                  <Text style={[styles.chipText, category === c.key && styles.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>✨ Condition</Text>
            <View style={styles.chipWrap}>
              {CONDITIONS.map(c => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.chip, condition === c.key && styles.chipActive]}
                  onPress={() => setCondition(c.key)}
                >
                  <Text style={[styles.chipText, condition === c.key && styles.chipTextActive]}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price & Original Price */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>💰 Price ($)</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="25"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.rowSpacer} />
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>🏷 Original ($, optional)</Text>
              <TextInput
                style={styles.input}
                value={originalPrice}
                onChangeText={setOriginalPrice}
                keyboardType="decimal-pad"
                placeholder="60"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Location */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📍 Pickup Location</Text>
            <View style={styles.locationRow}>
              <TextInput
                style={[styles.input, styles.locationInput]}
                value={location}
                onChangeText={(text) => { setLocation(text); setLocationCoords(null); }}
                placeholder="e.g. Golden Gate Park entrance"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity
                style={styles.locateBtn}
                onPress={useCurrentLocation}
                disabled={locating}
                activeOpacity={0.7}
              >
                {locating
                  ? <ActivityIndicator size="small" color={COLORS.primary} />
                  : <Text style={styles.locateIcon}>📍</Text>}
              </TouchableOpacity>
            </View>
          </View>

          {/* Description */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>💬 Description (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the item's condition, size, usage..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Edit-only: mark as sold + delete */}
          {isEdit && (
            <>
              <TouchableOpacity
                style={[styles.soldToggle, isSold && styles.soldToggleActive]}
                onPress={() => setIsSold(s => !s)}
                activeOpacity={0.8}
              >
                <Text style={[styles.soldToggleText, isSold && styles.soldToggleTextActive]}>
                  {isSold ? '✓ Marked as Sold' : 'Mark as Sold'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteBtn, deleting && { opacity: 0.6 }]}
                onPress={() => setConfirmVisible(true)}
                disabled={deleting}
              >
                {deleting
                  ? <ActivityIndicator color="#EF4444" />
                  : <Text style={styles.deleteText}>🗑 Remove Listing</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={[styles.ctaButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#FFFFFF" />
            : <Text style={styles.ctaText}>{isEdit ? '💾 Save Changes' : '🛍 Post Item'}</Text>}
        </TouchableOpacity>
      </View>

      {/* Delete confirmation dialog */}
      <Modal visible={confirmVisible} transparent animationType="none" statusBarTranslucent>
        <View style={styles.overlay}>
          <Animated.View style={[styles.dialogCard, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
            <View style={styles.dialogIcon}>
              <Text style={styles.dialogIconText}>🗑</Text>
            </View>
            <Text style={styles.dialogTitle}>Remove this listing?</Text>
            <Text style={styles.dialogMessage}>
              "{existing?.name}" will be removed from the marketplace. This action cannot be undone.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.dialogBtnSecondary} onPress={() => setConfirmVisible(false)}>
                <Text style={styles.dialogBtnSecondaryText}>Keep It</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.dialogBtnDanger} onPress={confirmDelete}>
                <Text style={styles.dialogBtnDangerText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
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
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  formBody: { padding: 20, gap: 4 },
  photoSection: { alignItems: 'center', marginBottom: 20, gap: 8 },
  photoBox: {
    width: 140,
    height: 140,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    gap: 6,
  },
  photoImage: { width: '100%', height: '100%' },
  photoEmoji: { fontSize: 44 },
  photoHint: { fontSize: 12, color: COLORS.textSub, fontWeight: '600' },
  changePhotoText: { fontSize: 13, color: COLORS.primary, fontWeight: '600' },
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
  textArea: { height: 110, paddingTop: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationInput: { flex: 1 },
  locateBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateIcon: { fontSize: 20 },
  rowFields: { flexDirection: 'row' },
  rowSpacer: { width: 12 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.textSub },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  soldToggle: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginTop: 8,
    marginBottom: 12,
  },
  soldToggleActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  soldToggleText: { fontSize: 15, fontWeight: '700', color: COLORS.textSub },
  soldToggleTextActive: { color: '#16A34A' },
  deleteBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
  },
  deleteText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },
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
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },

  // Delete dialog
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  dialogCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16,
  },
  dialogIcon: {
    width: 80, height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#FEF2F2',
    borderWidth: 2,
    borderColor: '#FECACA',
  },
  dialogIconText: { fontSize: 34 },
  dialogTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  dialogMessage: {
    fontSize: 14,
    color: COLORS.textSub,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  dialogActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  dialogBtnSecondary: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dialogBtnSecondaryText: { color: COLORS.textSub, fontSize: 15, fontWeight: '600' },
  dialogBtnDanger: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 100,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dialogBtnDangerText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
