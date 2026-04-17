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

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, login, logout, drivers, vyaparis, trips, complaints, vehicles } = useApp();
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

  const TABS: { key: Tab; label: string; count: number; icon: string }[] = [
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
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

