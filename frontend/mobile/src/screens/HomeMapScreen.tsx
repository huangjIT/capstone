import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, PROVIDER_DEFAULT } from 'react-native-maps';
import type { MapView as MapViewType } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { apiGet } from '../utils/api';
import type { WalkFeedItem } from './FindPartnersScreen';

const DEFAULT_REGION = {
  latitude: 37.7749,
  longitude: -122.4194,
  latitudeDelta: 0.02,
  longitudeDelta: 0.02,
};

type MapFeedItem = WalkFeedItem & { latitude?: number; longitude?: number };

/**
 * Marker showing the poster's avatar. Keeps tracksViewChanges enabled until the
 * remote image has loaded, so the marker stays rendered through zoom/pan
 * re-rasterization instead of showing a blank circle.
 */
const PosterMarker: React.FC<{
  item: MapFeedItem;
  onCalloutPress: () => void;
}> = ({ item, onCalloutPress }) => {
  const [tracking, setTracking] = useState(true);

  return (
    <Marker
      coordinate={{ latitude: item.latitude!, longitude: item.longitude! }}
      title={item.ownerName || item.petName}
      description={`${item.route || ''} · ${item.date || ''} ${item.time || ''}`}
      tracksViewChanges={tracking}
      onCalloutPress={onCalloutPress}
    >
      <View style={styles.markerWrap}>
        <View style={styles.markerContainer}>
          {item.ownerAvatarUrl ? (
            <Image
              source={{ uri: item.ownerAvatarUrl }}
              style={styles.markerPhoto}
              onLoad={() => setTimeout(() => setTracking(false), 100)}
            />
          ) : (
            <Text style={styles.markerInitial}>
              {item.ownerName?.[0]?.toUpperCase() ?? (item.petSpecies === 'CAT' ? '🐈' : '🐕')}
            </Text>
          )}
        </View>
        {/* Small pet badge on the avatar */}
        <View style={styles.markerPetBadge}>
          <Text style={styles.markerPetBadgeText}>{item.petSpecies === 'CAT' ? '🐈' : '🐕'}</Text>
        </View>
      </View>
    </Marker>
  );
};

export const HomeMapScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [feed, setFeed] = useState<MapFeedItem[]>([]);
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

  const loadFeed = useCallback(async () => {
    try {
      let feedPath = '/api/walk/invitations/feed';
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          feedPath += `?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`;
        }
      } catch (_) {}
      const items = await apiGet<MapFeedItem[]>(feedPath);
      setFeed(items);
    } catch (_) {}
  }, []);

  useFocusEffect(useCallback(() => { loadFeed(); }, [loadFeed]));

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      mapRef.current?.animateCamera({ center: coords, zoom: 15 }, { duration: 800 });
    })();
  }, []);

  const markers = feed.filter(item => item.latitude != null && item.longitude != null);

  const focusItem = (item: MapFeedItem) => {
    if (item.latitude == null || item.longitude == null) return;
    mapRef.current?.animateCamera(
      { center: { latitude: item.latitude, longitude: item.longitude }, zoom: 15 },
      { duration: 500 }
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={DEFAULT_REGION}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : PROVIDER_DEFAULT}
        showsUserLocation
        showsMyLocationButton={false}
        zoomEnabled
        zoomTapEnabled
        scrollEnabled
        pitchEnabled={false}
        rotateEnabled={false}
      >
        {markers.map((item) => (
          <PosterMarker
            key={item.id}
            item={item}
            onCalloutPress={() =>
              navigation?.navigate('Walk', {
                screen: 'ConnectPetProfile',
                params: { feedItem: item },
              })
            }
          />
        ))}
      </MapView>

      {/* Floating Header */}
      <View style={[styles.header, { top: insets.top + 12 }]}>
        <View style={styles.logoChip}>
          <Text style={styles.logoPaw}>🐾</Text>
          <Text style={styles.logoText}>PawPal</Text>
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
            <Text style={styles.nearbyCount}>🐾 {feed.length} pets nearby</Text>
          </View>
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={() => navigation?.navigate('Walk')}
          >
            <Text style={styles.seeAllText}>See all</Text>
          </TouchableOpacity>
        </View>
        {feed.length === 0 ? (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>No walk partners nearby yet.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petCardsScroll}
          >
            {feed.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.petMiniCard}
                activeOpacity={0.85}
                onPress={() => focusItem(item)}
              >
                <View style={styles.petMiniAvatar}>
                  {item.petProfilePhotoUrl ? (
                    <Image source={{ uri: item.petProfilePhotoUrl }} style={styles.petMiniPhoto} />
                  ) : (
                    <Text style={styles.petMiniEmoji}>{item.petSpecies === 'CAT' ? '🐈' : '🐕'}</Text>
                  )}
                </View>
                <Text style={styles.petMiniName} numberOfLines={1}>{item.petName || '—'}</Text>
                <Text style={styles.petMiniBreed} numberOfLines={1}>{item.petBreed || item.route || ''}</Text>
                <Text style={styles.petMiniOwner} numberOfLines={1}>
                  {item.distanceLabel ? `📍 ${item.distanceLabel}` : item.ownerName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
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
  markerWrap: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
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
    overflow: 'hidden',
  },
  markerPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  markerEmoji: {
    fontSize: 22,
  },
  markerInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  markerPetBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
  },
  markerPetBadgeText: {
    fontSize: 10,
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
  emptyRow: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textMuted,
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
    overflow: 'hidden',
  },
  petMiniPhoto: {
    width: 48,
    height: 48,
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
