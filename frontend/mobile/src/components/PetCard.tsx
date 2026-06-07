import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS } from '../constants/colors';

interface PetCardProps {
  name: string;
  emoji: string;
  breed: string;
  age: string;
  distance: string;
  tags: string[];
  time?: string;
  owner?: string;
  rating?: number;
  online?: boolean;
  onConnect?: () => void;
  onHeart?: () => void;
  variant?: 'connect' | 'heart';
  gender?: string;
}

export const PetCard: React.FC<PetCardProps> = ({
  name,
  emoji,
  breed,
  age,
  distance,
  tags,
  time,
  owner,
  rating,
  online = true,
  onConnect,
  onHeart,
  variant = 'connect',
  gender,
}) => {
  return (
    <View style={styles.card}>
      {/* Left: Avatar with status dot */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarEmoji}>{emoji}</Text>
        </View>
        <View style={[styles.statusDot, online ? styles.statusOnline : styles.statusOffline]} />
      </View>

      {/* Middle: Info */}
      <View style={styles.info}>
        <Text style={styles.nameLine} numberOfLines={1}>
          {name} · {breed}
        </Text>
        <View style={styles.metaRow}>
          {owner && <Text style={styles.metaText}>👤 {owner}</Text>}
          <Text style={styles.metaText}>  📍 {distance}</Text>
        </View>
        {time && (
          <Text style={styles.metaText}>🕐 {time}</Text>
        )}
        {tags.length > 0 && (
          <View style={styles.tagsRow}>
            {tags.map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Right: Action button */}
      <View style={styles.actionWrap}>
        {variant === 'connect' ? (
          <TouchableOpacity style={styles.connectBtn} onPress={onConnect}>
            <Text style={styles.connectBtnText}>Connect</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.heartBtn} onPress={onHeart}>
            <Text style={styles.heartText}>💕</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrap: {
    position: 'relative',
    marginRight: 12,
    flexShrink: 0,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 14,
    backgroundColor: '#FFF3E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 30,
  },
  statusDot: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.card,
  },
  statusOnline: {
    backgroundColor: '#22C55E',
  },
  statusOffline: {
    backgroundColor: COLORS.textMuted,
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameLine: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textSub,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  tag: {
    backgroundColor: COLORS.bg,
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 11,
    color: COLORS.textSub,
    fontWeight: '500',
  },
  actionWrap: {
    marginLeft: 10,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  connectBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  heartBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.purpleLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartText: {
    fontSize: 18,
  },
});
