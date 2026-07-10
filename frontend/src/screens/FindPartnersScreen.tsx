import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { walkingPartners, myInvitations, WalkingPartner, Invitation } from '../constants/mockData';
import { fetchWalkingPartners } from '../services/petService';
import { fetchMyInvitations } from '../services/invitationService';
import { FilterRow } from '../components/FilterRow';
import { PetCard } from '../components/PetCard';
import { useCollapsibleSection } from '../hooks/useCollapsibleSection';

interface FindPartnersScreenProps {
  navigation: any;
}

export const FindPartnersScreen: React.FC<FindPartnersScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [typeFilter, setTypeFilter] = useState('All');
  const [breedFilter, setBreedFilter] = useState('All');
  const [ageFilter, setAgeFilter] = useState('Any');
  const [partners, setPartners] = useState<WalkingPartner[]>(walkingPartners);
  const [invitations, setInvitations] = useState<Invitation[]>(myInvitations);

  useEffect(() => {
    // Backend data when reachable; mock cards otherwise (offline demo mode)
    fetchWalkingPartners()
      .then((data) => { if (data.length > 0) setPartners(data); })
      .catch(() => {});
    fetchMyInvitations()
      .then((data) => { if (data.length > 0) setInvitations(data); })
      .catch(() => {});
  }, []);

  // Scroll-direction hide/show: scrolling up hides, scrolling down reveals
  const {
    anim: invAnim,
    maxHeight: invMaxHeight,
    onScroll: handleScroll,
  } = useCollapsibleSection(220);

  const filtered = partners.filter((p) => {
    if (typeFilter !== 'All') {
      const map: Record<string, WalkingPartner['type']> = { Dogs: 'Dog', Cats: 'Cat', Others: 'Other' };
      if (p.type !== map[typeFilter]) return false;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>🚶 Find Walk Partners</Text>
      </View>

      {/* My Invitations — animated show/hide */}
      <Animated.View
        style={[styles.invSection, { maxHeight: invMaxHeight, opacity: invAnim, overflow: 'hidden' }]}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Invitations</Text>
          <TouchableOpacity
            style={styles.postNewBtn}
            onPress={() => navigation.navigate('PostInvitation')}
          >
            <Text style={styles.postNewText}>+ Post New</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.invitationsScroll}
        >
          {invitations.map((inv, index) => (
            <View key={inv.id} style={styles.invCard}>
              <View style={[styles.invBadge, index === 0 ? styles.invBadgeActive : styles.invBadgeDraft]}>
                <Text style={[styles.invBadgeText, index === 0 ? styles.invBadgeTextActive : styles.invBadgeTextDraft]}>
                  {index === 0 ? 'Active' : 'Draft'}
                </Text>
              </View>
              <Text style={styles.invRoute} numberOfLines={1}>📍 {inv.route}</Text>
              <Text style={styles.invMeta}>🗓 {inv.date} · {inv.time}</Text>
              <View style={styles.invFooter}>
                <Text style={styles.invSpotsText}>👥 {inv.spotsLeft} spots left</Text>
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
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <FilterRow
          label="Type"
          options={['All', 'Dogs', 'Cats', 'Others']}
          active={typeFilter}
          onSelect={setTypeFilter}
        />
        <FilterRow
          label="Breed"
          options={['All', 'Retriever', 'Corgi', 'Lab', 'Shiba']}
          active={breedFilter}
          onSelect={setBreedFilter}
        />
        <FilterRow
          label="Age"
          options={['Any', '0-1y', '1-3y', '3-7y', '7y+']}
          active={ageFilter}
          onSelect={setAgeFilter}
        />
      </View>

      {/* Nearby Partners — scrollable list */}
      <ScrollView
        style={styles.listScroll}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <Text style={styles.sectionTitle}>Nearby Walking Partners</Text>
        {filtered.map((partner) => (
          <PetCard
            key={partner.id}
            name={partner.name}
            emoji={partner.emoji}
            breed={partner.breed}
            age={partner.age}
            distance={partner.distance}
            time={partner.time}
            owner={partner.owner}
            online={partner.online}
            tags={partner.tags}
            rating={partner.rating}
            variant="connect"
            onConnect={() => navigation.navigate('ConnectPetProfile', { partner })}
          />
        ))}
      </ScrollView>
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
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  invSection: {
    backgroundColor: COLORS.card,
  },
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
  postNewText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  invitationsScroll: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 10,
  },
  invCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    minWidth: 200,
    maxWidth: 260,
    gap: 4,
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
  invRoute: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  invMeta: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  invFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  invSpotsText: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  invEditBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  invEditText: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  filtersSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 10,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingTop: 4,
  },
});
