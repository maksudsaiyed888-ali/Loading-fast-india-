import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import ComplaintModal from '@/components/ComplaintModal';
import { Bilty } from '@/lib/types';

type Filter = 'all' | 'available' | 'confirmed' | 'completed';

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getDriverTrips, bilties, refreshAll, updateTrip } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [showComplaint, setShowComplaint] = useState(false);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const filtered = filter === 'all' ? myTrips : myTrips.filter((t) => t.status === filter);

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const handleCancel = async (tripId: string) => {
    Alert.alert('ट्रिप रद्द करें?', 'क्या आप इस ट्रिप को रद्द करना चाहते हैं?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ, रद्द करें', style: 'destructive', onPress: async () => { await updateTrip(tripId, { status: 'cancelled' }); } },
    ]);
  };

  const handleComplete = async (tripId: string) => {
    Alert.alert('ट्रिप पूर्ण?', 'क्या ट्रिप पूरी हो गई?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ', onPress: async () => { await updateTrip(tripId, { status: 'completed' }); } },
    ]);
  };

  const handleBilty = (tripId: string) => {
    const b = bilties.find((b) => b.tripId === tripId);
    if (b) setSelectedBilty(b);
    else Alert.alert('बिलटी नहीं मिली', 'इस ट्रिप की बिलटी अभी नहीं बनी है।');
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'सभी' }, { key: 'available', label: 'उपलब्ध' },
    { key: 'confirmed', label: 'बुक' }, { key: 'completed', label: 'पूर्ण' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी ट्रिप्स</Text>
        <Text style={styles.sub}>{myTrips.length} कुल ट्रिप्स</Text>
      </LinearGradient>

      <View style={[styles.filters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterBtn, { borderColor: filter === f.key ? colors.primary : 'transparent', backgroundColor: filter === f.key ? colors.primary + '15' : 'transparent' }]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.filterText, { color: filter === f.key ? colors.primary : colors.mutedForeground }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {filtered.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="inbox" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>कोई ट्रिप नहीं मिली</Text>
          </View>
        ) : (
          filtered.map((trip) => (
            <View key={trip.id}>
              <TripCard trip={trip} isMyTrip />
              <View style={styles.tripActions}>
                {trip.status === 'confirmed' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.success + '15', borderColor: colors.success }]} onPress={() => handleBilty(trip.id)}>
                    <Feather name="file-text" size={14} color={colors.success} />
                    <Text style={[styles.actionBtnText, { color: colors.success }]}>बिलटी देखें</Text>
                  </TouchableOpacity>
                )}
                {trip.status === 'confirmed' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]} onPress={() => handleComplete(trip.id)}>
                    <Feather name="check-circle" size={14} color={colors.primary} />
                    <Text style={[styles.actionBtnText, { color: colors.primary }]}>पूर्ण करें</Text>
                  </TouchableOpacity>
                )}
                {(trip.status === 'available') && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]} onPress={() => handleCancel(trip.id)}>
                    <Feather name="x-circle" size={14} color={colors.destructive} />
                    <Text style={[styles.actionBtnText, { color: colors.destructive }]}>रद्द करें</Text>
                  </TouchableOpacity>
                )}
                {trip.confirmedBy && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]} onPress={() => setShowComplaint(true)}>
                    <Feather name="alert-triangle" size={14} color={colors.warning} />
                    <Text style={[styles.actionBtnText, { color: colors.warning }]}>शिकायत</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />
      <ComplaintModal
        visible={showComplaint}
        onClose={() => setShowComplaint(false)}
        againstRole="vyapari"
        againstName="व्यापारी"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  filters: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 6, borderBottomWidth: 1 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  tripActions: { flexDirection: 'row', gap: 8, marginTop: -4, marginBottom: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});
