import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapView as MapViewType } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

interface LatLng {
  latitude: number;
  longitude: number;
}

interface RouteMapPickerProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (route: string) => void;
}

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

async function reverseGeocode(coord: LatLng): Promise<string> {
  try {
    const results = await Location.reverseGeocodeAsync(coord);
    if (results.length > 0) {
      const r = results[0];
      return [r.name, r.street, r.district, r.city]
        .filter(Boolean)
        .slice(0, 2)
        .join(', ');
    }
  } catch {}
  return `${coord.latitude.toFixed(4)}, ${coord.longitude.toFixed(4)}`;
}

export const RouteMapPicker: React.FC<RouteMapPickerProps> = ({ visible, onClose, onConfirm }) => {
  const insets = useSafeAreaInsets();
  const [startPin, setStartPin] = useState<LatLng | null>(null);
  const [endPin, setEndPin] = useState<LatLng | null>(null);
  const [startLabel, setStartLabel] = useState('');
  const [endLabel, setEndLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'start' | 'end'>('start');
  const mapRef = useRef<MapViewType>(null);

  const handleMapPress = async (e: any) => {
    const coord: LatLng = e.nativeEvent.coordinate;
    setLoading(true);
    const label = await reverseGeocode(coord);
    setLoading(false);

    if (step === 'start') {
      setStartPin(coord);
      setStartLabel(label);
      setStep('end');
    } else {
      setEndPin(coord);
      setEndLabel(label);
    }
  };

  const handleConfirm = () => {
    if (!startLabel || !endLabel) return;
    onConfirm(`${startLabel} → ${endLabel}`);
    handleReset();
  };

  const handleReset = () => {
    setStartPin(null);
    setEndPin(null);
    setStartLabel('');
    setEndLabel('');
    setStep('start');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const isReady = startPin && endPin;

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
            <Text style={styles.closeArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Select Route</Text>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Hint bar */}
        <View style={[styles.hintBar, step === 'start' ? styles.hintStart : styles.hintEnd]}>
          <Text style={styles.hintText}>
            {!startPin
              ? '📍 Tap on the map to set Start point'
              : !endPin
              ? '🏁 Tap on the map to set End point'
              : '✅ Route selected — confirm below'}
          </Text>
        </View>

        {/* Map */}
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
          initialRegion={DEFAULT_REGION}
          onPress={handleMapPress}
          showsUserLocation
          zoomEnabled
          zoomTapEnabled
          scrollEnabled
          pitchEnabled={false}
          rotateEnabled={false}
          showsMyLocationButton={false}
        >
          {startPin && (
            <Marker coordinate={startPin} title="Start">
              <View style={styles.pinA}>
                <Text style={styles.pinText}>A</Text>
              </View>
            </Marker>
          )}
          {endPin && (
            <Marker coordinate={endPin} title="End">
              <View style={styles.pinB}>
                <Text style={styles.pinText}>B</Text>
              </View>
            </Marker>
          )}
          {startPin && endPin && (
            <Polyline
              coordinates={[startPin, endPin]}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineDashPattern={[8, 4]}
            />
          )}
        </MapView>

        {/* Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => mapRef.current?.getCamera().then(cam => {
              mapRef.current?.animateCamera({ zoom: (cam.zoom ?? 14) + 1 }, { duration: 200 });
            })}
          >
            <Text style={styles.zoomBtnText}>+</Text>
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            onPress={() => mapRef.current?.getCamera().then(cam => {
              mapRef.current?.animateCamera({ zoom: (cam.zoom ?? 14) - 1 }, { duration: 200 });
            })}
          >
            <Text style={styles.zoomBtnText}>−</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}

        {/* Bottom sheet */}
        <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Start row */}
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {startLabel ? `Start: ${startLabel}` : 'Start: tap map to select'}
            </Text>
          </View>
          {/* End row */}
          <View style={styles.locationRow}>
            <View style={[styles.dot, { backgroundColor: COLORS.primary }]} />
            <Text style={styles.locationText} numberOfLines={1}>
              {endLabel ? `End: ${endLabel}` : 'End: tap map to select'}
            </Text>
          </View>

          {/* Confirm */}
          <TouchableOpacity
            style={[styles.confirmBtn, !isReady && styles.confirmBtnDisabled]}
            onPress={handleConfirm}
            disabled={!isReady}
          >
            <Text style={styles.confirmText}>Confirm Route →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeArrow: { fontSize: 20, color: COLORS.text, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  resetBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  resetText: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },

  hintBar: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  hintStart: { backgroundColor: '#F0FDF4' },
  hintEnd: { backgroundColor: '#FFF8F5' },
  hintText: { fontSize: 13, fontWeight: '500', color: COLORS.text },

  map: { flex: 1 },
  zoomControls: {
    position: 'absolute',
    right: 14,
    bottom: 230,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomBtnText: {
    fontSize: 22,
    fontWeight: '300',
    color: '#1a1a1a',
    lineHeight: 26,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },

  pinA: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#22C55E',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  pinB: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4, elevation: 4,
  },
  pinText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  bottomSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 20,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  locationText: { fontSize: 14, color: COLORS.text, flex: 1 },

  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  confirmBtnDisabled: { backgroundColor: COLORS.textMuted, shadowOpacity: 0 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
