import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import * as Location from 'expo-location';
import { INDIA_STATES, GOODS_CATEGORIES, VEHICLE_TYPES } from '@/lib/types';
import { generateId } from '@/lib/utils';
import { sendZoneNotifications } from '@/lib/notifications';

type Colors = ReturnType<typeof useColors>;

const LOW_RATE_THRESHOLD = 300;

const isLowRate = (ratePerTon: number) => ratePerTon === 0 || ratePerTon < LOW_RATE_THRESHOLD;

export default function VyapariPostTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getVyapariOwnTrips, addVyapariTrip, updateVyapariTrip, drivers, addAdvanceRequest, getVyapariLatestAdvance } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);
  const [submittingRequest, setSubmittingRequest] = useState(false);

  const latestAdvance = user ? getVyapariLatestAdvance(user.id) : undefined;

  const [form, setForm] = useState({
    fromCity: '', fromState: '', toCity: '', toState: '',
    goodsCategory: '', weightTons: '', ratePerTon: '',
    tripDate: '', vehicleTypePref: '', description: '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const [editTrip, setEditTrip] = useState<ReturnType<typeof getVyapariOwnTrips>[0] | null>(null);
  const [editForm, setEditForm] = useState({ ratePerTon: '', weightTons: '', tripDate: '', description: '' });
  const [saving, setSaving] = useState(false);

  const openEdit = (trip: ReturnType<typeof getVyapariOwnTrips>[0]) => {
    setEditTrip(trip);
    setEditForm({
      ratePerTon: trip.ratePerTon > 0 ? String(trip.ratePerTon) : '',
      weightTons: String(trip.weightTons),
      tripDate: trip.tripDate,
      description: trip.description || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editTrip) return;
    const rate = editForm.ratePerTon.trim() ? Number(editForm.ratePerTon) : 0;
    const weight = Number(editForm.weightTons);
    if (!editForm.weightTons.trim() || isNaN(weight) || weight <= 0) {
      Alert.alert('त्रुटि', 'वज़न सही संख्या डालें'); return;
    }
    if (!editForm.tripDate.trim()) { Alert.alert('त्रुटि', 'तारीख जरूरी है'); return; }
    setSaving(true);
    try {
      await updateVyapariTrip(editTrip.id, {
        ratePerTon: isNaN(rate) ? 0 : rate,
        weightTons: weight,
        tripDate: editForm.tripDate.trim(),
        description: editForm.description.trim(),
      });
      setEditTrip(null);
      Alert.alert('✅ ट्रिप अपडेट हुई!', 'आपकी ट्रिप की जानकारी बदल दी गई।');
    } finally {
      setSaving(false);
    }
  };

  const myPostedTrips = user ? getVyapariOwnTrips(user.id) : [];
  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const validateForm = (): boolean => {
    if (!form.fromCity.trim()) { Alert.alert('त्रुटि', 'कहाँ से — शहर का नाम जरूरी है'); return false; }
    if (!form.fromState.trim()) { Alert.alert('त्रुटि', 'कहाँ से — राज्य जरूरी है'); return false; }
    if (!form.toCity.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — शहर का नाम जरूरी है'); return false; }
    if (!form.toState.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — राज्य जरूरी है'); return false; }
    if (!form.goodsCategory.trim()) { Alert.alert('त्रुटि', 'माल का प्रकार जरूरी है'); return false; }
    if (!form.weightTons.trim() || isNaN(Number(form.weightTons)) || Number(form.weightTons) <= 0) { Alert.alert('त्रुटि', 'वज़न (टन में) 0 से अधिक सही संख्या डालें'); return false; }
    if (form.ratePerTon.trim() && (isNaN(Number(form.ratePerTon)) || Number(form.ratePerTon) < 0)) { Alert.alert('त्रुटि', 'रेट प्रति टन सही संख्या डालें'); return false; }
    if (!form.tripDate.trim()) { Alert.alert('त्रुटि', 'तारीख जरूरी है'); return false; }
    return true;
  };

  const handleSubmitAdvanceRequest = async () => {
    if (!validateForm()) return;
    setSubmittingRequest(true);
    try {
      await addAdvanceRequest({
        id: generateId(),
        vyapariId: user!.id,
        vyapariName: currentVyapari?.name || user!.name,
        vyapariPhone: user!.phone,
        amount: 1000,
        status: 'pending',
        createdAt: new Date().toISOString(),
        tripData: {
          fromCity: form.fromCity.trim(),
          fromState: form.fromState.trim(),
          toCity: form.toCity.trim(),
          toState: form.toState.trim(),
          goodsCategory: form.goodsCategory.trim(),
          weightTons: Number(form.weightTons),
          vehicleTypePref: form.vehicleTypePref,
          ratePerTon: form.ratePerTon ? Number(form.ratePerTon) : 0,
          tripDate: form.tripDate.trim(),
          description: form.description.trim(),
        },
      });
    } catch {
      Alert.alert('त्रुटि', 'Request submit नहीं हो पाई। Internet connection चेक करें।');
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handlePost = async () => {
    setPosting(true);
    try {
      await addVyapariTrip({
        id: generateId(),
        vyapariId: user!.id,
        vyapariName: currentVyapari?.name || user!.name,
        vyapariPhone: user!.phone,
        fromCity: form.fromCity.trim(),
        fromState: form.fromState.trim(),
        toCity: form.toCity.trim(),
        toState: form.toState.trim(),
        goodsCategory: form.goodsCategory.trim(),
        weightTons: Number(form.weightTons),
        vehicleTypePref: form.vehicleTypePref,
        ratePerTon: form.ratePerTon ? Number(form.ratePerTon) : 0,
        tripDate: form.tripDate.trim(),
        description: form.description.trim(),
        status: 'open',
        createdAt: new Date().toISOString(),
        paymentType: 'sender',
      });
      let fromLat = 23.0;
      let fromLon = 72.5;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          fromLat = loc.coords.latitude;
          fromLon = loc.coords.longitude;
        }
      } catch {}
      sendZoneNotifications(
        drivers,
        fromLat,
        fromLon,
        form.vehicleTypePref,
        form.fromCity.trim(),
        form.toCity.trim(),
        form.goodsCategory.trim(),
        currentVyapari?.name || user!.name,
      );
      setForm({ fromCity: '', fromState: '', toCity: '', toState: '', goodsCategory: '', weightTons: '', ratePerTon: '', tripDate: '', vehicleTypePref: '', description: '' });
      setShowModal(false);
      Alert.alert('✅ ट्रिप पोस्ट हुई!', 'आपकी ट्रिप सफलतापूर्वक पोस्ट हो गई। सभी ड्राइवरों को notification भेजी गई।');
    } finally {
      setPosting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>ट्रिप डालें</Text>
        <Text style={styles.sub}>{myPostedTrips.length} ट्रिप पोस्ट • माल की जरूरत डालें</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>
        <TouchableOpacity
          style={[styles.addBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '50' }]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.addBannerTitle, { color: colors.primary }]}>नई ट्रिप डालें</Text>
            <Text style={[styles.addBannerSub, { color: colors.mutedForeground }]}>माल का रूट, वज़न और गाड़ी का प्रकार भरें</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>

        {myPostedTrips.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="upload" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>अभी कोई ट्रिप नहीं है</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>ऊपर बटन से अपना माल डालें</Text>
          </View>
        ) : (
          myPostedTrips.map((t) => (
            <View key={t.id} style={[styles.tripCard, {
              backgroundColor: colors.card,
              borderColor: t.status === 'open' && isLowRate(t.ratePerTon) ? '#f97316' + '60' : colors.border,
            }]}>
              <View style={styles.tripCardRow}>
                <View style={[styles.statusBadge, {
                  backgroundColor: t.status === 'open' ? colors.success + '20' :
                    t.status === 'accepted' ? colors.primary + '20' : colors.muted
                }]}>
                  <Text style={[styles.statusText, {
                    color: t.status === 'open' ? colors.success :
                      t.status === 'accepted' ? colors.primary : colors.mutedForeground
                  }]}>
                    {t.status === 'open' ? '🟢 Open' : t.status === 'accepted' ? '✅ Accept' : '❌ Cancel'}
                  </Text>
                </View>
                <Text style={[styles.tripDate, { color: colors.mutedForeground }]}>{t.tripDate}</Text>
              </View>
              <Text style={[styles.tripRoute, { color: colors.foreground }]}>
                {t.fromCity} ({t.fromState}) → {t.toCity} ({t.toState})
              </Text>
              <Text style={[styles.tripMeta, { color: colors.mutedForeground }]}>
                {t.goodsCategory} • {t.weightTons} टन
                {t.ratePerTon > 0 ? ` • ₹${t.ratePerTon}/टन` : ' • भाड़ा नहीं दिया'}
                {t.vehicleTypePref ? ` • ${VEHICLE_TYPES.find(v => v.id === t.vehicleTypePref)?.name ?? t.vehicleTypePref}` : ''}
              </Text>
              {t.description ? (
                <Text style={[styles.tripDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{t.description}</Text>
              ) : null}

              {/* 💰 Payment Badge — always sender */}
              <View style={[styles.payBadge, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                <Text style={[styles.payBadgeText, { color: '#E65100' }]}>💰 आप किराया देंगे (Sender Pay)</Text>
              </View>

              {/* ⚠️ Low Rate Warning */}
              {t.status === 'open' && isLowRate(t.ratePerTon) && (
                <View style={[styles.lowRateBanner, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '60' }]}>
                  <Feather name="alert-triangle" size={13} color="#f97316" />
                  <Text style={[styles.lowRateText, { color: '#c2410c' }]}>
                    {t.ratePerTon === 0
                      ? '⚠️ भाड़ा नहीं दिया — ड्राइवर नहीं आएंगे! भाड़ा बढ़ाएं।'
                      : `⚠️ ₹${t.ratePerTon}/टन बहुत कम है — ₹${LOW_RATE_THRESHOLD}+ डालने पर ड्राइवर जल्दी आएंगे।`}
                  </Text>
                </View>
              )}

              {/* Action Buttons Row */}
              {t.status === 'open' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.editBtn, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                    onPress={() => openEdit(t)}
                  >
                    <Feather name="edit-2" size={13} color={colors.primary} />
                    <Text style={[styles.editBtnText, { color: colors.primary }]}>
                      {isLowRate(t.ratePerTon) ? 'भाड़ा बढ़ाएं / Edit' : 'Edit करें'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setShowModal(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={26} color="#fff" />
      </TouchableOpacity>

      {/* ── Edit Trip Modal ── */}
      <Modal visible={!!editTrip} transparent animationType="slide" onRequestClose={() => setEditTrip(null)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>✏️ ट्रिप Edit करें</Text>
              <TouchableOpacity onPress={() => setEditTrip(null)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            {editTrip && (
              <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <View style={[styles.editRouteBadge, { backgroundColor: colors.navy + '12', borderColor: colors.navy + '30' }]}>
                  <Feather name="map-pin" size={14} color={colors.navy} />
                  <Text style={[styles.editRouteText, { color: colors.navy }]}>
                    {editTrip.fromCity} → {editTrip.toCity} • {editTrip.goodsCategory}
                  </Text>
                </View>

                <Input
                  label="भाड़ा / रेट प्रति टन (₹)"
                  placeholder="जैसे: 1500"
                  value={editForm.ratePerTon}
                  onChangeText={(v) => setEditForm(p => ({ ...p, ratePerTon: v }))}
                  keyboardType="numeric"
                  icon="dollar-sign"
                />
                {(editForm.ratePerTon === '' || isLowRate(Number(editForm.ratePerTon))) && (
                  <View style={[styles.rateHint, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '50', marginTop: -6 }]}>
                    <Feather name="alert-triangle" size={12} color="#f97316" />
                    <Text style={[styles.rateHintText, { color: '#c2410c' }]}>
                      ₹{LOW_RATE_THRESHOLD}+ डालने पर ड्राइवर जल्दी मिलेंगे
                    </Text>
                  </View>
                )}

                <Input
                  label="वज़न (टन में)"
                  placeholder="जैसे: 5"
                  value={editForm.weightTons}
                  onChangeText={(v) => setEditForm(p => ({ ...p, weightTons: v }))}
                  keyboardType="numeric"
                  icon="package"
                  required
                />
                <Input
                  label="तारीख"
                  placeholder="DD/MM/YYYY"
                  value={editForm.tripDate}
                  onChangeText={(v) => setEditForm(p => ({ ...p, tripDate: v }))}
                  icon="calendar"
                  required
                />
                <Input
                  label="विशेष जानकारी (वैकल्पिक)"
                  placeholder="कोई अतिरिक्त जानकारी..."
                  value={editForm.description}
                  onChangeText={(v) => setEditForm(p => ({ ...p, description: v }))}
                />
                <Button title="बदलाव सेव करें" onPress={handleSaveEdit} loading={saving} />
                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Post Trip Modal ── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>🚚 ट्रिप डालें</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.formNote, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>
                माल की जानकारी डालें — ड्राइवर आपसे संपर्क करेंगे
              </Text>

              <Text style={[styles.fieldGroup, { color: colors.secondary }]}>📍 कहाँ से</Text>
              <Input label="शहर (From City)" placeholder="जैसे: जयपुर" value={form.fromCity} onChangeText={(v) => set('fromCity', v)} icon="map-pin" required />
              <StateDropdown label="राज्य (From State)" value={form.fromState} onSelect={(v) => set('fromState', v)} colors={colors} />

              <Text style={[styles.fieldGroup, { color: colors.secondary, marginTop: 8 }]}>📍 कहाँ तक</Text>
              <Input label="शहर (To City)" placeholder="जैसे: मुंबई" value={form.toCity} onChangeText={(v) => set('toCity', v)} icon="map-pin" required />
              <StateDropdown label="राज्य (To State)" value={form.toState} onSelect={(v) => set('toState', v)} colors={colors} />

              <Text style={[styles.fieldGroup, { color: colors.secondary, marginTop: 8 }]}>📦 माल की जानकारी</Text>
              <GoodsCategoryPicker value={form.goodsCategory} onSelect={(v) => set('goodsCategory', v)} colors={colors} />
              <Input label="वज़न (टन में)" placeholder="जैसे: 5" value={form.weightTons} onChangeText={(v) => set('weightTons', v)} keyboardType="numeric" icon="package" required />
              <Input label="रेंट डालें (₹)" placeholder="रेंट डालें" value={form.ratePerTon} onChangeText={(v) => set('ratePerTon', v)} keyboardType="numeric" icon="dollar-sign" />
              {form.ratePerTon.trim() && isLowRate(Number(form.ratePerTon)) && (
                <View style={[styles.rateHint, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '50' }]}>
                  <Feather name="alert-triangle" size={12} color="#f97316" />
                  <Text style={[styles.rateHintText, { color: '#c2410c' }]}>
                    ₹{LOW_RATE_THRESHOLD}+ डालने पर ड्राइवर जल्दी मिलेंगे
                  </Text>
                </View>
              )}
              {(!form.ratePerTon.trim() || Number(form.ratePerTon) === 0) && (
                <View style={[styles.rateHint, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '50' }]}>
                  <Feather name="info" size={12} color="#f97316" />
                  <Text style={[styles.rateHintText, { color: '#c2410c' }]}>
                    भाड़ा (Rate) जरूर डालें — नहीं डालने पर ड्राइवर interest नहीं लेते
                  </Text>
                </View>
              )}
              {/* Sender pays — fixed, no option */}
              <View style={[styles.senderPayNote, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                <Text style={styles.senderPayNoteIcon}>💰</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.senderPayNoteTitle, { color: '#B71C1C' }]}>Rent आपको देना होगा</Text>
                  <Text style={[styles.senderPayNoteText, { color: '#BF360C' }]}>Driver को किराया आप (माल भेजने वाले) देंगे — loading के समय।</Text>
                </View>
              </View>

              <Input label="तारीख" placeholder="DD/MM/YYYY" value={form.tripDate} onChangeText={(v) => set('tripDate', v)} icon="calendar" required />

              <Text style={[styles.fieldGroup, { color: colors.secondary, marginTop: 8 }]}>🚛 गाड़ी का प्रकार (वैकल्पिक)</Text>
              <VehicleTypePicker value={form.vehicleTypePref} onSelect={(v) => set('vehicleTypePref', v)} colors={colors} />

              <Input label="विशेष जानकारी (वैकल्पिक)" placeholder="कोई अतिरिक्त जानकारी..." value={form.description} onChangeText={(v) => set('description', v)} />

              {/* ₹1000 Advance Payment — 3 states */}
              {(!latestAdvance || latestAdvance.status === 'rejected') ? (
                <View style={[styles.advanceBox, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
                  {/* Company Branding */}
                  <View style={styles.advanceBrandRow}>
                    <View style={[styles.advanceLogo, { backgroundColor: '#1B5E20' }]}>
                      <Text style={styles.advanceLogoText}>LFI</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.advanceBrandName, { color: '#1B5E20' }]}>Loading Fast India</Text>
                      <Text style={[styles.advanceBrandTag, { color: '#388E3C' }]}>Official Payment Portal</Text>
                    </View>
                    <View style={[styles.advanceBadge, { backgroundColor: '#2E7D32' }]}>
                      <Text style={styles.advanceBadgeText}>Verified</Text>
                    </View>
                  </View>

                  {latestAdvance?.status === 'rejected' && (
                    <View style={[styles.advanceRejBox, { backgroundColor: '#FFEBEE', borderColor: '#C62828' }]}>
                      <Feather name="x-circle" size={18} color="#C62828" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.advanceRejTitle, { color: '#B71C1C' }]}>Payment Not Received ✗</Text>
                        <Text style={[styles.advanceRejSub, { color: '#C62828' }]}>{latestAdvance.rejectionReason || 'Admin को payment नहीं मिली। दोबारा UPI से भेजें।'}</Text>
                      </View>
                    </View>
                  )}

                  {/* Amount Box */}
                  <View style={[styles.advanceAmtBox, { backgroundColor: '#fff', borderColor: '#4CAF50' }]}>
                    <Text style={[styles.advanceAmtLabel, { color: '#388E3C' }]}>Security Advance Amount</Text>
                    <Text style={[styles.advanceAmtValue, { color: '#1B5E20' }]}>₹1,000</Text>
                    <Text style={[styles.advanceAmtNote, { color: '#2E7D32' }]}>Trip post करने से पहले एकबार भुगतान करें</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.advancePayBtn, { backgroundColor: '#1B5E20' }]}
                    onPress={() => {
                      const url = 'upi://pay?pa=maksudsaiyed888@oksbi&pn=Loading%20Fast%20India&am=1000&cu=INR&tn=LFI+Security+Advance';
                      require('react-native').Linking.openURL(url).catch(() => {});
                    }}
                  >
                    <Feather name="smartphone" size={16} color="#fff" />
                    <Text style={styles.advancePayBtnText}>UPI से ₹1,000 भेजें</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.advanceDoneBtn, { borderColor: '#2E7D32', opacity: submittingRequest ? 0.6 : 1 }]}
                    disabled={submittingRequest}
                    onPress={() => Alert.alert(
                      'Payment Confirm करें',
                      'क्या आपने Loading Fast India को ₹1,000 UPI से भेज दिया?',
                      [
                        { text: 'हाँ, भेज दिया ✓', onPress: handleSubmitAdvanceRequest },
                        { text: 'नहीं', style: 'cancel' },
                      ]
                    )}
                  >
                    <Feather name="check-circle" size={16} color="#2E7D32" />
                    <Text style={[styles.advanceDoneBtnText, { color: '#2E7D32' }]}>
                      {submittingRequest ? 'Request भेजी जा रही है...' : 'मैंने ₹1,000 भेज दिया — Verify करें'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : latestAdvance.status === 'pending' ? (
                <View style={[styles.advancePendingBox, { backgroundColor: '#FFF8E1', borderColor: '#F57F17' }]}>
                  <View style={styles.advanceBrandRow}>
                    <View style={[styles.advanceLogo, { backgroundColor: '#E65100' }]}>
                      <Text style={styles.advanceLogoText}>LFI</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.advanceBrandName, { color: '#E65100' }]}>Payment Verification Pending</Text>
                      <Text style={[styles.advanceBrandTag, { color: '#F57F17' }]}>Loading Fast India</Text>
                    </View>
                  </View>
                  <View style={[styles.advanceAmtBox, { backgroundColor: '#fff', borderColor: '#FFB300' }]}>
                    <Feather name="clock" size={28} color="#F57F17" />
                    <Text style={[styles.advanceAmtLabel, { color: '#E65100', marginTop: 6 }]}>Admin Verify कर रहा है</Text>
                    <Text style={[styles.advanceAmtNote, { color: '#F57F17' }]}>आपकी ₹1,000 payment जाँची जा रही है।{'\n'}Approve होते ही trip automatically post हो जाएगी।</Text>
                  </View>
                  <View style={[styles.advancePendingNote, { backgroundColor: '#FFF3E0', borderColor: '#FFB300' }]}>
                    <Feather name="info" size={14} color="#E65100" />
                    <Text style={[styles.advancePendingNoteText, { color: '#E65100' }]}>अगर payment नहीं भेजी तो Admin reject करेगा और trip post नहीं होगी।</Text>
                  </View>
                </View>
              ) : (
                /* approved */
                <View style={[styles.advanceApprovedBox, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
                  <Feather name="check-circle" size={36} color="#2E7D32" />
                  <Text style={[styles.advanceApprovedTitle, { color: '#1B5E20' }]}>Payment Verified ✓</Text>
                  <Text style={[styles.advanceApprovedSub, { color: '#388E3C' }]}>आपकी trip successfully post हो गई!{'\n'}Driver tab में देखें।</Text>
                </View>
              )}
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StateDropdown({ label, value, onSelect, colors }: { label: string; value: string; onSelect: (v: string) => void; colors: Colors }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground, marginBottom: 6 }}>{label} *</Text>
      <TouchableOpacity
        style={[ddStyles.trigger, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(!open)}
      >
        <Text style={[ddStyles.triggerText, { color: value ? colors.foreground : colors.mutedForeground }]}>
          {value || 'राज्य चुनें'}
        </Text>
        <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
      {open && (
        <View style={[ddStyles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ScrollView style={{ maxHeight: 180 }} nestedScrollEnabled>
            {INDIA_STATES.map((s) => (
              <TouchableOpacity key={s} style={[ddStyles.option, { borderBottomColor: colors.border }]} onPress={() => { onSelect(s); setOpen(false); }}>
                <Text style={[ddStyles.optionText, { color: colors.foreground }]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

function GoodsCategoryPicker({ value, onSelect, colors }: { value: string; onSelect: (v: string) => void; colors: Colors }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground, marginBottom: 6 }}>माल का प्रकार *</Text>
      <View style={[gcStyles.bracket, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={gcStyles.row}>
          {GOODS_CATEGORIES.map((g) => {
            const isSelected = value === g.name;
            return (
              <TouchableOpacity
                key={g.id}
                style={[gcStyles.chip, {
                  backgroundColor: isSelected ? colors.primary : colors.background,
                  borderColor: isSelected ? colors.primary : colors.border,
                }]}
                onPress={() => onSelect(g.name)}
              >
                <Text style={gcStyles.icon}>{g.icon}</Text>
                <Text style={[gcStyles.chipText, { color: isSelected ? '#fff' : colors.foreground }]}>{g.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
}

function VehicleTypePicker({ value, onSelect, colors }: { value: string; onSelect: (v: string) => void; colors: Colors }) {
  const [open, setOpen] = useState(false);

  const displayName = value
    ? VEHICLE_TYPES.find(v => v.id === value)?.name ?? value
    : 'कोई भी गाड़ी चलेगी';

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        style={[ddStyles.trigger, { borderColor: value ? colors.navy : colors.border, backgroundColor: colors.card }]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 18 }}>🚛</Text>
          <Text style={[ddStyles.triggerText, { color: value ? colors.foreground : colors.mutedForeground }]}>
            {displayName}
          </Text>
        </View>
        <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={vtStyles.overlay}>
          <View style={[vtStyles.sheet, { backgroundColor: colors.background }]}>
            <View style={[vtStyles.header, { borderBottomColor: colors.border }]}>
              <Text style={[vtStyles.title, { color: colors.foreground }]}>🚛 गाड़ी चुनें</Text>
              <TouchableOpacity onPress={() => setOpen(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={[{ id: '', name: 'कोई भी गाड़ी चलेगी', category: '', maxLoad: 0 }, ...VEHICLE_TYPES]}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingBottom: 30 }}
              ListHeaderComponent={null}
              renderItem={({ item, index }) => {
                const isFirst = index === 0;
                const prevItem = index > 1 ? VEHICLE_TYPES[index - 2] : null;
                const showHeader = !isFirst && item.category !== prevItem?.category;
                const isSelected = value === item.id;

                return (
                  <>
                    {showHeader && (
                      <View style={[vtStyles.catHeader, { backgroundColor: colors.muted }]}>
                        <Text style={[vtStyles.catHeaderText, { color: colors.secondary }]}>
                          {item.category}
                        </Text>
                      </View>
                    )}
                    {isFirst && (
                      <View style={[vtStyles.catHeader, { backgroundColor: colors.muted }]}>
                        <Text style={[vtStyles.catHeaderText, { color: colors.secondary }]}>सभी गाड़ियाँ</Text>
                      </View>
                    )}
                    <TouchableOpacity
                      style={[vtStyles.row, {
                        backgroundColor: isSelected ? colors.navy + '10' : colors.background,
                        borderBottomColor: colors.border,
                      }]}
                      onPress={() => { onSelect(item.id); setOpen(false); }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[vtStyles.name, { color: isSelected ? colors.navy : colors.foreground }]}>
                          {item.name || 'कोई भी गाड़ी चलेगी'}
                        </Text>
                        {item.maxLoad > 0 && (
                          <Text style={[vtStyles.load, { color: colors.mutedForeground }]}>
                            अधिकतम भार: {item.maxLoad} टन
                          </Text>
                        )}
                      </View>
                      {isSelected && <Feather name="check-circle" size={20} color={colors.navy} />}
                    </TouchableOpacity>
                  </>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const ddStyles = StyleSheet.create({
  trigger: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12 },
  triggerText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  dropdown: { borderWidth: 1, borderRadius: 10, marginTop: 4, zIndex: 99 },
  option: { paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 0.5 },
  optionText: { fontSize: 14, fontFamily: 'Inter_400Regular' },
});

const vtStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  catHeader: { paddingHorizontal: 16, paddingVertical: 8 },
  catHeaderText: { fontSize: 12, fontFamily: 'Inter_700Bold', textTransform: 'uppercase', letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  name: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  load: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
});

const gcStyles = StyleSheet.create({
  bracket: { borderRadius: 14, borderWidth: 1, padding: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  icon: { fontSize: 14 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  body: { padding: 16 },
  addBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  addBannerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addBannerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  tripCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12 },
  tripCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  tripDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  tripRoute: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  tripMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 4 },
  tripDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', fontStyle: 'italic' },
  payBadge: { borderWidth: 1.5, borderRadius: 8, padding: 8, marginTop: 8, gap: 3 },
  payBadgeText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  senderPayNote: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, borderWidth: 2, marginBottom: 12, alignItems: 'center' },
  senderPayNoteIcon: { fontSize: 22 },
  senderPayNoteTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  senderPayNoteText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  advanceBox: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 14, gap: 12 },
  advanceBrandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  advanceLogo: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  advanceLogoText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  advanceBrandName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  advanceBrandTag: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2 },
  advanceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  advanceBadgeText: { color: '#fff', fontSize: 10, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  advanceAmtBox: { borderRadius: 12, borderWidth: 1.5, padding: 14, alignItems: 'center', gap: 4 },
  advanceAmtLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  advanceAmtValue: { fontSize: 32, fontFamily: 'Inter_700Bold' },
  advanceAmtNote: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  advancePayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  advancePayBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  advanceDoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 2, backgroundColor: '#F1F8E9' },
  advanceDoneBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  advancePaidBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 12 },
  advancePaidTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  advancePaidSub: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  advanceRejBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  advanceRejTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  advanceRejSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 17 },
  advancePendingBox: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 14, gap: 12, alignItems: 'center' },
  advancePendingNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1, width: '100%' as const },
  advancePendingNoteText: { fontSize: 12, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 17 },
  advanceApprovedBox: { borderRadius: 16, borderWidth: 2, padding: 24, marginBottom: 14, alignItems: 'center', gap: 10 },
  advanceApprovedTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  advanceApprovedSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 20 },
  lowRateBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8 },
  lowRateText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  rateHint: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 7, padding: 7, marginBottom: 10 },
  rateHintText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  editRouteBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 14 },
  editRouteText: { fontSize: 13, fontFamily: 'Inter_600SemiBold', flex: 1 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sheetBody: { padding: 20 },
  formNote: { borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  fieldGroup: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
