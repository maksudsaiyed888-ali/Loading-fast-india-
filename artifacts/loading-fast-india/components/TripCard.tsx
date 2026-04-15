import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Trip } from '@/lib/types';
import { formatCurrency, formatDate } from '@/lib/utils';

interface TripCardProps {
  trip: Trip;
  onPress?: () => void;
  showActions?: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  isMyTrip?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  available: '#16a34a',
  confirmed: '#d97706',
  pending_confirmation: '#f59e0b',
  completed: '#0A2540',
  cancelled: '#dc2626',
};

const STATUS_LABELS: Record<string, string> = {
  available: 'उपलब्ध',
  confirmed: 'बुक हुई',
  pending_confirmation: '⏳ Pending',
  completed: 'पूर्ण',
  cancelled: 'रद्द',
};

export default function TripCard({ trip, onPress, showActions, onConfirm, onCancel, isMyTrip }: TripCardProps) {
  const colors = useColors();
  const statusColor = STATUS_COLORS[trip.status] || colors.mutedForeground;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.header}>
        <View style={styles.route}>
          <Text style={[styles.city, { color: colors.foreground }]} numberOfLines={1}>
            {trip.fromCity}
          </Text>
          <View style={styles.arrow}>
            <View style={[styles.line, { backgroundColor: colors.primary }]} />
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </View>
          <Text style={[styles.city, { color: colors.foreground }]} numberOfLines={1}>
            {trip.toCity}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20', borderColor: statusColor }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{STATUS_LABELS[trip.status]}</Text>
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.info}>
          <Feather name="truck" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{trip.vehicleTypeName}</Text>
        </View>
        <View style={styles.info}>
          <Feather name="package" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{trip.loadTons} टन</Text>
        </View>
        <View style={styles.info}>
          <Feather name="calendar" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{formatDate(trip.tripDate)}</Text>
        </View>
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.rentLabel, { color: colors.mutedForeground }]}>कुल किराया</Text>
          <Text style={[styles.rent, { color: colors.primary }]}>{formatCurrency(trip.totalRent)}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.rentLabel, { color: colors.mutedForeground }]}>2% कमीशन</Text>
          <Text style={[styles.commission, { color: colors.secondary }]}>{formatCurrency(trip.commissionAmount)}</Text>
        </View>
      </View>

      {trip.paymentType && (
        <View style={[styles.paymentTypeBadge, {
          backgroundColor: trip.paymentType === 'receiver' ? '#FFF3E0' : '#E8F5E9',
          borderColor: trip.paymentType === 'receiver' ? '#FF6F00' : '#2E7D32',
        }]}>
          <Feather
            name={trip.paymentType === 'receiver' ? 'alert-circle' : 'check-circle'}
            size={12}
            color={trip.paymentType === 'receiver' ? '#E65100' : '#2E7D32'}
          />
          <Text style={[styles.paymentTypeText, { color: trip.paymentType === 'receiver' ? '#E65100' : '#2E7D32' }]}>
            {trip.paymentType === 'receiver' ? '⚠️ Receiver Pay' : '✅ Sender Pay'}
          </Text>
          {trip.paymentReceived && (
            <View style={[styles.paymentReceivedPill, { backgroundColor: '#2E7D32' }]}>
              <Text style={styles.paymentReceivedPillText}>RECEIVED ✓</Text>
            </View>
          )}
        </View>
      )}

      {!isMyTrip && trip.status === 'available' && (
        <View style={styles.driverRow}>
          <Feather name="user" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{trip.driverName} • {trip.driverPhone}</Text>
        </View>
      )}

      {trip.vehicleNumber ? (
        <View style={styles.vehicleRow}>
          <Feather name="credit-card" size={13} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{trip.vehicleNumber}</Text>
        </View>
      ) : null}

      {showActions && (
        <View style={styles.actions}>
          {onConfirm && trip.status === 'available' && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>बुक करें • 2% दें</Text>
            </TouchableOpacity>
          )}
          {onCancel && (trip.status === 'available' || trip.status === 'confirmed') && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.destructive }]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.actionBtnText}>रद्द करें</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  route: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  city: { fontSize: 15, fontFamily: 'Inter_600SemiBold', maxWidth: 90 },
  arrow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 6 },
  line: { height: 1, width: 16 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  statusText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  row: { flexDirection: 'row', gap: 14, marginBottom: 10 },
  info: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
  },
  rentLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  paymentTypeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  paymentTypeText: { fontSize: 11.5, fontFamily: 'Inter_600SemiBold', flex: 1 },
  paymentReceivedPill: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  paymentReceivedPillText: { fontSize: 9.5, fontFamily: 'Inter_700Bold', color: '#fff' },
  rent: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  commission: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  driverRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  vehicleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  actionBtn: { flex: 1, borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
});
