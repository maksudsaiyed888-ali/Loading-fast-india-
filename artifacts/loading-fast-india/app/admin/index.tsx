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
type Tab = 'advances' | 'drivers' | 'vyaparis' | 'trips' | 'complaints';

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, login, logout, drivers, vyaparis, trips, complaints, vehicles, advanceRequests, approveAdvanceRequest, rejectAdvanceRequest } = useApp();
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('advances');
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

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

  const pendingAdvances = advanceRequests.filter((r) => r.status === 'pending');

  const handleApprove = (id: string, vyapariName: string) => {
    Alert.alert(
      'Payment Approve?',
      `${vyapariName} का ₹1,000 payment received confirm करें? Trip automatically post हो जाएगी।`,
      [
        { text: 'Approve ✓', onPress: () => approveAdvanceRequest(id) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleReject = (id: string) => {
    setRejectingId(id);
    setRejectReason('');
  };

  const confirmReject = async () => {
    if (!rejectingId) return;
    if (!rejectReason.trim()) { Alert.alert('कारण जरूरी है', 'Reject करने का कारण लिखें'); return; }
    await rejectAdvanceRequest(rejectingId, rejectReason.trim());
    setRejectingId(null);
    setRejectReason('');
  };

  const TABS: { key: Tab; label: string; count: number; icon: string }[] = [
    { key: 'advances', label: 'Payments', count: pendingAdvances.length, icon: 'credit-card' },
    { key: 'drivers', label: 'Drivers', count: drivers.length, icon: 'truck' },
    { key: 'vyaparis', label: 'Vyaparis', count: vyaparis.length, icon: 'briefcase' },
    { key: 'trips', label: 'Trips', count: trips.length, icon: 'map' },
    { key: 'complaints', label: 'Complaints', count: complaints.length, icon: 'alert-triangle' },
  ];

  const totalRevenue = trips.filter((t) => t.commissionPaid).reduce((sum, t) => sum + t.commissionAmount, 0);
  const confirmedTrips = trips.filter((t) => t.status === 'confirmed' || t.status === 'completed').length;

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
          <SummaryCard label="Total Drivers" value={String(drivers.length)} />
          <SummaryCard label="Total Vyaparis" value={String(vyaparis.length)} />
          <SummaryCard label="Trips" value={String(trips.length)} />
          <SummaryCard label="Revenue" value={formatCurrency(totalRevenue)} />
        </View>
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
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{t.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reject Reason Modal */}
      {rejectingId && (
        <View style={[adStyles.rejectOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
          <View style={[adStyles.rejectSheet, { backgroundColor: colors.background }]}>
            <Text style={[adStyles.rejectTitle, { color: colors.foreground }]}>Reject करने का कारण</Text>
            <Text style={[adStyles.rejectSub, { color: colors.mutedForeground }]}>Vyapari को यह message dikhega</Text>
            <Input label="कारण लिखें" value={rejectReason} onChangeText={setRejectReason} placeholder="जैसे: Payment received नहीं हुई..." required />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <TouchableOpacity style={[adStyles.rejectCancelBtn, { borderColor: colors.border }]} onPress={() => setRejectingId(null)}>
                <Text style={[adStyles.rejectCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[adStyles.rejectConfirmBtn, { backgroundColor: '#C62828' }]} onPress={confirmReject}>
                <Text style={adStyles.rejectConfirmText}>Reject करें</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
        {tab === 'advances' && (
          advanceRequests.length === 0 ? <EmptyState label="कोई payment request नहीं" /> :
          [...advanceRequests].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => (
            <View key={r.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: r.status === 'pending' ? '#F57F17' : r.status === 'approved' ? '#2E7D32' : '#C62828', borderWidth: r.status === 'pending' ? 2 : 1 }]}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{r.vyapariName}</Text>
                  <Text style={[adStyles.tripRoute, { color: colors.mutedForeground }]}>{r.tripData.fromCity} → {r.tripData.toCity} • {r.tripData.weightTons}T</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: r.status === 'pending' ? '#FFF8E1' : r.status === 'approved' ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={[styles.statusText, { color: r.status === 'pending' ? '#E65100' : r.status === 'approved' ? '#2E7D32' : '#C62828' }]}>
                    {r.status === 'pending' ? '⏳ Pending' : r.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                  </Text>
                </View>
              </View>
              <DataRow label="Phone" value={r.vyapariPhone} />
              <DataRow label="Amount" value={`₹${r.amount.toLocaleString()}`} />
              <DataRow label="Goods" value={r.tripData.goodsCategory} />
              <DataRow label="Date" value={formatDate(r.createdAt)} />
              {r.status === 'rejected' && r.rejectionReason && <DataRow label="Reason" value={r.rejectionReason} />}
              {r.status === 'pending' && (
                <View style={adStyles.actionRow}>
                  <TouchableOpacity style={[adStyles.approveBtn, { backgroundColor: '#2E7D32' }]} onPress={() => handleApprove(r.id, r.vyapariName)}>
                    <Feather name="check" size={16} color="#fff" />
                    <Text style={adStyles.approveBtnText}>Approve — Trip Post</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[adStyles.rejectBtn, { borderColor: '#C62828' }]} onPress={() => handleReject(r.id)}>
                    <Feather name="x" size={16} color="#C62828" />
                    <Text style={[adStyles.rejectBtnText, { color: '#C62828' }]}>Reject</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}

        {tab === 'drivers' && (
          drivers.length === 0 ? <EmptyState label="कोई ड्राइवर नहीं" /> :
          drivers.map((d) => (
            <View key={d.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{d.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: d.isVerified ? colors.success + '20' : colors.warning + '20' }]}>
                  <Text style={[styles.statusText, { color: d.isVerified ? colors.success : colors.warning }]}>
                    {d.isVerified ? 'Verified' : 'Pending'}
                  </Text>
                </View>
              </View>
              <DataRow label="Phone" value={d.phone} />
              <DataRow label="City" value={`${d.city}, ${d.state}`} />
              <DataRow label="License" value={d.licenseNumber} />
              <DataRow label="Aadhaar" value={maskAadhaar(d.aadhaarNumber)} />
              <DataRow label="Vehicles" value={String(vehicles.filter((v) => v.driverId === d.id).length)} />
              <DataRow label="Joined" value={formatDate(d.createdAt)} />
            </View>
          ))
        )}

        {tab === 'vyaparis' && (
          vyaparis.length === 0 ? <EmptyState label="कोई व्यापारी नहीं" /> :
          vyaparis.map((v) => (
            <View key={v.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{v.name}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.navy + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.navy }]}>व्यापारी</Text>
                </View>
              </View>
              <DataRow label="Business" value={v.businessName} />
              <DataRow label="Phone" value={v.phone} />
              <DataRow label="City" value={`${v.city}, ${v.state}`} />
              <DataRow label="Aadhaar" value={maskAadhaar(v.aadhaarNumber)} />
              <DataRow label="GST" value={v.gstNumber || 'N/A'} />
              <DataRow label="Joined" value={formatDate(v.createdAt)} />
            </View>
          ))
        )}

        {tab === 'trips' && (
          trips.length === 0 ? <EmptyState label="कोई ट्रिप नहीं" /> :
          [...trips].reverse().map((t) => (
            <View key={t.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{t.fromCity} → {t.toCity}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.primary }]}>{t.status}</Text>
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

        {tab === 'complaints' && (
          complaints.length === 0 ? <EmptyState label="कोई शिकायत नहीं" /> :
          [...complaints].reverse().map((c) => (
            <View key={c.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{c.subject}</Text>
                <View style={[styles.statusBadge, { backgroundColor: colors.warning + '20' }]}>
                  <Text style={[styles.statusText, { color: colors.warning }]}>{c.status}</Text>
                </View>
              </View>
              <DataRow label="From" value={`${c.complainantName} (${c.complainantRole})`} />
              <DataRow label="Against" value={`${c.againstName} (${c.againstRole})`} />
              <DataRow label="Description" value={c.description} />
              <DataRow label="Date" value={formatDate(c.createdAt)} />
            </View>
          ))
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={sumStyles.card}>
      <Text style={sumStyles.value}>{value}</Text>
      <Text style={sumStyles.label}>{label}</Text>
    </View>
  );
}

const sumStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center' },
  value: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  label: { color: 'rgba(255,255,255,0.6)', fontSize: 10, fontFamily: 'Inter_400Regular', textAlign: 'center' },
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
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 70 },
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
  header: { padding: 20, paddingBottom: 20 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  logoutBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-around' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, flexDirection: 'column' },
  tabText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  badge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1 },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  dataCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
});

const adStyles = StyleSheet.create({
  tripRoute: { fontSize: 12, fontFamily: 'Inter_500Medium', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: 10 },
  approveBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  rejectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 18, borderRadius: 10, borderWidth: 1.5 },
  rejectBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  rejectOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, justifyContent: 'center', padding: 20 },
  rejectSheet: { borderRadius: 16, padding: 20, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10 },
  rejectTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  rejectSub: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 8 },
  rejectCancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center' },
  rejectCancelText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  rejectConfirmBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  rejectConfirmText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
