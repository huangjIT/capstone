import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { blindDatePets } from '../constants/mockData';
import { FilterRow } from '../components/FilterRow';
import { PetCard } from '../components/PetCard';

const MY_DATES = [
  {
    id: '1',
    petName: 'Buddy',
    emoji: '🐕',
    status: 'Active',
    breed: 'Golden Retriever',
    location: 'Central Park',
    date: 'Sat, Jun 7',
    requests: 3,
  },
  {
    id: '2',
    petName: 'Buddy',
    emoji: '🐕',
    status: 'Draft',
    breed: 'Golden Retriever',
    location: 'Riverside Trail',
    date: 'Sun, Jun 8',
    requests: 0,
  },
];

export const PetBlindDateScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [speciesFilter, setSpeciesFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('Any');
  const [vaccineFilter, setVaccineFilter] = useState('All');
  const [breedFilter, setBreedFilter] = useState('All');

  // Scroll-based hide/show for My Dates (same pattern as Walk page)
  const datesAnim = useRef(new Animated.Value(1)).current;
  const isDatesVisible = useRef(true);
  const animating = useRef(false);

  const showDates = useCallback(() => {
    if (isDatesVisible.current || animating.current) return;
    isDatesVisible.current = true;
    animating.current = true;
    Animated.timing(datesAnim, { toValue: 1, duration: 200, useNativeDriver: false })
      .start(() => { animating.current = false; });
  }, [datesAnim]);

  const hideDates = useCallback(() => {
    if (!isDatesVisible.current || animating.current) return;
    isDatesVisible.current = false;
    animating.current = true;
    Animated.timing(datesAnim, { toValue: 0, duration: 200, useNativeDriver: false })
      .start(() => { animating.current = false; });
  }, [datesAnim]);

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    if (y > 50) hideDates();
    else if (y < 20) showDates();
  }, [hideDates, showDates]);

  const datesMaxHeight = datesAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  });

  const filtered = blindDatePets.filter((p) => {
    if (speciesFilter !== 'All' && p.species !== speciesFilter) return false;
    if (vaccineFilter === 'Yes' && !p.vaccinated) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>💕 Pet Blind Date</Text>
        <Text style={styles.headerSub}>Find the perfect match for your pet</Text>
      </View>

      {/* My Dates — animated show/hide */}
      <Animated.View style={[styles.myDatesSection, { maxHeight: datesMaxHeight, opacity: datesAnim, overflow: 'hidden' }]}>
        <View style={styles.myDatesHeader}>
          <Text style={styles.myDatesTitle}>My Dates</Text>
          <TouchableOpacity>
            <Text style={styles.manageText}>Manage →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.myDatesScroll}
        >
          {MY_DATES.map((d, index) => (
            <View key={d.id} style={styles.dateCard}>
              <View style={styles.dateCardTop}>
                <View style={styles.dateAvatar}>
                  <Text style={styles.dateAvatarEmoji}>{d.emoji}</Text>
                </View>
                <View style={[styles.statusBadge, index === 0 ? styles.statusActive : styles.statusDraft]}>
                  <Text style={[styles.statusText, index === 0 ? styles.statusTextActive : styles.statusTextDraft]}>
                    {d.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.datePetName}>{d.petName}</Text>
              <Text style={styles.dateMeta} numberOfLines={1}>📍 {d.location}</Text>
              <Text style={styles.dateMeta}>🗓 {d.date}</Text>
              {d.requests > 0 && (
                <View style={styles.requestsBadge}>
                  <Text style={styles.requestsText}>💕 {d.requests} requests</Text>
                </View>
              )}
            </View>
          ))}

          {/* Add new card */}
          <TouchableOpacity style={styles.addDateCard}>
            <Text style={styles.addDateIcon}>+</Text>
            <Text style={styles.addDateText}>Post a Date</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <FilterRow label="Species" options={['All', 'Dog', 'Cat', 'Other']} active={speciesFilter} onSelect={setSpeciesFilter} accentColor={COLORS.purple} />
        <FilterRow label="Age" options={['Any', '0-1y', '1-3y', '3-7y', '7y+']} active={ageFilter} onSelect={setAgeFilter} accentColor={COLORS.purple} />
        <FilterRow label="Vaccine" options={['All', 'Yes', 'No']} active={vaccineFilter} onSelect={setVaccineFilter} accentColor={COLORS.purple} />
        <FilterRow label="Breed" options={['All', 'Persian', 'Corgi', 'Poodle', 'Shiba', 'Maine Coon']} active={breedFilter} onSelect={setBreedFilter} accentColor={COLORS.purple} />
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.countRow}>
            <Text style={styles.countText}>💕 {filtered.length} Nearby Matches</Text>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>Sort: Distance ↓</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <PetCard
            name={item.name}
            emoji={item.emoji}
            breed={item.breed}
            age={item.age}
            gender={item.gender}
            distance={item.distance}
            tags={item.tags}
            variant="heart"
            onHeart={() => {}}
          />
        )}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {},
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
    fontSize: 13,
    color: COLORS.textSub,
  },
  postNewBtn: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 100,
  },
  postNewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  // My Dates section
  myDatesSection: {
    backgroundColor: COLORS.card,
  },
  myDatesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    marginBottom: 10,
  },
  myDatesTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  manageText: {
    fontSize: 13,
    color: COLORS.purple,
    fontWeight: '600',
  },
  myDatesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  dateCard: {
    backgroundColor: COLORS.purpleLight,
    borderRadius: 14,
    padding: 12,
    width: 150,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    gap: 3,
  },
  dateCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  dateAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateAvatarEmoji: {
    fontSize: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  statusActive: { backgroundColor: '#DCFCE7' },
  statusDraft: { backgroundColor: '#F3F4F6' },
  statusText: { fontSize: 10, fontWeight: '600' },
  statusTextActive: { color: '#16A34A' },
  statusTextDraft: { color: COLORS.textMuted },
  datePetName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  dateMeta: {
    fontSize: 11,
    color: COLORS.textSub,
  },
  requestsBadge: {
    marginTop: 4,
    backgroundColor: '#EDE9FE',
    borderRadius: 100,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  requestsText: {
    fontSize: 10,
    color: COLORS.purple,
    fontWeight: '600',
  },
  addDateCard: {
    width: 100,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'transparent',
  },
  addDateIcon: {
    fontSize: 24,
    color: COLORS.purple,
    fontWeight: '300',
  },
  addDateText: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Filters
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  countText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.purple,
  },
  sortBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    backgroundColor: COLORS.purpleLight,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  sortBtnText: {
    fontSize: 12,
    color: COLORS.purple,
    fontWeight: '600',
  },
});
