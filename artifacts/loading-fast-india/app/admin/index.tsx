import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { formatDate, formatCurrency } from '@/lib/utils';

const ADMIN_PASS = 'LFI@Admin2024';
type Tab = 'drivers' | 'vyaparis' | 'trips' | 'bookings' | 'payments' | 'complaints';

const isNew = (createdAt: string) => {
  const days = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return days <= 7;
};

const STATUS_COLOR: Record<string, string> = {
  open: '#1D4ED8', accepted: '#16a34a', advance_pending: '#f97316',
  loading: '#7C3AED', on_way: '#0891b2', completed: '#16a34a',
  cancelled: '#DC2626', low_priority: '#6B7280',
  available: '#1D4ED8', 'pending_confirmation': '#f97316',
};

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    user, login, logout, drivers, vyaparis, trips, complaints, vehicles,
    vyapariTrips, bids, commissionPayments,
    resetVyapariAdvancePaid, blockDriver, unblockDriver, blockVyapari, unblockVyapari,
    resolveComplaint, approveDriverKyc, rejectDriverKyc,
  } = useApp();

  const isAdmin = user?.role === 'admin';

  const [photoModal, setPhotoModal] = useState<{ uri: string; label: string } | null>(null);
  const [password, setPassword] = useState('');
  const [tab, setTab] = useState<Tab>('drivers');
  const [driverSearch, setDriverSearch] = useState('');
  const [vyapariSearch, setVyapariSearch] = useState('');
  const [smsBalance, setSmsBalance] = useState<{ balance: number; isLow: boolean; message: string } | null>(null);

  const fetchSmsBalance = useCallback(async () => {
    try {
      const res = await fetch('/api/otp/sms-balance');
      const data = await res.json() as { success: boolean; balance: number; isLow: boolean; message: string };
      if (data.success) setSmsBalance({ balance: data.balance, isLow: data.isLow, message: data.message });
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchSmsBalance();
  }, [isAdmin, fetchSmsBalance]);
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

  const filteredDrivers = useMemo(() => {
    const q = driverSearch.toLowerCase();
    return [...drivers]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(d => !q || d.name.toLowerCase().includes(q) || d.phone.includes(q) || d.city.toLowerCase().includes(q) || d.licenseNumber?.toLowerCase().includes(q));
  }, [drivers, driverSearch]);

  const filteredVyaparis = useMemo(() => {
    const q = vyapariSearch.toLowerCase();
    return [...vyaparis]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter(v => !q || v.name.toLowerCase().includes(q) || v.phone.includes(q) || v.businessName.toLowerCase().includes(q) || v.city.toLowerCase().includes(q));
  }, [vyaparis, vyapariSearch]);

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
  const totalRevenue = trips.filter(t => t.commissionPaid).reduce((sum, t) => sum + (t.commissionAmount || 0), 0)
    + commissionPayments.reduce((sum, c) => sum + (c.amount || 0), 0);

  const TABS: { key: Tab; label: string; count: number; icon: string; alert?: number }[] = [
    { key: 'drivers', label: 'Drivers', count: drivers.length, icon: 'truck', alert: newDrivers },
    { key: 'vyaparis', label: 'Vyaparis', count: vyaparis.length, icon: 'briefcase', alert: newVyaparis },
    { key: 'trips', label: 'Trips', count: trips.length, icon: 'map' },
    { key: 'bookings', label: 'Bookings', count: vyapariTrips.length, icon: 'package' },
    { key: 'payments', label: 'Payments', count: commissionPayments.length, icon: 'credit-card' },
    { key: 'complaints', label: 'Complaints', count: complaints.length, icon: 'alert-triangle', alert: pendingComplaints },
  ];

  const sortedComplaints = [...complaints].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedVyapariTrips = [...vyapariTrips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sortedPayments = [...commissionPayments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());

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
            {pendingComplaints > 0 && <Text style={styles.alertText}>⚠️ {pendingComplaints} Complaints</Text>}
          </View>
        )}
        {/* SMS Balance Card */}
        <TouchableOpacity onPress={fetchSmsBalance} style={[styles.smsBalanceCard, { backgroundColor: smsBalance?.isLow ? '#7f1d1d' : '#14532d' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Feather name="message-square" size={15} color="#fff" />
            <View style={{ flex: 1 }}>
              <Text style={styles.smsBalanceTitle}>Fast2SMS Balance</Text>
              {smsBalance ? (
                <Text style={[styles.smsBalanceAmt, { color: smsBalance.isLow ? '#fca5a5' : '#86efac' }]}>
                  ₹{smsBalance.balance.toFixed(2)} {smsBalance.isLow ? '— ⚠️ कम है! Recharge करें' : '— ✅ OK'}
                </Text>
              ) : (
                <Text style={styles.smsBalanceAmt}>Tap to check...</Text>
              )}
            </View>
            <Feather name="refresh-cw" size={13} color="#fff" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Scrollable Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]} contentContainerStyle={styles.tabBarContent}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            style={[styles.tab, { borderBottomColor: tab === t.key ? colors.primary : 'transparent', borderBottomWidth: 2 }]}
            onPress={() => setTab(t.key)}
          >
            <Feather name={t.icon as any} size={15} color={tab === t.key ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabText, { color: tab === t.key ? colors.primary : colors.mutedForeground }]}>{t.label}</Text>
            <View style={[styles.badge, { backgroundColor: (t.alert ?? 0) > 0 ? '#DC2626' : colors.primary }]}>
              <Text style={styles.badgeText}>{(t.alert ?? 0) > 0 ? t.alert : t.count}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Modal visible={!!photoModal} transparent animationType="fade" onRequestClose={() => setPhotoModal(null)}>
        <TouchableOpacity style={photoModal_styles.overlay} activeOpacity={1} onPress={() => setPhotoModal(null)}>
          <View style={photoModal_styles.container}>
            <Text style={photoModal_styles.label}>{photoModal?.label}</Text>
            {photoModal?.uri && <Image source={{ uri: photoModal.uri }} style={photoModal_styles.image} resizeMode="contain" />}
            <Text style={photoModal_styles.close}>✕ बंद करें</Text>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>

        {/* ── DRIVERS ── */}
        {tab === 'drivers' && (
          <>
            <SearchBar value={driverSearch} onChangeText={setDriverSearch} placeholder="नाम, फोन, शहर, लाइसेंस खोजें..." />
            {filteredDrivers.length === 0 ? <EmptyState label="कोई ड्राइवर नहीं" /> :
              filteredDrivers.map((d) => (
                <View key={d.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: d.isBlocked ? '#DC262640' : colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{d.name}</Text>
                      <View style={styles.badgeRow}>
                        {isNew(d.createdAt) && <StatusPill label="🆕 New" color="#1D4ED8" />}
                        {d.isBlocked && <StatusPill label="🔴 Blocked" color="#DC2626" />}
                        <StatusPill label={d.isVerified ? 'Verified' : 'Pending'} color={d.isVerified ? '#16a34a' : '#f97316'} />
                        <StatusPill label={d.kycStatus === 'verified' ? '✅ KYC OK' : d.kycStatus === 'rejected' ? '❌ KYC Rejected' : '⏳ KYC Pending'} color={d.kycStatus === 'verified' ? '#16a34a' : d.kycStatus === 'rejected' ? '#DC2626' : '#f97316'} />
                      </View>
                    </View>
                  </View>

                  <DataRow label="📱 Phone" value={d.phone} />
                  <DataRow label="🏙️ City" value={`${d.city}, ${d.state}`} />
                  <DataRow label="📍 Address" value={d.address || 'N/A'} />
                  <DataRow label="📮 Pincode" value={d.pincode || 'N/A'} />
                  <DataRow label="🪪 Aadhaar" value={d.aadhaarNumber || 'N/A'} />
                  <DataRow label="🚗 License" value={d.licenseNumber || 'N/A'} />
                  <DataRow label="📅 Expiry" value={d.licenseExpiry || 'N/A'} />
                  <DataRow label="🚛 RC Book" value={d.rcBookNumber || 'N/A'} />
                  <DataRow label="🚛 Vehicles" value={String(vehicles.filter(v => v.driverId === d.id).length)} />
                  <DataRow label="📅 Joined" value={formatDate(d.createdAt)} />
                  <DataRow label="🔔 Radius" value={d.notificationRadius ? `${d.notificationRadius} km` : 'N/A'} />

                  {/* Vehicle list */}
                  {vehicles.filter(v => v.driverId === d.id).map(v => (
                    <View key={v.id} style={[styles.subCard, { backgroundColor: colors.accent }]}>
                      <Text style={[styles.subCardTitle, { color: colors.foreground }]}>🚛 {v.vehicleNumber} — {v.vehicleType}</Text>
                      <Text style={[styles.subCardSub, { color: colors.mutedForeground }]}>{v.capacity} टन • {v.bodyType || 'N/A'}</Text>
                    </View>
                  ))}

                  {/* Document Photos */}
                  {(d.aadhaarPhoto || d.licensePhoto || d.rcBookPhoto || d.selfiePhoto) && (
                    <View style={styles.photosSection}>
                      <Text style={[styles.photosTitle, { color: colors.mutedForeground }]}>📄 Documents & KYC Photos</Text>
                      <View style={styles.photosRow}>
                        {d.selfiePhoto && (
                          <TouchableOpacity onPress={() => setPhotoModal({ uri: d.selfiePhoto!, label: 'Selfie (KYC)' })} style={styles.photoThumbWrap}>
                            <Image source={{ uri: d.selfiePhoto }} style={[styles.photoThumb, { borderColor: '#1D4ED8' }]} />
                            <Text style={[styles.photoThumbLabel, { color: colors.mutedForeground }]}>Selfie</Text>
                          </TouchableOpacity>
                        )}
                        {d.aadhaarPhoto && (
                          <TouchableOpacity onPress={() => setPhotoModal({ uri: d.aadhaarPhoto!, label: 'Aadhaar Card' })} style={styles.photoThumbWrap}>
                            <Image source={{ uri: d.aadhaarPhoto }} style={[styles.photoThumb, { borderColor: '#16a34a' }]} />
                            <Text style={[styles.photoThumbLabel, { color: colors.mutedForeground }]}>Aadhaar</Text>
                          </TouchableOpacity>
                        )}
                        {d.licensePhoto && (
                          <TouchableOpacity onPress={() => setPhotoModal({ uri: d.licensePhoto!, label: 'Driving License' })} style={styles.photoThumbWrap}>
                            <Image source={{ uri: d.licensePhoto }} style={[styles.photoThumb, { borderColor: '#7C3AED' }]} />
                            <Text style={[styles.photoThumbLabel, { color: colors.mutedForeground }]}>License</Text>
                          </TouchableOpacity>
                        )}
                        {d.rcBookPhoto && (
                          <TouchableOpacity onPress={() => setPhotoModal({ uri: d.rcBookPhoto!, label: 'RC Book' })} style={styles.photoThumbWrap}>
                            <Image source={{ uri: d.rcBookPhoto }} style={[styles.photoThumb, { borderColor: '#f97316' }]} />
                            <Text style={[styles.photoThumbLabel, { color: colors.mutedForeground }]}>RC Book</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      <Text style={[styles.photosTip, { color: colors.mutedForeground }]}>📌 Photo tap करके बड़ा देखें</Text>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    {(!d.kycStatus || d.kycStatus === 'pending') && (d.selfiePhoto || d.aadhaarPhoto) && (
                      <>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                          onPress={() => Alert.alert('✅ KYC Approve?', `${d.name} की KYC approve करें?`, [
                            { text: 'हाँ', onPress: () => approveDriverKyc(d.id).then(() => Alert.alert('✅ Done', 'KYC Approved!')) },
                            { text: 'नहीं', style: 'cancel' },
                          ])}>
                          <Feather name="user-check" size={13} color="#fff" />
                          <Text style={styles.actionBtnText}>KYC Approve</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                          onPress={() => Alert.alert('❌ KYC Reject?', `${d.name} की KYC reject करें?`, [
                            { text: 'हाँ', style: 'destructive', onPress: () => rejectDriverKyc(d.id).then(() => Alert.alert('Done', 'KYC Rejected')) },
                            { text: 'नहीं', style: 'cancel' },
                          ])}>
                          <Feather name="user-x" size={13} color="#fff" />
                          <Text style={styles.actionBtnText}>KYC Reject</Text>
                        </TouchableOpacity>
                      </>
                    )}
                    {d.kycStatus === 'rejected' && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                        onPress={() => approveDriverKyc(d.id).then(() => Alert.alert('✅ Done', 'KYC Approved!'))}>
                        <Feather name="user-check" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Re-Approve</Text>
                      </TouchableOpacity>
                    )}
                    {d.isBlocked ? (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                        onPress={() => Alert.alert('✅ Unblock?', `${d.name} को Unblock करें?`, [
                          { text: 'हाँ', onPress: () => unblockDriver(d.id).then(() => Alert.alert('✅ Done', `${d.name} active है।`)) },
                          { text: 'नहीं', style: 'cancel' },
                        ])}>
                        <Feather name="unlock" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Unblock</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#991B1B' }]}
                        onPress={() => Alert.alert('🔴 Block?', `${d.name} को Block करें?`, [
                          { text: 'हाँ, Block', style: 'destructive', onPress: () => blockDriver(d.id).then(() => Alert.alert('✅ Done', `${d.name} Blocked।`)) },
                          { text: 'नहीं', style: 'cancel' },
                        ])}>
                        <Feather name="lock" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Block</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ── VYAPARIS ── */}
        {tab === 'vyaparis' && (
          <>
            <SearchBar value={vyapariSearch} onChangeText={setVyapariSearch} placeholder="नाम, फोन, व्यापार, शहर खोजें..." />
            {filteredVyaparis.length === 0 ? <EmptyState label="कोई व्यापारी नहीं" /> :
              filteredVyaparis.map((v) => (
                <View key={v.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: v.isBlocked ? '#DC262640' : colors.border }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{v.name}</Text>
                      <View style={styles.badgeRow}>
                        {isNew(v.createdAt) && <StatusPill label="🆕 New" color="#1D4ED8" />}
                        {v.isBlocked && <StatusPill label="🔴 Blocked" color="#DC2626" />}
                        <StatusPill label={v.advancePaid ? '✅ Unlocked' : '🔒 Locked'} color={v.advancePaid ? '#16a34a' : '#f97316'} />
                        {v.isVerified && <StatusPill label="Verified" color="#16a34a" />}
                      </View>
                    </View>
                  </View>

                  <DataRow label="🏢 Business" value={v.businessName} />
                  <DataRow label="📱 Phone" value={v.phone} />
                  <DataRow label="🏙️ City" value={`${v.city}, ${v.state}`} />
                  <DataRow label="📍 Address" value={v.address || 'N/A'} />
                  <DataRow label="📮 Pincode" value={v.pincode || 'N/A'} />
                  <DataRow label="🪪 Aadhaar" value={v.aadhaarNumber || 'N/A'} />
                  <DataRow label="🧾 GST" value={v.gstNumber || 'N/A'} />
                  <DataRow label="📅 Joined" value={formatDate(v.createdAt)} />
                  <DataRow label="📦 Bookings" value={String(v.totalBookings || 0)} />
                  {v.advancePaid && (
                    <>
                      <DataRow label="💳 Advance UTR" value={v.advanceUTR || 'N/A'} />
                      <DataRow label="📅 Paid On" value={v.advancePaidAt ? formatDate(v.advancePaidAt) : 'N/A'} />
                    </>
                  )}

                  {/* Aadhaar Photo */}
                  {v.aadhaarPhoto && (
                    <View style={styles.photosSection}>
                      <Text style={[styles.photosTitle, { color: colors.mutedForeground }]}>📄 Aadhaar Card Photo</Text>
                      <View style={styles.photosRow}>
                        <TouchableOpacity onPress={() => setPhotoModal({ uri: v.aadhaarPhoto!, label: `${v.name} — Aadhaar Card` })} style={styles.photoThumbWrap}>
                          <Image source={{ uri: v.aadhaarPhoto }} style={[styles.photoThumb, { borderColor: '#16a34a', width: 100, height: 72 }]} />
                          <Text style={[styles.photoThumbLabel, { color: colors.mutedForeground }]}>Aadhaar Card</Text>
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.photosTip, { color: colors.mutedForeground }]}>📌 Photo tap करके बड़ा देखें</Text>
                    </View>
                  )}

                  <View style={styles.actionRow}>
                    {v.isBlocked ? (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                        onPress={() => Alert.alert('✅ Unblock?', `${v.name} को Unblock करें?`, [
                          { text: 'हाँ', onPress: () => unblockVyapari(v.id).then(() => Alert.alert('✅ Done', `${v.name} active है।`)) },
                          { text: 'नहीं', style: 'cancel' },
                        ])}>
                        <Feather name="unlock" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Unblock</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#DC2626' }]}
                        onPress={() => Alert.alert('🔴 Block?', `${v.name} को Block करें?`, [
                          { text: 'हाँ, Block', style: 'destructive', onPress: () => blockVyapari(v.id).then(() => Alert.alert('✅ Done', `${v.name} Blocked।`)) },
                          { text: 'नहीं', style: 'cancel' },
                        ])}>
                        <Feather name="lock" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Block</Text>
                      </TouchableOpacity>
                    )}
                    {v.advancePaid && (
                      <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#B71C1C' }]}
                        onPress={() => Alert.alert('Advance Reset?', `${v.name} का Advance reset करें?`, [
                          { text: 'हाँ', style: 'destructive', onPress: () => resetVyapariAdvancePaid(v.id).then(() => Alert.alert('✅ Done', 'Advance reset हो गया।')) },
                          { text: 'नहीं', style: 'cancel' },
                        ])}>
                        <Feather name="refresh-ccw" size={13} color="#fff" />
                        <Text style={styles.actionBtnText}>Advance Reset</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            }
          </>
        )}

        {/* ── TRIPS ── */}
        {tab === 'trips' && (
          trips.length === 0 ? <EmptyState label="कोई ट्रिप नहीं" /> :
          [...trips].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((t) => (
            <View key={t.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground }]}>{t.fromCity} → {t.toCity}</Text>
                <StatusPill label={t.status} color={STATUS_COLOR[t.status] || '#6B7280'} />
              </View>
              <DataRow label="🚛 Driver" value={t.driverName || 'N/A'} />
              <DataRow label="📱 Phone" value={t.driverPhone || 'N/A'} />
              <DataRow label="🚗 Vehicle" value={`${t.vehicleNumber || 'N/A'} (${t.vehicleTypeName || ''})`} />
              <DataRow label="⚖️ Load" value={`${t.loadTons} टन`} />
              <DataRow label="📦 Goods" value={t.goodsType || 'N/A'} />
              <DataRow label="💰 Rent" value={formatCurrency(t.totalRent)} />
              <DataRow label="📊 Commission" value={formatCurrency(t.commissionAmount)} />
              <DataRow label="✅ Comm Paid" value={t.commissionPaid ? 'हाँ' : 'नहीं'} />
              <DataRow label="📅 Date" value={formatDate(t.createdAt)} />
              {t.deliveredAt && <DataRow label="📦 Delivered" value={formatDate(t.deliveredAt)} />}
              {t.deliveryOtp && <DataRow label="🔑 OTP" value={t.deliveryOtp} />}
            </View>
          ))
        )}

        {/* ── BOOKINGS (VyapariTrips + Bids) ── */}
        {tab === 'bookings' && (
          sortedVyapariTrips.length === 0 ? <EmptyState label="कोई बुकिंग नहीं" /> :
          sortedVyapariTrips.map((vt) => {
            const tripBids = bids.filter(b => b.tripId === vt.id);
            const acceptedBid = tripBids.find(b => b.status === 'accepted');
            return (
              <View key={vt.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardName, { color: colors.foreground }]}>{vt.fromCity} → {vt.toCity}</Text>
                  <StatusPill label={vt.status} color={STATUS_COLOR[vt.status] || '#6B7280'} />
                </View>
                <DataRow label="👤 Vyapari" value={vt.vyapariName || 'N/A'} />
                <DataRow label="📱 Phone" value={vt.vyapariPhone || 'N/A'} />
                <DataRow label="📦 Goods" value={`${vt.goodsCategory || ''} — ${vt.goodsWeight || ''} टन`} />
                <DataRow label="💰 Budget" value={vt.budget ? formatCurrency(Number(vt.budget)) : 'N/A'} />
                <DataRow label="📅 Date" value={formatDate(vt.createdAt)} />
                {vt.acceptedByDriverName && <DataRow label="🚛 Driver" value={`${vt.acceptedByDriverName} (${vt.acceptedByDriverPhone || ''})`} />}
                {vt.acceptedBidAmount && <DataRow label="💵 Bid Amount" value={formatCurrency(vt.acceptedBidAmount)} />}
                {vt.advanceUTR20 && <DataRow label="💳 Advance UTR" value={vt.advanceUTR20} />}

                {/* All Bids */}
                {tripBids.length > 0 && (
                  <View style={[styles.photosSection, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.photosTitle, { color: colors.mutedForeground }]}>📋 सभी Bids ({tripBids.length})</Text>
                    {tripBids.map((b) => (
                      <View key={b.id} style={[styles.bidRow, { borderColor: b.status === 'accepted' ? '#16a34a' : colors.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.bidDriver, { color: colors.foreground }]}>{b.driverName}</Text>
                          <Text style={[styles.bidSub, { color: colors.mutedForeground }]}>{b.driverPhone} • {formatCurrency(b.bidAmount)}</Text>
                        </View>
                        <StatusPill label={b.status === 'accepted' ? '✅ Accept' : b.status === 'rejected' ? '❌ Reject' : '⏳ Pending'} color={b.status === 'accepted' ? '#16a34a' : b.status === 'rejected' ? '#DC2626' : '#f97316'} />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}

        {/* ── PAYMENTS ── */}
        {tab === 'payments' && (
          <>
            <View style={[styles.paymentSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.paymentSummaryTitle, { color: colors.foreground }]}>💰 Total Commission Collected</Text>
              <Text style={[styles.paymentSummaryAmount, { color: '#16a34a' }]}>{formatCurrency(totalRevenue)}</Text>
              <Text style={[styles.paymentSummaryCount, { color: colors.mutedForeground }]}>{commissionPayments.length} transactions</Text>
            </View>
            {sortedPayments.length === 0 ? <EmptyState label="कोई payment नहीं" /> :
              sortedPayments.map((p) => (
                <View key={p.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>₹{formatCurrency(p.amount)}</Text>
                    <StatusPill label="Commission" color="#16a34a" />
                  </View>
                  <DataRow label="🚛 Driver" value={p.driverName || 'N/A'} />
                  <DataRow label="💳 UTR" value={p.utrNumber || 'N/A'} />
                  <DataRow label="📅 Date" value={formatDate(p.paidAt)} />
                  <DataRow label="🆔 Trip ID" value={p.vyapariTripId?.slice(0, 12) || 'N/A'} />
                </View>
              ))
            }

            {/* Driver Payout Pending — 18% bhejne wale */}
            <Text style={[styles.sectionDivider, { color: '#DC2626' }]}>🚨 Driver को 18% भेजना बाकी है</Text>
            {(() => {
              const pendingPayouts = vyapariTrips.filter(vt => vt.status === 'completed' && vt.acceptedBidAmount && vt.acceptedByDriverName);
              if (pendingPayouts.length === 0) return <EmptyState label="कोई pending payout नहीं ✅" />;
              return pendingPayouts.map(vt => {
                const fare = vt.acceptedBidAmount || 0;
                const payout = Math.round(fare * 0.18);
                const commission = Math.round(fare * 0.02);
                return (
                  <View key={vt.id} style={[styles.dataCard, { backgroundColor: '#FFF5F5', borderColor: '#DC262640', borderWidth: 1.5 }]}>
                    <View style={styles.cardHeader}>
                      <Text style={[styles.cardName, { color: '#DC2626' }]}>₹{payout.toLocaleString('en-IN')} भेजना है</Text>
                      <StatusPill label="⏳ Pending" color="#DC2626" />
                    </View>
                    <DataRow label="🚛 Driver" value={vt.acceptedByDriverName || 'N/A'} />
                    <DataRow label="📱 Driver Phone" value={vt.acceptedByDriverPhone || 'N/A'} />
                    <DataRow label="🛣️ Route" value={`${vt.fromCity} → ${vt.toCity}`} />
                    <DataRow label="💵 Total Fare" value={`₹${fare.toLocaleString('en-IN')}`} />
                    <DataRow label="✂️ 2% Commission (रखें)" value={`₹${commission.toLocaleString('en-IN')}`} />
                    <DataRow label="💸 18% Driver को भेजें" value={`₹${payout.toLocaleString('en-IN')}`} />
                    <DataRow label="📅 Completed" value={formatDate(vt.createdAt)} />
                    <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 8, marginTop: 6 }}>
                      <Text style={{ color: '#991B1B', fontSize: 12, fontFamily: 'Inter_700Bold' }}>
                        👉 {vt.acceptedByDriverName} को UPI से ₹{payout.toLocaleString('en-IN')} भेजें
                      </Text>
                      <Text style={{ color: '#DC2626', fontSize: 11, marginTop: 2 }}>Phone: {vt.acceptedByDriverPhone}</Text>
                    </View>
                  </View>
                );
              });
            })()}

            {/* Vyapari Advance Payments */}
            <Text style={[styles.sectionDivider, { color: colors.secondary }]}>🔒 Vyapari Advance Payments</Text>
            {vyaparis.filter(v => v.advancePaid).length === 0
              ? <EmptyState label="कोई advance payment नहीं" />
              : vyaparis.filter(v => v.advancePaid).map(v => (
                <View key={v.id} style={[styles.dataCard, { backgroundColor: colors.card, borderColor: '#16a34a40' }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardName, { color: colors.foreground }]}>{v.name}</Text>
                    <StatusPill label="✅ Advance Paid" color="#16a34a" />
                  </View>
                  <DataRow label="🏢 Business" value={v.businessName} />
                  <DataRow label="📱 Phone" value={v.phone} />
                  <DataRow label="💳 UTR" value={v.advanceUTR || 'N/A'} />
                  <DataRow label="📅 Date" value={v.advancePaidAt ? formatDate(v.advancePaidAt) : 'N/A'} />
                </View>
              ))
            }
          </>
        )}

        {/* ── COMPLAINTS ── */}
        {tab === 'complaints' && (
          sortedComplaints.length === 0 ? <EmptyState label="कोई शिकायत नहीं" /> :
          sortedComplaints.map((c) => (
            <View key={c.id} style={[styles.dataCard, {
              backgroundColor: colors.card,
              borderColor: c.status === 'pending' ? '#f9731660' : c.status === 'resolved' ? '#16a34a40' : colors.border,
            }]}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardName, { color: colors.foreground, flex: 1 }]}>{c.subject}</Text>
                <StatusPill label={c.status === 'pending' ? '⏳ Pending' : c.status === 'resolved' ? '✅ Resolved' : '🔴 Escalated'}
                  color={c.status === 'pending' ? '#E65100' : c.status === 'resolved' ? '#16a34a' : '#7C3AED'} />
              </View>
              <DataRow label="👤 From" value={`${c.complainantName} (${c.complainantRole})`} />
              <DataRow label="📱 Phone" value={c.complainantPhone || 'N/A'} />
              <DataRow label="⚠️ Against" value={`${c.againstName} (${c.againstRole})`} />
              <DataRow label="📝 Details" value={c.description} />
              <DataRow label="📅 Date" value={formatDate(c.createdAt)} />
              {c.status === 'pending' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => Alert.alert('✅ Resolve?', 'इस complaint को Resolved mark करें?', [
                      { text: 'हाँ', onPress: () => resolveComplaint(c.id).then(() => Alert.alert('✅ Done', 'Complaint resolved।')) },
                      { text: 'नहीं', style: 'cancel' },
                    ])}>
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

function SearchBar({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  const colors = useColors();
  return (
    <View style={[searchStyles.wrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name="search" size={16} color={colors.mutedForeground} />
      <TextInput
        style={[searchStyles.input, { color: colors.foreground }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const searchStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, fontFamily: 'Inter_400Regular' },
});

function StatusPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[pillStyles.pill, { backgroundColor: color + '20' }]}>
      <Text style={[pillStyles.text, { color }]}>{label}</Text>
    </View>
  );
}
const pillStyles = StyleSheet.create({
  pill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  text: { fontSize: 10, fontFamily: 'Inter_600SemiBold' },
});

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
      <Text style={[dataStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[dataStyles.value, { color: colors.foreground }]} numberOfLines={3}>{value}</Text>
    </View>
  );
}
const dataStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginBottom: 5 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', width: 100 },
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

const photoModal_styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { width: '100%', alignItems: 'center', gap: 12 },
  label: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  image: { width: '100%', height: 320, borderRadius: 12 },
  close: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontFamily: 'Inter_500Medium' },
});

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
  smsBalanceCard: { marginTop: 10, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  smsBalanceTitle: { color: '#fff', fontSize: 11, fontFamily: 'Inter_600SemiBold', opacity: 0.8 },
  smsBalanceAmt: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold', marginTop: 1 },
  tabBar: { borderBottomWidth: 1, maxHeight: 60 },
  tabBarContent: { paddingHorizontal: 4 },
  tab: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 2, flexDirection: 'column' },
  tabText: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  badge: { borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1, minWidth: 18, alignItems: 'center' },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  dataCard: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 10 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, gap: 8 },
  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  photosSection: { marginTop: 8, marginBottom: 4, padding: 10, borderRadius: 10 },
  photosTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  photosRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoThumbWrap: { alignItems: 'center', gap: 4 },
  photoThumb: { width: 72, height: 72, borderRadius: 8, borderWidth: 2 },
  photoThumbLabel: { fontSize: 10, fontFamily: 'Inter_500Medium' },
  photosTip: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 6 },
  subCard: { borderRadius: 8, padding: 10, marginBottom: 6 },
  subCardTitle: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  subCardSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  bidRow: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, marginBottom: 6 },
  bidDriver: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  bidSub: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  paymentSummary: { borderRadius: 12, padding: 16, borderWidth: 1, marginBottom: 12, alignItems: 'center' },
  paymentSummaryTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  paymentSummaryAmount: { fontSize: 28, fontFamily: 'Inter_700Bold' },
  paymentSummaryCount: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  sectionDivider: { fontSize: 15, fontFamily: 'Inter_700Bold', marginTop: 16, marginBottom: 10 },
});
