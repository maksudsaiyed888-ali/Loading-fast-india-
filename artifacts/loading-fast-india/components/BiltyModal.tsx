import { Feather } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Bilty } from '@/lib/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { APP_NAME, COMMISSION_UPI } from '@/lib/types';

interface Props {
  bilty: Bilty | null;
  visible: boolean;
  onClose: () => void;
}

export default function BiltyModal({ bilty, visible, onClose }: Props) {
  const colors = useColors();
  if (!bilty) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <LinearGradient colors={[colors.navy, colors.primary]} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <View style={styles.headerContent}>
              <Text style={styles.appName}>{APP_NAME}</Text>
              <Text style={styles.biltyTitle}>DIGITAL BILTY / ई-बिलटी</Text>
              <Text style={styles.biltyNum}>{bilty.biltyNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Section title="माल भेजने वाला (Driver)">
              <Row label="नाम" value={bilty.driverName} />
              <Row label="फोन" value={bilty.driverPhone} />
              <Row label="गाड़ी नंबर" value={bilty.vehicleNumber} />
              <Row label="गाड़ी प्रकार" value={bilty.vehicleType} />
            </Section>

            <Section title="माल मंगाने वाला (Vyapari)">
              <Row label="नाम" value={bilty.vyapariName} />
              <Row label="फोन" value={bilty.vyapariPhone} />
            </Section>

            <Section title="माल का विवरण">
              <Row label="से (From)" value={bilty.fromCity} />
              <Row label="तक (To)" value={bilty.toCity} />
              <Row label="माल वजन" value={`${bilty.loadTons} टन`} />
            </Section>

            <Section title="भुगतान विवरण" bg={colors.accent}>
              <Row label="कुल किराया" value={formatCurrency(bilty.totalRent)} bold />
              <Row label="2% कमीशन (LFI)" value={formatCurrency(bilty.commissionAmount)} />
              <Row label="UPI" value={COMMISSION_UPI} small />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <Row label="ड्राइवर को मिलेगा" value={formatCurrency(bilty.netRent)} bold highlight />
            </Section>

            <View style={[styles.legalBox, { borderColor: colors.destructive + '40', backgroundColor: colors.destructive + '08' }]}>
              <Feather name="alert-triangle" size={16} color={colors.destructive} />
              <Text style={[styles.legalText, { color: colors.destructive }]}>
                {'किराया न देने पर Indian Penal Code Section 420 (धोखाधड़ी) के तहत कड़ी कानूनी कार्यवाही होगी।'}
              </Text>
            </View>

            <View style={[styles.footer, { borderTopColor: colors.border }]}>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                दिनांक: {formatDateTime(bilty.createdAt)}
              </Text>
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                Powered by {APP_NAME}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, children, bg }: { title: string; children: React.ReactNode; bg?: string }) {
  const colors = useColors();
  return (
    <View style={[styles.section, { backgroundColor: bg || colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: colors.secondary }]}>{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, bold, small, highlight }: { label: string; value: string; bold?: boolean; small?: boolean; highlight?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.rowItem}>
      <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[
        styles.rowValue,
        { color: highlight ? colors.success : colors.foreground },
        bold && styles.boldValue,
        small && styles.smallValue,
      ]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { padding: 20, paddingTop: 24, flexDirection: 'row', justifyContent: 'space-between' },
  headerContent: { flex: 1 },
  appName: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_500Medium', letterSpacing: 2 },
  biltyTitle: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold', marginTop: 4 },
  biltyNum: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: 'Inter_500Medium', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { padding: 16 },
  section: { borderRadius: 12, padding: 14, marginBottom: 12, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  rowItem: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  rowLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 13, fontFamily: 'Inter_500Medium', maxWidth: '60%', textAlign: 'right' },
  boldValue: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  smallValue: { fontSize: 11 },
  divider: { height: 1, marginVertical: 8 },
  legalBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 8, borderWidth: 1, marginBottom: 12 },
  legalText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  footer: { borderTopWidth: 1, paddingTop: 12, gap: 4, marginBottom: 24 },
  footerText: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
});
