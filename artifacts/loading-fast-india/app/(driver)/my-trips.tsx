import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import ComplaintModal from '@/components/ComplaintModal';
import ChatbotModal from '@/components/ChatbotModal';
import { Bilty, Trip } from '@/lib/types';

type Filter = 'all' | 'available' | 'confirmed' | 'completed';
type TripStatus = 'loading' | 'on_the_way' | 'delivered';

const TRIP_STATUS_OPTIONS: { key: TripStatus; label: string; icon: string; color: string }[] = [
  { key: 'loading', label: 'लोडिंग हो रही है', icon: '📦', color: '#d97706' },
  { key: 'on_the_way', label: 'रास्ते में है', icon: '🚛', color: '#2563eb' },
  { key: 'delivered', label: 'डिलीवर हो गया', icon: '✅', color: '#16a34a' },
];

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, getDriverTrips, bilties, refreshAll, updateTrip } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [showComplaint, setShowComplaint] = useState(false);
  const [showChatbot, setShowChatbot] = useState(false);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedTripStatus, setSelectedTripStatus] = useState<TripStatus | ''>('');
  const [locationInput, setLocationInput] = useState('');

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
      { text: 'हाँ', onPress: async () => { await updateTrip(tripId, { status: 'completed', tripStatus: 'delivered' }); } },
    ]);
  };

  const handleBilty = (tripId: string) => {
    const b = bilties.find((b) => b.tripId === tripId);
    if (b) setSelectedBilty(b);
    else Alert.alert('बिलटी नहीं मिली', 'इस ट्रिप की बिलटी अभी नहीं बनी है।');
  };

  const openStatusModal = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedTripStatus(trip.tripStatus || '');
    setLocationInput(trip.currentLocation || '');
    setStatusModal(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedTrip) return;
    if (!selectedTripStatus) {
      Alert.alert('स्थिति चुनें', 'कृपया गाड़ी की स्थिति चुनें।');
      return;
    }
    await updateTrip(selectedTrip.id, {
      tripStatus: selectedTripStatus,
      currentLocation: locationInput.trim() || undefined,
    });
    setStatusModal(false);
    Alert.alert('अपडेट हो गया!', `स्थिति: ${TRIP_STATUS_OPTIONS.find(s => s.key === selectedTripStatus)?.label}${locationInput ? `\nस्थान: ${locationInput}` : ''}`);
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

              {trip.tripStatus && (
                <View style={[styles.statusBanner, {
                  backgroundColor: TRIP_STATUS_OPTIONS.find(s => s.key === trip.tripStatus)?.color + '15',
                  borderColor: TRIP_STATUS_OPTIONS.find(s => s.key === trip.tripStatus)?.color + '50',
                }]}>
                  <Text style={styles.statusBannerIcon}>{TRIP_STATUS_OPTIONS.find(s => s.key === trip.tripStatus)?.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.statusBannerLabel, { color: TRIP_STATUS_OPTIONS.find(s => s.key === trip.tripStatus)?.color }]}>
                      {TRIP_STATUS_OPTIONS.find(s => s.key === trip.tripStatus)?.label}
                    </Text>
                    {trip.currentLocation ? (
                      <Text style={[styles.statusBannerLoc, { color: colors.mutedForeground }]}>
                        📍 {trip.currentLocation}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              <View style={styles.tripActions}>
                {trip.status === 'confirmed' && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#7C3AED' + '15', borderColor: '#7C3AED' }]}
                    onPress={() => openStatusModal(trip)}
                  >
                    <Feather name="navigation" size={14} color="#7C3AED" />
                    <Text style={[styles.actionBtnText, { color: '#7C3AED' }]}>स्थिति अपडेट</Text>
                  </TouchableOpacity>
                )}
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
                {trip.status === 'available' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]} onPress={() => handleCancel(trip.id)}>
                    <Feather name="x-circle" size={14} color={colors.destructive} />
                    <Text style={[styles.actionBtnText, { color: colors.destructive }]}>रद्द करें</Text>
                  </TouchableOpacity>
                )}
                {trip.status === 'confirmed' && trip.commissionPaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#0ea5e9' + '15', borderColor: '#0ea5e9' }]}
                    onPress={() => router.push(`/chat?tripId=${trip.id}`)}
                  >
                    <Feather name="message-circle" size={14} color="#0ea5e9" />
                    <Text style={[styles.actionBtnText, { color: '#0ea5e9' }]}>चैट</Text>
                  </TouchableOpacity>
                )}
                {trip.status === 'confirmed' && !trip.commissionPaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#94a3b8' + '15', borderColor: '#94a3b8' }]}
                    onPress={() => router.push(`/chat?tripId=${trip.id}`)}
                  >
                    <Feather name="lock" size={14} color="#94a3b8" />
                    <Text style={[styles.actionBtnText, { color: '#94a3b8' }]}>चैट 🔒</Text>
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

      <TouchableOpacity
        style={[styles.chatbotFab, { backgroundColor: '#E07B39' }]}
        onPress={() => setShowChatbot(true)}
        activeOpacity={0.85}
      >
        <Feather name="help-circle" size={24} color="#fff" />
      </TouchableOpacity>
      <ChatbotModal visible={showChatbot} onClose={() => setShowChatbot(false)} />

      <Modal visible={statusModal} transparent animationType="slide" onRequestClose={() => setStatusModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.statusSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.statusHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>🚛 गाड़ी की स्थिति अपडेट करें</Text>
              <TouchableOpacity onPress={() => setStatusModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statusBody}>
              {selectedTrip && (
                <View style={[styles.tripInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tripInfoRoute, { color: colors.foreground }]}>
                    {selectedTrip.fromCity} → {selectedTrip.toCity}
                  </Text>
                  <Text style={[styles.tripInfoSub, { color: colors.mutedForeground }]}>
                    {selectedTrip.vehicleTypeName} • {selectedTrip.loadTons} टन
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionLabel, { color: colors.secondary }]}>गाड़ी अभी कहाँ है?</Text>

              {TRIP_STATUS_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.statusOption, {
                    backgroundColor: selectedTripStatus === opt.key ? opt.color + '18' : colors.card,
                    borderColor: selectedTripStatus === opt.key ? opt.color : colors.border,
                    borderWidth: selectedTripStatus === opt.key ? 2 : 1,
                  }]}
                  onPress={() => setSelectedTripStatus(opt.key)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.statusOptionIcon}>{opt.icon}</Text>
                  <Text style={[styles.statusOptionLabel, { color: selectedTripStatus === opt.key ? opt.color : colors.foreground }]}>
                    {opt.label}
                  </Text>
                  {selectedTripStatus === opt.key && (
                    <Feather name="check-circle" size={20} color={opt.color} />
                  )}
                </TouchableOpacity>
              ))}

              <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: 16 }]}>शहर का नाम लिखें (optional)</Text>
              <TextInput
                style={[styles.locationInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="जैसे: जयपुर, दिल्ली, मुंबई..."
                placeholderTextColor={colors.mutedForeground}
                value={locationInput}
                onChangeText={setLocationInput}
              />

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveStatus}
                activeOpacity={0.8}
              >
                <Feather name="check" size={18} color="#fff" />
                <Text style={styles.saveBtnText}>अपडेट करें</Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

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
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: -6, marginBottom: 6 },
  statusBannerIcon: { fontSize: 20 },
  statusBannerLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statusBannerLoc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tripActions: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  statusSheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  statusHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  statusTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  statusBody: { padding: 20 },
  chatbotFab: { position: 'absolute', bottom: 88, right: 20, width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 4 },
  tripInfo: { borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1 },
  tripInfoRoute: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  tripInfoSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, marginBottom: 10 },
  statusOptionIcon: { fontSize: 24 },
  statusOptionLabel: { flex: 1, fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  locationInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular', marginBottom: 20 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 16 },
  saveBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
});
