import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { VEHICLE_TYPES } from '@/lib/types';
import { generateId } from '@/lib/utils';

export default function VehiclesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getDriverVehicles, addVehicle } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedType, setSelectedType] = useState(VEHICLE_TYPES[4]);

  const [form, setForm] = useState({
    vehicleNumber: '', model: '', year: '', rcNumber: '', rcExpiry: '', insuranceExpiry: '',
  });

  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

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
      setShowModal(false);
      setForm({ vehicleNumber: '', model: '', year: '', rcNumber: '', rcExpiry: '', insuranceExpiry: '' });
      Alert.alert('सफल!', 'गाड़ी जोड़ी गई');
    } finally {
      setLoading(false);
    }
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>मेरी गाड़ियां</Text>
        <Text style={styles.sub}>{myVehicles.length} गाड़ियां रजिस्टर्ड</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]}>
        {myVehicles.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="truck" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>कोई गाड़ी नहीं</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>नीचे + बटन से गाड़ी जोड़ें</Text>
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
              <Text style={[styles.sectionLabel, { color: colors.foreground }]}>गाड़ी का प्रकार चुनें *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typesScroll}>
                {VEHICLE_TYPES.map((vt) => (
                  <TouchableOpacity
                    key={vt.id}
                    style={[styles.typeChip, {
                      backgroundColor: selectedType.id === vt.id ? colors.primary : colors.card,
                      borderColor: selectedType.id === vt.id ? colors.primary : colors.border,
                    }]}
                    onPress={() => setSelectedType(vt)}
                  >
                    <Text style={[styles.typeChipText, { color: selectedType.id === vt.id ? '#fff' : colors.foreground }]}>
                      {vt.name}
                    </Text>
                    <Text style={[styles.typeLoad, { color: selectedType.id === vt.id ? 'rgba(255,255,255,0.7)' : colors.mutedForeground }]}>
                      {vt.maxLoad} टन
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
  value: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  body: { padding: 16 },
  empty: { borderRadius: 16, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1, marginTop: 20 },
  emptyTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  emptySub: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  vehicleCard: { borderRadius: 14, borderWidth: 1, marginBottom: 12, overflow: 'hidden' },
  vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderBottomWidth: 1 },
  vehicleTypeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  vehicleTypeName: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  activeBadgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  vehicleNumber: { fontSize: 22, fontFamily: 'Inter_700Bold', paddingHorizontal: 12, paddingTop: 10 },
  vehicleModel: { fontSize: 13, fontFamily: 'Inter_400Regular', paddingHorizontal: 12, paddingBottom: 4 },
  docsRow: { flexDirection: 'row', gap: 8, padding: 12, flexWrap: 'wrap' },
  fab: { position: 'absolute', bottom: 90, right: 20, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 8, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  sheetTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  sheetBody: { padding: 20 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  typesScroll: { marginBottom: 16 },
  typeChip: { borderWidth: 1.5, borderRadius: 10, padding: 10, marginRight: 8, minWidth: 100, alignItems: 'center' },
  typeChipText: { fontSize: 12, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  typeLoad: { fontSize: 10, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
