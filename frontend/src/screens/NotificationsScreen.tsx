import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { notifications, Notification } from '../constants/mockData';
import { fetchNotifications, markAllNotificationsRead } from '../services/notificationService';
import { NotifItem } from '../components/NotifItem';

interface NotificationsScreenProps {
  navigation: any;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<Notification[]>(notifications);

  const loadNotifications = () => {
    // Backend data when reachable; mock rows otherwise (offline demo mode)
    fetchNotifications()
      .then((data) => { if (data.length > 0) setItems(data); })
      .catch(() => {});
  };

  useEffect(loadNotifications, []);

  const handleMarkAllRead = () => {
    markAllNotificationsRead()
      .then(loadNotifications)
      .catch(() => setItems(items.map((n) => ({ ...n, isNew: false }))));
  };

  const newNotifs = items.filter((n) => n.isNew);
  const earlierNotifs = items.filter((n) => !n.isNew);

  const sections = [
    { title: 'NEW', data: newNotifs },
    { title: 'EARLIER', data: earlierNotifs },
  ];

  const handlePress = (item: Notification) => {
    if (item.category === 'blind_date') {
      navigation.navigate('NotificationDetail', { notif: item });
    } else if (item.category === 'walk_request') {
      navigation.navigate('WalkRequestDetail', { notif: item, expanded: false });
    } else if (item.category === 'message') {
      navigation.navigate('MarketplaceChat', {});
    }
  };

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      }
      renderSectionHeader={({ section }) => (
        <Text style={styles.sectionLabel}>{section.title}</Text>
      )}
      renderItem={({ item }) => (
        <NotifItem item={item} onPress={() => handlePress(item)} />
      )}
      contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 20 }]}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  listContent: {},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  markAllText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    paddingVertical: 8,
    marginTop: 4,
  },
});
