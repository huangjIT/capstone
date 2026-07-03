import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { COLORS } from '../constants/colors';
import { FilterRow } from '../components/FilterRow';
import { PetCard } from '../components/PetCard';
import { apiGet } from '../utils/api';
import { useWalkBadge } from '../context/WalkBadgeContext';

export interface WalkInvitation {
  id: string;
  route: string;
  date: string;
  time: string;
  durationMinutes: number;
  maxSpots: number;
  spotsLeft?: number;
  message?: string;
  status: string;
  hostPetIds?: string[];
  pendingRequestCount?: number;
}

export interface WalkFeedItem {
  id: string;
  route: string;
  date: string;
  time: string;
  durationMinutes: number;
  maxSpots: number;
  spotsLeft: number;
  message?: string;
  ownerId: string;
  ownerName: string;
  ownerAvatarUrl?: string;
  petId?: string;
  petName?: string;
  petSpecies?: string;
  petBreed?: string;
  petGender?: string;
  petAge?: string;
  petProfilePhotoUrl?: string;
  petIsVaccinated?: boolean;
  petIsNeutered?: boolean;
  distanceKm?: number;
  distanceLabel?: string;
  myRequestId?: string;
  myRequestStatus?: string;
  unreadMessageCount?: number;
  pets?: Array<{
    petId: string;
    petName: string;
    petSpecies?: string;
    petBreed?: string;
    petGender?: string;
    petAge?: string;
    petProfilePhotoUrl?: string;
    petIsVaccinated?: boolean;
    petIsNeutered?: boolean;
  }>;
}

interface FindPartnersScreenProps {
  navigation: any;
}

