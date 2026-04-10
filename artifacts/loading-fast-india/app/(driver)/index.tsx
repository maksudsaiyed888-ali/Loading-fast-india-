import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import LocationTracker from '@/components/LocationTracker';
import { Bilty } from '@/lib/types';
import { DriverLocation } from '@/lib/locationService';
import { formatCurrency, generateBiltyNumber, generateId, calcCommission } from '@/lib/utils';
import { COMMISSION_UPI } from '@/lib/types';

export default function DriverHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentDriver, getDriverTrips, getDriverVehicles, vehicles, bilties, refreshAll, addBilty, updateTrip } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const activeTrips = myTrips.filter((t) => t.status === 'confirmed');
  const myBilties = bilties.filter((b) => b.driverId === user?.id);

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
            <View style={{ marginTop: 6 }}>
              <LocationTracker onLocationUpdate={setDriverLocation} showBadge />
            </View>
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

        <View style={[styles.commissionInfo, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
          <Feather name="info" size={15} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.commissionTitle, { color: colors.primary }]}>2% Commission — Loading Fast India</Text>
            <Text style={[styles.commissionSub, { color: colors.mutedForeground }]}>Trip confirm होने पर 2% commission UPI पर भेजें{'\n'}UPI: {COMMISSION_UPI}</Text>
          </View>
        </View>

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
  label: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
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
  addVehicleTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  addVehicleSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  quickActions: { marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  commissionInfo: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  commissionTitle: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: 2 },
  commissionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
