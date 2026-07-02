import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../constants/colors';
import { RouteMapPicker } from '../components/RouteMapPicker';

interface EditInvitationScreenProps {
  navigation: any;
  route: any;
}

export const EditInvitationScreen: React.FC<EditInvitationScreenProps> = ({ navigation, route: navRoute }) => {
  const insets = useSafeAreaInsets();
  const invitation = navRoute?.params?.invitation;

  const [routeText, setRouteText] = useState(invitation?.route || 'Riverside Park → Elm St');
  const [mapVisible, setMapVisible] = useState(false);
  const [date, setDate] = useState(invitation?.date || 'Sat, Jun 7, 2026');
  const [time, setTime] = useState(invitation?.time || '7:00 AM');
  const [duration, setDuration] = useState('45');
  const [pace, setPace] = useState('Moderate');
  const [requirements, setRequirements] = useState('');

  const handleWithdraw = () => {
    Alert.alert(
      'Withdraw Invitation',
      'Are you sure you want to withdraw this invitation? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: () => navigation.goBack(),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <RouteMapPicker
        visible={mapVisible}
        onClose={() => setMapVisible(false)}
        onConfirm={(r) => { setRouteText(r); setMapVisible(false); }}
      />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.headerBar, { paddingTop: insets.top + 4 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Invitation</Text>
          <View style={styles.backBtn} />
        </View>

        <View style={styles.formBody}>
          {/* Route */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📍 Route / Meeting Point</Text>
            <TouchableOpacity
              style={[styles.input, styles.routeField]}
              onPress={() => setMapVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={routeText ? styles.routeText : styles.routePlaceholder} numberOfLines={1}>
                {routeText || 'Tap to select route on map'}
              </Text>
              <Text style={styles.mapIcon}>🗺</Text>
            </TouchableOpacity>
          </View>

          {/* Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📅 Date</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectInputText}>{date}</Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Time */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>⏰ Start Time</Text>
            <TouchableOpacity style={styles.selectInput}>
              <Text style={styles.selectInputText}>{time}</Text>
              <Text style={styles.selectArrow}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Duration & Pace */}
          <View style={styles.rowFields}>
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>⏱ Duration (min)</Text>
              <TextInput
                style={styles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="number-pad"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
            <View style={styles.rowSpacer} />
            <View style={[styles.fieldGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>🚶 Walking Pace</Text>
              <TextInput
                style={styles.input}
                value={pace}
                onChangeText={setPace}
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Partner Requirements */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>📝 Partner Requirements</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={requirements}
              onChangeText={setRequirements}
              placeholder="e.g. Friendly dogs only, no rush..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomActions, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.saveBtnText}>💾  Save Changes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.withdrawBtn} onPress={handleWithdraw}>
          <Text style={styles.withdrawBtnText}>🗑  Withdraw Invitation</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
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
  backBtn: { width: 60 },
  backText: { fontSize: 15, color: COLORS.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: COLORS.text },
  formBody: { padding: 20, gap: 4 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: COLORS.textSub, marginBottom: 8 },
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
  routeField: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeText: { fontSize: 15, color: COLORS.text, flex: 1 },
  routePlaceholder: { fontSize: 15, color: COLORS.textMuted, flex: 1 },
  mapIcon: { fontSize: 18, marginLeft: 8 },
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
  selectInputText: { fontSize: 15, color: COLORS.text },
  selectArrow: { fontSize: 12, color: COLORS.textMuted },
  textArea: { height: 90, paddingTop: 12 },
  rowFields: { flexDirection: 'row' },
  rowSpacer: { width: 12 },

  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 14,
    gap: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  withdrawBtn: {
    borderRadius: 100,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#EF4444',
  },
  withdrawBtnText: { color: '#EF4444', fontSize: 15, fontWeight: '600' },
});
