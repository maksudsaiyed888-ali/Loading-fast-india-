import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useMemo } from 'react';
import { Alert, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { VEHICLE_TYPES, GOODS_CATEGORIES, COMMISSION_UPI, Trip, Bilty } from '@/lib/types';
import { TextInput } from 'react-native';
import { calcCommission, formatCurrency, generateBiltyNumber, generateId } from '@/lib/utils';

export default function BrowseTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getAvailableTrips, updateTrip, addBilty, bilties, refreshAll } = useApp();
  const [refreshing, setRefreshing] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [confirmModal, setConfirmModal] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [selectedGoodsCat, setSelectedGoodsCat] = useState('');
  const [selectedGoodsItem, setSelectedGoodsItem] = useState('');
  const [customGoods, setCustomGoods] = useState('');

  const availableTrips = getAvailableTrips();

  const filtered = useMemo(() => {
    return availableTrips.filter((t) => {
      const fromMatch = !searchFrom || t.fromCity.toLowerCase().includes(searchFrom.toLowerCase()) || t.fromState.toLowerCase().includes(searchFrom.toLowerCase());
      const toMatch = !searchTo || t.toCity.toLowerCase().includes(searchTo.toLowerCase()) || t.toState.toLowerCase().includes(searchTo.toLowerCase());
      const typeMatch = !selectedVehicleType || t.vehicleType === selectedVehicleType;
      return fromMatch && toMatch && typeMatch;
    });
  }, [availableTrips, searchFrom, searchTo, selectedVehicleType]);

  const onRefresh = async () => { setRefreshing(true); await refreshAll(); setRefreshing(false); };

  const handleConfirm = (trip: Trip) => {
    setSelectedTrip(trip);
    setSelectedGoodsCat('');
    setSelectedGoodsItem('');
    setCustomGoods('');
    setConfirmModal(true);
  };

  const selectedCatObj = GOODS_CATEGORIES.find(c => c.id === selectedGoodsCat);
  const finalGoodsType = selectedGoodsCat === 'other' ? customGoods : selectedGoodsItem;
  const finalGoodsCatName = selectedCatObj ? `${selectedCatObj.icon} ${selectedCatObj.name}` : '';

  const handlePayAndConfirm = async () => {
    if (!selectedTrip || !user || !currentVyapari) return;
    const commission = calcCommission(selectedTrip.totalRent);
    const biltyId = generateId();
    const bilty: Bilty = {
      id: biltyId,
      tripId: selectedTrip.id,
      driverId: selectedTrip.driverId,
      driverName: selectedTrip.driverName,
      driverPhone: selectedTrip.driverPhone,
      vyapariId: user.id,
      vyapariName: currentVyapari.name,
      vyapariPhone: currentVyapari.phone,
      vehicleNumber: selectedTrip.vehicleNumber,
      vehicleType: selectedTrip.vehicleTypeName,
      fromCity: selectedTrip.fromCity,
      toCity: selectedTrip.toCity,
      loadTons: selectedTrip.loadTons,
      totalRent: selectedTrip.totalRent,
      commissionAmount: commission,
      netRent: selectedTrip.totalRent - commission,
      upiRef: COMMISSION_UPI,
      createdAt: new Date().toISOString(),
      biltyNumber: generateBiltyNumber(),
      goodsCategory: finalGoodsCatName || undefined,
      goodsType: finalGoodsType || undefined,
      needsColdStorage: selectedCatObj?.needsCold || false,
    };
    await addBilty(bilty);
    await updateTrip(selectedTrip.id, {
      status: 'confirmed',
      confirmedBy: user.id,
      confirmedByName: currentVyapari.name,
      confirmedAt: new Date().toISOString(),
      commissionPaid: true,
    });
    setConfirmModal(false);
    setSelectedBilty(bilty);
    Alert.alert(
      'बुकिंग confirmed!',
      `ट्रिप बुक हो गई। ₹${commission} commission भेजें:\n${COMMISSION_UPI}`,
      [
        { text: 'UPI से भुगतान करें', onPress: () => Linking.openURL(`upi://pay?pa=${COMMISSION_UPI}&pn=Loading%20Fast%20India&am=${commission}&cu=INR`) },
        { text: 'बाद में', style: 'cancel' },
      ]
    );
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.header, { paddingTop: top }]}>
        <Text style={styles.title}>ट्रिप खोजें</Text>
        <Text style={styles.sub}>{filtered.length} ट्रिप उपलब्ध</Text>

        <View style={styles.searchRow}>
          <Input placeholder="कहाँ से?" value={searchFrom} onChangeText={setSearchFrom} icon="map-pin" containerStyle={styles.searchInput} />
          <Input placeholder="कहाँ तक?" value={searchTo} onChangeText={setSearchTo} icon="navigation" containerStyle={styles.searchInput} />
        </View>
      </LinearGradient>

      <View style={[styles.vehicleTypeFilter, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.typeChip, { backgroundColor: !selectedVehicleType ? colors.primary : colors.muted, borderColor: !selectedVehicleType ? colors.primary : colors.border }]}
            onPress={() => setSelectedVehicleType('')}
          >
            <Text style={[styles.typeChipText, { color: !selectedVehicleType ? '#fff' : colors.foreground }]}>सभी</Text>
          </TouchableOpacity>
          {VEHICLE_TYPES.map((vt) => (
            <TouchableOpacity
              key={vt.id}
              style={[styles.typeChip, { backgroundColor: selectedVehicleType === vt.id ? colors.primary : colors.muted, borderColor: selectedVehicleType === vt.id ? colors.primary : colors.border }]}
              onPress={() => setSelectedVehicleType(selectedVehicleType === vt.id ? '' : vt.id)}
            >
              <Text style={[styles.typeChipText, { color: selectedVehicleType === vt.id ? '#fff' : colors.foreground }]}>{vt.name}</Text>
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
            <Feather name="search" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>कोई ट्रिप नहीं मिली</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>फ़िल्टर बदलें या बाद में देखें</Text>
          </View>
        ) : (
          filtered.map((trip) => (
            <TripCard
              key={trip.id}
              trip={trip}
              showActions
              onConfirm={() => handleConfirm(trip)}
            />
          ))
        )}
      </ScrollView>

      <Modal visible={confirmModal} transparent animationType="slide" onRequestClose={() => setConfirmModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.confirmHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.confirmTitle, { color: colors.foreground }]}>ट्रिप बुक करें</Text>
              <TouchableOpacity onPress={() => setConfirmModal(false)}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>
            {selectedTrip && (
              <ScrollView style={styles.confirmBody}>
                <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.confirmRoute, { color: colors.foreground }]}>{selectedTrip.fromCity} → {selectedTrip.toCity}</Text>
                  <Text style={[styles.confirmType, { color: colors.mutedForeground }]}>{selectedTrip.vehicleTypeName} • {selectedTrip.loadTons} टन</Text>
                </View>

                {/* Goods Type Selector */}
                <View style={[styles.goodsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.goodsTitle, { color: colors.secondary }]}>📦 माल का प्रकार चुनें</Text>
                  <Text style={[styles.goodsSub, { color: colors.mutedForeground }]}>कौनसा माल भेजना है?</Text>

                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {GOODS_CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catChip, {
                          backgroundColor: selectedGoodsCat === cat.id ? colors.primary : colors.muted,
                          borderColor: selectedGoodsCat === cat.id ? colors.primary : colors.border,
                        }]}
                        onPress={() => { setSelectedGoodsCat(cat.id); setSelectedGoodsItem(''); setCustomGoods(''); }}
                      >
                        <Text style={[styles.catChipText, { color: selectedGoodsCat === cat.id ? '#fff' : colors.foreground }]}>
                          {cat.icon} {cat.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {selectedCatObj && selectedCatObj.needsCold && (
                    <View style={[styles.coldWarning, { backgroundColor: '#E3F2FD', borderColor: '#1976D2' }]}>
                      <Text style={styles.coldText}>🧊 इस माल के लिए Insulated / Refrigerated गाड़ी जरूरी है!</Text>
                    </View>
                  )}

                  {selectedCatObj && selectedCatObj.id !== 'other' && selectedCatObj.items.length > 0 && (
                    <View style={styles.itemsWrap}>
                      <Text style={[styles.itemsLabel, { color: colors.mutedForeground }]}>माल चुनें:</Text>
                      <View style={styles.itemsGrid}>
                        {selectedCatObj.items.map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[styles.itemChip, {
                              backgroundColor: selectedGoodsItem === item ? colors.secondary : colors.muted,
                              borderColor: selectedGoodsItem === item ? colors.secondary : colors.border,
                            }]}
                            onPress={() => setSelectedGoodsItem(item)}
                          >
                            <Text style={[styles.itemChipText, { color: selectedGoodsItem === item ? '#fff' : colors.foreground }]}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {selectedGoodsCat === 'other' && (
                    <TextInput
                      style={[styles.customInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.muted }]}
                      placeholder="माल का नाम लिखें..."
                      placeholderTextColor={colors.mutedForeground}
                      value={customGoods}
                      onChangeText={setCustomGoods}
                    />
                  )}

                  {(finalGoodsType || (selectedGoodsCat && selectedGoodsCat !== 'other')) && (
                    <View style={[styles.selectedGoods, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
                      <Text style={[styles.selectedGoodsText, { color: colors.success }]}>
                        ✓ {finalGoodsCatName}{finalGoodsType ? ` — ${finalGoodsType}` : ''}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={[styles.paymentBreakdown, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
                  <Text style={[styles.payTitle, { color: colors.secondary }]}>Payment Breakdown</Text>
                  <PayRow label="कुल किराया" value={formatCurrency(selectedTrip.totalRent)} />
                  <PayRow label="2% Commission (LFI)" value={formatCurrency(calcCommission(selectedTrip.totalRent))} highlight />
                  <PayRow label="UPI" value={COMMISSION_UPI} small />
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <PayRow label="ड्राइवर का किराया" value={formatCurrency(selectedTrip.totalRent - calcCommission(selectedTrip.totalRent))} bold />
                </View>

                <View style={[styles.legalNote, { borderColor: colors.destructive + '30', backgroundColor: colors.destructive + '08' }]}>
                  <Feather name="alert-triangle" size={14} color={colors.destructive} />
                  <Text style={[styles.legalText, { color: colors.destructive }]}>
                    ट्रिप confirm करने के बाद किराया न देने पर IPC 420 के तहत कड़ी कार्यवाही होगी।
                  </Text>
                </View>

                <Button title={`बुक करें • 2% Commission: ${formatCurrency(calcCommission(selectedTrip.totalRent))}`} onPress={handlePayAndConfirm} />
                <View style={{ height: 24 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />
    </View>
  );
}

function PayRow({ label, value, highlight, bold, small }: { label: string; value: string; highlight?: boolean; bold?: boolean; small?: boolean }) {
  const colors = useColors();
  return (
    <View style={payStyles.row}>
      <Text style={[payStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[payStyles.value, { color: highlight ? colors.primary : bold ? colors.success : colors.foreground }, bold && payStyles.boldValue, small && payStyles.smallValue]}>{value}</Text>
    </View>
  );
}

const payStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  value: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  boldValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  smallValue: { fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 8 },
  title: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  sub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4, marginBottom: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, marginBottom: 0 },
  vehicleTypeFilter: { paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1 },
  typeChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 6, borderWidth: 1.5 },
  typeChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  body: { padding: 16 },
  empty: { borderRadius: 14, padding: 40, alignItems: 'center', gap: 8, borderWidth: 1 },
  emptyText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  emptySub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  confirmSheet: { maxHeight: '80%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  confirmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  confirmTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  confirmBody: { padding: 20 },
  confirmCard: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  confirmRoute: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  confirmType: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  paymentBreakdown: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  payTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 8 },
  legalNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  legalText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  goodsSection: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  goodsTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  goodsSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  catScroll: { marginBottom: 10 },
  catChip: { borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, marginRight: 8, borderWidth: 1.5 },
  catChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  coldWarning: { borderRadius: 8, padding: 10, borderWidth: 1, marginBottom: 10 },
  coldText: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#1976D2' },
  itemsWrap: { marginBottom: 8 },
  itemsLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  itemsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  itemChip: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  itemChipText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  customInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 8 },
  selectedGoods: { borderRadius: 8, padding: 10, borderWidth: 1, marginTop: 8 },
  selectedGoodsText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
});
