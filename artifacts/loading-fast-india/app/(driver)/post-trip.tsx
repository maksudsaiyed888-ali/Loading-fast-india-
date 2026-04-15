import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { INDIA_STATES } from '@/lib/types';
import { calcCommission, formatCurrency, generateId } from '@/lib/utils';

export default function PostTripScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, getDriverVehicles, addTrip } = useApp();
  const [loading, setLoading] = useState(false);

  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const [selectedVehicle, setSelectedVehicle] = useState(myVehicles[0] || null);

  const [form, setForm] = useState({
    fromCity: '', fromState: 'राजस्थान',
    toCity: '', toState: 'राजस्थान',
    loadTons: '', rentPerTon: '', totalRent: '',
    tripDate: new Date().toISOString().split('T')[0],
    description: '',
    usePerTon: false,
    paymentType: 'sender' as 'sender' | 'receiver',
  });

  const set = (k: string, v: string | boolean) => setForm((p) => ({ ...p, [k]: v }));

  const calcTotal = () => {
    const tons = parseFloat(form.loadTons) || 0;
    const perTon = parseFloat(form.rentPerTon) || 0;
    if (form.usePerTon && tons > 0 && perTon > 0) {
      set('totalRent', String(tons * perTon));
    }
  };

  const commission = calcCommission(parseFloat(form.totalRent) || 0);

  const handlePost = async () => {
    if (!selectedVehicle) { Alert.alert('त्रुटि', 'पहले गाड़ी जोड़ें'); return; }
    if (!form.fromCity.trim() || !form.toCity.trim()) { Alert.alert('त्रुटि', 'From/To शहर जरूरी है'); return; }
    if (!form.loadTons || parseFloat(form.loadTons) <= 0) { Alert.alert('त्रुटि', 'माल का वजन जरूरी है'); return; }
    const total = parseFloat(form.totalRent) || 0;
    if (total <= 0) { Alert.alert('त्रुटि', 'किराया जरूरी है'); return; }

    setLoading(true);
    try {
      const tripId = generateId();
      await addTrip({
        id: tripId,
        driverId: user!.id,
        driverName: user!.name,
        driverPhone: user!.phone,
        vehicleId: selectedVehicle.id,
        vehicleNumber: selectedVehicle.vehicleNumber,
        vehicleType: selectedVehicle.vehicleType,
        vehicleTypeName: selectedVehicle.vehicleTypeName,
        fromCity: form.fromCity.trim(),
        fromState: form.fromState,
        toCity: form.toCity.trim(),
        toState: form.toState,
        loadTons: parseFloat(form.loadTons),
        rentPerTon: parseFloat(form.rentPerTon) || 0,
        totalRent: total,
        tripDate: form.tripDate,
        description: form.description.trim(),
        status: 'available',
        commissionPaid: false,
        commissionAmount: commission,
        createdAt: new Date().toISOString(),
        paymentType: form.paymentType,
        paymentReceived: false,
      });
      Alert.alert('ट्रिप पोस्ट हुई!', 'आपकी ट्रिप सभी नज़दीकी व्यापारियों को दिख रही है।');
      setForm({ fromCity: '', fromState: 'राजस्थान', toCity: '', toState: 'राजस्थान', loadTons: '', rentPerTon: '', totalRent: '', tripDate: new Date().toISOString().split('T')[0], description: '', usePerTon: false, paymentType: 'sender' });
    } finally {
      setLoading(false);
    }
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>ट्रिप पोस्ट करें</Text>
        <Text style={styles.sub}>नज़दीकी व्यापारियों को notification मिलेगी</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.body, { paddingBottom: 100 }]} keyboardShouldPersistTaps="handled">
        {myVehicles.length === 0 ? (
          <View style={[styles.noVehicle, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={24} color={colors.mutedForeground} />
            <Text style={[styles.noVehicleText, { color: colors.mutedForeground }]}>पहले गाड़ी जोड़ें, फिर ट्रिप पोस्ट करें</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionLabel, { color: colors.secondary }]}>गाड़ी चुनें *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.vehiclesScroll}>
              {myVehicles.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[styles.vehicleChip, {
                    backgroundColor: selectedVehicle?.id === v.id ? colors.primary : colors.card,
                    borderColor: selectedVehicle?.id === v.id ? colors.primary : colors.border,
                  }]}
                  onPress={() => setSelectedVehicle(v)}
                >
                  <Feather name="truck" size={16} color={selectedVehicle?.id === v.id ? '#fff' : colors.primary} />
                  <Text style={[styles.vehicleChipNum, { color: selectedVehicle?.id === v.id ? '#fff' : colors.foreground }]}>{v.vehicleNumber}</Text>
                  <Text style={[styles.vehicleChipType, { color: selectedVehicle?.id === v.id ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>{v.vehicleTypeName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.sectionLabel, { color: colors.secondary }]}>मार्ग (Route)</Text>
            <View style={styles.routeRow}>
              <View style={{ flex: 1 }}>
                <Input label="From - शहर" placeholder="कहाँ से" value={form.fromCity} onChangeText={(v) => set('fromCity', v)} icon="map-pin" />
              </View>
              <Feather name="arrow-right" size={20} color={colors.primary} style={{ marginTop: 18 }} />
              <View style={{ flex: 1 }}>
                <Input label="To - शहर" placeholder="कहाँ तक" value={form.toCity} onChangeText={(v) => set('toCity', v)} icon="navigation" />
              </View>
            </View>

            <Text style={[styles.sectionLabel, { color: colors.secondary }]}>माल और किराया</Text>
            <Input label="माल का वजन (टन में)" placeholder="जैसे: 10" value={form.loadTons} onChangeText={(v) => { set('loadTons', v); }} keyboardType="decimal-pad" icon="package" required />

            <View style={styles.rentToggle}>
              <TouchableOpacity style={[styles.rentToggleBtn, { backgroundColor: !form.usePerTon ? colors.primary : colors.card, borderColor: colors.primary }]} onPress={() => set('usePerTon', false)}>
                <Text style={{ color: !form.usePerTon ? '#fff' : colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>कुल किराया</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.rentToggleBtn, { backgroundColor: form.usePerTon ? colors.primary : colors.card, borderColor: colors.primary }]} onPress={() => set('usePerTon', true)}>
                <Text style={{ color: form.usePerTon ? '#fff' : colors.primary, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>प्रति टन</Text>
              </TouchableOpacity>
            </View>

            {form.usePerTon ? (
              <>
                <Input label="प्रति टन किराया (₹)" placeholder="जैसे: 500" value={form.rentPerTon} onChangeText={(v) => { set('rentPerTon', v); calcTotal(); }} keyboardType="decimal-pad" icon="dollar-sign" required />
                <Button title="कुल किराया कैलकुलेट करें" onPress={calcTotal} variant="outline" small style={{ marginBottom: 12 }} />
              </>
            ) : null}

            <Input label="कुल किराया ₹" placeholder="जैसे: 15000" value={form.totalRent} onChangeText={(v) => set('totalRent', v)} keyboardType="decimal-pad" icon="dollar-sign" required />

            {(parseFloat(form.totalRent) || 0) > 0 && (
              <View style={[styles.commissionPreview, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
                <View style={styles.commPreviewRow}>
                  <Text style={[styles.commLabel, { color: colors.mutedForeground }]}>कुल किराया</Text>
                  <Text style={[styles.commValue, { color: colors.foreground }]}>{formatCurrency(parseFloat(form.totalRent))}</Text>
                </View>
                <View style={styles.commPreviewRow}>
                  <Text style={[styles.commLabel, { color: colors.mutedForeground }]}>2% Commission (LFI)</Text>
                  <Text style={[styles.commValue, { color: colors.primary }]}>{formatCurrency(commission)}</Text>
                </View>
                <View style={[styles.commPreviewRow, styles.netRow]}>
                  <Text style={[styles.commLabel, { color: colors.success, fontFamily: 'Inter_600SemiBold' }]}>आपको मिलेगा</Text>
                  <Text style={[styles.commValue, { color: colors.success, fontSize: 18 }]}>{formatCurrency(parseFloat(form.totalRent) - commission)}</Text>
                </View>
              </View>
            )}

            <Input label="ट्रिप की तारीख" placeholder="YYYY-MM-DD" value={form.tripDate} onChangeText={(v) => set('tripDate', v)} icon="calendar" required />
            <Text style={[styles.sectionLabel, { color: colors.secondary, marginTop: 8 }]}>भुगतान कौन करेगा?</Text>
            <View style={styles.paymentRow}>
              <TouchableOpacity
                style={[styles.paymentBtn, {
                  backgroundColor: form.paymentType === 'sender' ? '#16a34a' : colors.card,
                  borderColor: form.paymentType === 'sender' ? '#16a34a' : colors.border,
                }]}
                onPress={() => set('paymentType', 'sender')}
              >
                <Feather name="user" size={15} color={form.paymentType === 'sender' ? '#fff' : colors.mutedForeground} />
                <Text style={[styles.paymentBtnText, { color: form.paymentType === 'sender' ? '#fff' : colors.foreground }]}>Sender Pay</Text>
                <Text style={[styles.paymentBtnSub, { color: form.paymentType === 'sender' ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>माल भेजने वाला (Default)</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentBtn, {
                  backgroundColor: form.paymentType === 'receiver' ? '#dc2626' : colors.card,
                  borderColor: form.paymentType === 'receiver' ? '#dc2626' : colors.border,
                }]}
                onPress={() => set('paymentType', 'receiver')}
              >
                <Feather name="user-check" size={15} color={form.paymentType === 'receiver' ? '#fff' : colors.mutedForeground} />
                <Text style={[styles.paymentBtnText, { color: form.paymentType === 'receiver' ? '#fff' : colors.foreground }]}>Receiver Pay</Text>
                <Text style={[styles.paymentBtnSub, { color: form.paymentType === 'receiver' ? 'rgba(255,255,255,0.8)' : colors.mutedForeground }]}>माल पाने वाला</Text>
              </TouchableOpacity>
            </View>

            {form.paymentType === 'receiver' && (
              <View style={[styles.paymentWarning, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                <Feather name="alert-triangle" size={16} color="#E65100" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.paymentWarningTitle}>⚠️ Payment Risk हो सकता है!</Text>
                  <Text style={styles.paymentWarningText}>
                    Receiver Pay में payment मिलने की गारंटी नहीं होती। माल deliver होने के बाद receiver payment देने से मना कर सकता है। सावधानी बरतें।
                  </Text>
                </View>
              </View>
            )}

            <Input label="विवरण (वैकल्पिक)" placeholder="माल का प्रकार, शर्तें आदि" value={form.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={3} />

            <Button title="ट्रिप पोस्ट करें" onPress={handlePost} loading={loading} style={{ marginTop: 8 }} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  body: { padding: 16 },
  noVehicle: { padding: 24, borderRadius: 14, borderWidth: 1, alignItems: 'center', gap: 8 },
  noVehicleText: { fontSize: 14, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10, marginTop: 4 },
  vehiclesScroll: { marginBottom: 16 },
  vehicleChip: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginRight: 10, minWidth: 120, alignItems: 'center', gap: 4 },
  vehicleChipNum: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  vehicleChipType: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rentToggle: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  rentToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center', borderWidth: 1.5 },
  commissionPreview: { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 14 },
  paymentRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  paymentBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', gap: 4 },
  paymentBtnText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  paymentBtnSub: { fontSize: 10.5, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  paymentWarning: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1.5, marginBottom: 14, alignItems: 'flex-start' },
  paymentWarningTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#E65100', marginBottom: 4 },
  paymentWarningText: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#BF360C', lineHeight: 17 },
  commPreviewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  commLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  commValue: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  netRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 4, borderTopColor: 'rgba(0,0,0,0.08)' },
});
