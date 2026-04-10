import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import { formatCurrency } from '@/lib/utils';

export default function VyapariHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getAvailableTrips, getVyapariBookings, bilties, refreshAll } = useApp();
  const [refreshing, setRefreshing] = useState(false);

  const availableTrips = getAvailableTrips();
  const myBookings = user ? getVyapariBookings(user.id) : [];
  const myBilties = bilties.filter((b) => b.vyapariId === user?.id);
  const activeBookings = myBookings.filter((t) => t.status === 'confirmed');

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };
  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>नमस्ते, {currentVyapari?.name || user?.name}</Text>
            <Text style={styles.business}>{currentVyapari?.businessName || 'व्यापारी डैशबोर्ड'}</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="उपलब्ध ट्रिप" value={String(availableTrips.length)} icon="truck" />
          <StatCard label="मेरी बुकिंग" value={String(myBookings.length)} icon="package" />
          <StatCard label="Active" value={String(activeBookings.length)} icon="zap" />
          <StatCard label="बिलटी" value={String(myBilties.length)} icon="file-text" />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.navy]} />}
      >
        <View style={styles.quickActions}>
          <ActionBtn icon="search" label="ट्रिप खोजें" onPress={() => router.push('/(vyapari)/browse')} color={colors.primary} />
          <ActionBtn icon="package" label="मेरी बुकिंग" onPress={() => router.push('/(vyapari)/bookings')} color={colors.navy} />
        </View>

        {activeBookings.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Bookings</Text>
            {activeBookings.slice(0, 2).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>नई उपलब्ध ट्रिप्स</Text>
        {availableTrips.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>अभी कोई ट्रिप उपलब्ध नहीं है</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>बाद में चेक करें</Text>
          </View>
        ) : (
          availableTrips.slice(0, 5).map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              onPress={() => router.push('/(vyapari)/browse')}
            />
          ))
        )}
      </ScrollView>
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
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});

function ActionBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[actionStyles.btn, { backgroundColor: color + '15', borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon as any} size={24} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flex: 1, alignItems: 'center', gap: 8, padding: 18, borderRadius: 14, borderWidth: 1.5 },
  label: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  business: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  body: { padding: 16 },
  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  empty: { borderRadius: 14, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptySubText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
