import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import React, { useState, useRef } from 'react';
import {
  Alert, Linking, Modal, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import ComplaintModal from '@/components/ComplaintModal';
import ChatbotModal from '@/components/ChatbotModal';
import RatingModal from '@/components/RatingModal';
import FraudAlertModal from '@/components/FraudAlertModal';
import { Bilty, Trip, COMMISSION_UPI } from '@/lib/types';

type Filter = 'all' | 'available' | 'confirmed' | 'pending_confirmation' | 'completed';
type TripStatus = 'loading' | 'on_the_way' | 'delivered';

const TRIP_STATUS_OPTIONS: { key: TripStatus; label: string; icon: string; color: string }[] = [
  { key: 'loading',   label: 'लोडिंग हो रही है', icon: '📦', color: '#d97706' },
  { key: 'on_the_way', label: 'रास्ते में है',    icon: '🚛', color: '#2563eb' },
  { key: 'delivered', label: 'डिलीवर हो गया',    icon: '✅', color: '#16a34a' },
];

export default function MyTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, getDriverTrips, bilties, refreshAll, updateTrip, hasRated, vyaparis } = useApp();
  const [filter, setFilter] = useState<Filter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complainTrip, setComplainTrip] = useState<Trip | null>(null);
  const [fraudTrip, setFraudTrip] = useState<Trip | null>(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [ratingTrip, setRatingTrip] = useState<Trip | null>(null);

  const [statusModal, setStatusModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedTripStatus, setSelectedTripStatus] = useState<TripStatus | ''>('');
  const [locationInput, setLocationInput] = useState('');

  const [deliveryModal, setDeliveryModal] = useState(false);
  const [deliveryTrip, setDeliveryTrip] = useState<Trip | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [voiceDone, setVoiceDone] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [savingDelivery, setSavingDelivery] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const myTrips = user ? getDriverTrips(user.id) : [];
  const filtered = filter === 'all' ? myTrips : myTrips.filter((t) => t.status === filter);

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const handleCancel = async (tripId: string) => {
    Alert.alert('ट्रिप रद्द करें?', 'क्या आप इस ट्रिप को रद्द करना चाहते हैं?', [
      { text: 'नहीं', style: 'cancel' },
      { text: 'हाँ, रद्द करें', style: 'destructive', onPress: async () => { await updateTrip(tripId, { status: 'cancelled' }); } },
    ]);
  };

  const openDeliveryModal = (trip: Trip) => {
    setDeliveryTrip(trip);
    setGpsCoords(null);
    setVoiceDone(false);
    setRecordingDuration(0);
    setIsRecording(false);
    setDeliveryNotes('');
    recordingRef.current = null;
    setDeliveryModal(true);
  };

  const captureGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission नहीं मिली', 'GPS के लिए Location Permission दें।');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setGpsCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    } catch {
      Alert.alert('GPS Error', 'Location नहीं मिली। दोबारा कोशिश करें।');
    }
    setGpsLoading(false);
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission नहीं मिली', 'Voice Record के लिए Microphone Permission दें।');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      Alert.alert('Error', 'Voice recording शुरू नहीं हो पाई।');
    }
  };

  const stopRecording = async () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    setIsRecording(false);
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        recordingRef.current = null;
      }
    } catch {}
    setVoiceDone(true);
  };

  const handleSaveDelivery = async () => {
    if (!deliveryTrip) return;
    if (!gpsCoords) {
      Alert.alert('GPS ज़रूरी है', 'कृपया पहले GPS Location कैप्चर करें।');
      return;
    }
    if (!voiceDone) {
      Alert.alert('Voice Note ज़रूरी है', 'कृपया पहले Voice Note रिकॉर्ड करें और Stop करें।');
      return;
    }
    if (isRecording) {
      Alert.alert('Recording चल रही है', 'पहले Stop Recording दबाएँ।');
      return;
    }
    setSavingDelivery(true);
    try {
      await updateTrip(deliveryTrip.id, {
        status: 'pending_confirmation',
        tripStatus: 'delivered',
        deliveryLat: gpsCoords.lat,
        deliveryLng: gpsCoords.lng,
        deliveryVoiceRecorded: true,
        deliveryNotes: deliveryNotes.trim() || undefined,
        deliveredAt: new Date().toISOString(),
      });
      setDeliveryModal(false);
      Alert.alert(
        'डिलीवरी दर्ज हो गई! ✅',
        'GPS + Voice Note सेव हो गया। व्यापारी की पुष्टि का इंतज़ार है।'
      );
    } catch {
      Alert.alert('Error', 'कुछ गड़बड़ हुई, दोबारा कोशिश करें।');
    }
    setSavingDelivery(false);
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

  const formatDuration = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`;

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'all', label: 'सभी' },
    { key: 'available', label: 'उपलब्ध' },
    { key: 'confirmed', label: 'बुक' },
    { key: 'pending_confirmation', label: '⏳ Pending' },
    { key: 'completed', label: 'पूर्ण' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी ट्रिप्स</Text>
        <Text style={styles.sub}>{myTrips.length} कुल ट्रिप्स</Text>
      </LinearGradient>

      <View style={[styles.filters, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterBtn, { borderColor: filter === f.key ? colors.primary : 'transparent', backgroundColor: filter === f.key ? colors.primary + '15' : 'transparent' }]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterText, { color: filter === f.key ? colors.primary : colors.mutedForeground }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
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

              {trip.status === 'pending_confirmation' && (
                <View style={[styles.pendingBanner, { borderColor: '#f59e0b50', backgroundColor: '#f59e0b12' }]}>
                  <Text style={styles.pendingIcon}>⏳</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.pendingLabel, { color: '#b45309' }]}>व्यापारी की पुष्टि बाकी है</Text>
                    {trip.deliveryLat ? (
                      <Text style={[styles.pendingGps, { color: colors.mutedForeground }]}>
                        📍 {trip.deliveryLat.toFixed(5)}, {trip.deliveryLng?.toFixed(5)}
                        {trip.deliveryVoiceRecorded ? '  🎙️ Voice ✓' : ''}
                      </Text>
                    ) : null}
                  </View>
                </View>
              )}

              {trip.tripStatus && trip.status !== 'pending_confirmation' && (
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
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a15', borderColor: '#16a34a' }]}
                    onPress={() => openDeliveryModal(trip)}
                  >
                    <Feather name="check-circle" size={14} color="#16a34a" />
                    <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>डिलीवरी पूर्ण करें</Text>
                  </TouchableOpacity>
                )}
                {trip.status === 'available' && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.destructive + '15', borderColor: colors.destructive }]} onPress={() => handleCancel(trip.id)}>
                    <Feather name="x-circle" size={14} color={colors.destructive} />
                    <Text style={[styles.actionBtnText, { color: colors.destructive }]}>रद्द करें</Text>
                  </TouchableOpacity>
                )}
                {(trip.status === 'confirmed' || trip.status === 'pending_confirmation') && trip.commissionPaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#0ea5e9' + '15', borderColor: '#0ea5e9' }]}
                    onPress={() => router.push(`/chat?tripId=${trip.id}`)}
                  >
                    <Feather name="message-circle" size={14} color="#0ea5e9" />
                    <Text style={[styles.actionBtnText, { color: '#0ea5e9' }]}>चैट</Text>
                  </TouchableOpacity>
                )}
                {(trip.status === 'confirmed' || trip.status === 'pending_confirmation') && !trip.commissionPaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#16a34a15', borderColor: '#16a34a' }]}
                    onPress={() => Linking.openURL(`upi://pay?pa=${COMMISSION_UPI}&pn=Loading%20Fast%20India&am=${trip.commissionAmount?.toFixed(0) ?? '0'}&cu=INR`)}
                  >
                    <Feather name="credit-card" size={14} color="#16a34a" />
                    <Text style={[styles.actionBtnText, { color: '#16a34a' }]}>₹{trip.commissionAmount?.toFixed(0)} Commission भेजें</Text>
                  </TouchableOpacity>
                )}
                {(trip.status === 'confirmed' || trip.status === 'pending_confirmation') && !trip.commissionPaid && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#94a3b8' + '15', borderColor: '#94a3b8' }]}
                    onPress={() => router.push(`/chat?tripId=${trip.id}`)}
                  >
                    <Feather name="lock" size={14} color="#94a3b8" />
                    <Text style={[styles.actionBtnText, { color: '#94a3b8' }]}>चैट 🔒</Text>
                  </TouchableOpacity>
                )}
                {trip.status === 'completed' && trip.confirmedBy && (
                  <TouchableOpacity
                    style={[styles.actionBtn, {
                      backgroundColor: (user && hasRated(trip.id, user.id)) ? '#94a3b8' + '15' : '#f59e0b' + '15',
                      borderColor: (user && hasRated(trip.id, user.id)) ? '#94a3b8' : '#f59e0b',
                    }]}
                    onPress={() => setRatingTrip(trip)}
                  >
                    <Text style={{ fontSize: 12 }}>⭐</Text>
                    <Text style={[styles.actionBtnText, { color: (user && hasRated(trip.id, user.id)) ? '#94a3b8' : '#f59e0b' }]}>
                      {(user && hasRated(trip.id, user.id)) ? 'रेटिंग दी ✓' : 'रेटिंग दें'}
                    </Text>
                  </TouchableOpacity>
                )}
                {trip.confirmedBy && (
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#dc262615', borderColor: '#dc2626' }]}
                    onPress={() => setFraudTrip(trip)}
                  >
                    <Feather name="alert-octagon" size={14} color="#dc2626" />
                    <Text style={[styles.actionBtnText, { color: '#dc2626' }]}>Fraud</Text>
                  </TouchableOpacity>
                )}
                {trip.confirmedBy && (
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.warning + '15', borderColor: colors.warning }]} onPress={() => { setComplainTrip(trip); setShowComplaint(true); }}>
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
      {ratingTrip && ratingTrip.confirmedBy && (
        <RatingModal
          visible={!!ratingTrip}
          onClose={() => setRatingTrip(null)}
          tripId={ratingTrip.id}
          toId={ratingTrip.confirmedBy}
          toName={ratingTrip.confirmedByName || 'व्यापारी'}
          toRole="vyapari"
        />
      )}

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

      <Modal visible={deliveryModal} transparent animationType="slide" onRequestClose={() => { if (!savingDelivery) { if (isRecording) stopRecording(); setDeliveryModal(false); } }}>
        <View style={styles.overlay}>
          <View style={[styles.statusSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.statusHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>📦 डिलीवरी प्रमाण</Text>
              <TouchableOpacity onPress={() => { if (!savingDelivery) { if (isRecording) stopRecording(); setDeliveryModal(false); } }}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.statusBody}>
              {deliveryTrip && (
                <View style={[styles.tripInfo, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tripInfoRoute, { color: colors.foreground }]}>
                    {deliveryTrip.fromCity} → {deliveryTrip.toCity}
                  </Text>
                  <Text style={[styles.tripInfoSub, { color: colors.mutedForeground }]}>
                    {deliveryTrip.vehicleTypeName} • {deliveryTrip.loadTons} टन
                  </Text>
                </View>
              )}

              <View style={[styles.mandatoryNote, { backgroundColor: '#fef3c7', borderColor: '#f59e0b' }]}>
                <Feather name="info" size={14} color="#b45309" />
                <Text style={[styles.mandatoryNoteText, { color: '#92400e' }]}>
                  GPS Location और Voice Note दोनों अनिवार्य हैं — यह झूठ को रोकने के लिए है।
                </Text>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: 16 }]}>
                1. GPS Location (अनिवार्य) {gpsCoords ? '✅' : ''}
              </Text>
              {gpsCoords ? (
                <View style={[styles.gpsResult, { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }]}>
                  <Feather name="map-pin" size={16} color="#16a34a" />
                  <Text style={[styles.gpsResultText, { color: '#15803d' }]}>
                    {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                  </Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.gpsBtn, { backgroundColor: '#2563eb15', borderColor: '#2563eb' }]}
                  onPress={captureGPS}
                  disabled={gpsLoading}
                  activeOpacity={0.8}
                >
                  {gpsLoading ? (
                    <ActivityIndicator size="small" color="#2563eb" />
                  ) : (
                    <Feather name="map-pin" size={16} color="#2563eb" />
                  )}
                  <Text style={[styles.gpsBtnText, { color: '#2563eb' }]}>
                    {gpsLoading ? 'Location ले रहे हैं...' : '📍 GPS Location लें'}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: 20 }]}>
                2. Voice Note (अनिवार्य) {voiceDone ? '✅' : ''}
              </Text>
              <View style={[styles.voiceCard, { backgroundColor: colors.card, borderColor: isRecording ? '#dc2626' : voiceDone ? '#16a34a' : colors.border }]}>
                <View style={styles.voiceRow}>
                  {isRecording ? (
                    <>
                      <View style={styles.recDot} />
                      <Text style={[styles.recTimerText, { color: '#dc2626' }]}>
                        Recording... {formatDuration(recordingDuration)}
                      </Text>
                    </>
                  ) : voiceDone ? (
                    <>
                      <Feather name="check-circle" size={18} color="#16a34a" />
                      <Text style={[styles.recTimerText, { color: '#15803d' }]}>
                        Voice Note रिकॉर्ड हो गया ({formatDuration(recordingDuration)})
                      </Text>
                    </>
                  ) : (
                    <>
                      <Feather name="mic" size={18} color={colors.mutedForeground} />
                      <Text style={[styles.recTimerText, { color: colors.mutedForeground }]}>
                        Record नहीं हुआ
                      </Text>
                    </>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.recBtn, { backgroundColor: isRecording ? '#dc2626' : voiceDone ? '#16a34a50' : '#2563eb' }]}
                  onPress={isRecording ? stopRecording : voiceDone ? undefined : startRecording}
                  disabled={voiceDone && !isRecording}
                  activeOpacity={0.8}
                >
                  <Feather name={isRecording ? 'square' : 'mic'} size={16} color="#fff" />
                  <Text style={styles.recBtnText}>
                    {isRecording ? 'Stop' : voiceDone ? 'हो गया ✓' : 'Start Recording'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: 20 }]}>3. नोट (Optional)</Text>
              <TextInput
                style={[styles.locationInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.card }]}
                placeholder="जैसे: माल ठीक हालत में डिलीवर हुआ..."
                placeholderTextColor={colors.mutedForeground}
                value={deliveryNotes}
                onChangeText={setDeliveryNotes}
                multiline
                numberOfLines={2}
              />

              <TouchableOpacity
                style={[styles.saveBtn, {
                  backgroundColor: (gpsCoords && voiceDone && !savingDelivery) ? '#16a34a' : '#94a3b8',
                  opacity: (gpsCoords && voiceDone && !savingDelivery) ? 1 : 0.6,
                }]}
                onPress={handleSaveDelivery}
                activeOpacity={0.8}
                disabled={!gpsCoords || !voiceDone || savingDelivery}
              >
                {savingDelivery ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="check-circle" size={18} color="#fff" />
                )}
                <Text style={styles.saveBtnText}>
                  {savingDelivery ? 'सेव हो रहा है...' : 'डिलीवरी पूर्ण करें'}
                </Text>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />
      <ComplaintModal
        visible={showComplaint}
        onClose={() => { setShowComplaint(false); setComplainTrip(null); }}
        againstId={complainTrip?.confirmedBy}
        againstName={complainTrip?.confirmedByName || 'व्यापारी'}
        againstRole="vyapari"
        tripId={complainTrip?.id}
        bookingId={complainTrip?.id}
        hasGST={!!vyaparis.find(v => v.id === complainTrip?.confirmedBy)?.gstNumber}
      />
      <FraudAlertModal
        visible={!!fraudTrip}
        onClose={() => setFraudTrip(null)}
        bookingId={fraudTrip?.id}
        targetName={fraudTrip?.confirmedByName || 'व्यापारी'}
        targetId={fraudTrip?.confirmedBy}
        targetRole="vyapari"
        hasGST={!!vyaparis.find(v => v.id === fraudTrip?.confirmedBy)?.gstNumber}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  filters: { paddingVertical: 8, borderBottomWidth: 1 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  filterText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  pendingBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: -6, marginBottom: 6 },
  pendingIcon: { fontSize: 20 },
  pendingLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  pendingGps: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  statusBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, borderWidth: 1, marginTop: -6, marginBottom: 6 },
  statusBannerIcon: { fontSize: 20 },
  statusBannerLabel: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  statusBannerLoc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  tripActions: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1.5 },
  actionBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  statusSheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
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
  mandatoryNote: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', padding: 12, borderRadius: 10, borderWidth: 1 },
  mandatoryNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  gpsBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 12, borderWidth: 1.5 },
  gpsBtnText: { fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  gpsResult: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 4 },
  gpsResultText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  voiceCard: { borderRadius: 12, borderWidth: 1.5, padding: 14, gap: 12 },
  voiceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#dc2626' },
  recTimerText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  recBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 12 },
  recBtnText: { color: '#fff', fontSize: 14, fontFamily: 'Inter_700Bold' },
});
