import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';

interface ConnectPetProfileScreenProps {
  navigation: any;
  route: any;
}

export const ConnectPetProfileScreen: React.FC<ConnectPetProfileScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const partner = route?.params?.partner;

  const name = partner?.name || 'Max';
  const emoji = partner?.emoji || '🐕';
  const breed = partner?.breed || 'Golden Retriever';
  const age = partner?.age || '3 years';
  const distance = partner?.distance || '0.3 km';
  const owner = partner?.owner || 'Sarah Kim';
  const tags = partner?.tags || ['Vaccinated', 'Neutered', 'Trained'];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — pink background with pet emoji */}
        <View style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.heroEmoji}>{emoji}</Text>
        </View>

        {/* Available badge overlapping hero/content border */}
        <View style={styles.availableWrap}>
          <View style={styles.availableBadge}>
            <View style={styles.availableDot} />
            <Text style={styles.availableText}>Available Today</Text>
          </View>
        </View>

        {/* White content card */}
        <View style={styles.contentCard}>
          {/* Name & breed */}
          <Text style={styles.petName}>{name}</Text>
          <Text style={styles.petBreed}>{breed} · {age}</Text>

          <View style={styles.divider} />

          {/* Owner row */}
          <View style={styles.ownerRow}>
            <View style={styles.ownerAvatar}>
              <Text style={styles.ownerAvatarText}>{owner.charAt(0)}</Text>
            </View>
            <Text style={styles.ownerName}>{owner} · Owner</Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>♂</Text>
              <Text style={styles.statValue}>Male</Text>
              <Text style={styles.statLabel}>Sex</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>📍</Text>
              <Text style={styles.statValue}>{distance}</Text>
              <Text style={styles.statLabel}>Distance</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>⚡</Text>
              <Text style={styles.statValue}>Energetic</Text>
              <Text style={styles.statLabel}>Pace</Text>
            </View>
          </View>

          {/* Walking Invitation */}
          <Text style={styles.sectionTitle}>Walking Invitation</Text>
          <View style={styles.invitationCard}>
            <View style={styles.invRow}>
              <Text style={styles.invIcon}>📍</Text>
              <Text style={styles.invText}>Riverside Park → Elm St</Text>
            </View>
            <View style={styles.invRow}>
              <Text style={styles.invIcon}>🗓</Text>
              <Text style={styles.invText}>Sat, Jun 7 · 7:00 AM</Text>
            </View>
            <View style={styles.invRow}>
              <Text style={styles.invIcon}>⏱</Text>
              <Text style={styles.invText}>45 min · Moderate pace</Text>
            </View>
          </View>

          {/* Tags */}
          <View style={styles.tagsRow}>
            {tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>
                  {tag === 'Vaccinated' ? '✅ ' : tag === 'Neutered' ? '✔ ' : '🏆 '}
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* CTA Button */}
      <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaBtn}>
          <Text style={styles.ctaText}>Send Walk Request →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Hero
  hero: {
    backgroundColor: '#FDECEA',
    height: 260,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize: 20,
    color: COLORS.text,
    fontWeight: '600',
  },
  heroEmoji: {
    fontSize: 90,
    marginTop: 20,
  },

  // Available badge
  availableWrap: {
    alignItems: 'center',
    marginTop: -18,
    marginBottom: 0,
    zIndex: 10,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  availableDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  availableText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Content card
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: 12,
    padding: 24,
    paddingBottom: 8,
  },
  petName: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  petBreed: {
    fontSize: 15,
    color: COLORS.textSub,
    marginBottom: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 16,
  },

  // Owner
  ownerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  ownerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDDDD5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ownerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ownerName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.bg,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },

  // Walking Invitation
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  invitationCard: {
    backgroundColor: '#FFF8F5',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  invRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  invIcon: {
    fontSize: 16,
    width: 20,
  },
  invText: {
    fontSize: 14,
    color: COLORS.text,
  },

  // Tags
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tagText: {
    fontSize: 13,
    color: '#15803D',
    fontWeight: '500',
  },

  // CTA
  ctaWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
  ctaBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