export const FindPartnersScreen: React.FC<FindPartnersScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { setPendingCount, setUnreadMsgCount } = useWalkBadge();
  const [typeFilter, setTypeFilter] = useState('All');
  const [myInvitations, setMyInvitations] = useState<WalkInvitation[]>([]);
  const [feed, setFeed] = useState<WalkFeedItem[]>([]);
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set());
  const [unreadCountMap, setUnreadCountMap] = useState<Record<string, number>>({});
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const isFocused = useRef(false);

  const invAnim = useRef(new Animated.Value(1)).current;
  const isInvVisible = useRef(true);
  const animating = useRef(false);

  const showInv = useCallback(() => {
    if (isInvVisible.current || animating.current) return;
    isInvVisible.current = true;
    animating.current = true;
    Animated.timing(invAnim, { toValue: 1, duration: 200, useNativeDriver: false })
      .start(() => { animating.current = false; });
  }, [invAnim]);

  const hideInv = useCallback(() => {
    if (!isInvVisible.current || animating.current) return;
    isInvVisible.current = false;
    animating.current = true;
    Animated.timing(invAnim, { toValue: 0, duration: 200, useNativeDriver: false })
      .start(() => { animating.current = false; });
  }, [invAnim]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 50) hideInv();
    else if (y < 20) showInv();
  }, [hideInv, showInv]);

  const invMaxHeight = invAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 220] });

  const loadData = useCallback(async () => {
    try {
      let feedPath = '/api/walk/invitations/feed';
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          feedPath += `?lat=${loc.coords.latitude}&lng=${loc.coords.longitude}`;
        }
      } catch (_) {}

      const [invs, feedItems, sentReqs] = await Promise.all([
        apiGet<WalkInvitation[]>('/api/walk/invitations/my'),
        apiGet<WalkFeedItem[]>(feedPath),
        apiGet<Array<{ invitationId: string; status: string }>>('/api/walk/requests/my-sent'),
      ]);
      setMyInvitations(invs);
      setFeed(feedItems);
      setSentRequestIds(new Set(sentReqs.map(r => r.invitationId)));
      const total = invs.reduce((sum, inv) => sum + (inv.pendingRequestCount ?? 0), 0);
      setPendingCount(total);
      const totalUnread = feedItems.reduce((sum, item) => sum + (item.unreadMessageCount ?? 0), 0);
      setUnreadMsgCount(totalUnread);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshUnread = useCallback(async () => {
    try {
      const [data, counts] = await Promise.all([
        apiGet<Array<{ invitationId: string; unreadCount: number }>>('/api/walk/requests/my-sent-unread'),
        apiGet<Record<string, number>>('/api/messages/unread-counts'),
      ]);
      const map: Record<string, number> = {};
      let total = 0;
      data.forEach(item => { map[item.invitationId] = item.unreadCount; total += item.unreadCount; });
      setUnreadCountMap(map);
      setUnreadMsgCount(total);
      setUnreadMsg(counts.WALK ?? 0);
    } catch (_) {}
  }, []);

  useFocusEffect(useCallback(() => {
    isFocused.current = true;
    loadData();
    const interval = setInterval(() => {
      if (isFocused.current) refreshUnread();
    }, 5000);
    return () => {
      isFocused.current = false;
      clearInterval(interval);
    };
  }, [loadData, refreshUnread]));

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  const filtered = feed.filter(item => {
    if (typeFilter === 'All') return true;
    const target = typeFilter === 'Dogs' ? 'DOG' : 'CAT';
    if (item.pets && item.pets.length > 0) {
      return item.pets.some(p => p.petSpecies === target);
    }
    return item.petSpecies === target;
  });

  const petTags = (item: WalkFeedItem): string[] => {
    const tags: string[] = [];
    if (item.petIsVaccinated) tags.push('Vaccinated');
    if (item.petIsNeutered) tags.push('Neutered');
    return tags;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🚶 Find Walk Partners</Text>
          <TouchableOpacity
            style={styles.msgBtn}
            onPress={() => navigation.navigate('Notifications' as any, { filter: 'walk' } as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.msgBtnText}>💬</Text>
            {unreadMsg > 0 && <View style={styles.msgBtnDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* My Invitations */}
      <Animated.View style={[styles.invSection, { maxHeight: invMaxHeight, opacity: invAnim, overflow: 'hidden' }]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Invitations</Text>
          <TouchableOpacity style={styles.postNewBtn} onPress={() => navigation.navigate('PostInvitation')}>
            <Text style={styles.postNewText}>+ Post New</Text>
          </TouchableOpacity>
        </View>

        {myInvitations.length === 0 ? (
          <View style={styles.emptyInv}>
            <Text style={styles.emptyInvText}>No invitations yet. Post one!</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.invitationsScroll}
          >
            {myInvitations.map(inv => (
              <View key={inv.id} style={styles.invCard}>
                <View style={[styles.invBadge,
                  inv.status === 'ACTIVE' ? styles.invBadgeActive : styles.invBadgeDraft]}>
                  <Text style={[styles.invBadgeText,
                    inv.status === 'ACTIVE' ? styles.invBadgeTextActive : styles.invBadgeTextDraft]}>
                    {inv.status === 'ACTIVE' ? 'Active' : inv.status}
                  </Text>
                </View>
                {(inv.pendingRequestCount ?? 0) > 0 && (
                  <TouchableOpacity
                    style={styles.pendingBadge}
                    onPress={() => navigation.navigate('Notifications' as any, { filter: 'walk' } as any)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.pendingBadgeIcon}>🔔</Text>
                    <View style={styles.pendingBadgeCount}>
                      <Text style={styles.pendingBadgeCountText}>{inv.pendingRequestCount}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                <Text style={styles.invRoute} numberOfLines={1}>📍 {inv.route || '—'}</Text>
                <Text style={styles.invMeta}>🗓 {inv.date} · {inv.time}</Text>
                <View style={styles.invFooter}>
                  <Text style={styles.invSpotsText}>👥 {inv.maxSpots} spots</Text>
                  <TouchableOpacity
                    style={styles.invEditBtn}
                    onPress={() => navigation.navigate('EditInvitation', { invitation: inv })}
                  >
                    <Text style={styles.invEditText}>✏️ Edit</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <FilterRow
          label="Type"
          options={['All', 'Dogs', 'Cats']}
          active={typeFilter}
          onSelect={setTypeFilter}
        />
      </View>

      {/* Feed */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        <Text style={styles.sectionTitle}>Nearby Walking Partners</Text>
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <View style={styles.emptyFeed}>
            <Text style={styles.emptyFeedText}>No walk partners nearby yet.</Text>
          </View>
        ) : (
          filtered.map(item => (
            <PetCard
              key={item.id}
              name={item.petName || item.ownerName}
              emoji={item.petSpecies === 'CAT' ? '🐈' : '🐕'}
              photoUrl={item.ownerAvatarUrl}
              breed={item.petBreed || '—'}
              age={item.petAge || ''}
              distance={item.distanceLabel || ''}
              time={`${item.date} · ${item.time}`}
              owner={item.ownerName}
              online
              tags={petTags(item)}
              rating={0}
              variant="connect"
              connectStatus={
                item.myRequestStatus === 'REJECTED' || item.myRequestStatus === 'BLOCKED' ? 'rejected'
                : item.myRequestStatus === 'ACCEPTED' ? 'accepted'
                : item.myRequestStatus === 'PENDING' || sentRequestIds.has(item.id) ? 'requested'
                : 'default'
              }
              messageCount={unreadCountMap[item.id] ?? item.unreadMessageCount}
              onConnect={() => navigation.navigate('ConnectPetProfile', { feedItem: item })}
              onMessage={() => navigation.navigate('Notifications' as any, { filter: 'walk' } as any)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: COLORS.text },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  msgBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msgBtnText: { fontSize: 18 },
  msgBtnDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: COLORS.card,
  },
  invSection: { backgroundColor: COLORS.card },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 14,
    marginBottom: 10,
  },
  postNewBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
  },
  postNewText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  invitationsScroll: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 10 },
  emptyInv: { paddingHorizontal: 20, paddingBottom: 14 },
  emptyInvText: { fontSize: 13, color: COLORS.textMuted },
  invCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingTop: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 200,
    maxWidth: 260,
    gap: 4,
    overflow: 'visible',
  },
  invBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 100,
    marginBottom: 2,
  },
  invBadgeActive: { backgroundColor: '#DCFCE7' },
  invBadgeDraft: { backgroundColor: '#F3F4F6' },
  invBadgeText: { fontSize: 11, fontWeight: '600' },
  invBadgeTextActive: { color: '#16A34A' },
  invBadgeTextDraft: { color: COLORS.textMuted },
  invRoute: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  invMeta: { fontSize: 12, color: COLORS.textSub },
  pendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  pendingBadgeIcon: {
    fontSize: 20,
  },
  pendingBadgeCount: {
    position: 'absolute',
    top: -4,
    right: -6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pendingBadgeCountText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 12,
  },
  invFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  invSpotsText: { fontSize: 12, color: COLORS.textSub },
  invEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  invEditText: { fontSize: 11, color: COLORS.textSub, fontWeight: '500' },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listScroll: { flex: 1 },
  listContent: { paddingTop: 4 },
  emptyFeed: { alignItems: 'center', paddingVertical: 40 },
  emptyFeedText: { fontSize: 14, color: COLORS.textMuted },
});
