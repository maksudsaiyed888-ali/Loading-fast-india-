import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ComplaintModal from '@/components/ComplaintModal';
import { maskAadhaar, getInitials } from '@/lib/utils';
import { COMMISSION_UPI, APP_NAME } from '@/lib/types';

export default function DriverProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentDriver, getDriverTrips, getDriverVehicles, logout } = useApp();
  const [showComplaint, setShowComplaint] = useState(false);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const completedTrips = myTrips.filter((t) => t.status === 'completed').length;

  const handleLogout = () => {
    Alert.alert('लॉगआउट', 'क्या आप लॉगआउट करना चाहते हैं?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);
  if (!currentDriver && !user) return null;
  const driver = currentDriver;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.navy]} style={[styles.header, { paddingTop: top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.3)' }]}>
            <Text style={styles.avatarText}>{getInitials(user?.name || 'D')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{driver?.name || user?.name}</Text>
            <Text style={styles.role}>ड्राइवर</Text>
            {driver && !driver.isVerified && (
              <View style={styles.verifyBadge}>
                <Feather name="clock" size={12} color={colors.warning} />
                <Text style={[styles.verifyText, { color: colors.warning }]}>Verification Pending</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="गाड़ियां" value={String(myVehicles.length)} />
          <StatItem label="कुल ट्रिप" value={String(myTrips.length)} />
          <StatItem label="पूर्ण" value={String(completedTrips)} />
          <StatItem label="Rating" value={`${driver?.rating || 4.5}★`} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>
        {driver && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>व्यक्तिगत जानकारी</Text>
            <InfoRow icon="phone" label="मोबाइल" value={driver.phone} />
            <InfoRow icon="mail" label="Email" value={driver.email} />
            <InfoRow icon="map-pin" label="शहर" value={`${driver.city}, ${driver.state}`} />
            <InfoRow icon="shield" label="Aadhaar" value={maskAadhaar(driver.aadhaarNumber)} />
            <InfoRow icon="credit-card" label="License" value={driver.licenseNumber} />
            <InfoRow icon="bell" label="Notification Range" value={`${driver.notificationRadius} km`} />
          </View>
        )}

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Commission Info</Text>
          <InfoRow icon="percent" label="Commission" value="2% per trip" />
          <InfoRow icon="credit-card" label="UPI" value={COMMISSION_UPI} />
          <Text style={[styles.commNote, { color: colors.mutedForeground }]}>
            Trip confirm होने के बाद 2% commission UPI पर भेजें
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Privacy Policy</Text>
          <Text style={[styles.policyText, { color: colors.mutedForeground }]}>
            • आपकी सभी जानकारी Indian IT Act 2000 के तहत सुरक्षित है{'\n'}
            • आपका Aadhaar और License नंबर किसी तीसरे पक्ष को नहीं दिया जाता{'\n'}
            • गलत जानकारी देने पर IPC 471 लागू होगा{'\n'}
            • {APP_NAME} आपकी जानकारी का दुरुपयोग नहीं करेगा
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.destructive + '08', borderColor: colors.destructive + '30' }]}>
          <Text style={[styles.sectionTitle, { color: colors.destructive }]}>कानूनी जानकारी</Text>
          <Text style={[styles.policyText, { color: colors.destructive + 'cc' }]}>
            • किराया न मिलने पर IPC 420 (धोखाधड़ी) लागू होगी{'\n'}
            • माल नुकसान पर IPC 379 (चोरी) की कार्यवाही होगी{'\n'}
            • झूठी शिकायत पर IPC 182 लागू होगी
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.complaintBtn, { borderColor: colors.warning }]}
          onPress={() => setShowComplaint(true)}
        >
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[styles.complaintBtnText, { color: colors.warning }]}>शिकायत दर्ज करें</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>लॉगआउट</Text>
        </TouchableOpacity>
      </ScrollView>

      <ComplaintModal visible={showComplaint} onClose={() => setShowComplaint(false)} />
    </View>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={statStyles.item}>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  item: { flex: 1, alignItems: 'center' },
  value: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
});

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={infoStyles.row}>
      <Feather name={icon as any} size={15} color={colors.primary} />
      <Text style={[infoStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[infoStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const infoStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, borderTopWidth: 0.5, borderTopColor: 'rgba(0,0,0,0.05)' },
  label: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular' },
  value: { fontSize: 13, fontFamily: 'Inter_500Medium', maxWidth: '55%', textAlign: 'right' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 24, fontFamily: 'Inter_700Bold' },
  name: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  role: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  verifyBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  verifyText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  body: { padding: 16 },
  section: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  commNote: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 8 },
  policyText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  complaintBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  complaintBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
