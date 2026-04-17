import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, FlatList } from 'react-native';
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
const RATE_PER_KM_PER_TON = 2.2; // ₹2.2 per ton per km (standard Indian freight)

const isLowRate = (ratePerTon: number) => ratePerTon === 0 || ratePerTon < LOW_RATE_THRESHOLD;

// Major Indian city coordinates
const CITY_COORDS: Record<string, [number, number]> = {
  'mumbai': [19.076, 72.877], 'delhi': [28.704, 77.102], 'bangalore': [12.972, 77.594],
  'bengaluru': [12.972, 77.594], 'hyderabad': [17.385, 78.487], 'ahmedabad': [23.022, 72.572],
  'chennai': [13.083, 80.270], 'kolkata': [22.573, 88.364], 'surat': [21.170, 72.831],
  'pune': [18.520, 73.856], 'jaipur': [26.913, 75.787], 'lucknow': [26.847, 80.947],
  'kanpur': [26.449, 80.331], 'nagpur': [21.145, 79.088], 'indore': [22.720, 75.857],
  'bhopal': [23.259, 77.412], 'visakhapatnam': [17.686, 83.218], 'vizag': [17.686, 83.218],
  'patna': [25.595, 85.138], 'vadodara': [22.307, 73.181], 'ghaziabad': [28.669, 77.438],
  'ludhiana': [30.901, 75.857], 'agra': [27.176, 78.008], 'nashik': [19.998, 73.789],
  'faridabad': [28.408, 77.313], 'meerut': [28.984, 77.706], 'rajkot': [22.308, 70.800],
  'varanasi': [25.317, 82.974], 'srinagar': [34.083, 74.797], 'aurangabad': [19.877, 75.343],
  'dhanbad': [23.796, 86.430], 'amritsar': [31.634, 74.873], 'allahabad': [25.435, 81.846],
  'prayagraj': [25.435, 81.846], 'ranchi': [23.344, 85.310], 'howrah': [22.588, 88.310],
  'coimbatore': [11.017, 76.956], 'jabalpur': [23.181, 79.987], 'gwalior': [26.218, 78.182],
  'vijayawada': [16.506, 80.648], 'jodhpur': [26.292, 73.017], 'madurai': [9.919, 78.120],
  'raipur': [21.251, 81.630], 'kota': [25.183, 75.833], 'guwahati': [26.144, 91.736],
  'chandigarh': [30.733, 76.779], 'solapur': [17.686, 75.905], 'hubli': [15.365, 75.124],
  'dharwad': [15.460, 75.010], 'bareilly': [28.367, 79.416], 'moradabad': [28.839, 78.776],
  'mysore': [12.295, 76.639], 'mysuru': [12.295, 76.639], 'tiruppur': [11.109, 77.341],
  'gurgaon': [28.459, 77.026], 'gurugram': [28.459, 77.026], 'noida': [28.535, 77.391],
  'aligarh': [27.882, 78.082], 'jalandhar': [31.324, 75.578], 'bhubaneswar': [20.296, 85.826],
  'salem': [11.664, 78.145], 'warangal': [17.977, 79.601], 'guntur': [16.300, 80.436],
  'bhiwandi': [19.296, 73.059], 'saharanpur': [29.968, 77.547], 'gorakhpur': [26.760, 83.373],
  'bikaner': [28.022, 73.312], 'amravati': [20.937, 77.750], 'dehradun': [30.316, 78.032],
  'durgapur': [23.479, 87.320], 'asansol': [23.683, 86.982], 'nanded': [19.160, 77.316],
  'kolhapur': [16.705, 74.243], 'ajmer': [26.449, 74.638], 'latur': [18.400, 76.560],
  'siliguri': [26.725, 88.395], 'jammu': [32.735, 74.868], 'jamshedpur': [22.802, 86.185],
  'jhansi': [25.448, 78.568], 'ulhasnagar': [19.217, 73.155], 'nellore': [14.446, 79.987],
  'mangalore': [12.914, 74.856], 'mangaluru': [12.914, 74.856], 'belgaum': [15.851, 74.496],
  'belagavi': [15.851, 74.496], 'bhavnagar': [21.752, 72.152], 'malegaon': [20.553, 74.528],
  'thiruvananthapuram': [8.524, 76.936], 'trivandrum': [8.524, 76.936],
  'kochi': [9.931, 76.267], 'ernakulam': [9.994, 76.296], 'kozhikode': [11.259, 75.782],
  'calicut': [11.259, 75.782], 'thrissur': [10.524, 76.214], 'tirunelveli': [8.727, 77.701],
};

