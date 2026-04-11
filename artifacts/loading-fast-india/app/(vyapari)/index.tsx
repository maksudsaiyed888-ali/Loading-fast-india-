import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { INDIA_STATES, GOODS_CATEGORIES } from '@/lib/types';
import { generateId } from '@/lib/utils';

type Colors = ReturnType<typeof useColors>;

const VEHICLE_PREFS = [
  { label: 'कोई भी', value: '' },
  { label: 'छोटा (≤5 टन)', value: 'small' },
  { label: 'मध्यम (6W)', value: 'medium' },
  { label: 'बड़ा (10W-14W)', value: 'large' },
  { label: 'भारी (16W+)', value: 'heavy' },
];

export default function VyapariHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getAvailableTrips, getVyapariBookings, bilties, refreshAll,
    addVyapariTrip, getVyapariOwnTrips } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [posting, setPosting] = useState(false);

  const [form, setForm] = useState({
    fromCity: '', fromState: '', toCity: '', toState: '',
    goodsCategory: '', weightTons: '', ratePerTon: '', tripDate: '', vehicleTypePref: '', description: '',
  });
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const availableTrips = getAvailableTrips();
  const myBookings = user ? getVyapariBookings(user.id) : [];
  const myBilties = bilties.filter((b) => b.vyapariId === user?.id);
  const activeBookings = myBookings.filter((t) => t.status === 'confirmed');
  const myPostedTrips = user ? getVyapariOwnTrips(user.id) : [];

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };
  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  const handlePostTrip = async () => {
    if (!form.fromCity.trim()) { Alert.alert('त्रुटि', 'कहाँ से — शहर का नाम जरूरी है'); return; }
    if (!form.fromState.trim()) { Alert.alert('त्रुटि', 'कहाँ से — राज्य जरूरी है'); return; }
    if (!form.toCity.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — शहर का नाम जरूरी है'); return; }
    if (!form.toState.trim()) { Alert.alert('त्रुटि', 'कहाँ तक — राज्य जरूरी है'); return; }
    if (!form.goodsCategory.trim()) { Alert.alert('त्रुटि', 'माल का प्रकार जरूरी है'); return; }
    if (!form.weightTons.trim() || isNaN(Number(form.weightTons))) { Alert.alert('त्रुटि', 'वज़न (टन में) सही भरें'); return; }
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
      setForm({ fromCity: '', fromState: '', toCity: '', toState: '', goodsCategory: '', weightTons: '', ratePerTon: '', tripDate: '', vehicleTypePref: '', description: '' });
      setShowPostModal(false);
      Alert.alert('✅ ट्रिप पोस्ट हुई!', 'आपकी ट्रिप सफलतापूर्वक पोस्ट हो गई। ड्राइवर आपसे संपर्क करेंगे।');
    } finally {
      setPosting(false);
    }
  };

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
          <StatCard label="उपलब्ध गाड़ी" value={String(availableTrips.length)} icon="truck" />
          <StatCard label="मेरी बुकिंग" value={String(myBookings.length)} icon="package" />
          <StatCard label="मेरी ट्रिप" value={String(myPostedTrips.length)} icon="upload" />
          <StatCard label="बिलटी" value={String(myBilties.length)} icon="file-text" />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.navy]} />}
      >
        <View style={styles.quickActions}>
          <ActionBtn icon="upload" label="ट्रिप डालें" onPress={() => setShowPostModal(true)} color={colors.primary} />
          <ActionBtn icon="search" label="ट्रिप खोजें" onPress={() => router.push('/(vyapari)/browse')} color={colors.navy} />
        </View>

        {myPostedTrips.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>मेरी पोस्ट की ट्रिप्स</Text>
            {myPostedTrips.slice(0, 3).map((t) => (
              <View key={t.id} style={[styles.postedCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.postedCardRow}>
                  <View style={[styles.statusBadge, { backgroundColor: t.status === 'open' ? colors.success + '20' : colors.muted }]}>
                    <Text style={[styles.statusText, { color: t.status === 'open' ? colors.success : colors.mutedForeground }]}>
                      {t.status === 'open' ? '🟢 Open' : t.status === 'accepted' ? '✅ Accept' : '❌ Cancel'}
                    </Text>
                  </View>
                  <Text style={[styles.postedDate, { color: colors.mutedForeground }]}>{t.tripDate}</Text>
                </View>
                <Text style={[styles.postedRoute, { color: colors.foreground }]}>
                  {t.fromCity} → {t.toCity}
                </Text>
                <Text style={[styles.postedMeta, { color: colors.mutedForeground }]}>
                  {t.goodsCategory} • {t.weightTons} टन {t.ratePerTon > 0 ? `• ₹${t.ratePerTon}/टन` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {activeBookings.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Active Bookings</Text>
            {activeBookings.slice(0, 2).map((trip) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>नई उपलब्ध गाड़ियां</Text>
        {availableTrips.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>अभी कोई गाड़ी उपलब्ध नहीं है</Text>
            <Text style={[styles.emptySubText, { color: colors.mutedForeground }]}>बाद में चेक करें</Text>
          </View>
        ) : (
          availableTrips.slice(0, 5).map((trip) => (
            <TripCard key={trip.id} trip={trip} onPress={() => router.push('/(vyapari)/browse')} />
          ))
        )}
      </ScrollView>

      <Modal visible={showPostModal} transparent animationType="slide" onRequestClose={() => setShowPostModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.sheet, { backgroundColor: colors.background }]}>
            <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>🚚 ट्रिप डालें</Text>
              <TouchableOpacity onPress={() => setShowPostModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[styles.formNote, { color: colors.mutedForeground, backgroundColor: colors.muted }]}>
                आप यहाँ अपना माल डालें — ड्राइवर आपसे संपर्क करेंगे
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

              <Button title="ट्रिप पोस्ट करें" onPress={handlePostTrip} loading={posting} />
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

function GoodsCategoryPicker({ value, onSelect, colors }: { value: string; onSelect: (v: string) => void; colors: Colors }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontFamily: 'Inter_500Medium', color: colors.foreground, marginBottom: 6 }}>माल का प्रकार *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={gcStyles.row}>
          {GOODS_CATEGORIES.map((g) => {
            const isSelected = value === g.name;
            return (
              <TouchableOpacity
                key={g.id}
                style={[gcStyles.chip, {
                  backgroundColor: isSelected ? colors.primary : colors.card,
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
  row: { flexDirection: 'row', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7 },
  icon: { fontSize: 14 },
  chipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});

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
  label: { fontSize: 14, fontFamily: 'Inter_500Medium' },
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
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12 },
  postedCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  postedCardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  postedDate: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  postedRoute: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  postedMeta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  empty: { borderRadius: 14, padding: 32, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptySubText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '94%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sheetBody: { padding: 20 },
  formNote: { borderRadius: 10, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 16 },
  fieldGroup: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
});
