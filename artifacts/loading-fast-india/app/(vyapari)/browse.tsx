import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState, useMemo } from 'react';
import { Alert, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { VEHICLE_TYPES, GOODS_CATEGORIES, COMMISSION_UPI, Trip, Bilty } from '@/lib/types';
import { calcCommission, formatCurrency, generateBiltyNumber, generateId } from '@/lib/utils';

const ADVANCE_AMOUNT = 1000;
const ADVANCE_UPI = 'maksudsaiyed888@oksbi';
const ADVANCE_UPI_NAME = 'Loading%20Fast%20India';

export default function BrowseTripsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentVyapari, getAvailableTrips, updateTrip, addBilty, refreshAll } = useApp();
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
  const [step, setStep] = useState<1 | 2>(1);
  const [advancePaid, setAdvancePaid] = useState(false);
  const [loading, setLoading] = useState(false);

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
    setStep(1);
    setAdvancePaid(false);
    setConfirmModal(true);
  };

  const closeModal = () => {
    setConfirmModal(false);
    setStep(1);
    setAdvancePaid(false);
  };

  const selectedCatObj = GOODS_CATEGORIES.find(c => c.id === selectedGoodsCat);
  const finalGoodsType = selectedGoodsCat === 'other' ? customGoods : selectedGoodsItem;
  const finalGoodsCatName = selectedCatObj ? `${selectedCatObj.icon} ${selectedCatObj.name}` : '';

  const openUpiPayment = () => {
    const upiUrl = `upi://pay?pa=${ADVANCE_UPI}&pn=${ADVANCE_UPI_NAME}&am=${ADVANCE_AMOUNT}&cu=INR&tn=LFI+Advance`;
    Linking.openURL(upiUrl).catch(() => {
      Alert.alert('UPI App नहीं मिला', `UPI ID पर manually ₹${ADVANCE_AMOUNT} bhejein:\n${ADVANCE_UPI}`);
    });
  };

  const handleAdvanceDone = () => {
    Alert.alert(
      '₹1000 Advance Confirm करें',
      `क्या आपने Loading Fast India (${ADVANCE_UPI}) को ₹1000 advance भेज दिया?`,
      [
        { text: 'हाँ, भेज दिया', onPress: () => { setAdvancePaid(true); setStep(2); } },
        { text: 'नहीं', style: 'cancel' },
      ]
    );
  };

  const handleBookTrip = async () => {
    if (!selectedTrip || !user || !currentVyapari) return;
    if (!advancePaid) {
      Alert.alert('Advance जरूरी है', 'Trip share करने से पहले ₹1000 advance दें।');
      return;
    }
    setLoading(true);
    try {
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
        advancePaid: true,
        advanceAmount: ADVANCE_AMOUNT,
      };
      await addBilty(bilty);
      await updateTrip(selectedTrip.id, {
        status: 'confirmed',
        confirmedBy: user.id,
        confirmedByName: currentVyapari.name,
        confirmedAt: new Date().toISOString(),
        commissionPaid: true,
        paymentType: 'sender',
      });
      setConfirmModal(false);
      setSelectedBilty(bilty);
    } finally {
      setLoading(false);
    }
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
            <TripCard key={trip.id} trip={trip} showActions onConfirm={() => handleConfirm(trip)} />
          ))
        )}
      </ScrollView>

      <Modal visible={confirmModal} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.overlay}>
          <View style={[styles.confirmSheet, { backgroundColor: colors.background }]}>
            <View style={[styles.confirmHeader, { borderBottomColor: colors.border }]}>
              <View>
                <Text style={[styles.confirmTitle, { color: colors.foreground }]}>ट्रिप बुक करें</Text>
                <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
                  {step === 1 ? 'Step 1 of 2 — माल व Advance' : 'Step 2 of 2 — Confirm Booking'}
                </Text>
              </View>
              <TouchableOpacity onPress={closeModal}>
                <Feather name="x" size={22} color={colors.foreground} />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <ScrollView style={styles.confirmBody} showsVerticalScrollIndicator={false}>

                {/* Trip Info */}
                <View style={[styles.confirmCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.confirmRoute, { color: colors.foreground }]}>{selectedTrip.fromCity} → {selectedTrip.toCity}</Text>
                  <Text style={[styles.confirmType, { color: colors.mutedForeground }]}>{selectedTrip.vehicleTypeName} • {selectedTrip.loadTons} टन</Text>
                </View>

                {step === 1 ? (
                  <>
                    {/* Rent — Sender Pays Box */}
                    <View style={[styles.senderPayBox, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                      <View style={styles.senderPayTop}>
                        <Text style={styles.senderPayIcon}>💰</Text>
                        <Text style={[styles.senderPayTitle, { color: '#B71C1C' }]}>Rent आपको देना होगा</Text>
                      </View>
                      <Text style={[styles.senderPayText, { color: '#BF360C' }]}>
                        इस trip में किराया <Text style={{ fontFamily: 'Inter_700Bold' }}>आप (माल भेजने वाले)</Text> को driver को देना होगा।{'\n'}
                        कुल किराया: <Text style={{ fontFamily: 'Inter_700Bold' }}>{formatCurrency(selectedTrip.totalRent)}</Text> — driver को loading के समय दें।
                      </Text>
                    </View>

                    {/* Goods Selector */}
                    <View style={[styles.goodsSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                      <Text style={[styles.goodsTitle, { color: colors.secondary }]}>📦 माल का प्रकार चुनें</Text>
                      <Text style={[styles.goodsSub, { color: colors.mutedForeground }]}>कौनसा माल भेजना है?</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                        {GOODS_CATEGORIES.map((cat) => (
                          <TouchableOpacity
                            key={cat.id}
                            style={[styles.catChip, { backgroundColor: selectedGoodsCat === cat.id ? colors.primary : colors.muted, borderColor: selectedGoodsCat === cat.id ? colors.primary : colors.border }]}
                            onPress={() => { setSelectedGoodsCat(cat.id); setSelectedGoodsItem(''); setCustomGoods(''); }}
                          >
                            <Text style={[styles.catChipText, { color: selectedGoodsCat === cat.id ? '#fff' : colors.foreground }]}>{cat.icon} {cat.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      {selectedCatObj?.needsCold && (
                        <View style={[styles.coldWarning, { backgroundColor: '#E3F2FD', borderColor: '#1976D2' }]}>
                          <Text style={styles.coldText}>🧊 इस माल के लिए Refrigerated गाड़ी जरूरी है!</Text>
                        </View>
                      )}
                      {selectedCatObj && selectedCatObj.id !== 'other' && selectedCatObj.items.length > 0 && (
                        <View style={styles.itemsWrap}>
                          <Text style={[styles.itemsLabel, { color: colors.mutedForeground }]}>माल चुनें:</Text>
                          <View style={styles.itemsGrid}>
                            {selectedCatObj.items.map((item) => (
                              <TouchableOpacity
                                key={item}
                                style={[styles.itemChip, { backgroundColor: selectedGoodsItem === item ? colors.secondary : colors.muted, borderColor: selectedGoodsItem === item ? colors.secondary : colors.border }]}
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
                          <Text style={[styles.selectedGoodsText, { color: colors.success }]}>✓ {finalGoodsCatName}{finalGoodsType ? ` — ${finalGoodsType}` : ''}</Text>
                        </View>
                      )}
                    </View>

                    {/* ₹1000 Advance Box */}
                    <View style={[styles.advanceBox, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
                      <View style={styles.advanceHeader}>
                        <Text style={styles.advanceIcon}>🏦</Text>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.advanceTitle, { color: '#1B5E20' }]}>₹1,000 Advance — Loading Fast India</Text>
                          <Text style={[styles.advanceSub, { color: '#2E7D32' }]}>Trip share करने से पहले ₹1000 advance देना अनिवार्य है</Text>
                        </View>
                      </View>
                      <View style={[styles.advanceUpiBox, { backgroundColor: '#fff', borderColor: '#4CAF50' }]}>
                        <Text style={[styles.advanceUpiLabel, { color: '#388E3C' }]}>UPI ID</Text>
                        <Text style={[styles.advanceUpiValue, { color: '#1B5E20' }]}>{ADVANCE_UPI}</Text>
                        <Text style={[styles.advanceUpiName, { color: '#388E3C' }]}>Loading Fast India</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.advancePayBtn, { backgroundColor: '#2E7D32' }]}
                        onPress={openUpiPayment}
                      >
                        <Feather name="smartphone" size={16} color="#fff" />
                        <Text style={styles.advancePayBtnText}>UPI से ₹1,000 भेजें</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.advanceDoneBtn, { borderColor: '#2E7D32' }]}
                        onPress={handleAdvanceDone}
                      >
                        <Feather name="check-circle" size={16} color="#2E7D32" />
                        <Text style={[styles.advanceDoneBtnText, { color: '#2E7D32' }]}>Maine ₹1,000 de diya → Aage Barhe</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={[styles.legalNote, { borderColor: colors.destructive + '30', backgroundColor: colors.destructive + '08' }]}>
                      <Feather name="alert-triangle" size={14} color={colors.destructive} />
                      <Text style={[styles.legalText, { color: colors.destructive }]}>
                        Trip confirm करने के बाद किराया न देने पर IPC 420 के तहत कार्यवाही होगी।
                      </Text>
                    </View>
                  </>
                ) : (
                  <>
                    {/* Advance Paid Confirmation */}
                    <View style={[styles.advancePaidBadge, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
                      <Feather name="check-circle" size={20} color="#2E7D32" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.advancePaidTitle, { color: '#1B5E20' }]}>₹1,000 Advance दे दिया ✓</Text>
                        <Text style={[styles.advancePaidSub, { color: '#388E3C' }]}>Loading Fast India को advance confirm है</Text>
                      </View>
                    </View>

                    {/* Payment Breakdown */}
                    <View style={[styles.paymentBreakdown, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
                      <Text style={[styles.payTitle, { color: colors.secondary }]}>Payment Breakdown</Text>
                      <PayRow label="कुल किराया" value={formatCurrency(selectedTrip.totalRent)} />
                      <PayRow label="✅ ₹1,000 Advance (LFI को दिया)" value={formatCurrency(ADVANCE_AMOUNT)} highlight />
                      <PayRow label="2% Commission (LFI)" value={formatCurrency(calcCommission(selectedTrip.totalRent))} highlight />
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                      <PayRow label="ड्राइवर को किराया (loading पर)" value={formatCurrency(selectedTrip.totalRent - calcCommission(selectedTrip.totalRent))} bold />
                    </View>

                    {/* Rent reminder */}
                    <View style={[styles.senderPayBox, { backgroundColor: '#FFF3E0', borderColor: '#E65100' }]}>
                      <View style={styles.senderPayTop}>
                        <Text style={styles.senderPayIcon}>💰</Text>
                        <Text style={[styles.senderPayTitle, { color: '#B71C1C' }]}>Rent याद रखें — आपको देना होगा</Text>
                      </View>
                      <Text style={[styles.senderPayText, { color: '#BF360C' }]}>
                        Driver को loading के समय <Text style={{ fontFamily: 'Inter_700Bold' }}>{formatCurrency(selectedTrip.totalRent - calcCommission(selectedTrip.totalRent))}</Text> किराया दें।
                      </Text>
                    </View>

                    <Button title="ट्रिप Confirm करें ✓" onPress={handleBookTrip} loading={loading} />
                    <View style={{ height: 24 }} />
                  </>
                )}
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
  confirmSheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  confirmHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  confirmTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  stepLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  confirmBody: { padding: 20 },
  confirmCard: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  confirmRoute: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  confirmType: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  senderPayBox: { borderRadius: 14, borderWidth: 2, padding: 14, marginBottom: 14 },
  senderPayTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  senderPayIcon: { fontSize: 22 },
  senderPayTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  senderPayText: { fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 20 },
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
  advanceBox: { borderRadius: 16, borderWidth: 2, padding: 16, marginBottom: 14, gap: 12 },
  advanceHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  advanceIcon: { fontSize: 26 },
  advanceTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', marginBottom: 3 },
  advanceSub: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  advanceUpiBox: { borderRadius: 12, borderWidth: 1.5, padding: 12, alignItems: 'center', gap: 2 },
  advanceUpiLabel: { fontSize: 11, fontFamily: 'Inter_500Medium', textTransform: 'uppercase', letterSpacing: 1 },
  advanceUpiValue: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  advanceUpiName: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  advancePayBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  advancePayBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  advanceDoneBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 2, backgroundColor: '#F1F8E9' },
  advanceDoneBtnText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  advancePaidBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 14 },
  advancePaidTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  advancePaidSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  paymentBreakdown: { borderRadius: 12, padding: 14, marginBottom: 14, borderWidth: 1 },
  payTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase' },
  divider: { height: 1, marginVertical: 8 },
  legalNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  legalText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