function haversineKmLocal(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getSuggestedRate(fromCity: string, toCity: string): { rate: number; km: number } | null {
  const f = fromCity.trim().toLowerCase();
  const t = toCity.trim().toLowerCase();
  const fc = CITY_COORDS[f];
  const tc = CITY_COORDS[t];
  if (!fc || !tc) return null;
  const km = Math.round(haversineKmLocal(fc[0], fc[1], tc[0], tc[1]) * 1.25); // road ~25% more than aerial
  if (km < 20) return null;
  const raw = km * RATE_PER_KM_PER_TON;
  const rate = Math.ceil(raw / 50) * 50; // round up to nearest ₹50
  return { rate, km };
}

export default function VyapariPostTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getVyapariOwnTrips, addVyapariTrip, updateVyapariTrip, drivers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState({
    fromCity: '', fromState: '', toCity: '', toState: '',
    goodsCategory: '', weightTons: '', ratePerTon: '',
    tripDate: '', vehicleTypePref: '', description: '',
    receiverName: '', receiverPhone: '', receiverAddress: '',
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
    if (!form.receiverName.trim()) { Alert.alert('त्रुटि', 'माल प्राप्तकर्ता (Receiver) का नाम जरूरी है'); return false; }
    if (!form.receiverPhone.trim() || form.receiverPhone.trim().length < 10) { Alert.alert('त्रुटि', 'Receiver का मोबाइल नंबर (10 अंक) जरूरी है'); return false; }
    return true;
  };

  const handlePost = async () => {
    if (!validateForm()) return;
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
        receiverName: form.receiverName.trim(),
        receiverPhone: form.receiverPhone.trim(),
        receiverAddress: form.receiverAddress.trim() || undefined,
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
        form.weightTons.trim(),
        form.ratePerTon.trim(),
      );
      setForm({ fromCity: '', fromState: '', toCity: '', toState: '', goodsCategory: '', weightTons: '', ratePerTon: '', tripDate: '', vehicleTypePref: '', description: '', receiverName: '', receiverPhone: '', receiverAddress: '' });
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
              {(() => {
                const suggestion = getSuggestedRate(form.fromCity, form.toCity);
                const enteredRate = Number(form.ratePerTon);
                const showDistSuggestion = suggestion && form.ratePerTon.trim() && enteredRate > 0 && enteredRate < suggestion.rate * 0.75;
                const showEmptyHint = !form.ratePerTon.trim() || enteredRate === 0;
                const showLowHint = form.ratePerTon.trim() && isLowRate(enteredRate) && !showDistSuggestion;
                return (
                  <>
                    {showDistSuggestion && suggestion && (
                      <View style={[styles.distSuggestBox, { backgroundColor: '#EFF6FF', borderColor: '#1D4ED8' }]}>
                        <View style={styles.distSuggestRow}>
                          <Feather name="trending-up" size={14} color="#1D4ED8" />
                          <Text style={[styles.distSuggestTitle, { color: '#1E40AF' }]}>
                            दूरी के हिसाब से उचित किराया
                          </Text>
                        </View>
                        <Text style={[styles.distSuggestSub, { color: '#1E3A8A' }]}>
                          {form.fromCity} → {form.toCity} ≈ {suggestion.km} km{'\n'}
                          बाज़ार भाव: <Text style={{ fontFamily: 'Inter_700Bold' }}>₹{suggestion.rate}/टन</Text>
                          {' '}(₹2.2/km/टन){'\n'}
                          आपने डाला: <Text style={{ fontFamily: 'Inter_700Bold', color: '#DC2626' }}>₹{enteredRate}/टन</Text> — यह बहुत कम है।
                        </Text>
                        <TouchableOpacity
                          style={[styles.distSuggestBtn, { backgroundColor: '#1D4ED8' }]}
                          onPress={() => set('ratePerTon', String(suggestion.rate))}
                          activeOpacity={0.8}
                        >
                          <Feather name="check-circle" size={14} color="#fff" />
                          <Text style={styles.distSuggestBtnText}>₹{suggestion.rate}/टन use करें</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {showLowHint && (
                      <View style={[styles.rateHint, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '50' }]}>
                        <Feather name="alert-triangle" size={12} color="#f97316" />
                        <Text style={[styles.rateHintText, { color: '#c2410c' }]}>
                          ₹{LOW_RATE_THRESHOLD}+ डालने पर ड्राइवर जल्दी मिलेंगे
                        </Text>
                      </View>
                    )}
                    {showEmptyHint && (
                      <View style={[styles.rateHint, { backgroundColor: '#fff7ed', borderColor: '#f97316' + '50' }]}>
                        <Feather name="info" size={12} color="#f97316" />
                        <Text style={[styles.rateHintText, { color: '#c2410c' }]}>
                          भाड़ा (Rate) जरूर डालें — नहीं डालने पर ड्राइवर interest नहीं लेते
                        </Text>
                      </View>
                    )}
                  </>
                );
              })()}
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

              <Text style={[styles.fieldGroup, { color: colors.secondary, marginTop: 8 }]}>📦 माल प्राप्तकर्ता (Receiver) की जानकारी</Text>
              <Input label="Receiver का नाम *" placeholder="जैसे: Suresh Kumar" value={form.receiverName} onChangeText={(v) => set('receiverName', v)} />
              <Input label="Receiver का मोबाइल नंबर *" placeholder="10 अंकों का नंबर" value={form.receiverPhone} onChangeText={(v) => set('receiverPhone', v)} keyboardType="phone-pad" maxLength={10} />
              <Input label="Receiver का पता (वैकल्पिक)" placeholder="गोदाम / दुकान का पता..." value={form.receiverAddress} onChangeText={(v) => set('receiverAddress', v)} />

              <Button title="ट्रिप पोस्ट करें" onPress={handlePost} loading={posting} />
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
  advanceSafetyNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  advanceSafetyText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 18 },
  advanceBlockNote: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1.5 },
  advanceBlockText: { fontSize: 13, fontFamily: 'Inter_700Bold', flex: 1 },
  lowRateBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, borderWidth: 1, borderRadius: 8, padding: 8, marginTop: 8 },
  lowRateText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  editBtnText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  rateHint: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 7, padding: 7, marginBottom: 10 },
  rateHintText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  distSuggestBox: { borderRadius: 10, borderWidth: 1.5, padding: 12, marginBottom: 10, gap: 8 },
  distSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distSuggestTitle: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  distSuggestSub: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  distSuggestBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  distSuggestBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
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
  utrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  utrCard: { width: '100%', borderRadius: 20, overflow: 'hidden', elevation: 10, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12 },
  utrHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  utrLogo: { width: 42, height: 42, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  utrLogoText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  utrHeaderTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  utrHeaderSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  utrBody: { padding: 18, gap: 14 },
  utrInfoBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 10, borderWidth: 1.5, padding: 12 },
  utrInfoText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 19 },
  utrLabel: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginBottom: -8 },
  utrInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  utrHint: { fontSize: 11.5, fontFamily: 'Inter_400Regular', lineHeight: 17, marginTop: -6 },
  utrConfirmBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12, marginTop: 4 },
  utrConfirmText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
