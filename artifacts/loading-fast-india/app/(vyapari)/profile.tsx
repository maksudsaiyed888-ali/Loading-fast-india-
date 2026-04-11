import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import ComplaintModal from '@/components/ComplaintModal';
import AppRatingModal from '@/components/AppRatingModal';
import { maskAadhaar, getInitials } from '@/lib/utils';
import { APP_NAME } from '@/lib/types';

export default function VyapariProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getVyapariBookings, logout, getAverageRating, getUserRatings, hasRatedApp, getAppAvgRating, appRatings } = useApp();
  const [showComplaint, setShowComplaint] = useState(false);
  const [showAppRating, setShowAppRating] = useState(false);

  const myBookings = user ? getVyapariBookings(user.id) : [];
  const completedBookings = myBookings.filter((t) => t.status === 'completed').length;
  const avgRating = user ? getAverageRating(user.id) : 0;
  const myRatings = user ? getUserRatings(user.id) : [];

  const handleLogout = () => {
    Alert.alert('लॉगआउट', 'क्या आप लॉगआउट करना चाहते हैं?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ', style: 'destructive', onPress: async () => { await logout(); router.replace('/'); } },
    ]);
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
            <InfoRow icon="mail" label="Email" value={vyapari.email} />
            <InfoRow icon="briefcase" label="व्यापार" value={vyapari.businessName} />
            <InfoRow icon="map-pin" label="शहर" value={`${vyapari.city}, ${vyapari.state}`} />
            <InfoRow icon="shield" label="Aadhaar" value={maskAadhaar(vyapari.aadhaarNumber)} />
            {vyapari.gstNumber && <InfoRow icon="file" label="GST" value={vyapari.gstNumber} />}
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

        <View style={[styles.section, { backgroundColor: colors.destructive + '08', borderColor: colors.destructive + '30' }]}>
          <Text style={[styles.sectionTitle, { color: colors.destructive }]}>कानूनी चेतावनी</Text>
          <Text style={[styles.policyText, { color: colors.destructive + 'cc' }]}>
            • ड्राइवर का किराया न देने पर IPC 420 (धोखाधड़ी) के तहत कड़ी कार्यवाही होगी{'\n'}
            • अदालत में मुकदमा और जेल की सज़ा हो सकती है{'\n'}
            • झूठी शिकायत पर IPC 182 लागू होगी
          </Text>
        </View>

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
      <AppRatingModal visible={showAppRating} onClose={() => setShowAppRating(false)} />
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
  complaintBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  complaintBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  logoutText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
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
