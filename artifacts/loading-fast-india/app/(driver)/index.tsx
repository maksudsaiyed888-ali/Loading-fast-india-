import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import { Bilty, VyapariTrip } from '@/lib/types';
import { formatCurrency, generateBiltyNumber, generateId, calcCommission } from '@/lib/utils';
import { COMMISSION_UPI } from '@/lib/types';

type Colors = ReturnType<typeof useColors>;

export default function DriverHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentDriver, getDriverTrips, getDriverVehicles, vehicles, bilties, refreshAll, addBilty, updateTrip, getOpenVyapariTrips, addCommissionPayment, hasDriverPaidCommission, confirmVyapariTrip } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const activeTrips = myTrips.filter((t) => t.status === 'confirmed');
  const myBilties = bilties.filter((b) => b.driverId === user?.id);
  const openVyapariTrips = getOpenVyapariTrips();

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const handleViewBilty = (tripId: string) => {
    const b = bilties.find((b) => b.tripId === tripId);
    if (b) setSelectedBilty(b);
    else Alert.alert('बिलटी नहीं मिली', 'इस ट्रिप की बिलटी अभी नहीं बनी है।');
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.navy]} style={[styles.header, { paddingTop: top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>नमस्ते, {currentDriver?.name || user?.name}</Text>
            <Text style={styles.subGreeting}>ड्राइवर डैशबोर्ड • Loading Fast India</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="गाड़ियां" value={String(myVehicles.length)} icon="truck" />
          <StatCard label="कुल ट्रिप" value={String(myTrips.length)} icon="map" />
          <StatCard label="बिलटी" value={String(myBilties.length)} icon="file-text" />
          <StatCard label="Active" value={String(activeTrips.length)} icon="zap" />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {myVehicles.length === 0 && (
          <TouchableOpacity
            style={[styles.addVehicleCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => router.push('/(driver)/vehicles')}
          >
            <Feather name="plus-circle" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.addVehicleTitle, { color: colors.primary }]}>पहली गाड़ी जोड़ें</Text>
              <Text style={[styles.addVehicleSub, { color: colors.mutedForeground }]}>Add Vehicle to start posting trips</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {openVyapariTrips.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📦 व्यापारी की जरूरत</Text>
            {openVyapariTrips.slice(0, 4).map((vt) => (
              <VyapariTripCard
                key={vt.id}
                trip={vt}
                colors={colors}
                driverId={user?.id || ''}
                driverName={currentDriver?.name || user?.name || ''}
                hasPaid={hasDriverPaidCommission(user?.id || '', vt.id)}
                onPayCommission={addCommissionPayment}
                onConfirmTrip={confirmVyapariTrip}
              />
            ))}
          </View>
        )}

        {activeTrips.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Confirmed Trips</Text>
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} isMyTrip onPress={() => handleViewBilty(trip.id)} />
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionBtn icon="plus-circle" label="ट्रिप डालें" onPress={() => router.push('/(driver)/post-trip')} color={colors.primary} />
            <ActionBtn icon="truck" label="गाड़ी जोड़ें" onPress={() => router.push('/(driver)/vehicles')} color={colors.navy} />
            <ActionBtn icon="list" label="मेरी ट्रिप" onPress={() => router.push('/(driver)/my-trips')} color={colors.success} />
            <ActionBtn icon="file-text" label="बिलटी" onPress={() => router.push('/(driver)/my-trips')} color={colors.warning} />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.commissionInfo, { backgroundColor: '#16a34a10', borderColor: '#16a34a40' }]}
          onPress={() => Alert.alert(
            'Commission भेजें',
            `Loading Fast India को 2% commission UPI पर भेजें।\n\n${COMMISSION_UPI}\nनाम: Loading Fast India`,
            [
              { text: 'UPI App खोलें', onPress: () => Linking.openURL(`upi://pay?pa=${COMMISSION_UPI}&pn=Loading%20Fast%20India&cu=INR`) },
              { text: 'बंद करें', style: 'cancel' },
            ]
          )}
          activeOpacity={0.8}
        >
          <Feather name="credit-card" size={15} color="#16a34a" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.commissionTitle, { color: '#16a34a' }]}>2% Commission — Loading Fast India</Text>
            <Text style={[styles.commissionSub, { color: colors.mutedForeground }]}>{COMMISSION_UPI}</Text>
          </View>
          <Feather name="chevron-right" size={15} color="#16a34a" />
        </TouchableOpacity>

        {myTrips.slice(-3).reverse().map((trip) => (
          <TripCard key={trip.id} trip={trip} isMyTrip onPress={() => handleViewBilty(trip.id)} />
        ))}
      </ScrollView>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={statStyles.card}>
      <Feather name={icon as any} size={16} color="rgba(255,255,255,0.7)" />
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: { flex: 1, alignItems: 'center', gap: 3 },
  value: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
});

function ActionBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[actionStyles.btn, { backgroundColor: color + '15', borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon as any} size={22} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 1.5 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
});

function VyapariTripCard({
  trip, colors, driverId, driverName, hasPaid, onPayCommission, onConfirmTrip,
}: {
  trip: VyapariTrip;
  colors: Colors;
  driverId: string;
  driverName: string;
  hasPaid: boolean;
  onPayCommission: (c: import('@/lib/types').CommissionPayment) => Promise<void>;
  onConfirmTrip: (tripId: string, driverId: string, driverName: string) => Promise<void>;
}) {
  const [utr, setUtr] = useState('');
  const [paying, setPaying] = useState(false);
  const [showUtr, setShowUtr] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(trip.status === 'accepted');
  const [subscribed, setSubscribed] = useState(false);

  const commissionAmt = trip.ratePerTon > 0
    ? Math.max(50, Math.round(trip.weightTons * trip.ratePerTon * 0.02))
    : 100;

  const handleOpenUpi = () => {
    const upiUrl = `upi://pay?pa=${COMMISSION_UPI}&pn=Loading%20Fast%20India&am=${commissionAmt}&cu=INR&tn=Commission-${trip.id.slice(0, 8)}`;
    Linking.openURL(upiUrl).catch(() =>
      Alert.alert('UPI App नहीं मिला', 'Google Pay, PhonePe या Paytm install करें।')
    );
    setShowUtr(true);
  };

  const handleUnlock = async () => {
    if (!utr.trim()) {
      Alert.alert('त्रुटि', 'UTR / Transaction ID दर्ज करें');
      return;
    }
    setPaying(true);
    try {
      await onPayCommission({
        id: generateId(),
        driverId,
        driverName,
        vyapariTripId: trip.id,
        vyapariId: trip.vyapariId,
        amount: commissionAmt,
        utrNumber: utr.trim(),
        paidAt: new Date().toISOString(),
      });
    } finally {
      setPaying(false);
    }
  };

  const handleConfirm = async () => {
    if (isConfirmed) return;
    Alert.alert(
      'ट्रिप Accept करें?',
      `${trip.fromCity} → ${trip.toCity} की यह ट्रिप accept करना चाहते हैं?`,
      [
        { text: 'नहीं', style: 'cancel' },
        {
          text: 'हाँ, Accept करें',
          onPress: async () => {
            setConfirming(true);
            try {
              await onConfirmTrip(trip.id, driverId, driverName);
              setIsConfirmed(true);
              Alert.alert('✅ Trip Accept', 'आपने यह ट्रिप accept कर लिया है!');
            } finally {
              setConfirming(false);
            }
          },
        },
      ]
    );
  };

  const handleSubscribe = () => {
    const next = !subscribed;
    setSubscribed(next);
    Alert.alert(
      next ? '🔔 Subscribed!' : '🔕 Unsubscribed',
      next
        ? `${trip.fromCity} → ${trip.toCity} route के नए loads की notification मिलेगी।`
        : 'Notification band कर दी गई।'
    );
  };

  return (
    <View style={[vtStyles.card, { backgroundColor: colors.card, borderColor: isConfirmed ? '#16a34a40' : hasPaid ? colors.primary + '40' : colors.navy + '30' }]}>
      {/* Header */}
      <View style={vtStyles.row}>
        <View style={[vtStyles.badge, { backgroundColor: isConfirmed ? '#16a34a15' : colors.navy + '15' }]}>
          <Text style={[vtStyles.badgeText, { color: isConfirmed ? '#16a34a' : colors.navy }]}>
            {isConfirmed ? '✅ Accepted' : '📦 व्यापारी लोड'}
          </Text>
        </View>
        <Text style={[vtStyles.date, { color: colors.mutedForeground }]}>{trip.tripDate}</Text>
      </View>

      {/* Route */}
      <Text style={[vtStyles.route, { color: colors.foreground }]}>
        {trip.fromCity} ({trip.fromState}) → {trip.toCity} ({trip.toState})
      </Text>
      <Text style={[vtStyles.meta, { color: colors.mutedForeground }]}>
        {trip.goodsCategory} • {trip.weightTons} टन
        {trip.ratePerTon > 0 ? ` • ₹${trip.ratePerTon}/टन` : ''}
      </Text>

      {/* ───── CONSOLIDATED ACTION PANEL ───── */}
      <View style={[vtStyles.actionPanel, { borderColor: colors.border + '60' }]}>

        {/* Row 1: Confirm + Subscribe — always visible */}
        <View style={vtStyles.actionRow}>
          <TouchableOpacity
            style={[vtStyles.actionBtn, { backgroundColor: isConfirmed ? '#16a34a' : colors.success, opacity: confirming ? 0.6 : 1, flex: 1.4 }]}
            onPress={handleConfirm}
            disabled={confirming || isConfirmed}
            activeOpacity={0.8}
          >
            <Feather name={isConfirmed ? 'check-circle' : 'check-square'} size={15} color="#fff" />
            <Text style={vtStyles.actionBtnText}>
              {confirming ? 'हो रहा है...' : isConfirmed ? 'Accepted ✓' : 'Trip Confirm'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[vtStyles.actionBtn, { backgroundColor: subscribed ? '#f97316' : colors.mutedForeground, flex: 1 }]}
            onPress={handleSubscribe}
            activeOpacity={0.8}
          >
            <Feather name={subscribed ? 'bell' : 'bell-off'} size={15} color="#fff" />
            <Text style={vtStyles.actionBtnText}>{subscribed ? 'Subscribed' : 'Notify'}</Text>
          </TouchableOpacity>
        </View>

        {/* Row 2: Contact buttons (visible after commission paid) */}
        {hasPaid ? (
          <View>
            <Text style={[vtStyles.unlockedTitle, { color: '#16a34a', marginBottom: 6 }]}>
              ✅ Contact Unlocked — 👤 {trip.vyapariName}
            </Text>
            <View style={vtStyles.actionRow}>
              <TouchableOpacity
                style={[vtStyles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => Linking.openURL(`tel:${trip.vyapariPhone}`)}
                activeOpacity={0.8}
              >
                <Feather name="phone" size={15} color="#fff" />
                <Text style={vtStyles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[vtStyles.actionBtn, { backgroundColor: '#25D366', flex: 1 }]}
                onPress={() => Linking.openURL(`whatsapp://send?phone=91${trip.vyapariPhone}`)}
                activeOpacity={0.8}
              >
                <Feather name="message-circle" size={15} color="#fff" />
                <Text style={vtStyles.actionBtnText}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[vtStyles.actionBtn, { backgroundColor: colors.navy, flex: 1 }]}
                onPress={() => router.push(`/chat?tripId=${trip.id}&toId=${trip.vyapariId}&toName=${trip.vyapariName}`)}
                activeOpacity={0.8}
              >
                <Feather name="message-square" size={15} color="#fff" />
                <Text style={vtStyles.actionBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Commission gate */
          <View style={[vtStyles.commGate, { borderColor: colors.warning + '50', backgroundColor: colors.warning + '08' }]}>
            <View style={vtStyles.lockedRow}>
              <Feather name="lock" size={13} color={colors.warning} />
              <Text style={[vtStyles.lockedText, { color: colors.warning }]}>
                Contact unlock करें — ₹{commissionAmt} (2%)
              </Text>
            </View>
            <TouchableOpacity
              style={[vtStyles.upiBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenUpi}
              activeOpacity={0.8}
            >
              <Feather name="credit-card" size={14} color="#fff" />
              <Text style={vtStyles.upiBtnText}>UPI से Pay करें — ₹{commissionAmt}</Text>
            </TouchableOpacity>
            {showUtr ? (
              <>
                <TextInput
                  style={[vtStyles.utrInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                  placeholder="UTR / Transaction ID दर्ज करें"
                  placeholderTextColor={colors.mutedForeground}
                  value={utr}
                  onChangeText={setUtr}
                />
                <TouchableOpacity
                  style={[vtStyles.upiBtn, { backgroundColor: '#16a34a', opacity: paying ? 0.6 : 1 }]}
                  onPress={handleUnlock}
                  disabled={paying}
                  activeOpacity={0.8}
                >
                  <Feather name="unlock" size={14} color="#fff" />
                  <Text style={vtStyles.upiBtnText}>{paying ? 'Processing...' : 'Contact Unlock करें'}</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity onPress={() => setShowUtr(true)}>
                <Text style={[vtStyles.alreadyPaid, { color: colors.primary }]}>पहले pay कर दिया? UTR दर्ज करें</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const vtStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  route: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  actionPanel: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 7 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 9 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  unlockedTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  commGate: { borderRadius: 9, borderWidth: 1, padding: 9, gap: 7 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  upiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' },
  upiBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  utrInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular' },
  alreadyPaid: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 2 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  subGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  body: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12, marginTop: 4 },
  addVehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  addVehicleTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  addVehicleSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  quickActions: { marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  commissionInfo: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  commissionTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  commissionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
