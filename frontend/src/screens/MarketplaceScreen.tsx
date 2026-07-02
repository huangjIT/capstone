import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { marketplaceItems, MarketplaceItem } from '../constants/mockData';
import { fetchMarketplaceItems } from '../services/marketplaceService';
import { ItemCard } from '../components/ItemCard';

interface MarketplaceScreenProps {
  navigation: any;
}

export const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('All');
  const [items, setItems] = useState<MarketplaceItem[]>(marketplaceItems);

  useEffect(() => {
    // Backend data when reachable; mock listings otherwise (offline demo mode)
    fetchMarketplaceItems()
      .then((data) => { if (data.length > 0) setItems(data); })
      .catch(() => {});
  }, []);

  const filters = ['All', 'Toys', 'Carriers', 'Food', 'Accessories'];

  const categoryMap: Record<string, string> = {
    Toys: 'Toy',
    Carriers: 'Carrier',
    Food: 'Food',
    Accessories: 'Accessory',
  };

  const filtered =
    activeFilter === 'All'
      ? items
      : items.filter((item) => item.category === categoryMap[activeFilter]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>🛍️ Marketplace</Text>
        <Text style={styles.headerSub}>Pre-loved pet gear near you</Text>
      </View>

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
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.grid, { paddingBottom: insets.bottom + 20 }]}
        renderItem={({ item }) => (
          <ItemCard
            item={item}
            onPress={() => navigation.navigate('MarketplaceChat', { item })}
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
});
