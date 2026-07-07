import React from 'react';
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

interface MarketplaceChatScreenProps {
  navigation: any;
  route: any;
}

const CHAT_MESSAGES = [
  {
    id: '1',
    message: "Hi! Is the pet carrier still available? I'm interested for my cat Luna 🐱",
    isOwn: false,
    time: '10:14 AM',
    avatar: '👩',
  },
  {
    id: '2',
    message: "Yes it's still available! Great condition, only used a few times. The dimensions are 45x30x28cm — fits most cats and small dogs comfortably.",
    isOwn: true,
    time: '10:17 AM',
  },
  {
    id: '3',
    message: 'Would you accept $20? I can pick up today if that works!',
    isOwn: false,
    time: '10:19 AM',
    avatar: '👩',
  },
  {
    id: '4',
    message: "Best I can do is $22 — it's basically new and I paid $60. I'm free this afternoon around 3pm or 5pm.",
    isOwn: true,
    time: '10:22 AM',
  },
  {
    id: '5',
    message: "Deal! $22 works for me. Let's meet at 5pm at the Golden Gate Park entrance? 📍",
    isOwn: false,
    time: '10:24 AM',
    avatar: '👩',
  },
];

export const MarketplaceChatScreen: React.FC<MarketplaceChatScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  const item = route?.params?.item;

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
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>👤</Text>
          </View>
          <View>
            <Text style={styles.headerName}>Alex M.</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online now</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.backBtn}>
          <Text style={styles.moreText}>⋯</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Item Card */}
        <View style={styles.itemCard}>
          <View style={styles.itemCardInner}>
            <View style={styles.itemImageBox}>
              <Text style={styles.itemEmoji}>{item?.emoji || '🎒'}</Text>
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item?.name || 'Pet Carrier Bag'}</Text>
              <Text style={styles.itemCondition}>Condition: {item?.condition || 'Good'} · 3 uses</Text>
              <View style={styles.itemPriceRow}>
                <Text style={styles.itemPrice}>${item?.price || 25}</Text>
                {(item?.originalPrice || 60) && (
                  <Text style={styles.itemOriginalPrice}>${item?.originalPrice || 60}</Text>
                )}
                <View style={styles.availableBadge}>
                  <View style={styles.availableDot} />
                  <Text style={styles.availableText}>Available</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Timestamp */}
        <View style={styles.timestampRow}>
          <Text style={styles.timestampText}>Today, 10:14 AM</Text>
        </View>

        {/* Chat Messages */}
        {CHAT_MESSAGES.map((msg) => (
          <ChatBubble
            key={msg.id}
            message={msg.message}
            timestamp={msg.time}
            isOwn={msg.isOwn}
            avatarEmoji={msg.avatar}
          />
        ))}
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
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 22,
    color: COLORS.primary,
  },
  moreText: {
    fontSize: 22,
    color: COLORS.textSub,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 8,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerAvatarText: {
    fontSize: 20,
  },
  headerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: COLORS.green,
  },
  onlineText: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  itemCard: {
    margin: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.card,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardInner: {
    flexDirection: 'row',
    padding: 14,
    gap: 12,
  },
  itemImageBox: {
    width: 70,
    height: 70,
    borderRadius: 14,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemEmoji: {
    fontSize: 38,
  },
  itemDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemCondition: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  itemPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  itemOriginalPrice: {
    fontSize: 13,
    color: COLORS.textMuted,
    textDecorationLine: 'line-through',
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryLight,
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  availableText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
  },
  timestampRow: {
    alignItems: 'center',
    marginVertical: 6,
  },
  timestampText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: COLORS.bg,
    paddingHorizontal: 12,
  },
});
