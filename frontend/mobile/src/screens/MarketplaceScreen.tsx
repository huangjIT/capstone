import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS } from '../constants/colors';
import { ItemCard } from '../components/ItemCard';
import { apiGet } from '../utils/api';

export interface MarketItem {
  id: string;
  sellerUserId: string;
  name: string;
  description?: string;
  category: string;   // TOY, CARRIER, FOOD, ACCESSORY, OTHER
  price?: number;
  originalPrice?: number;
  condition: string;  // NEW, LIKE_NEW, GOOD, FAIR
  photoUrl?: string;
  location?: string;
  status: string;     // ACTIVE, SOLD, WITHDRAWN
  sellerName?: string;
  sellerAvatarUrl?: string;
  unreadMessageCount?: number;
}

export const categoryEmoji = (category?: string) => {
  switch (category) {
    case 'TOY': return '🧸';
    case 'CARRIER': return '🎒';
    case 'FOOD': return '🥫';
    case 'ACCESSORY': return '🦴';
    default: return '📦';
  }
};

export const conditionLabel = (condition?: string) => {
  switch (condition) {
    case 'NEW': return 'New';
    case 'LIKE_NEW': return 'Like New';
    case 'GOOD': return 'Good';
    case 'FAIR': return 'Fair';
    default: return condition || 'Good';
  }
};

interface MarketplaceScreenProps {
  navigation: any;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [feed, setFeed] = useState<MarketItem[]>([]);
  const [myItems, setMyItems] = useState<MarketItem[]>([]);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filters = ['All', 'Toys', 'Carriers', 'Food', 'Accessories', 'Other'];
  const categoryMap: Record<string, string> = {
    Toys: 'TOY',
    Carriers: 'CARRIER',
    Food: 'FOOD',
    Accessories: 'ACCESSORY',
    Other: 'OTHER',
  };

  const loadData = useCallback(async () => {
    try {
      const categoryParam = activeFilter !== 'All' ? `?category=${categoryMap[activeFilter]}` : '';
      const [feedItems, mine] = await Promise.all([
        apiGet<MarketItem[]>(`/api/market/items${categoryParam}`),
        apiGet<MarketItem[]>('/api/market/items/my'),
      ]);
      setFeed(feedItems);
      setMyItems(mine);
    } catch (_) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter]);

  const refreshUnread = useCallback(async () => {
    try {
      const counts = await apiGet<Record<string, number>>('/api/messages/unread-counts');
      setUnreadMsg(counts.MARKET ?? 0);
    } catch (_) {}
  }, []);

  useFocusEffect(useCallback(() => {
    loadData();
    refreshUnread();
    const interval = setInterval(refreshUnread, 5000);
    return () => clearInterval(interval);
  }, [loadData, refreshUnread]));

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, [loadData]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>🛍️ Marketplace</Text>
            <Text style={styles.headerSub}>Pre-loved pet gear near you</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.chatsBtn}
              onPress={() => navigation.navigate('MarketChats')}
              activeOpacity={0.8}
            >
              <Text style={styles.chatsBtnText}>💬</Text>
              {unreadMsg > 0 && <View style={styles.chatsBtnDot} />}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sellBtn}
              onPress={() => navigation.navigate('PostMarketItem')}
              activeOpacity={0.8}
            >
              <Text style={styles.sellBtnText}>+ Sell</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* My Listings */}
      {myItems.length > 0 && (
        <View style={styles.mySection}>
          <Text style={styles.mySectionTitle}>My Listings</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.myScroll}
          >
            {myItems.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.myCard}
                onPress={() => navigation.navigate('PostMarketItem', { item })}
                activeOpacity={0.8}
              >
                <View style={styles.myCardImage}>
                  {item.photoUrl ? (
                    <Image source={{ uri: item.photoUrl }} style={styles.myCardPhoto} />
                  ) : (
                    <Text style={styles.myCardEmoji}>{categoryEmoji(item.category)}</Text>
                  )}
                  {item.status === 'SOLD' && (
                    <View style={styles.soldOverlay}>
                      <Text style={styles.soldText}>SOLD</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.myCardName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.myCardPrice}>${item.price ?? 0}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter chips */}
      <View style={styles.filterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, f === activeFilter && styles.chipActive]}
              onPress={() => setActiveFilter(f)}
            >
              <Text style={[styles.chipText, f === activeFilter && styles.chipTextActive]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      <FlatList
        data={feed}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.emptyFeed}>
              <Text style={styles.emptyFeedText}>No items in this category yet.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('MarketplaceChat', { item, otherUserId: item.sellerUserId })}
          />
        )}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSub: {
    fontSize: 14,
    color: COLORS.textSub,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  chatsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatsBtnText: { fontSize: 18 },
  chatsBtnDot: {
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
  sellBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 100,
  },
  sellBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  mySection: {
    backgroundColor: COLORS.card,
    paddingBottom: 12,
  },
  mySectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 8,
  },
  myScroll: { paddingHorizontal: 16, gap: 10 },
  myCard: {
    width: 110,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 8,
    gap: 3,
  },
  myCardImage: {
    height: 70,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  myCardPhoto: { width: '100%', height: '100%' },
  myCardEmoji: { fontSize: 32 },
  soldOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  soldText: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  myCardName: { fontSize: 12, fontWeight: '600', color: COLORS.text },
  myCardPrice: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  filterSection: {
    backgroundColor: COLORS.card,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.textSub,
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  grid: {
    padding: 10,
  },
  row: {
    justifyContent: 'flex-start',
  },
  emptyFeed: { alignItems: 'center', paddingVertical: 40 },
  emptyFeedText: { fontSize: 14, color: COLORS.textMuted },
});
