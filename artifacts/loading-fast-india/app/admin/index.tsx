import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { maskAadhaar, formatDate, formatCurrency } from '@/lib/utils';

const ADMIN_PASS = 'LFI@Admin2024';
type Tab = 'drivers' | 'vyaparis' | 'trips' | 'complaints';

const isNew = (createdAt: string) => {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, login, logout, drivers, vyaparis, trips, complaints, vehicles,
    resetVyapariAdvancePaid, blockDriver, unblockDriver, blockVyapari, unblockVyapari, resolveComplaint } = useApp();
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('drivers');

  const isAdmin = user?.role === 'admin';
  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handleAdminLogin = async () => {
    if (password === ADMIN_PASS) {
      await login({ id: 'admin', role: 'admin', name: 'Admin', phone: '', email: '' });
    } else {
      Alert.alert('गलत पासवर्ड');
    }
  };

  const handleLogout = () => {
    logout().then(() => router.replace('/')).catch(() => router.replace('/'));
  };

  if (!isAdmin) {
    return (
      <View style={[styles.loginContainer, { backgroundColor: colors.background, paddingTop: top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.loginContent}>
          <Feather name="shield" size={48} color={colors.primary} />
          <Text style={[styles.loginTitle, { color: colors.foreground }]}>Admin Panel</Text>
          <Text style={[styles.loginSub, { color: colors.mutedForeground }]}>Loading Fast India</Text>
          <Input label="Admin Password" value={password} onChangeText={setPassword} secureTextEntry icon="lock" required />
          <Button title="लॉगिन करें" onPress={handleAdminLogin} />
        </View>
      </View>
    );
  }

  const newDrivers = drivers.filter(d => isNew(d.createdAt)).length;
  const newVyaparis = vyaparis.filter(v => isNew(v.createdAt)).length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;

  const sortedDrivers = [...drivers].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedVyaparis = [...vyaparis].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedComplaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenue = trips.filter((t) => t.commissionPaid).reduce((sum, t) => sum + t.commissionAmount, 0);

  const TABS: { key: Tab; label: string; count: number; icon: string; alert?: number }[] = [
    { key: 'drivers', label: 'Drivers', count: drivers.length, icon: 'truck', alert: newDrivers },
    { key: 'vyaparis', label: 'Vyaparis', count: vyaparis.length, icon: 'briefcase', alert: newVyaparis },
    { key: 'trips', label: 'Trips', count: trips.length, icon: 'map' },
    { key: 'complaints', label: 'Complaints', count: complaints.length, icon: 'alert-triangle', alert: pendingComplaints },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={['#1a1a2e', '#0A2540']} style={[styles.header, { paddingTop: top }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Admin Panel</Text>
            <Text style={styles.headerSub}>Loading Fast India</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Feather name="log-out" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Drivers" value={String(drivers.length)} sub={newDrivers > 0 ? `+${newDrivers} नए` : undefined} />
          <SummaryCard label="Vyaparis" value={String(vyaparis.length)} sub={newVyaparis > 0 ? `+${newVyaparis} नए` : undefined} />
          <SummaryCard label="Trips" value={String(trips.length)} />
          <SummaryCard label="Revenue" value={formatCurrency(totalRevenue)} />
        </View>

        {(newDrivers > 0 || newVyaparis > 0 || pendingComplaints > 0) && (
          <View style={styles.alertBar}>
            {newDrivers > 0 && <Text style={styles.alertText}>🆕 {newDrivers} नए Driver</Text>}
            {newVyaparis > 0 && <Text style={styles.alertText}>🆕 {newVyaparis} नए Vyapari</Text>}
            {pendingComplaints > 0 && <Text style={styles.alertText}>⚠️ {pendingComplaints} Complaints Pending</Text>}
          </View>
        )}
      </LinearGradient>

      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, { borderBottomColor: tab === t.key ? colors.primary : 'transparent', borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={16} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
            {(t.alert ?? 0) > 0 ? (
              <View style={[styles.badge, { backgroundColor: '#DC2626' }]}>
                <Text style={styles.badgeText}>{t.alert}</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{t.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

        {/* ── DRIVERS ── */}
        {tab === 'drivers' && (
          sortedDrivers.length === 0 ? <EmptyState label="कोई ड्राइवर नहीं" /> :
          sortedDrivers.map((d) => (
            <View key={d.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: d.isBlocked ? '#DC262640' : colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{d.name}</Text>
                  <View style={styles.badgeRow}>
                    {isNew(d.createdAt) && (
                      <View style={[styles.tagBadge, { backgroundColor: '#1D4ED820' }]}>
                        <Text style={[styles.tagText, { color: '#1D4ED8' }]}>🆕 New</Text>
                      </View>
                    )}
                    {d.isBlocked && (
                      <View style={[styles.tagBadge, { backgroundColor: '#DC262620' }]}>
                        <Text style={[styles.tagText, { color: '#DC2626' }]}>🔴 Blocked</Text>
                      </View>
                    )}
                    <View style={[styles.tagBadge, { backgroundColor: d.isVerified ? colors.success + '20' : colors.warning + '20' }]}>
                      <Text style={[styles.tagText, { color: d.isVerified ? colors.success : colors.warning }]}>
                        {d.isVerified ? 'Verified' : 'Pending'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <DataRow label="Phone" value={d.phone} />
              <DataRow label="City" value={`${d.city}, ${d.state}`} />
              <DataRow label="License" value={d.licenseNumber} />
              <DataRow label="Aadhaar" value={maskAadhaar(d.aadhaarNumber)} />
              <DataRow label="Vehicles" value={String(vehicles.filter((v) => v.driverId === d.id).length)} />
              <DataRow label="Joined" value={formatDate(d.createdAt)} />
              <View style={styles.actionRow}>
                {d.isBlocked ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => Alert.alert('✅ Unblock करें?', `${d.name} को Unblock करें?`, [
                      { text: 'हाँ', onPress: () => unblockDriver(d.id).then(() => Alert.alert('✅ Done', `${d.name} अब active है।`)) },
                      { text: 'नहीं', style: 'cancel' },
                    ])}
                  >
                    <Feather name="unlock" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Unblock करें</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => Alert.alert('🔴 Block करें?', `${d.name} को Block करें?\n\nDriver को login नहीं मिलेगा।`, [
                      { text: 'हाँ, Block करें', style: 'destructive', onPress: () => blockDriver(d.id).then(() => Alert.alert('✅ Done', `${d.name} अब Blocked है।`)) },
                      { text: 'रहने दो', style: 'cancel' },
                    ])}
                  >
                    <Feather name="lock" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Block करें</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* ── VYAPARIS ── */}
        {tab === 'vyaparis' && (
          sortedVyaparis.length === 0 ? <EmptyState label="कोई व्यापारी नहीं" /> :
          sortedVyaparis.map((v) => (
            <View key={v.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: v.isBlocked ? '#DC262640' : colors.border }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{v.name}</Text>
                  <View style={styles.badgeRow}>
                    {isNew(v.createdAt) && (
                      <View style={[styles.tagBadge, { backgroundColor: '#1D4ED820' }]}>
                        <Text style={[styles.tagText, { color: '#1D4ED8' }]}>🆕 New</Text>
                      </View>
                    )}
                    {v.isBlocked && (
                      <View style={[styles.tagBadge, { backgroundColor: '#DC262620' }]}>
                        <Text style={[styles.tagText, { color: '#DC2626' }]}>🔴 Blocked</Text>
                      </View>
                    )}
                    <View style={[styles.tagBadge, { backgroundColor: v.advancePaid ? '#E8F5E9' : '#FFF3E0' }]}>
                      <Text style={[styles.tagText, { color: v.advancePaid ? '#2E7D32' : '#E65100' }]}>
                        {v.advancePaid ? '✅ Unlocked' : '🔒 Locked'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <DataRow label="Business" value={v.businessName} />
              <DataRow label="Phone" value={v.phone} />
              <DataRow label="City" value={`${v.city}, ${v.state}`} />
              <DataRow label="Aadhaar" value={maskAadhaar(v.aadhaarNumber)} />
              <DataRow label="GST" value={v.gstNumber || 'N/A'} />
              <DataRow label="Joined" value={formatDate(v.createdAt)} />
              {v.advancePaid && (
                <>
                  <DataRow label="Advance UTR" value={v.advanceUTR || 'N/A'} />
                  <DataRow label="Paid On" value={v.advancePaidAt ? formatDate(v.advancePaidAt) : 'N/A'} />
                </>
              )}
              <View style={styles.actionRow}>
                {v.isBlocked ? (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => Alert.alert('✅ Unblock करें?', `${v.name} को Unblock करें?`, [
                      { text: 'हाँ', onPress: () => unblockVyapari(v.id).then(() => Alert.alert('✅ Done', `${v.name} अब active है।`)) },
                      { text: 'नहीं', style: 'cancel' },
                    ])}
                  >
                    <Feather name="unlock" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Unblock करें</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                    onPress={() => Alert.alert('🔴 Block करें?', `${v.name} को Block करें?`, [
                      { text: 'हाँ, Block करें', style: 'destructive', onPress: () => blockVyapari(v.id).then(() => Alert.alert('✅ Done', `${v.name} अब Blocked है।`)) },
                      { text: 'रहने दो', style: 'cancel' },
                    ])}
                  >
                    <Feather name="lock" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Block करें</Text>
                  </TouchableOpacity>
                )}
                {v.advancePaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#B71C1C' }]}
                    onPress={() => Alert.alert('Advance Reset?', `${v.name} का Advance reset करें?`, [
                      { text: 'हाँ', style: 'destructive', onPress: () => resetVyapariAdvancePaid(v.id).then(() => Alert.alert('✅ Done', 'Advance reset हो गया।')) },
                      { text: 'नहीं', style: 'cancel' },
                    ])}
                  >
                    <Feather name="refresh-ccw" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Advance Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}

        {/* ── TRIPS ── */}
        {tab === 'trips' && (
          trips.length === 0 ? <EmptyState label="कोई ट्रिप नहीं" /> :
          [...trips].reverse().map((t) => (
            <View key={t.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{t.fromCity} → {t.toCity}</Text>
                <View style={[styles.tagBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.tagText, { color: colors.primary }]}>{t.status}</Text>
                </View>
              </View>
              <DataRow label="Driver" value={t.driverName} />
              <DataRow label="Vehicle" value={`${t.vehicleNumber} (${t.vehicleTypeName})`} />
              <DataRow label="Load" value={`${t.loadTons} टन`} />
              <DataRow label="Rent" value={formatCurrency(t.totalRent)} />
              <DataRow label="Commission" value={formatCurrency(t.commissionAmount)} />
              <DataRow label="Date" value={formatDate(t.createdAt)} />
            </View>
          ))
        )}

        {/* ── COMPLAINTS ── */}
        {tab === 'complaints' && (
          sortedComplaints.length === 0 ? <EmptyState label="कोई शिकायत नहीं" /> :
          sortedComplaints.map((c) => (
            <View key={c.id} style={[styles.dataCard, {
              backgroundColor: colors.card,
              borderColor: c.status === 'pending' ? '#f97316' + '60' : c.status === 'resolved' ? '#16a34a40' : colors.border
            }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground, flex: 1 }]}>{c.subject}</Text>
                <View style={[styles.tagBadge, {
                  backgroundColor: c.status === 'pending' ? '#FFF3E0' : c.status === 'resolved' ? '#E8F5E9' : '#EDE9FE'
                }]}>
                  <Text style={[styles.tagText, {
                    color: c.status === 'pending' ? '#E65100' : c.status === 'resolved' ? '#16a34a' : '#7C3AED'
                  }]}>
                    {c.status === 'pending' ? '⏳ Pending' : c.status === 'resolved' ? '✅ Resolved' : '🔴 Escalated'}
                  </Text>
                </View>
              </View>
              <DataRow label="From" value={`${c.complainantName} (${c.complainantRole})`} />
              <DataRow label="Against" value={`${c.againstName} (${c.againstRole})`} />
              <DataRow label="Details" value={c.description} />
              <DataRow label="Date" value={formatDate(c.createdAt)} />
              {c.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => Alert.alert('✅ Resolve करें?', 'इस complaint को Resolved mark करें?', [
                      { text: 'हाँ', onPress: () => resolveComplaint(c.id).then(() => Alert.alert('✅ Done', 'Complaint resolved हो गई।')) },
                      { text: 'नहीं', style: 'cancel' },
                    ])}
                  >
                    <Feather name="check-circle" size={13} color="#fff" />
                    <Text style={styles.actionBtnText}>Mark Resolved</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={sumStyles.card}>
      <Text style={sumStyles.value}>{value}</Text>
      <Text style={sumStyles.label}>{label}</Text>
      {sub && <Text style={sumStyles.sub}>{sub}</Text>}
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center' },
  value: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  sub: { color: '#86efac', fontSize: 9, fontFamily: 'Inter_600SemiBold', marginTop: 1 },
});

function DataRow({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={dataStyles.row}>
      <Text style={[dataStyles.label, { color: colors.mutedForeground }]}>{label}:</Text>
      <Text style={[dataStyles.value, { color: colors.foreground }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

const dataStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 80 },
  value: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1 },
});

function EmptyState({ label }: { label: string }) {
  const colors = useColors();
  return (
    <View style={{ padding: 40, alignItems: 'center', gap: 8 }}>
      <Feather name="inbox" size={32} color={colors.mutedForeground} />
      <Text style={{ color: colors.mutedForeground, fontSize: 14, fontFamily: 'Inter_500Medium' }}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loginContainer: { flex: 1 },
  back: { padding: 20 },
  loginContent: { flex: 1, justifyContent: 'center', padding: 32, gap: 8 },
  loginTitle: { fontSize: 28, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  loginSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 24 },
  header: { padding: 20, paddingBottom: 16 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  alertBar: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  alertText: { color: '#fde68a', fontSize: 11, fontFamily: 'Inter_600SemiBold', backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, flexDirection: 'column' },
  tabText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  badge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  dataCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  tagBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  tagText: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
});
