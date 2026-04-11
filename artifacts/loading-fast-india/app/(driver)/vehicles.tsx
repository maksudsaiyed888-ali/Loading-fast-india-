import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useMemo, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { VEHICLE_TYPES } from '@/lib/types';
import { generateId } from '@/lib/utils';

const WEIGHT_FILTERS = [
  { label: 'सभी',     min: 0,  max: Infinity },
  { label: '1-5 टन',  min: 0,  max: 5 },
  { label: '5-15 टन', min: 5, max: 15 },
  { label: '15-30 टन', min: 15, max: 30 },
  { label: '30+ टन',  min: 30, max: Infinity },
];

const OTHER_VEHICLE = {
  id: 'other-vehicle',
  name: 'अन्य वाहन',
  nameEn: 'Other Vehicle',
  maxLoad: 0,
  icon: '🚗',
  category: 'अन्य',
  wheels: 0,
};

const DEFAULT_TYPE = VEHICLE_TYPES.find((v) => v.id === 'truck-6w') ?? VEHICLE_TYPES[6];

export default function VehiclesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getDriverVehicles, addVehicle } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(DEFAULT_TYPE);
  const [weightFilter, setWeightFilter] = useState(0);

  const [form, setForm] = useState({
    vehicleNumber: '', model: '', year: '', rcNumber: '', rcExpiry: '', insuranceExpiry: '',
  });

  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const activeFilter = WEIGHT_FILTERS[weightFilter];
  const filteredVehicles = useMemo(() => {
    if (weightFilter === 0) return VEHICLE_TYPES;
    return VEHICLE_TYPES.filter((v) => v.maxLoad > activeFilter.min && v.maxLoad <= activeFilter.max);
  }, [activeFilter, weightFilter]);

  const handleAdd = async () => {
    if (!form.vehicleNumber.trim()) { Alert.alert('त्रुटि', 'गाड़ी नंबर जरूरी है'); return; }
    if (!form.rcNumber.trim()) { Alert.alert('त्रुटि', 'RC नंबर जरूरी है'); return; }
    if (!form.rcExpiry.trim()) { Alert.alert('त्रुटि', 'RC एक्सपायरी जरूरी है'); return; }
    setLoading(true);
    try {
      await addVehicle({
        id: generateId(),
        driverId: user!.id,
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        vehicleType: selectedType.id,
        vehicleTypeName: selectedType.name,
        model: form.model.trim(),
        year: form.year.trim(),
        maxLoadTons: selectedType.maxLoad,
        rcNumber: form.rcNumber.trim().toUpperCase(),
        rcExpiry: form.rcExpiry.trim(),
        insuranceExpiry: form.insuranceExpiry.trim(),
        isActive: true,
        createdAt: new Date().toISOString(),
      });
      setForm({ vehicleNumber: '', model: '', year: '', rcNumber: '', rcExpiry: '', insuranceExpiry: '' });
      setSelectedType(DEFAULT_TYPE);
      Alert.alert(
        '✅ गाड़ी जोड़ी गई!',
        `${form.vehicleNumber.trim().toUpperCase()} सफलतापूर्वक रजिस्टर हो गई।\n\nक्या आप एक और गाड़ी जोड़ना चाहते हैं?`,
        [
          { text: 'नहीं, बाद में', style: 'cancel', onPress: () => setShowModal(false) },
          { text: '➕ हाँ, एक और जोड़ें', onPress: () => {} },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);
  const vt = selectedType as { wheels?: number; category?: string } & typeof selectedType;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी गाड़ियां</Text>
        <Text style={styles.sub}>{myVehicles.length} गाड़ियां • 3-चक्का से 22-चक्का तक सभी वाहन</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>

        <TouchableOpacity
          style={[styles.addMoreBanner, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '50' }]}
          onPress={() => setShowModal(true)}
          activeOpacity={0.8}
        >
          <Feather name="plus-circle" size={20} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.addMoreTitle, { color: colors.primary }]}>नई गाड़ी जोड़ें</Text>
            <Text style={[styles.addMoreSub, { color: colors.mutedForeground }]}>एक ID से unlimited गाड़ियां — 3W से 22W तक</Text>
          </View>
          <Feather name="chevron-right" size={18} color={colors.primary} />
        </TouchableOpacity>

        {myVehicles.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>अभी कोई गाड़ी नहीं है</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>ऊपर बटन से पहली गाड़ी जोड़ें</Text>
          </View>
        ) : (
          myVehicles.map((v) => (
            <View key={v.id} style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.vehicleHeader, { borderBottomColor: colors.border }]}>
                <View style={[styles.vehicleTypeTag, { backgroundColor: colors.primary + '15' }]}>
                  <Feather name="truck" size={14} color={colors.primary} />
                  <Text style={[styles.vehicleTypeName, { color: colors.primary }]}>{v.vehicleTypeName}</Text>
                </View>
                <View style={[styles.activeBadge, { backgroundColor: colors.success + '20' }]}>
                  <Text style={[styles.activeBadgeText, { color: colors.success }]}>Active</Text>
                </View>
              </View>
              <Text style={[styles.vehicleNumber, { color: colors.foreground }]}>{v.vehicleNumber}</Text>
              <Text style={[styles.vehicleModel, { color: colors.mutedForeground }]}>{v.model} {v.year}</Text>
              <View style={styles.docsRow}>
                <DocChip label="RC" value={v.rcExpiry} />
                {v.insuranceExpiry ? <DocChip label="Insurance" value={v.insuranceExpiry} /> : null}
                <DocChip label="Load" value={`${v.maxLoadTons} टन`} />
              </View>
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
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>नई गाड़ी जोड़ें</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

              <Text style={[styles.sectionLabel, { color: colors.secondary }]}>वज़न के अनुसार फ़िल्टर करें</Text>

              <View style={styles.weightFilterRow}>
                {WEIGHT_FILTERS.map((f, i) => (
                  <TouchableOpacity
                    key={f.label}
                    style={[styles.weightChip, {
                      backgroundColor: weightFilter === i ? colors.primary : colors.card,
                      borderColor: weightFilter === i ? colors.primary : colors.border,
                    }]}
                    onPress={() => setWeightFilter(i)}
                  >
                    <Text style={[styles.weightChipText, { color: weightFilter === i ? '#fff' : colors.foreground }]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.selectedInfo, { backgroundColor: colors.primary + '12', borderColor: colors.primary + '40' }]}>
                <Text style={{ fontSize: 20 }}>
                  {['3-चक्का', '4-चक्का'].includes((vt as { category?: string }).category ?? '') ? '🛺' :
                   (vt as { category?: string }).category === '6-चक्का' ? '🚛' :
                   (vt as { category?: string }).category === 'विशेष' ? '🏗️' : '🚚'}
                </Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedName, { color: colors.foreground }]}>{selectedType.name}</Text>
                  <Text style={[styles.selectedMeta, { color: colors.mutedForeground }]}>
                    {vt.wheels ? `${vt.wheels} चक्के • ` : ''}{selectedType.maxLoad} टन क्षमता
                  </Text>
                </View>
                <View style={[styles.wheelBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.wheelBadgeText}>{vt.wheels ?? '—'}W</Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.secondary, marginBottom: 10 }]}>वाहन चुनें</Text>
              <View style={[styles.vehicleBracket, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.vehicleGrid}>
                  {filteredVehicles.map((vt2) => {
                    const isSelected = selectedType.id === vt2.id;
                    const v2 = vt2 as { wheels?: number; category?: string } & typeof vt2;
                    return (
                      <TouchableOpacity
                        key={vt2.id}
                        style={[styles.vehicleGridItem, {
                          backgroundColor: isSelected ? colors.primary : colors.background,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 2 : 1,
                        }]}
                        onPress={() => setSelectedType(vt2)}
                      >
                        <Text style={[styles.vehicleGridName, { color: isSelected ? '#fff' : colors.foreground }]} numberOfLines={2}>
                          {vt2.name}
                        </Text>
                        <Text style={[styles.vehicleGridLoad, { color: isSelected ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
                          {vt2.maxLoad} टन
                        </Text>
                        {(v2.wheels ?? 0) > 0 && (
                          <View style={[styles.wBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : colors.muted }]}>
                            <Text style={[styles.wBadgeText, { color: isSelected ? '#fff' : colors.mutedForeground }]}>
                              {v2.wheels}W
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                  <TouchableOpacity
                    key="other-vehicle"
                    style={[styles.vehicleGridItem, {
                      backgroundColor: selectedType.id === 'other-vehicle' ? colors.navy : colors.background,
                      borderColor: selectedType.id === 'other-vehicle' ? colors.navy : colors.border,
                      borderWidth: selectedType.id === 'other-vehicle' ? 2 : 1,
                    }]}
                    onPress={() => setSelectedType(OTHER_VEHICLE as typeof VEHICLE_TYPES[0])}
                  >
                    <Text style={{ fontSize: 18 }}>🚗</Text>
                    <Text style={[styles.vehicleGridName, { color: selectedType.id === 'other-vehicle' ? '#fff' : colors.foreground }]} numberOfLines={2}>
                      अन्य वाहन
                    </Text>
                    <Text style={[styles.vehicleGridLoad, { color: selectedType.id === 'other-vehicle' ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>
                      Other
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.divider, { borderColor: colors.border }]} />

              <Input label="गाड़ी नंबर (RC)" placeholder="जैसे: RJ14CA0001" value={form.vehicleNumber} onChangeText={(v) => set('vehicleNumber', v)} autoCapitalize="characters" icon="credit-card" required />
              <Input label="RC Book नंबर" placeholder="RC नंबर" value={form.rcNumber} onChangeText={(v) => set('rcNumber', v)} autoCapitalize="characters" icon="file-text" required />
              <Input label="RC एक्सपायरी" placeholder="DD/MM/YYYY" value={form.rcExpiry} onChangeText={(v) => set('rcExpiry', v)} icon="calendar" required />
              <Input label="Model (वैकल्पिक)" placeholder="जैसे: Tata 407" value={form.model} onChangeText={(v) => set('model', v)} />
              <Input label="Year (वैकल्पिक)" placeholder="जैसे: 2020" value={form.year} onChangeText={(v) => set('year', v)} keyboardType="numeric" maxLength={4} />
              <Input label="Insurance एक्सपायरी (वैकल्पिक)" placeholder="DD/MM/YYYY" value={form.insuranceExpiry} onChangeText={(v) => set('insuranceExpiry', v)} icon="shield" />
              <Button title="गाड़ी जोड़ें" onPress={handleAdd} loading={loading} />
              <View style={{ height: 30 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function DocChip({ label, value }: { label: string; value: string }) {
  const colors = useColors();
  return (
    <View style={[docStyles.chip, { backgroundColor: colors.muted }]}>
      <Text style={[docStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[docStyles.value, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const docStyles = StyleSheet.create({
  chip: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignItems: 'center' },
  label: { fontSize: 10, fontFamily: 'Inter_400Regular' },
  value: { fontSize: 12, fontFamily: 'Inter_500Medium' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_500Medium' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  vehicleCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  vehicleTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  vehicleTypeName: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  vehicleNumber: { fontSize: 22, fontFamily: 'Inter_700Bold', paddingHorizontal: 12, paddingTop: 10 },
  vehicleModel: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingHorizontal: 12, paddingBottom: 4 },
  docsRow: { flexDirection: 'row', gap: 8, padding: 12, flexWrap: 'wrap' },
  addMoreBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  addMoreTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  addMoreSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sheetBody: { padding: 20 },
  sectionLabel: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  weightFilterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  weightChip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  weightChipText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  selectedInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 16 },
  selectedName: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  selectedMeta: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  wheelBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  wheelBadgeText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  vehicleBracket: { borderRadius: 14, borderWidth: 1, padding: 10, marginBottom: 16 },
  vehicleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vehicleGridItem: { borderRadius: 10, padding: 10, width: '48%', alignItems: 'center', gap: 4 },
  vehicleGridName: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  vehicleGridLoad: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  wBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 2 },
  wBadgeText: { fontSize: 10, fontFamily: 'Inter_700Bold' },
  divider: { borderTopWidth: 1, marginBottom: 16, marginTop: 4 },
});
