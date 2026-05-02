import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import * as Updates from 'expo-updates';
import React, { useState } from 'react';
import { Alert, Linking, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ComplaintModal from '@/components/ComplaintModal';
import AppRatingModal from '@/components/AppRatingModal';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import AdminQuickModal from '@/components/AdminQuickModal';
import { maskAadhaar, getInitials } from '@/lib/utils';
import { APP_NAME } from '@/lib/types';

export default function VyapariProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getVyapariBookings, logout, getAverageRating, getUserRatings, hasRatedApp, getAppAvgRating, appRatings } = useApp();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showAppRating, setShowAppRating] = useState(false);
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);

  const myBookings = user ? getVyapariBookings(user.id) : [];
  const completedBookings = myBookings.filter((t) => t.status === 'completed').length;
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
  const vyapari = currentVyapari;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <View style={styles.avatarRow}>
          <View style={[styles.avatar, { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
            <Text style={styles.avatarText}>{getInitials(user?.name || 'V')}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{vyapari?.name || user?.name}</Text>
            <Text style={styles.business}>{vyapari?.businessName}</Text>
            <Text style={styles.role}>व्यापारी</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatItem label="कुल बुकिंग" value={String(myBookings.length)} />
          <StatItem label="पूर्ण" value={String(completedBookings)} />
          <StatItem label="GST" value={vyapari?.gstNumber ? 'हाँ' : 'नहीं'} />
          <StatItem label="Rating" value={avgRating > 0 ? `${avgRating.toFixed(1)}⭐` : 'नई'} />
        </View>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>
        {vyapari && (
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>व्यक्तिगत जानकारी</Text>
            <InfoRow icon="phone" label="मोबाइल" value={vyapari.phone} />
            <InfoRow icon="mail" label="Email" value={vyapari.email ?? '—'} />
            <InfoRow icon="briefcase" label="व्यापार" value={vyapari.businessName} />
            <InfoRow icon="map-pin" label="शहर" value={`${vyapari.city}, ${vyapari.state}`} />
            <InfoRow icon="shield" label="Aadhaar" value={maskAadhaar(vyapari.aadhaarNumber)} />
            {vyapari.gstNumber && <InfoRow icon="file" label="GST" value={vyapari.gstNumber} />}
          </View>
        )}

        {/* LFI System Full Explainer — Merchant Transparency */}
        <View style={[styles.lfiExplainer, { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' }]}>
          <View style={styles.lfiExHeader}>
            <View style={[styles.lfiExLogo, { backgroundColor: '#4F46E5' }]}>
              <Text style={styles.lfiExLogoText}>LFI</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.lfiExTitle, { color: '#1E1B4B' }]}>LFI Payment System क्या है?</Text>
              <Text style={[styles.lfiExSub, { color: '#4338CA' }]}>पूरी जानकारी — हिंदी में</Text>
            </View>
          </View>

          <View style={[styles.lfiExCard, { backgroundColor: '#fff', borderColor: '#C7D2FE' }]}>
            <Text style={[styles.lfiExCardTitle, { color: '#312E81' }]}>🎯 LFI क्यों बना?</Text>
            <Text style={[styles.lfiExCardText, { color: '#374151' }]}>
              अनजान driver को पूरा पैसा पहले देना खतरनाक है। LFI ने 3-Step payment बनाया जिससे{' '}
              <Text style={{ fontFamily: 'Inter_600SemiBold' }}>व्यापारी और driver दोनों safe रहें।</Text>
            </Text>
          </View>

          <Text style={[styles.lfiExStep, { color: '#4338CA' }]}>📋 3 Steps में समझें</Text>

          <View style={[styles.lfiExStep1, { backgroundColor: '#DBEAFE', borderColor: '#3B82F6' }]}>
            <Text style={styles.lfiExStepNum}>Step 1</Text>
            <Text style={[styles.lfiExStepTitle, { color: '#1D4ED8' }]}>20% Advance — LFI को UPI से</Text>
            <Text style={[styles.lfiExStepText, { color: '#1E40AF' }]}>
              • Bid accept करने के बाद{'\n'}
              • यह पैसा LFI के पास सुरक्षित रहता है{'\n'}
              • इसमें से 2% LFI रखता है, बाकी 18% driver को trip पूरी होने पर मिलता है{'\n'}
              • Driver cancel करे तो आपको refund मिलेगा
            </Text>
          </View>

          <View style={[styles.lfiExStep1, { backgroundColor: '#D1FAE5', borderColor: '#10B981' }]}>
            <Text style={styles.lfiExStepNum}>Step 2</Text>
            <Text style={[styles.lfiExStepTitle, { color: '#065F46' }]}>50% Loading पर — Driver को Cash</Text>
            <Text style={[styles.lfiExStepText, { color: '#047857' }]}>
              • माल load होने के समय{'\n'}
              • आप driver को सीधे cash देते हैं{'\n'}
              • LFI का इसमें कोई हिस्सा नहीं{'\n'}
              • Start OTP से confirm होता है
            </Text>
          </View>

          <View style={[styles.lfiExStep1, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
            <Text style={styles.lfiExStepNum}>Step 3</Text>
            <Text style={[styles.lfiExStepTitle, { color: '#991B1B' }]}>30% Delivery पर — Receiver से Cash</Text>
            <Text style={[styles.lfiExStepText, { color: '#B91C1C' }]}>
              • माल पहुंचने पर receiver देता है{'\n'}
              • आपको कुछ नहीं देना{'\n'}
              • End OTP से delivery confirm होती है{'\n'}
              • Driver का locked 18% unlock होता है
            </Text>
          </View>

          <View style={[styles.lfiExCard, { backgroundColor: '#FEF9C3', borderColor: '#EAB308' }]}>
            <Text style={[styles.lfiExCardTitle, { color: '#78350F' }]}>💸 LFI का असली charge कितना है?</Text>
            <View style={styles.lfiChargeRow}>
              <Text style={[styles.lfiChargeItem, { color: '#374151' }]}>कुल किराया</Text>
              <Text style={[styles.lfiChargeVal, { color: '#111827' }]}>100%</Text>
            </View>
            <View style={styles.lfiChargeRow}>
              <Text style={[styles.lfiChargeItem, { color: '#374151' }]}>LFI commission</Text>
              <Text style={[styles.lfiChargeVal, { color: '#DC2626', fontFamily: 'Inter_700Bold' }]}>सिर्फ 2%</Text>
            </View>
            <View style={styles.lfiChargeRow}>
              <Text style={[styles.lfiChargeItem, { color: '#374151' }]}>Driver को जाता है</Text>
              <Text style={[styles.lfiChargeVal, { color: '#16A34A', fontFamily: 'Inter_700Bold' }]}>98%</Text>
            </View>
            <Text style={[styles.lfiExCardText, { color: '#92400E', marginTop: 8 }]}>
              ✅ बाकी 80% किराया (50%+30%) cash में सीधे driver को — LFI को नहीं
            </Text>
          </View>

          <View style={[styles.lfiExCard, { backgroundColor: '#F0FDF4', borderColor: '#22C55E' }]}>
            <Text style={[styles.lfiExCardTitle, { color: '#14532D' }]}>🔒 आपकी safety कैसे?</Text>
            <Text style={[styles.lfiExCardText, { color: '#166534' }]}>
              ✅ Driver का Aadhaar verified{'\n'}
              ✅ OTP से loading और delivery confirm{'\n'}
              ✅ Driver cancel करे → advance refund{'\n'}
              ✅ Complaint helpline: 8401023589
            </Text>
          </View>
        </View>

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
                  🚛 {r.fromName}
                </Text>
                <Text style={styles.reviewStars}>{'⭐'.repeat(r.stars)}</Text>
              </View>
              {r.comment ? <Text style={[styles.reviewComment, { color: colors.mutedForeground }]}>{r.comment}</Text> : null}
            </View>
          ))}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Privacy Policy</Text>
          <Text style={[styles.policyText, { color: colors.mutedForeground }]}>
            • आपकी सभी जानकारी Indian IT Act 2000 के तहत सुरक्षित है{'\n'}
            • आपका Aadhaar किसी तीसरे पक्ष को नहीं दिया जाता{'\n'}
            • {APP_NAME} आपकी जानकारी का दुरुपयोग नहीं करेगा
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
            <Text style={[styles.sectionTitle, { color: '#0A2540', marginBottom: 2 }]}>पूरी गोपनीयता नीति देखें</Text>
            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>
              Fraud नियम • IPC धाराएं • आपके अधिकार
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color="#0A2540" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.appRateBtn, {
            backgroundColor: (user && hasRatedApp(user.id)) ? '#f59e0b15' : '#1B3A6B12',
            borderColor: (user && hasRatedApp(user.id)) ? '#f59e0b' : '#1B3A6B',
          }]}
          onPress={() => setShowAppRating(true)}
        >
          <Text style={styles.appRateEmoji}>⭐</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.appRateBtnTitle, { color: (user && hasRatedApp(user.id)) ? '#f59e0b' : '#1B3A6B' }]}>
              {(user && hasRatedApp(user.id)) ? 'App रेटिंग दी ✓' : 'Loading Fast India को Rate करें'}
            </Text>
            <Text style={[styles.appRateBtnSub, { color: colors.mutedForeground }]}>
              {getAppAvgRating() > 0 ? `${getAppAvgRating().toFixed(1)}⭐ • ${appRatings.length} रेटिंग` : 'आपकी रेटिंग जरूरी है'}
            </Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        {/* Customer Care */}
        <View style={[styles.careCard, { backgroundColor: '#E3F2FD', borderColor: '#1565C0' }]}>
          <View style={styles.careHeader}>
            <Feather name="headphones" size={18} color="#1565C0" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.careTitle, { color: '#0D47A1' }]}>Loading Fast India — Customer Care</Text>
              <Text style={[styles.careSub, { color: '#1565C0' }]}>कोई भी समस्या हो तो call करें</Text>
            </View>
          </View>
          <TouchableOpacity style={[styles.careNumBtn, { backgroundColor: '#1565C0' }]} onPress={() => Linking.openURL('tel:8401023589')}>
            <Feather name="phone" size={15} color="#fff" />
            <Text style={styles.careNumText}>8401023589</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.careNumBtn, { backgroundColor: '#1565C0' }]} onPress={() => Linking.openURL('tel:9227016371')}>
            <Feather name="phone" size={15} color="#fff" />
            <Text style={styles.careNumText}>9227016371</Text>
          </TouchableOpacity>
          <Text style={[styles.careTiming, { color: '#1565C0' }]}>सोमवार–शनिवार • सुबह 9 बजे – रात 8 बजे</Text>
        </View>

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

        <TouchableOpacity
          style={[styles.adminBtn, { backgroundColor: '#1a1a2e' }]}
          onPress={() => setShowAdmin(true)}
        >
          <Feather name="shield" size={16} color="#fff" />
          <Text style={styles.adminBtnText}>Admin Panel</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.destructive }]} onPress={handleLogout}>
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>लॉगआउट</Text>
        </TouchableOpacity>
      </ScrollView>

      <ComplaintModal visible={showComplaint} onClose={() => setShowComplaint(false)} />
      <AppRatingModal visible={showAppRating} onClose={() => setShowAppRating(false)} />
      <PrivacyPolicyModal visible={showPrivacyPolicy} onClose={() => setShowPrivacyPolicy(false)} />
      <AdminQuickModal visible={showAdmin} onClose={() => setShowAdmin(false)} />
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
      <Feather name={icon as any} size={15} color={colors.navy} />
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
  business: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Inter_500Medium' },
  role: { color: 'rgba(255,255,255,0.6)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  body: { padding: 16 },
  section: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  policyText: { fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 22 },
  careCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12, gap: 8 },
  careHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  careTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  careSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  careNumBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10 },
  careNumText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  careTiming: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 2 },
  complaintBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  complaintBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  updateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  updateBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  adminBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13, borderRadius: 12, marginBottom: 10 },
  adminBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  lfiExplainer: { borderRadius: 16, borderWidth: 1.5, padding: 16, marginBottom: 12, gap: 10 },
  lfiExHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 6 },
  lfiExLogo: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  lfiExLogoText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  lfiExTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  lfiExSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  lfiExCard: { borderRadius: 12, borderWidth: 1, padding: 12 },
  lfiExCardTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  lfiExCardText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  lfiExStep: { fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 4, marginBottom: 4 },
  lfiExStep1: { borderRadius: 12, borderWidth: 1, padding: 12 },
  lfiExStepNum: { fontSize: 11, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 1, color: '#6B7280', marginBottom: 3 },
  lfiExStepTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  lfiExStepText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  lfiChargeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4, borderBottomWidth: 0.5, borderBottomColor: '#E5E7EB' },
  lfiChargeItem: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  lfiChargeVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
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
});
