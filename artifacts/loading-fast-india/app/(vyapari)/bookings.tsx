import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { Bid, VyapariTrip } from '@/lib/types';
const ADVANCE_UPI = 'maksudsaiyed888@oksbi';
const ADVANCE_UPI_NAME = 'Loading%20Fast%20India';

export default function BookingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getVyapariOwnTrips, refreshAll, getTripBids, acceptBid, processAdvance20, generateStartOtp, generateEndOtp, updateVyapariTrip } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'active' | 'completed'>('active');
  const [advanceModal, setAdvanceModal] = useState(false);
  const [advanceTrip, setAdvanceTrip] = useState<VyapariTrip | null>(null);
  const [advanceUtr, setAdvanceUtr] = useState('');
  const [processingAdvance, setProcessingAdvance] = useState(false);
  const [otpModal, setOtpModal] = useState(false);
  const [otpTrip, setOtpTrip] = useState<VyapariTrip | null>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpType, setOtpType] = useState<'start' | 'end'>('start');
  const [delivery30Modal, setDelivery30Modal] = useState(false);
  const [delivery30Trip, setDelivery30Trip] = useState<VyapariTrip | null>(null);
  const [delivery30Utr, setDelivery30Utr] = useState('');
  const [processingDelivery30, setProcessingDelivery30] = useState(false);

  const myTrips = user ? getVyapariOwnTrips(user.id) : [];
  const activeTrips = myTrips.filter(t => !['completed', 'cancelled'].includes(t.status));
  const completedTrips = myTrips.filter(t => t.status === 'completed');
  const displayTrips = tab === 'active' ? activeTrips : completedTrips;

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const handleAcceptBid = (trip: VyapariTrip, bid: Bid) => {
    Alert.alert(
      'Bid Accept करें?',
      `Driver: ${bid.driverName}\nBid Amount: ₹${bid.bidAmount.toLocaleString('en-IN')}\n\nAccept करने पर 20% advance (₹${Math.round(bid.bidAmount * 0.20).toLocaleString('en-IN')}) देना होगा।`,
      [
        { text: 'नहीं', style: 'cancel' },
        {
          text: 'हाँ, Accept करें', onPress: async () => {
            await acceptBid(trip.id, bid);
            Alert.alert('✅ Bid Accepted!', `अब ₹${Math.round(bid.bidAmount * 0.20).toLocaleString('en-IN')} (20%) advance pay करें।`);
          }
        },
      ]
    );
  };

  const openAdvanceModal = (trip: VyapariTrip) => {
    setAdvanceTrip(trip);
    setAdvanceUtr('');
    setAdvanceModal(true);
  };

  const handleAdvancePay = async () => {
    if (!advanceTrip || !advanceTrip.acceptedBidAmount || !advanceTrip.acceptedByDriverId) return;
    if (!advanceUtr.trim()) { Alert.alert('UTR जरूरी है', 'Payment का UTR/Transaction ID दर्ज करें'); return; }
    setProcessingAdvance(true);
    try {
      await processAdvance20(advanceTrip.id, advanceUtr, advanceTrip.acceptedBidAmount, advanceTrip.acceptedByDriverId);
      setAdvanceModal(false);
      Alert.alert('✅ Payment Confirmed!', `Driver का contact reveal हो गया!\n\nDriver: ${advanceTrip.acceptedByDriverName}\nPhone: ${advanceTrip.acceptedByDriverPhone}`);
    } finally {
      setProcessingAdvance(false);
    }
  };

  const handleGenerateOtp = async (trip: VyapariTrip, type: 'start' | 'end') => {
    if (type === 'end') {
      setDelivery30Trip(trip);
      setDelivery30Utr('');
      setDelivery30Modal(true);
      return;
    }
    const otp = await generateStartOtp(trip.id);
    setOtpTrip(trip);
    setGeneratedOtp(otp);
    setOtpType('start');
    setOtpModal(true);
  };

  const handleDelivery30Confirm = async () => {
    if (!delivery30Trip) return;
    if (!delivery30Utr.trim()) { Alert.alert('UTR जरूरी है', '30% payment का UTR/Transaction ID दर्ज करें।'); return; }
    setProcessingDelivery30(true);
    try {
      await updateVyapariTrip(delivery30Trip.id, {
        deliveryUTR30: delivery30Utr.trim().toUpperCase(),
        deliveryUTR30At: new Date().toISOString(),
      });
      const otp = await generateEndOtp(delivery30Trip.id);
      setDelivery30Modal(false);
      setOtpTrip(delivery30Trip);
      setGeneratedOtp(otp);
      setOtpType('end');
      setOtpModal(true);
    } finally {
      setProcessingDelivery30(false);
    }
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी Load Posts</Text>
        <Text style={styles.sub}>{myTrips.length} कुल posts</Text>
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, { backgroundColor: tab === 'active' ? '#fff' : 'transparent' }]} onPress={() => setTab('active')}>
            <Text style={[styles.tabText, { color: tab === 'active' ? colors.navy : '#fff' }]}>Active ({activeTrips.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, { backgroundColor: tab === 'completed' ? '#fff' : 'transparent' }]} onPress={() => setTab('completed')}>
            <Text style={[styles.tabText, { color: tab === 'completed' ? colors.navy : '#fff' }]}>Completed ({completedTrips.length})</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.navy]} />}
      >
        {/* LFI Trust Card — हर बार visible */}
        <View style={[styles.trustCard, { backgroundColor: '#FFF8E1', borderColor: '#F59E0B' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Text style={{ fontSize: 18 }}>🛡️</Text>
            <Text style={[styles.trustTitle, { color: '#78350F' }]}>LFI आपकी सुरक्षा करता है</Text>
          </View>
          <View style={styles.trustRow}>
            <Text style={styles.trustIcon}>💰</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustHead, { color: '#92400E' }]}>20% Advance — Driver की guarantee</Text>
              <Text style={[styles.trustSub, { color: '#B45309' }]}>
                यह पैसा LFI के पास सुरक्षित रहता है। Driver बीच में job छोड़े तो वापस मिलेगा।
              </Text>
            </View>
          </View>
          <View style={styles.trustRow}>
            <Text style={styles.trustIcon}>✅</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.trustHead, { color: '#92400E' }]}>50% Loading पर + 30% Delivery पर — सीधे Driver को</Text>
              <Text style={[styles.trustSub, { color: '#B45309' }]}>
                यह cash आप driver को देते हैं — LFI को नहीं। LFI का charge सिर्फ 2% है।
              </Text>
            </View>
          </View>
          <View style={[styles.trustNote, { backgroundColor: '#FEF3C7', borderColor: '#D97706' }]}>
            <Text style={[styles.trustNoteText, { color: '#78350F' }]}>
              💡 LFI सिर्फ 2% लेता है — बाकी 98% किराया पूरा आपका और Driver का
            </Text>
          </View>
        </View>

        {displayTrips.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="package" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{tab === 'active' ? 'कोई active trip नहीं' : 'कोई completed trip नहीं'}</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Post Trip से load post करें</Text>
          </View>
        ) : (
          displayTrips.map((trip) => {
            const bids = getTripBids(trip.id);
            const pendingBids = bids.filter(b => b.status === 'pending');
            const advance20 = trip.acceptedBidAmount ? Math.round(trip.acceptedBidAmount * 0.20) : 0;
            const adv50 = trip.acceptedBidAmount ? Math.round(trip.acceptedBidAmount * 0.50) : 0;
            const adv30 = trip.acceptedBidAmount ? Math.round(trip.acceptedBidAmount * 0.30) : 0;
            const statusColor = trip.status === 'open' ? colors.primary : trip.status === 'advance_pending' ? '#f59e0b' : trip.status === 'accepted' ? '#16a34a' : trip.status === 'loading' ? '#2563eb' : trip.status === 'on_way' ? '#7C3AED' : '#6b7280';
            const statusLabel = trip.status === 'open' ? '📦 Bids आ रही हैं' : trip.status === 'low_priority' ? '⬇️ Low Priority' : trip.status === 'advance_pending' ? '💰 Advance Pay करें' : trip.status === 'accepted' ? '✅ Driver Ready' : trip.status === 'loading' ? '📦 Loading' : trip.status === 'on_way' ? '🚛 On the Way' : '✅ Completed';

            return (
              <View key={trip.id} style={[styles.tripCard, { backgroundColor: colors.card, borderColor: statusColor + '40' }]}>
                {/* Header */}
                <View style={styles.cardRow}>
                  <View style={[styles.badge, { backgroundColor: statusColor + '18' }]}>
                    <Text style={[styles.badgeText, { color: statusColor }]}>{statusLabel}</Text>
                  </View>
                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{trip.tripDate}</Text>
                </View>

                <Text style={[styles.route, { color: colors.foreground }]}>{trip.fromCity} → {trip.toCity}</Text>
                <Text style={[styles.meta, { color: colors.mutedForeground }]}>{trip.goodsCategory} • {trip.weightTons} टन • {trip.vehicleTypePref}</Text>

                {/* Bids Section — show when open/low_priority */}
                {(trip.status === 'open' || trip.status === 'low_priority') && (
                  <View style={[styles.bidsSection, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <Text style={[styles.bidsSectionTitle, { color: colors.foreground }]}>
                      🏷️ Bids ({bids.length}) {pendingBids.length > 0 && `— ${pendingBids.length} नई`}
                    </Text>
                    {bids.length === 0 ? (
                      <Text style={[styles.noBids, { color: colors.mutedForeground }]}>अभी कोई bid नहीं आई</Text>
                    ) : (
                      bids.map((bid) => (
                        <View key={bid.id} style={[styles.bidRow, { borderBottomColor: colors.border }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.bidDriver, { color: colors.foreground }]}>{bid.driverName}</Text>
                            <Text style={[styles.bidVehicle, { color: colors.mutedForeground }]}>{bid.vehicleTypeName} {bid.vehicleNumber ? `• ${bid.vehicleNumber}` : ''}</Text>
                          </View>
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={[styles.bidAmount, { color: colors.primary }]}>₹{bid.bidAmount.toLocaleString('en-IN')}</Text>
                            {bid.status === 'pending' && (
                              <TouchableOpacity
                                style={[styles.acceptBidBtn, { backgroundColor: '#16a34a' }]}
                                onPress={() => handleAcceptBid(trip, bid)}
                              >
                                <Text style={styles.acceptBidText}>Accept</Text>
                              </TouchableOpacity>
                            )}
                            {bid.status === 'accepted' && <Text style={{ color: '#16a34a', fontSize: 11, fontFamily: 'Inter_700Bold' }}>✅ Accepted</Text>}
                            {bid.status === 'rejected' && <Text style={{ color: '#dc2626', fontSize: 11 }}>Rejected</Text>}
                          </View>
                        </View>
                      ))
                    )}
                  </View>
                )}

                {/* Advance Pending — pay 20% */}
                {trip.status === 'advance_pending' && trip.acceptedBidAmount && (
                  <View style={[styles.advanceBox, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                    <Text style={[styles.advanceTitle, { color: '#B71C1C' }]}>💰 20% Advance Pay करें</Text>
                    <Text style={[styles.advanceSub, { color: '#BF360C' }]}>
                      Driver: {trip.acceptedByDriverName}{'\n'}
                      Total Fare: ₹{trip.acceptedBidAmount.toLocaleString('en-IN')}{'\n'}
                      20% Advance: <Text style={{ fontFamily: 'Inter_700Bold' }}>₹{advance20.toLocaleString('en-IN')}</Text>{'\n'}
                      (2% admin + 18% driver wallet locked)
                    </Text>
                    <TouchableOpacity
                      style={[styles.upiBtn, { backgroundColor: '#1B5E20' }]}
                      onPress={() => Linking.openURL(`upi://pay?pa=${ADVANCE_UPI}&pn=${ADVANCE_UPI_NAME}&am=${advance20}&cu=INR&tn=LFI+Advance+${trip.id.slice(0, 8)}`)}
                    >
                      <Feather name="smartphone" size={14} color="#fff" />
                      <Text style={styles.upiBtnText}>UPI से ₹{advance20.toLocaleString('en-IN')} भेजें</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.utrBtn, { borderColor: '#2E7D32' }]} onPress={() => openAdvanceModal(trip)}>
                      <Text style={{ color: '#2E7D32', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>✅ भेज दिया — UTR दर्ज करें</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Driver Details — after advance paid */}
                {trip.driverDetailsRevealed && trip.acceptedByDriverName && (
                  <View style={[styles.driverReveal, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                    <Text style={[styles.driverRevealTitle, { color: '#1B5E20' }]}>✅ Driver Contact Unlocked</Text>
                    <Text style={[styles.driverRevealInfo, { color: '#2E7D32' }]}>👤 {trip.acceptedByDriverName}</Text>
                    <Text style={[styles.driverRevealInfo, { color: '#2E7D32' }]}>📞 {trip.acceptedByDriverPhone}</Text>
                    <Text style={[styles.walletInfo, { color: '#1565C0' }]}>
                      🔒 Driver Wallet: ₹{(trip.driverWalletAmount || 0).toLocaleString('en-IN')} (locked until delivery){'\n'}
                      💰 Loading Cash (50%): ₹{adv50.toLocaleString('en-IN')}{'\n'}
                      💰 Delivery Cash (30%): ₹{adv30.toLocaleString('en-IN')}
                    </Text>
                    <View style={styles.contactRow}>
                      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: colors.primary }]} onPress={() => Linking.openURL(`tel:${trip.acceptedByDriverPhone}`)}>
                        <Feather name="phone" size={13} color="#fff" /><Text style={styles.contactBtnText}>Call</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' }]} onPress={() => Linking.openURL(`whatsapp://send?phone=91${trip.acceptedByDriverPhone}`)}>
                        <Feather name="message-circle" size={13} color="#fff" /><Text style={styles.contactBtnText}>WhatsApp</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* OTP Actions */}
                {trip.status === 'accepted' && (
                  <TouchableOpacity style={[styles.otpBtn, { backgroundColor: '#2563eb' }]} onPress={() => handleGenerateOtp(trip, 'start')}>
                    <Feather name="key" size={14} color="#fff" />
                    <Text style={styles.otpBtnText}>Start Trip OTP Generate करें (Merchant देगा Driver को)</Text>
                  </TouchableOpacity>
                )}

                {trip.status === 'loading' && (
                  <View style={[styles.infoBox, { backgroundColor: '#E3F2FD', borderColor: '#1976D2' }]}>
                    <Text style={{ color: '#1565C0', fontSize: 13, fontFamily: 'Inter_700Bold' }}>📦 Loading हो रही है</Text>
                    <Text style={{ color: '#1976D2', fontSize: 12, marginTop: 4 }}>Driver ने Start OTP verify किया। ₹{adv50.toLocaleString('en-IN')} (50%) cash दें।</Text>
                  </View>
                )}

                {trip.status === 'on_way' && (
                  <>
                    <TouchableOpacity style={[styles.otpBtn, { backgroundColor: '#7C3AED' }]} onPress={() => handleGenerateOtp(trip, 'end')}>
                      <Feather name="check-circle" size={14} color="#fff" />
                      <Text style={styles.otpBtnText}>Delivery OTP Generate करें (Receiver देगा Driver को)</Text>
                    </TouchableOpacity>
                    {trip.driverLat && trip.driverLng ? (
                      <View style={{ marginTop: 6 }}>
                        <TouchableOpacity
                          style={[styles.otpBtn, { backgroundColor: '#0f766e' }]}
                          onPress={() => Linking.openURL(`https://maps.google.com/?q=${trip.driverLat},${trip.driverLng}`)}
                        >
                          <Feather name="map-pin" size={14} color="#fff" />
                          <Text style={styles.otpBtnText}>🗺️ Driver की Live Location देखें (Google Maps)</Text>
                        </TouchableOpacity>
                        {trip.driverLocationAt && (
                          <Text style={{ fontSize: 11, color: '#6b7280', fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 3 }}>
                            अपडेट: {new Date(trip.driverLocationAt).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        )}
                      </View>
                    ) : (
                      <View style={[styles.infoBox, { backgroundColor: '#FFF8E1', borderColor: '#F59E0B', marginTop: 6 }]}>
                        <Text style={{ color: '#92400E', fontSize: 12, fontFamily: 'Inter_400Regular' }}>
                          📍 Driver की location अभी available नहीं — जब driver रास्ते में हो तो automatically update होगी
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {trip.status === 'completed' && (
                  <View style={[styles.infoBox, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                    <Text style={{ color: '#1B5E20', fontSize: 13, fontFamily: 'Inter_700Bold' }}>✅ Trip Completed!</Text>
                    <Text style={{ color: '#388E3C', fontSize: 12, marginTop: 4 }}>Driver wallet ₹{(trip.driverWalletAmount || 0).toLocaleString('en-IN')} unlock हो गया।</Text>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Advance UTR Modal */}
      <Modal visible={advanceModal} transparent animationType="slide" onRequestClose={() => setAdvanceModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>Payment UTR दर्ज करें</Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16 }}>
              ₹{advanceTrip?.acceptedBidAmount ? Math.round(advanceTrip.acceptedBidAmount * 0.20).toLocaleString('en-IN') : ''} का UTR/Transaction ID
            </Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.foreground, backgroundColor: colors.card, marginBottom: 12, fontFamily: 'Inter_500Medium' }}
              placeholder="UTR123456789"
              placeholderTextColor={colors.mutedForeground}
              value={advanceUtr}
              onChangeText={setAdvanceUtr}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={{ backgroundColor: '#1B5E20', borderRadius: 10, padding: 14, alignItems: 'center', opacity: processingAdvance ? 0.6 : 1 }}
              onPress={handleAdvancePay}
              disabled={processingAdvance}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' }}>{processingAdvance ? 'Process हो रहा है...' : 'Confirm Payment'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setAdvanceModal(false)}>
              <Text style={{ color: colors.mutedForeground }}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 30% Delivery Payment UTR Modal */}
      <Modal visible={delivery30Modal} transparent animationType="slide" onRequestClose={() => { if (!processingDelivery30) setDelivery30Modal(false); }}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontSize: 17, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>
              💰 30% Delivery Payment Proof
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 6 }}>
              Delivery OTP से पहले 30% payment का proof दें
            </Text>

            {delivery30Trip?.acceptedBidAmount ? (
              <View style={{ backgroundColor: '#FFF8E1', borderRadius: 10, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#F59E0B' }}>
                <Text style={{ color: '#92400E', fontFamily: 'Inter_700Bold', fontSize: 14 }}>
                  30% Amount: ₹{Math.round(delivery30Trip.acceptedBidAmount * 0.30).toLocaleString('en-IN')}
                </Text>
                <Text style={{ color: '#92400E', fontSize: 12, marginTop: 4, fontFamily: 'Inter_400Regular' }}>
                  यह amount Driver को cash में दें और UTR/reference नीचे दर्ज करें
                </Text>
              </View>
            ) : null}

            <Text style={{ fontSize: 13, fontFamily: 'Inter_600SemiBold', color: colors.foreground, marginBottom: 6 }}>
              Payment Reference / UTR Number
            </Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 15, color: colors.foreground, backgroundColor: colors.card, marginBottom: 14, fontFamily: 'Inter_500Medium' }}
              placeholder="जैसे: CASH300000 या UTR123456"
              placeholderTextColor={colors.mutedForeground}
              value={delivery30Utr}
              onChangeText={setDelivery30Utr}
              autoCapitalize="characters"
            />

            <View style={{ backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, marginBottom: 14, flexDirection: 'row', gap: 8 }}>
              <Text style={{ fontSize: 13 }}>🔒</Text>
              <Text style={{ flex: 1, fontSize: 12, color: '#1B5E20', fontFamily: 'Inter_400Regular', lineHeight: 18 }}>
                UTR दर्ज करने के बाद Delivery OTP generate होगा। Driver को OTP तभी दें जब 30% cash मिल जाए।
              </Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#7C3AED', borderRadius: 10, padding: 14, alignItems: 'center', opacity: processingDelivery30 ? 0.6 : 1 }}
              onPress={handleDelivery30Confirm}
              disabled={processingDelivery30}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' }}>
                {processingDelivery30 ? 'Process हो रहा है...' : '✅ Confirm करें — Delivery OTP Generate करें'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => { if (!processingDelivery30) setDelivery30Modal(false); }}>
              <Text style={{ color: colors.mutedForeground }}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* OTP Display Modal */}
      <Modal visible={otpModal} transparent animationType="fade" onRequestClose={() => setOtpModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.background, borderRadius: 20, padding: 24, width: '100%', alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>
              {otpType === 'start' ? '🔑 Loading शुरू करने का OTP' : '🎯 Delivery का OTP'}
            </Text>

            {/* OTP Number — Big & Clear */}
            <View style={{ backgroundColor: otpType === 'start' ? '#1B5E20' : '#4C1D95', borderRadius: 14, paddingHorizontal: 32, paddingVertical: 18, marginVertical: 16, width: '100%', alignItems: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 4 }}>
                {otpType === 'start' ? 'यह OTP Driver को बोलें' : 'यह OTP Receiver को SMS गया है'}
              </Text>
              <Text style={{ color: '#fff', fontSize: 40, fontFamily: 'Inter_700Bold', letterSpacing: 10 }}>{generatedOtp}</Text>
            </View>

            {/* Guide Box */}
            <View style={{ backgroundColor: otpType === 'start' ? '#F0FDF4' : '#FAF5FF', borderRadius: 12, padding: 12, marginBottom: 16, width: '100%', borderWidth: 1, borderColor: otpType === 'start' ? '#BBF7D0' : '#E9D5FF' }}>
              <Text style={{ fontSize: 12, fontFamily: 'Inter_700Bold', color: otpType === 'start' ? '#15803D' : '#7C3AED', marginBottom: 6 }}>
                📋 आगे क्या करें:
              </Text>
              {otpType === 'start' ? (
                <>
                  <Text style={{ fontSize: 12, color: '#166534', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>① ऊपर दिखा <Text style={{ fontFamily: 'Inter_700Bold' }}>6 अंकों का OTP</Text> याद करें या screen दिखाएं</Text>
                  <Text style={{ fontSize: 12, color: '#166534', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>② Driver से कहें — <Text style={{ fontFamily: 'Inter_700Bold' }}>"यह OTP अपनी app में डालो"</Text></Text>
                  <Text style={{ fontSize: 12, color: '#166534', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>③ Driver verify करेगा → Loading शुरू होगी ✅</Text>
                </>
              ) : (
                <>
                  <Text style={{ fontSize: 12, color: '#6D28D9', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>① Receiver के phone पर <Text style={{ fontFamily: 'Inter_700Bold' }}>SMS में OTP गया है</Text></Text>
                  <Text style={{ fontSize: 12, color: '#6D28D9', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>② Receiver वो OTP Driver को बोलेगा</Text>
                  <Text style={{ fontSize: 12, color: '#6D28D9', fontFamily: 'Inter_400Regular', lineHeight: 20 }}>③ Driver app में डालेगा → Delivery complete ✅</Text>
                  <Text style={{ fontSize: 12, color: '#6D28D9', fontFamily: 'Inter_700Bold', lineHeight: 20, marginTop: 4 }}>⚠️ Driver को OTP खुद मत बताएं — Receiver को बताने दें</Text>
                </>
              )}
            </View>

            <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 12, width: '100%', alignItems: 'center' }} onPress={() => setOtpModal(false)}>
              <Text style={{ color: '#fff', fontFamily: 'Inter_700Bold' }}>समझ गया — बंद करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tab: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7 },
  tabText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tripCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  dateText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  route: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  bidsSection: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10 },
  bidsSectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  noBids: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 8 },
  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  bidDriver: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  bidVehicle: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  bidAmount: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  acceptBidBtn: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 5, marginTop: 4 },
  acceptBidText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  advanceBox: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 10, gap: 6 },
  advanceTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  advanceSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  upiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 11, borderRadius: 8, justifyContent: 'center' },
  upiBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  utrBtn: { borderWidth: 1.5, borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 4 },
  driverReveal: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 10, gap: 4 },
  driverRevealTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  driverRevealInfo: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  walletInfo: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18, marginTop: 6 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1, justifyContent: 'center', padding: 9, borderRadius: 8 },
  contactBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  otpBtn: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 11, borderRadius: 9, justifyContent: 'center', marginBottom: 8 },
  otpBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold', flex: 1 },
  infoBox: { borderRadius: 9, borderWidth: 1.5, padding: 10, marginBottom: 8 },
  trustCard: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 16 },
  trustTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  trustIcon: { fontSize: 16, lineHeight: 22 },
  trustHead: { fontSize: 12.5, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  trustSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  trustNote: { borderRadius: 8, borderWidth: 1, padding: 9, marginTop: 4 },
  trustNoteText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', lineHeight: 18 },
});
