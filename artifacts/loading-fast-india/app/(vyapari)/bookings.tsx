import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import ComplaintModal from '@/components/ComplaintModal';
import { Bilty, Trip } from '@/lib/types';

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getVyapariBookings, bilties, refreshAll } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [showComplaint, setShowComplaint] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const myBookings = user ? getVyapariBookings(user.id) : [];
  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const handleBilty = (tripId: string) => {
    const b = bilties.find((b) => b.tripId === tripId);
    if (b) setSelectedBilty(b);
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी बुकिंग</Text>
        <Text style={styles.sub}>{myBookings.length} कुल बुकिंग</Text>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.navy]} />}
      >
        {myBookings.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>कोई बुकिंग नहीं</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Browse Trips से ट्रिप बुक करें</Text>
          </View>
        ) : (
          myBookings.map((trip) => (
            <View key={trip.id}>
              <TripCard trip={trip} />
              <View style={styles.tripActions}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success }]}
                  onPress={() => handleBilty(trip.id)}
                >
                  <Feather name="file-text" size={14} color={colors.success} />
                  <Text style={[styles.actionBtnText, { color: colors.success }]}>ई-बिलटी</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                  onPress={() => { setSelectedTrip(trip); setShowComplaint(true); }}
                >
                  <Feather name="alert-triangle" size={14} color={colors.primary} />
                  <Text style={[styles.actionBtnText, { color: colors.primary }]}>शिकायत</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />
      <ComplaintModal
        visible={showComplaint}
        onClose={() => setShowComplaint(false)}
        againstId={selectedTrip?.driverId}
        againstName={selectedTrip?.driverName}
        againstRole="driver"
        tripId={selectedTrip?.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tripActions: { flexDirection: 'row', gap: 10, marginTop: -4, marginBottom: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, borderWidth: 1.5 },
  actionBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
