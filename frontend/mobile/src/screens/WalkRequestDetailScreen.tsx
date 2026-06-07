import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { ChatBubble } from '../components/ChatBubble';
import { ChatInputBar } from '../components/ChatInputBar';

interface WalkRequestDetailScreenProps {
  navigation: any;
  route: any;
}

const CHAT_MESSAGES = [
  { id: '1', message: "Hi! I saw your walk invitation for Riverside Park. Max would love to join! He's super friendly with other dogs 🐕", isOwn: false, time: '9:12 AM', avatar: '👩' },
  { id: '2', message: "That sounds great! Buddy loves making new friends. What time works best for you? We're flexible on the start time.", isOwn: true, time: '9:15 AM' },
  { id: '3', message: "We could do 9am? Max is usually very energetic in the mornings and loves the trail by the river!", isOwn: false, time: '9:17 AM', avatar: '👩' },
];

export const WalkRequestDetailScreen: React.FC<WalkRequestDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const [expanded, setExpanded] = useState(route?.params?.expanded ?? false);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Walk Request</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Requester Card */}
        <View style={styles.requesterCard}>
          <View style={styles.requesterTop}>
            <View style={styles.requesterAvatar}>
              <Text style={styles.requesterAvatarText}>👩</Text>
            </View>
            <View style={styles.requesterInfo}>
              <Text style={styles.requesterName}>Sarah K.</Text>
              <Text style={styles.requesterMeta}>⭐ 4.8 · 📍 0.3 km · 18 walks</Text>
              <View style={styles.requesterPetRow}>
                <Text style={styles.requesterPetEmoji}>🐕</Text>
                <Text style={styles.requesterPetInfo}>Max · Corgi · 2y</Text>
              </View>
              <View style={styles.tagsRow}>
                <View style={styles.tag}><Text style={styles.tagText}>Friendly</Text></View>
                <View style={styles.tag}><Text style={styles.tagText}>Vaccinated</Text></View>
              </View>
            </View>
          </View>

          {/* Accordion toggle */}
          <TouchableOpacity
            style={styles.accordionToggle}
            onPress={() => setExpanded(!expanded)}
          >
            <Text style={styles.accordionText}>
              {expanded ? '▼' : '▶'} Walk Details & Actions
            </Text>
          </TouchableOpacity>

          {expanded && (
            <View style={styles.expandedContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📍</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>Riverside Park Trail, Main Entrance</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>📅</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Date</Text>
                  <Text style={styles.detailValue}>Saturday, June 8, 2026</Text>
                </View>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailIcon}>🕐</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Time</Text>
                  <Text style={styles.detailValue}>9:00 AM</Text>
                </View>
              </View>
              <View style={[styles.detailRow, styles.detailRowLast]}>
                <Text style={styles.detailIcon}>⏱</Text>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Duration</Text>
                  <Text style={styles.detailValue}>60 minutes</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.acceptBtn}>
                  <Text style={styles.actionBtnText}>✅ Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.denyBtn}>
                  <Text style={styles.denyBtnText}>❌ Deny</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.blockBtn}>
                  <Text style={styles.blockBtnText}>🚫 Block</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <Text style={styles.dividerText}>Messages</Text>
        </View>

        {/* Chat Bubbles */}
        <View style={styles.chatArea}>
          {CHAT_MESSAGES.map((msg) => (
            <ChatBubble
              key={msg.id}
              message={msg.message}
              timestamp={msg.time}
              isOwn={msg.isOwn}
              avatarEmoji={msg.avatar}
            />
          ))}
        </View>
      </ScrollView>

      {/* Chat Input */}
      <ChatInputBar />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  requesterCard: {
    backgroundColor: COLORS.card,
    margin: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  requesterTop: {
    flexDirection: 'row',
    padding: 16,
    gap: 14,
  },
  requesterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requesterAvatarText: {
    fontSize: 30,
  },
  requesterInfo: {
    flex: 1,
    gap: 4,
  },
  requesterName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  requesterMeta: {
    fontSize: 13,
    color: COLORS.textSub,
  },
  requesterPetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  requesterPetEmoji: {
    fontSize: 16,
  },
  requesterPetInfo: {
    fontSize: 13,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  tag: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  accordionToggle: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bg,
  },
  accordionText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSub,
  },
  expandedContent: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  detailRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  detailIcon: {
    fontSize: 18,
    marginTop: 1,
  },
  detailContent: {},
  detailLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 1,
    backgroundColor: COLORS.green,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  denyBtn: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  blockBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  denyBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.red,
  },
  blockBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSub,
  },
  divider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dividerText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
  },
  chatArea: {
    paddingVertical: 8,
  },
});
