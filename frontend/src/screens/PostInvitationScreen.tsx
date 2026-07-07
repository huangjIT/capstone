import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { RouteMapPicker } from '../components/RouteMapPicker';

interface PostInvitationScreenProps {
  navigation: any;
}

export const PostInvitationScreen: React.FC<PostInvitationScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [route, setRoute] = useState('');
  const [mapVisible, setMapVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [duration, setDuration] = useState('60');
  const [maxSpots, setMaxSpots] = useState('4');

  return (
    <View style={styles.container}>
      <RouteMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={(r) => { setRoute(r); setMapVisible(false); }}
      />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Post Invitation</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.formBody}>
          {/* Route / Meeting Point */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📍 Route / Meeting Point</Text>
            <TouchableOpacity
              style={[styles.input, styles.routeField]}
              onPress={() => setMapVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={route ? styles.routeText : styles.routePlaceholder} numberOfLines={1}>
                {route || 'e.g. Riverside Park entrance'}
              </Text>
              <Text style={styles.mapIcon}>🗺</Text>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📅 Date</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectInputText}>Saturday, June 8, 2026</Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>🕐 Time</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectInputText}>9:00 AM</Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Duration & Max Spots in a row */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>⏱ Duration (min)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.rowSpacer} />
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>👥 Max Spots</Text>
              <TextInput
                style={styles.input}
                value={maxSpots}
                onChangeText={setMaxSpots}
                keyboardType="number-pad"
                placeholder="4"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Message */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>💬 Message (optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={message}
              onChangeText={setMessage}
              placeholder="Share a note with potential walk partners..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Tips */}
          <View style={styles.tipCard}>
            <Text style={styles.tipTitle}>💡 Tips for a great walk</Text>
            <Text style={styles.tipText}>• Be specific with your location to help others find you easily</Text>
            <Text style={styles.tipText}>• Choose a dog-friendly park or trail</Text>
            <Text style={styles.tipText}>• Update the invitation if your plans change</Text>
          </View>
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.ctaContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.ctaButton} onPress={() => navigation.goBack()}>
          <Text style={styles.ctaText}>🐾 Post Invitation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {},
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
    width: 60,
  },
  backText: {
    fontSize: 15,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  formBody: {
    padding: 20,
    gap: 4,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSub,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: COLORS.text,
  },
  routeField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  routeText: {
    fontSize: 15,
    color: COLORS.text,
    flex: 1,
  },
  routePlaceholder: {
    fontSize: 15,
    color: COLORS.textMuted,
    flex: 1,
  },
  mapIcon: {
    fontSize: 18,
    marginLeft: 8,
  },
  selectInput: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectInputText: {
    fontSize: 15,
    color: COLORS.text,
  },
  selectArrow: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  textArea: {
    height: 110,
    paddingTop: 12,
  },
  rowFields: {
    flexDirection: 'row',
  },
  rowSpacer: {
    width: 12,
  },
  tipCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
    gap: 6,
    marginTop: 8,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 4,
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
  },
  ctaContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  ctaButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
});
