import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Linking, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import TripCard from '@/components/TripCard';
import BiltyModal from '@/components/BiltyModal';
import { Bilty, VyapariTrip, Bid } from '@/lib/types';
import { formatCurrency, generateId } from '@/lib/utils';

type Colors = ReturnType<typeof useColors>;

export default function DriverHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, currentDriver, getDriverTrips, getDriverVehicles, vehicles, bilties, refreshAll, getOpenVyapariTrips, vyapariTrips, addBid, getDriverBids, getTripBids } = useApp();
  const [bidModal, setBidModal] = useState(false);
  const [bidTrip, setBidTrip] = useState<VyapariTrip | null>(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedBilty, setSelectedBilty] = useState<Bilty | null>(null);
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchFrom, setSearchFrom] = useState('');
  const [searchTo, setSearchTo] = useState('');

  const myTrips = user ? getDriverTrips(user.id) : [];
  const myVehicles = user ? getDriverVehicles(user.id) : [];
  const activeTrips = myTrips.filter((t) => t.status === 'confirmed');
  const myBilties = bilties.filter((b) => b.driverId === user?.id);
  const openVyapariTrips = getOpenVyapariTrips();
  const myBids = user ? getDriverBids(user.id) : [];
  const myAcceptedVyapariTrips = user ? vyapariTrips.filter(t => t.acceptedByDriverId === user.id && ['advance_pending','accepted','loading','on_way'].includes(t.status)) : [];
  const myCompletedVyapariTrips = user ? vyapariTrips.filter(t => t.acceptedByDriverId === user.id && t.status === 'completed') : [];

  const handleBidSubmit = async () => {
    if (!bidTrip || !user || !currentDriver) return;
    const amt = parseFloat(bidAmount);
    if (!amt || amt <= 0) { Alert.alert('गलत राशि', 'सही bid amount डालें'); return; }
    const myVehicle = myVehicles[0];
    const bid: Bid = {
      id: generateId(),
      tripId: bidTrip.id,
      driverId: user.id,
      driverName: currentDriver.name,
      driverPhone: currentDriver.phone,
      vehicleType: myVehicle?.vehicleType || '',
      vehicleTypeName: myVehicle?.vehicleTypeName || '',
      vehicleNumber: myVehicle?.vehicleNumber || '',
      bidAmount: amt,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    setSubmittingBid(true);
    try {
      await addBid(bid);
      setBidModal(false);
      setBidAmount('');
      Alert.alert('✅ Bid लगाई गई!', `आपकी ₹${amt.toLocaleString('en-IN')} की bid submit हो गई। व्यापारी जल्द ही reply करेगा।`);
    } finally {
      setSubmittingBid(false);
    }
  };

  // Return load: find last completed trip's toCity, then show open trips from that city
  const lastCompletedVyapariTrip = [...myCompletedVyapariTrips]
    .sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime())[0];
  const returnCity = lastCompletedVyapariTrip?.toCity?.trim().toLowerCase();
  const returnLoadTrips = returnCity
    ? openVyapariTrips.filter(t => t.fromCity.trim().toLowerCase() === returnCity)
    : [];

  // Manual search results
  const manualResults = (searchFrom.trim().length >= 2 || searchTo.trim().length >= 2)
    ? openVyapariTrips.filter(t => {
        const from = t.fromCity.trim().toLowerCase();
        const to = t.toCity.trim().toLowerCase();
        const sf = searchFrom.trim().toLowerCase();
        const st = searchTo.trim().toLowerCase();
        const fromMatch = sf.length < 2 || from.includes(sf);
        const toMatch = st.length < 2 || to.includes(st);
        return fromMatch && toMatch;
      })
    : [];

  const recentlyTakenTrips = vyapariTrips.filter(t => {
    if (t.status !== 'accepted') return false;
    if (t.acceptedByDriverId === user?.id) return false;
    const minsAgo = (Date.now() - new Date(t.acceptedAt || t.createdAt).getTime()) / 60000;
    return minsAgo <= 30;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshAll();
    setRefreshing(false);
  };

  const handleViewBilty = (tripId: string) => {
    const b = bilties.find((b) => b.tripId === tripId);
    if (b) setSelectedBilty(b);
    else Alert.alert('बिलटी नहीं मिली', 'इस ट्रिप की बिलटी अभी नहीं बनी है।');
  };

  const top = insets.top + (Platform.OS === 'web' ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.navy]} style={[styles.header, { paddingTop: top }]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>नमस्ते, {currentDriver?.name || user?.name}</Text>
            <Text style={styles.subGreeting}>ड्राइवर डैशबोर्ड • Loading Fast India</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Feather name="bell" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="गाड़ियां" value={String(myVehicles.length)} icon="truck" />
          <StatCard label="कुल ट्रिप" value={String(myTrips.length)} icon="map" />
          <StatCard label="बिलटी" value={String(myBilties.length)} icon="file-text" />
          <StatCard label="Active" value={String(activeTrips.length)} icon="zap" />
        </View>
      </LinearGradient>

      {/* GPS Strict Warning Banner — Always Visible */}
      <View style={[gpsBanner.box, { backgroundColor: '#DC262610', borderColor: '#DC2626' }]}>
        <View style={gpsBanner.row}>
          <Feather name="navigation" size={16} color="#DC2626" />
          <Text style={gpsBanner.title}>🔴 GPS अनिवार्य निर्देश</Text>
        </View>
        <Text style={gpsBanner.line}>ट्रिप के दौरान GPS और Mobile हर हाल में चालू रखें।</Text>
        <Text style={gpsBanner.line}>GPS बंद = IPC 406/378 के तहत FIR। कोई बहाना मान्य नहीं।</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.body, { paddingBottom: 100 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {myVehicles.length === 0 && (
          <TouchableOpacity
            style={[styles.addVehicleCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => router.push('/(driver)/vehicles')}
          >
            <Feather name="plus-circle" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.addVehicleTitle, { color: colors.primary }]}>पहली गाड़ी जोड़ें</Text>
              <Text style={[styles.addVehicleSub, { color: colors.mutedForeground }]}>Add Vehicle to start posting trips</Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}

        {myBids.filter(b => b.status === 'pending').length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>⏳ मेरी Pending Bids</Text>
            {myBids.filter(b => b.status === 'pending').slice(0, 3).map(b => {
              const trip = vyapariTrips.find(t => t.id === b.tripId);
              if (!trip) return null;
              return (
                <View key={b.id} style={[vtStyles.card, { backgroundColor: colors.card, borderColor: '#f59e0b40' }]}>
                  <View style={vtStyles.row}>
                    <View style={[vtStyles.badge, { backgroundColor: '#fef3c710' }]}><Text style={[vtStyles.badgeText, { color: '#d97706' }]}>⏳ Bid Pending</Text></View>
                    <Text style={[vtStyles.date, { color: colors.mutedForeground }]}>₹{b.bidAmount.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={[vtStyles.route, { color: colors.foreground }]}>{trip.fromCity} → {trip.toCity}</Text>
                  <Text style={[vtStyles.detailText, { color: colors.mutedForeground }]}>{trip.goodsCategory} • {trip.weightTons} टन</Text>
                </View>
              );
            })}
          </View>
        )}

        {myAcceptedVyapariTrips.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🚛 मेरी Active Trips</Text>
            {myAcceptedVyapariTrips.map((vt) => {
              const statusLabel = vt.status === 'advance_pending' ? '💰 Advance का इंतजार' : vt.status === 'accepted' ? '✅ Advance मिला — Trip शुरू करें' : vt.status === 'loading' ? '📦 Loading हो रही है' : '🚛 रास्ते में';
              const statusColor = vt.status === 'advance_pending' ? '#f59e0b' : vt.status === 'accepted' ? '#16a34a' : '#2563eb';
              return (
                <View key={vt.id} style={[vtStyles.card, { backgroundColor: colors.card, borderColor: statusColor + '40' }]}>
                  <View style={vtStyles.row}>
                    <View style={[vtStyles.badge, { backgroundColor: statusColor + '18' }]}><Text style={[vtStyles.badgeText, { color: statusColor }]}>{statusLabel}</Text></View>
                    <Text style={[vtStyles.date, { color: colors.mutedForeground }]}>₹{(vt.acceptedBidAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={[vtStyles.route, { color: colors.foreground }]}>{vt.fromCity} → {vt.toCity}</Text>
                  <Text style={[vtStyles.detailText, { color: colors.mutedForeground }]}>{vt.goodsCategory} • {vt.weightTons} टन</Text>
                  {vt.driverDetailsRevealed && vt.status !== 'advance_pending' && (
                    <View style={[{ backgroundColor: '#E8F5E9', borderRadius: 8, padding: 8, marginTop: 6 }]}>
                      <Text style={{ color: '#1B5E20', fontSize: 12, fontFamily: 'Inter_700Bold' }}>✅ Wallet: ₹{(vt.driverWalletAmount || 0).toLocaleString('en-IN')} Locked</Text>
                      <Text style={{ color: '#388E3C', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 }}>Trip complete होने पर unlock होगा</Text>
                    </View>
                  )}
                  {vt.driverDetailsRevealed && (
                    <View style={vtStyles.actionRow}>
                      <TouchableOpacity style={[vtStyles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]} onPress={() => Linking.openURL(`tel:${vt.vyapariPhone}`)}>
                        <Feather name="phone" size={14} color="#fff" /><Text style={vtStyles.actionBtnText}>Call व्यापारी</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 6, fontFamily: 'Inter_400Regular' }}>
                    OTP flow → My Trips tab से manage करें
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {returnLoadTrips.length > 0 && lastCompletedVyapariTrip && (
          <View style={{ marginBottom: 16 }}>
            <View style={[styles.returnLoadBanner, { backgroundColor: '#E8F5E9', borderColor: '#2E7D32' }]}>
              <Feather name="rotate-ccw" size={16} color="#2E7D32" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.returnLoadTitle, { color: '#1B5E20' }]}>🔄 वापसी का लोड — {lastCompletedVyapariTrip.toCity} से</Text>
                <Text style={[styles.returnLoadSub, { color: '#388E3C' }]}>आपकी गाड़ी {lastCompletedVyapariTrip.toCity} में है — {returnLoadTrips.length} trip उपलब्ध</Text>
              </View>
            </View>
            {returnLoadTrips.map((vt) => (
              <OpenTripBidCard key={vt.id} trip={vt} colors={colors} myBid={myBids.find(b => b.tripId === vt.id)} onBid={() => { setBidTrip(vt); setBidModal(true); }} />
            ))}
          </View>
        )}

        {/* Manual Load Search */}
        <View style={{ marginBottom: 16 }}>
          <TouchableOpacity
            style={[styles.manualSearchToggle, { backgroundColor: showManualSearch ? colors.primary : colors.primary + '15', borderColor: colors.primary }]}
            onPress={() => setShowManualSearch(p => !p)}
            activeOpacity={0.8}
          >
            <Feather name="search" size={15} color={showManualSearch ? '#fff' : colors.primary} />
            <Text style={[styles.manualSearchToggleText, { color: showManualSearch ? '#fff' : colors.primary }]}>
              🔍 खुद से शहर चुनें — Trip ढूंढें
            </Text>
            <Feather name={showManualSearch ? 'chevron-up' : 'chevron-down'} size={15} color={showManualSearch ? '#fff' : colors.primary} />
          </TouchableOpacity>

          {showManualSearch && (
            <View style={[styles.manualSearchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                style={[styles.manualSearchInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                placeholder="📍 कहाँ से — शहर का नाम (जैसे: Ahmedabad)"
                placeholderTextColor={colors.mutedForeground}
                value={searchFrom}
                onChangeText={setSearchFrom}
                autoCorrect={false}
              />
              <TextInput
                style={[styles.manualSearchInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.background }]}
                placeholder="🏁 कहाँ तक — शहर का नाम (जैसे: Junagadh)"
                placeholderTextColor={colors.mutedForeground}
                value={searchTo}
                onChangeText={setSearchTo}
                autoCorrect={false}
              />
              {(searchFrom.trim().length >= 2 || searchTo.trim().length >= 2) && (
                manualResults.length > 0 ? (
                  <>
                    <Text style={[styles.manualResultCount, { color: colors.success }]}>
                      ✅ {manualResults.length} trip{manualResults.length > 1 ? 's' : ''} मिली
                    </Text>
                    {manualResults.map((vt) => (
                      <OpenTripBidCard key={vt.id} trip={vt} colors={colors} myBid={myBids.find(b => b.tripId === vt.id)} onBid={() => { setBidTrip(vt); setBidModal(true); }} />
                    ))}
                  </>
                ) : (
                  <Text style={[styles.manualNoResult, { color: colors.mutedForeground }]}>
                    😔 इस route पर अभी कोई trip उपलब्ध नहीं है
                  </Text>
                )
              )}
            </View>
          )}
        </View>

        {recentlyTakenTrips.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>🔒 अभी-अभी Booked हुई (Taken)</Text>
            {recentlyTakenTrips.map((vt) => (
              <View key={vt.id} style={[takenStyles.card, { backgroundColor: colors.card, borderColor: '#94a3b840' }]}>
                <View style={takenStyles.row}>
                  <View style={[takenStyles.badge, { backgroundColor: '#94a3b818' }]}>
                    <Text style={[takenStyles.badgeText, { color: '#64748b' }]}>🔒 किसी और ने ले लिया</Text>
                  </View>
                  <Text style={[takenStyles.time, { color: colors.mutedForeground }]}>
                    {Math.floor((Date.now() - new Date(vt.acceptedAt || vt.createdAt).getTime()) / 60000)} मिनट पहले
                  </Text>
                </View>
                <Text style={[takenStyles.route, { color: colors.mutedForeground }]}>
                  {vt.fromCity} → {vt.toCity}
                </Text>
                <Text style={[takenStyles.meta, { color: colors.mutedForeground }]}>
                  {vt.goodsCategory} • {vt.weightTons} टन
                </Text>
              </View>
            ))}
          </View>
        )}

        {openVyapariTrips.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>📦 व्यापारी की जरूरत — Bid लगाएं</Text>
            {openVyapariTrips.slice(0, 4).map((vt) => (
              <OpenTripBidCard key={vt.id} trip={vt} colors={colors} myBid={myBids.find(b => b.tripId === vt.id)} onBid={() => { setBidTrip(vt); setBidModal(true); }} />
            ))}
          </View>
        )}

        {activeTrips.length > 0 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Confirmed Trips</Text>
            {activeTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} isMyTrip onPress={() => handleViewBilty(trip.id)} />
            ))}
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <ActionBtn icon="plus-circle" label="ट्रिप डालें" onPress={() => router.push('/(driver)/post-trip')} color={colors.primary} />
            <ActionBtn icon="truck" label="गाड़ी जोड़ें" onPress={() => router.push('/(driver)/vehicles')} color={colors.navy} />
            <ActionBtn icon="list" label="मेरी ट्रिप" onPress={() => router.push('/(driver)/my-trips')} color={colors.success} />
            <ActionBtn icon="file-text" label="बिलटी" onPress={() => router.push('/(driver)/my-trips')} color={colors.warning} />
          </View>
        </View>

        {myTrips.slice(-3).reverse().map((trip) => (
          <TripCard key={trip.id} trip={trip} isMyTrip onPress={() => handleViewBilty(trip.id)} />
        ))}
      </ScrollView>

      <BiltyModal bilty={selectedBilty} visible={!!selectedBilty} onClose={() => setSelectedBilty(null)} />

      {/* Bid Modal */}
      <Modal visible={bidModal} transparent animationType="slide" onRequestClose={() => setBidModal(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 }}>
            <Text style={{ fontSize: 18, fontFamily: 'Inter_700Bold', color: colors.foreground, marginBottom: 4 }}>💰 Bid लगाएं</Text>
            {bidTrip && (
              <Text style={{ color: colors.mutedForeground, fontSize: 13, marginBottom: 16, fontFamily: 'Inter_400Regular' }}>
                {bidTrip.fromCity} → {bidTrip.toCity} • {bidTrip.goodsCategory} • {bidTrip.weightTons} टन
              </Text>
            )}
            <Text style={{ color: colors.foreground, fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 }}>Total Freight Amount (₹)</Text>
            <TextInput
              style={{ borderWidth: 1.5, borderColor: colors.border, borderRadius: 10, padding: 12, fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground, backgroundColor: colors.card, marginBottom: 8 }}
              placeholder="जैसे: 25000"
              placeholderTextColor={colors.mutedForeground}
              value={bidAmount}
              onChangeText={setBidAmount}
              keyboardType="numeric"
            />
            {bidAmount ? (
              <View style={{ backgroundColor: '#E8F5E9', borderRadius: 8, padding: 10, marginBottom: 12 }}>
                <Text style={{ color: '#1B5E20', fontSize: 12, fontFamily: 'Inter_500Medium' }}>
                  आपकी Bid: ₹{parseFloat(bidAmount || '0').toLocaleString('en-IN')}{'\n'}
                  Merchant को 20% advance देना होगा: ₹{Math.round(parseFloat(bidAmount || '0') * 0.20).toLocaleString('en-IN')}{'\n'}
                  आपको Loading पर (50% cash): ₹{Math.round(parseFloat(bidAmount || '0') * 0.50).toLocaleString('en-IN')}{'\n'}
                  Delivery पर (30% cash): ₹{Math.round(parseFloat(bidAmount || '0') * 0.30).toLocaleString('en-IN')}
                </Text>
              </View>
            ) : null}
            <TouchableOpacity
              style={{ backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', opacity: submittingBid ? 0.6 : 1 }}
              onPress={handleBidSubmit}
              disabled={submittingBid}
            >
              <Text style={{ color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' }}>{submittingBid ? 'Submit हो रहा है...' : 'Bid Submit करें'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginTop: 10, alignItems: 'center' }} onPress={() => setBidModal(false)}>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>रद्द करें</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

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
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
});

function ActionBtn({ icon, label, onPress, color }: { icon: string; label: string; onPress: () => void; color: string }) {
  return (
    <TouchableOpacity style={[actionStyles.btn, { backgroundColor: color + '15', borderColor: color }]} onPress={onPress} activeOpacity={0.8}>
      <Feather name={icon as any} size={22} color={color} />
      <Text style={[actionStyles.label, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  btn: { flex: 1, minWidth: '45%', alignItems: 'center', gap: 8, padding: 16, borderRadius: 12, borderWidth: 1.5 },
  label: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center' },
});

function OpenTripBidCard({ trip, colors, myBid, onBid }: { trip: VyapariTrip; colors: Colors; myBid?: Bid; onBid: () => void }) {
  const alreadyBid = !!myBid;
  const bidStatusColor = myBid?.status === 'accepted' ? '#16a34a' : myBid?.status === 'rejected' ? '#dc2626' : '#d97706';
  const bidStatusLabel = myBid?.status === 'accepted' ? '✅ Bid Accepted!' : myBid?.status === 'rejected' ? '❌ Bid Rejected' : '⏳ Bid Pending';
  return (
    <View style={[vtStyles.card, { backgroundColor: colors.card, borderColor: alreadyBid ? bidStatusColor + '40' : colors.navy + '30' }]}>
      <View style={vtStyles.row}>
        <View style={[vtStyles.badge, { backgroundColor: colors.navy + '18' }]}>
          <Text style={[vtStyles.badgeText, { color: colors.navy }]}>📦 Load Available</Text>
        </View>
        <Text style={[vtStyles.date, { color: colors.mutedForeground }]}>{trip.tripDate}</Text>
      </View>
      <Text style={[vtStyles.route, { color: colors.foreground }]}>{trip.fromCity} → {trip.toCity}</Text>
      <View style={[vtStyles.detailBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={vtStyles.detailRow}><Feather name="package" size={13} color={colors.mutedForeground} /><Text style={[vtStyles.detailText, { color: colors.foreground }]}>{trip.goodsCategory}</Text></View>
        <View style={vtStyles.detailRow}><Feather name="layers" size={13} color={colors.mutedForeground} /><Text style={[vtStyles.detailText, { color: colors.foreground }]}>{trip.weightTons} टन</Text></View>
        {trip.vehicleTypePref ? <View style={vtStyles.detailRow}><Feather name="truck" size={13} color={colors.mutedForeground} /><Text style={[vtStyles.detailText, { color: colors.foreground }]}>{trip.vehicleTypePref}</Text></View> : null}
        {trip.description ? <View style={vtStyles.detailRow}><Feather name="info" size={13} color={colors.mutedForeground} /><Text style={[vtStyles.detailText, { color: colors.mutedForeground }]}>{trip.description}</Text></View> : null}
      </View>
      {alreadyBid ? (
        <View style={{ backgroundColor: bidStatusColor + '15', borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ color: bidStatusColor, fontSize: 13, fontFamily: 'Inter_700Bold' }}>{bidStatusLabel}</Text>
          <Text style={{ color: bidStatusColor, fontSize: 12, fontFamily: 'Inter_400Regular' }}>— ₹{myBid.bidAmount.toLocaleString('en-IN')}</Text>
        </View>
      ) : (
        <TouchableOpacity style={{ backgroundColor: colors.primary, borderRadius: 9, padding: 11, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }} onPress={onBid} activeOpacity={0.8}>
          <Feather name="tag" size={14} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' }}>Bid लगाएं</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}


const takenStyles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1.5, padding: 12, marginBottom: 8, opacity: 0.7 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  badge: { borderRadius: 7, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  time: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  route: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});

const vtStyles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1.5, padding: 14, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_500Medium' },
  date: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  route: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 8 },
  detailBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10, gap: 5 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  detailText: { fontSize: 13, fontFamily: 'Inter_400Regular', flex: 1 },
  settlementBox: { borderRadius: 10, borderWidth: 1, padding: 10, marginBottom: 10, gap: 4 },
  settlementTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  settlementRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  settlementLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  settlementVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  settlementNote: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  actionPanel: { borderTopWidth: 1, paddingTop: 10, gap: 8 },
  actionRow: { flexDirection: 'row', gap: 7 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, paddingHorizontal: 6, borderRadius: 9 },
  actionBtnText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  unlockedTitle: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  commGate: { borderRadius: 9, borderWidth: 1, padding: 9, gap: 7 },
  lockedRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lockedText: { fontSize: 12, fontFamily: 'Inter_500Medium', flex: 1 },
  upiBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 9, paddingHorizontal: 10, borderRadius: 8, justifyContent: 'center' },
  upiBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
  utrInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular' },
  alreadyPaid: { fontSize: 12, fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 2 },
  rentWarning: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 10, borderRadius: 10, borderWidth: 1.5, marginTop: 8 },
  rentWarningText: { fontSize: 12.5, fontFamily: 'Inter_400Regular', flex: 1, lineHeight: 19 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  greeting: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  subGreeting: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  notifBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: 8 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  body: { padding: 16 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 12, marginTop: 4 },
  returnLoadBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, borderWidth: 1.5, marginBottom: 10 },
  returnLoadTitle: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  returnLoadSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  manualSearchToggle: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1.5 },
  manualSearchToggleText: { flex: 1, fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  manualSearchBox: { borderRadius: 10, borderWidth: 1, padding: 12, marginTop: 8, gap: 8 },
  manualSearchInput: { borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 13, fontFamily: 'Inter_400Regular' },
  manualResultCount: { fontSize: 13, fontFamily: 'Inter_600SemiBold', marginTop: 4 },
  manualNoResult: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', paddingVertical: 16 },
  addVehicleCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', marginBottom: 16 },
  addVehicleTitle: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  addVehicleSub: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  quickActions: { marginBottom: 16 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  commissionInfo: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  commissionTitle: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 2 },
  commissionSub: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});

const gpsBanner = StyleSheet.create({
  box: { borderWidth: 1.5, borderLeftWidth: 4, marginHorizontal: 16, marginTop: 10, marginBottom: 4, borderRadius: 10, padding: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#DC2626' },
  line: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#DC2626', lineHeight: 18 },
});
