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

interface MeProfileScreenProps {
  navigation: any;
}

export const MeProfileScreen: React.FC<MeProfileScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>👤 My Profile</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Text style={styles.iconBtnText}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Text style={styles.iconBtnText}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatarWrap}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>👩</Text>
          </View>
          <View style={styles.editAvatarBadge}>
            <Text style={styles.editAvatarText}>📷</Text>
          </View>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>Jennifer T.</Text>
          <Text style={styles.profileBio}>Dog mom 🐕 · Outdoor lover · SF Bay Area</Text>
          <Text style={styles.profileLocation}>📍 San Francisco, CA</Text>
          <TouchableOpacity style={styles.editBtn}>
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Activity Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>My Activity</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>12</Text>
            <Text style={styles.statLabel}>Walks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>5</Text>
            <Text style={styles.statLabel}>Date Requests</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>8</Text>
            <Text style={styles.statLabel}>Items Sold</Text>
          </View>
        </View>
      </View>

      {/* My Pet */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.cardTitle}>🐾 My Pet</Text>
          <TouchableOpacity>
            <Text style={styles.addPetText}>+ Add Pet</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.petRow}>
          <View style={styles.petAvatarContainer}>
            <Text style={styles.petAvatarEmoji}>🐕</Text>
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>Buddy</Text>
            <Text style={styles.petBreed}>Golden Retriever · 3y · ♂</Text>
            <View style={styles.petTagsRow}>
              <View style={styles.petTag}>
                <Text style={styles.petTagText}>Friendly</Text>
              </View>
              <View style={styles.petTag}>
                <Text style={styles.petTagText}>Vaccinated</Text>
              </View>
              <View style={styles.petTag}>
                <Text style={styles.petTagText}>Trained</Text>
              </View>
            </View>
          </View>
          <TouchableOpacity style={styles.viewProfileBtn}>
            <Text style={styles.viewProfileText}>View</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuCard}>
        {[
          { icon: '🚶', label: 'Walk History', sub: '12 walks completed' },
          { icon: '💕', label: 'Date Requests', sub: '5 sent · 3 received' },
          { icon: '🛍️', label: 'My Listings', sub: '8 items sold' },
          { icon: '⭐', label: 'Reviews', sub: '4.8 avg · 18 reviews' },
          { icon: '❤️', label: 'Saved Pets', sub: '6 bookmarks' },
        ].map((item, idx) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, idx > 0 && styles.menuItemBorder]}
          >
            <View style={styles.menuIconWrap}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Text style={styles.menuSub}>{item.sub}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sign Out */}
      <TouchableOpacity style={styles.signOutBtn}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {},
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  iconBtnText: {
    fontSize: 20,
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  profileCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileAvatarWrap: {
    position: 'relative',
  },
  profileAvatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryBorder,
  },
  profileAvatarText: {
    fontSize: 38,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  editAvatarText: {
    fontSize: 11,
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  profileBio: {
    fontSize: 13,
    color: COLORS.textSub,
    lineHeight: 18,
  },
  profileLocation: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  editBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignSelf: 'flex-start',
  },
  editBtnText: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 18,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  sectionCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 18,
    padding: 18,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  addPetText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '700',
  },
  petRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  petAvatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petAvatarEmoji: {
    fontSize: 28,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 13,
    color: COLORS.textSub,
    marginBottom: 6,
  },
  petTagsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  petTag: {
    backgroundColor: COLORS.bg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  petTagText: {
    fontSize: 11,
    color: COLORS.textSub,
  },
  viewProfileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  viewProfileText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  menuCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    marginBottom: 0,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  menuSub: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  menuArrow: {
    fontSize: 20,
    color: COLORS.textMuted,
  },
  signOutBtn: {
    margin: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.red,
    alignItems: 'center',
  },
  signOutText: {
    fontSize: 15,
    color: COLORS.red,
    fontWeight: '700',
  },
});
