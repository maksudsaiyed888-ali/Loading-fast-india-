import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const VEHICLE_PREFS = [
  { label: 'कोई भी', value: '' },
  { label: 'छोटा (≤5 टन)', value: 'small' },
  { label: 'मध्यम (6W)', value: 'medium' },
  { label: 'बड़ा (10W-14W)', value: 'large' },
  { label: 'भारी (16W+)', value: 'heavy' },
];

export default function VyapariPostTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getVyapariOwnTrips, addVyapariTrip, drivers } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState({
    fromCity: '', fromState: '', toCity: '', toState: '',
    goodsCategory: '', weightTons: '', ratePerTon: '',
    tripDate: '', vehicleTypePref: '', description: '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const myPostedTrips = user ? getVyapariOwnTrips(user.id) : [];
  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePost = async () => {
    if (!form.fromCity.trim()) { Alert.alert('त्रुटि', 'कहाँ से — शहर का नाम जरूरी है'); return; }
    if (!form.fromState.trim()) { Alert.alert('त्रुटि', 'कहाँ से — राज्य जरूरी है'); return; }
    if (!form.toCity.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — शहर का नाम जरूरी है'); return; }
    if (!form.toState.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — राज्य जरूरी है'); return; }
    if (!form.goodsCategory.trim()) { Alert.alert('त्रुटि', 'माल का प्रकार जरूरी है'); return; }
    if (!form.weightTons.trim() || isNaN(Number(form.weightTons)) || Number(form.weightTons) <= 0) { Alert.alert('त्रुटि', 'वज़न (टन में) 0 से अधिक सही संख्या डालें'); return; }
    if (form.ratePerTon.trim() && (isNaN(Number(form.ratePerTon)) || Number(form.ratePerTon) < 0)) { Alert.alert('त्रुटि', 'रेट प्रति टन सही संख्या डालें'); return; }
    if (!form.tripDate.trim()) { Alert.alert('त्रुटि', 'तारीख जरूरी है'); return; }

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
            <View key={t.id} style={[styles.tripCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                {t.ratePerTon > 0 ? ` • ₹${t.ratePerTon}/टन` : ''}
                {t.vehicleTypePref ? ` • ${VEHICLE_PREFS.find(v => v.value === t.vehicleTypePref)?.label ?? t.vehicleTypePref}` : ''}
              </Text>
              {t.description ? (
                <Text style={[styles.tripDesc, { color: colors.mutedForeground }]} numberOfLines={2}>{t.description}</Text>
              ) : null}
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
              <Input label="रेट प्रति टन (₹, वैकल्पिक)" placeholder="जैसे: 1500" value={form.ratePerTon} onChangeText={(v) => set('ratePerTon', v)} keyboardType="numeric" icon="dollar-sign" />
              <Input label="तारीख" placeholder="DD/MM/YYYY" value={form.tripDate} onChangeText={(v) => set('tripDate', v)} icon="calendar" required />

              <Text style={[styles.fieldGroup, { color: colors.secondary, marginTop: 8 }]}>🚛 गाड़ी का प्रकार (वैकल्पिक)</Text>
              <VehiclePrefPicker value={form.vehicleTypePref} onSelect={(v) => set('vehicleTypePref', v)} colors={colors} />

              <Input label="विशेष जानकारी (वैकल्पिक)" placeholder="कोई अतिरिक्त जानकारी..." value={form.description} onChangeText={(v) => set('description', v)} />

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

function VehiclePrefPicker({ value, onSelect, colors }: { value: string; onSelect: (v: string) => void; colors: Colors }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={gcStyles.row}>
          {VEHICLE_PREFS.map((vp) => {
            const isSelected = value === vp.value;
            return (
              <TouchableOpacity
                key={vp.value}
                style={[gcStyles.chip, {
                  backgroundColor: isSelected ? colors.navy : colors.card,
                  borderColor: isSelected ? colors.navy : colors.border,
                }]}
                onPress={() => onSelect(vp.value)}
              >
                <Text style={[gcStyles.chipText, { color: isSelected ? '#fff' : colors.foreground }]}>{vp.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
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
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sheetBody: { padding: 20 },
  formNote: { borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  fieldGroup: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
