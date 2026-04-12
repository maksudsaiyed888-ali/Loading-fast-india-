import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ComplaintModal from '@/components/ComplaintModal';
import AppRatingModal from '@/components/AppRatingModal';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import { maskAadhaar, getInitials } from '@/lib/utils';
import { COMMISSION_UPI, APP_NAME } from '@/lib/types';

export default function DriverProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentDriver, getDriverTrips, getDriverVehicles, logout, getAverageRating, getUserRatings, hasRatedApp, getAppAvgRating, appRatings } = useApp();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showAppRating, setShowAppRating] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const completedTrips = myTrips.filter((t) => t.status === 'completed').length;
  const avgRating = user ? getAverageRating(user.id) : 0;
  const myRatings = user ? getUserRatings(user.id) : [];

  const handleLogout = () => {
    Alert.alert('लॉगआउट', 'क्या आप लॉगआउट करना चाहते हैं?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ', style: 'destructive', onPress: () => { logout().then(() => router.replace('/')).catch(() => router.replace('/')); } },
    ]);
  };

  const handleCheckUpdate = async () => {
    try {
      Alert.alert('अपडेट', 'नया अपडेट चेक हो रहा है...');
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        Alert.alert('नया अपडेट मिला! 🎉', 'अपडेट डाउनलोड हो रहा है, app अभी restart होगी।', [], { cancelable: false });
        await Updates.fetchUpdateAsync();
        await Updates.reloadAsync();
      } else {
        Alert.alert('✅ App अप-टू-डेट है', 'कोई नया अपडेट नहीं है।');
      }
    } catch {
      Alert.alert('Update Check', 'अपडेट चेक नहीं हो सका। Internet connection चेक करें।');
    }
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
          <StatItem label="Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)}⭐` : 'नई'} />
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
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>मेरी रेटिंग</Text>
          <View style={styles.ratingOverview}>
            <View style={styles.ratingBig}>
              <Text style={[styles.ratingNumber, { color: colors.foreground }]}>
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
              </Text>
              <Text style={styles.ratingStars}>
                {avgRating > 0 ? '⭐'.repeat(Math.round(avgRating)) : '⭐⭐⭐⭐⭐'}
              </Text>
              <Text style={[styles.ratingCount, { color: colors.mutedForeground }]}>
                {myRatings.length} रेटिंग{myRatings.length !== 1 ? 'ें' : ''}
              </Text>
            </View>
            <View style={styles.ratingBars}>
              {[5, 4, 3, 2, 1].map((s) => {
                const cnt = myRatings.filter((r) => r.stars === s).length;
                const pct = myRatings.length > 0 ? (cnt / myRatings.length) * 100 : 0;
                return (
                  <View key={s} style={styles.barRow}>
                    <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>{s}⭐</Text>
                    <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: '#f59e0b' }]} />
                    </View>
                    <Text style={[styles.barCount, { color: colors.mutedForeground }]}>{cnt}</Text>
                  </View>
                );
              })}
            </View>
          </View>
          {myRatings.slice(-3).reverse().map((r) => (
            <View key={r.id} style={[styles.reviewItem, { borderTopColor: colors.border }]}>
              <View style={styles.reviewHeader}>
                <Text style={[styles.reviewFrom, { color: colors.foreground }]}>
                  🏪 {r.fromName}
                </Text>
                <Text style={styles.reviewStars}>{'⭐'.repeat(r.stars)}</Text>
              </View>
              {r.comment ? <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>{r.comment}</Text> : null}
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Commission Info</Text>
          <InfoRow icon="percent" label="Commission" value="2% per trip" />
          <InfoRow icon="credit-card" label="UPI" value={COMMISSION_UPI} />
          <Text style={[styles.commNote, { color: colors.mutedForeground }]}>
            Trip confirm होने के बाद 2% commission भेजें
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.section, { backgroundColor: '#0A254008', borderColor: '#0A254030', flexDirection: 'row', alignItems: 'center' }]}
          onPress={() => setShowPrivacyPolicy(true)}
          activeOpacity={0.7}
        >
          <View style={{ width: 38, height: 38, borderRadius: 10, backgroundColor: '#0A254018', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
            <Feather name="shield" size={18} color="#0A2540" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: '#0A2540', marginBottom: 2 }]}>गोपनीयता नीति देखें</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
              Fraud नियम • IPC धाराएं • आपके अधिकार
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#0A2540" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.appRateBtn, {
            backgroundColor: (user && hasRatedApp(user.id)) ? '#f59e0b15' : colors.navy + '12',
            borderColor: (user && hasRatedApp(user.id)) ? '#f59e0b' : colors.navy,
          }]}
          onPress={() => setShowAppRating(true)}
        >
          <Text style={styles.appRateEmoji}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appRateBtnTitle, { color: (user && hasRatedApp(user.id)) ? '#f59e0b' : colors.navy }]}>
              {(user && hasRatedApp(user.id)) ? 'App रेटिंग दी ✓' : 'Loading Fast India को Rate करें'}
            </Text>
            <Text style={[styles.appRateBtnSub, { color: colors.mutedForeground }]}>
              {getAppAvgRating() > 0 ? `${getAppAvgRating().toFixed(1)}⭐ • ${appRatings.length} रेटिंग` : 'आपकी रेटिंग जरूरी है'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.complaintBtn, { borderColor: colors.warning }]}
          onPress={() => setShowComplaint(true)}
        >
          <Feather name="alert-triangle" size={18} color={colors.warning} />
          <Text style={[styles.complaintBtnText, { color: colors.warning }]}>शिकायत दर्ज करें</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.updateBtn, { borderColor: colors.primary, backgroundColor: colors.primary + '10' }]} onPress={handleCheckUpdate}>
          <Feather name="download-cloud" size={18} color={colors.primary} />
          <Text style={[styles.updateBtnText, { color: colors.primary }]}>अपडेट चेक करें</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>लॉगआउट</Text>
        </TouchableOpacity>
      </ScrollView>

      <ComplaintModal visible={showComplaint} onClose={() => setShowComplaint(false)} />
      <AppRatingModal visible={showAppRating} onClose={() => setShowAppRating(false)} />
      <PrivacyPolicyModal visible={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
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
  ratingOverview: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  ratingBig: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  ratingNumber: { fontSize: 36, fontFamily: 'Inter_700Bold', lineHeight: 40 },
  ratingStars: { fontSize: 14, lineHeight: 20 },
  ratingCount: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  ratingBars: { flex: 1, gap: 4, justifyContent: 'center' },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  barLabel: { width: 28, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right' },
  barTrack: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 3 },
  barCount: { width: 18, fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  reviewItem: { paddingTop: 10, marginTop: 8, borderTopWidth: 0.5 },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewFrom: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  reviewStars: { fontSize: 12 },
  reviewComment: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3, lineHeight: 18 },
  appRateBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, marginBottom: 10 },
  appRateEmoji: { fontSize: 22 },
  appRateBtnTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  appRateBtnSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
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
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  updateBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
});
