import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapView as MapViewType } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { nearbyPets } from '../constants/mockData';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

export const HomeMapScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [region, setRegion] = useState(DEFAULT_REGION);
  const mapRef = useRef<MapViewType>(null);

  const handleLocateMe = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    mapRef.current?.animateCamera(
      { center: { latitude: loc.coords.latitude, longitude: loc.coords.longitude }, zoom: 15 },
      { duration: 600 }
    );
  };

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setRegion({ ...coords, latitudeDelta: 0.02, longitudeDelta: 0.02 });
      mapRef.current?.animateCamera({ center: coords, zoom: 15 }, { duration: 800 });
    })();
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        zoomEnabled
        zoomTapEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {nearbyPets.map((pet) => (
          <Marker
            key={pet.id}
            coordinate={{ latitude: pet.latitude, longitude: pet.longitude }}
            title={pet.name}
            description={pet.breed}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerEmoji}>{pet.emoji}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Floating Header */}
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <View style={styles.logoChip}>
          <Text style={styles.logoPaw}>🐾</Text>
          <Text style={styles.logoText}>PawPal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.floatingBtn}>
            <Text style={styles.notifEmoji}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.floatingBtn}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Locate Me Button */}
      <TouchableOpacity style={styles.locateBtn} onPress={handleLocateMe}>
        <Text style={styles.locateBtnIcon}>📍</Text>
      </TouchableOpacity>

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

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sectionTitle}>Nearby Walking Partners</Text>
            <Text style={styles.nearbyCount}>🐾 {nearbyPets.length} pets nearby</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation?.navigate('Walk')}
          >
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.petCardsScroll}
        >
          {nearbyPets.map((pet) => (
            <TouchableOpacity key={pet.id} style={styles.petMiniCard} activeOpacity={0.85}>
              <View style={styles.petMiniAvatar}>
                <Text style={styles.petMiniEmoji}>{pet.emoji}</Text>
              </View>
              <Text style={styles.petMiniName}>{pet.name}</Text>
              <Text style={styles.petMiniBreed} numberOfLines={1}>{pet.breed}</Text>
              <Text style={styles.petMiniOwner}>{pet.owner}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFill,
  },
  markerContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.primaryBorder,
  },
  markerEmoji: {
    fontSize: 22,
  },
  locateBtn: {
    position: 'absolute',
    right: 16,
    bottom: 470,
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  locateBtnIcon: {
    fontSize: 22,
  },
  zoomControls: {
    position: 'absolute',
    right: 16,
    bottom: 360,
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
    color: COLORS.text,
    lineHeight: 26,
  },
  zoomDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 8,
  },
  header: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  logoPaw: {
    fontSize: 18,
  },
  logoText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  floatingBtn: {
    position: 'relative',
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  notifEmoji: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  avatarEmoji: {
    fontSize: 20,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.border,
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  nearbyCount: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  seeAllBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: COLORS.primaryLight,
  },
  seeAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  petCardsScroll: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  petMiniCard: {
    width: 110,
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  petMiniAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  petMiniEmoji: {
    fontSize: 24,
  },
  petMiniName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  petMiniBreed: {
    fontSize: 11,
    color: COLORS.textSub,
    textAlign: 'center',
    marginBottom: 2,
  },
  petMiniOwner: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});
