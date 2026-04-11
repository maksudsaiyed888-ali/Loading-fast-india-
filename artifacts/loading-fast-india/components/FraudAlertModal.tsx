import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { generateId } from '@/lib/utils';

interface Props {
  visible: boolean;
  onClose: () => void;
  bookingId?: string;
  targetName?: string;
  targetId?: string;
  targetRole?: 'driver' | 'vyapari';
  hasGST?: boolean;
}

const FRAUD_CATEGORIES = [
  {
    value: 'Payment Issue',
    label: 'पैसे की धोखाधड़ी (Payment Fraud)',
    icon: '💸',
    ipc: 'IPC 420 + IPC 406',
    desc: 'किराया नहीं दिया / झूठा payment claim',
    color: '#dc2626',
  },
  {
    value: 'Theft',
    label: 'सामान की चोरी (Theft)',
    icon: '📦',
    ipc: 'IPC 378 + IPC 424',
    desc: 'माल चोरी या हेराफेरी',
    color: '#7c3aed',
  },
  {
    value: 'Behavior',
    label: 'गलत व्यवहार / धमकी (Misbehavior)',
    icon: '😡',
    ipc: 'IPC 503 + IPC 506',
    desc: 'आपराधिक धमकी / दुर्व्यवहार',
    color: '#b45309',
  },
  {
    value: 'Fake Docs',
    label: 'नकली दस्तावेज़ (Fake Documents)',
    icon: '🆔',
    ipc: 'IPC 468 + IPC 471',
    desc: 'झूठी ID / जाली कागज़',
    color: '#0369a1',
  },
];

export default function FraudAlertModal({
  visible,
  onClose,
  bookingId,
  targetName,
  targetId,
  targetRole,
  hasGST,
}: Props) {
  const colors = useColors();
  const { user, addComplaint } = useApp();
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const selectedCat = FRAUD_CATEGORIES.find((c) => c.value === category);
  const merchantVerifiedBy = hasGST ? 'GST & Aadhaar' : 'Aadhaar Only';

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert('⚠️ Category चुनें', 'धोखाधड़ी का प्रकार चुनना ज़रूरी है।');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      Alert.alert('⚠️ विवरण लिखें', 'कम से कम 10 अक्षरों में विवरण लिखें।');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      const reportData = {
        id: generateId(),
        complainantId: user.id,
        complainantName: user.name,
        complainantRole: user.role as 'driver' | 'vyapari',
        againstId: targetId || '',
        againstName: targetName || '',
        againstRole: targetRole || 'driver',
        tripId: bookingId,
        bookingId,
        subject: `🚨 FRAUD ALERT: ${selectedCat?.label} (${selectedCat?.ipc})`,
        description: `[FRAUD REPORT]\nCategory: ${category}\nMerchant Verified By: ${merchantVerifiedBy}\n\n${description.trim()}`,
        merchantVerifiedBy: merchantVerifiedBy as 'GST & Aadhaar' | 'Aadhaar Only',
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };
      await addComplaint(reportData);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCategory('');
    setDescription('');
    setSubmitted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.alertHeader}>
            <View style={styles.alertBadge}>
              <Feather name="alert-octagon" size={18} color="#fff" />
              <Text style={styles.alertBadgeText}>FRAUD ALERT</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.alertTitle}>
            <Text style={styles.alertTitleText}>🚨 धोखाधड़ी की रिपोर्ट</Text>
            <Text style={styles.alertTitleSub}>
              यह Report सीधे Admin और Legal Team को जाएगी
            </Text>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={styles.successTitle}>Fraud Alert दर्ज हुई!</Text>
              <Text style={[styles.successMsg, { color: colors.mutedForeground }]}>
                आपकी Fraud Report दर्ज हो गई है।{'\n\n'}
                🔍 <Text style={{ fontFamily: 'Inter_700Bold', color: '#dc2626' }}>धारा: {selectedCat?.ipc}</Text>{'\n\n'}
                📋 सत्यापन: <Text style={{ fontFamily: 'Inter_700Bold' }}>{merchantVerifiedBy}</Text>{'\n\n'}
                चूँकि हमारे पास {hasGST ? 'GST और ' : ''}Aadhaar record है, हम उचित{'\n'}
                कानूनी कार्यवाही करेंगे। Admin 24 घंटे में संपर्क करेगा।
              </Text>
              {bookingId && (
                <View style={styles.bookingRef}>
                  <Feather name="hash" size={13} color="#dc2626" />
                  <Text style={styles.bookingRefText}>
                    Booking: #{bookingId.slice(-8).toUpperCase()}
                  </Text>
                </View>
              )}
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>बंद करें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
              {(targetName || bookingId) && (
                <View style={[styles.infoRow, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <View style={styles.infoItem}>
                    <Feather name="user" size={13} color="#dc2626" />
                    <Text style={styles.infoLabel}>के खिलाफ:</Text>
                    <Text style={styles.infoValue}>{targetName || 'Unknown'}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Feather name="shield" size={13} color={hasGST ? '#16a34a' : '#b45309'} />
                    <Text style={[styles.infoValue, { color: hasGST ? '#16a34a' : '#b45309' }]}>
                      {merchantVerifiedBy}
                    </Text>
                  </View>
                  {bookingId && (
                    <View style={styles.infoItem}>
                      <Feather name="hash" size={13} color="#2563eb" />
                      <Text style={[styles.infoValue, { color: '#1d4ed8' }]}>
                        #{bookingId.slice(-8).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                धोखाधड़ी का प्रकार चुनें *
              </Text>

              {FRAUD_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.value}
                  style={[
                    styles.catCard,
                    {
                      backgroundColor: category === cat.value ? cat.color + '18' : colors.card,
                      borderColor: category === cat.value ? cat.color : colors.border,
                      borderWidth: category === cat.value ? 2 : 1,
                    },
                  ]}
                  onPress={() => setCategory(cat.value)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.catIcon}>{cat.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.catLabel, { color: category === cat.value ? cat.color : colors.foreground }]}>
                      {cat.label}
                    </Text>
                    <Text style={[styles.catIpc, { color: colors.mutedForeground }]}>
                      {cat.ipc} — {cat.desc}
                    </Text>
                  </View>
                  {category === cat.value && (
                    <Feather name="check-circle" size={18} color={cat.color} />
                  )}
                </TouchableOpacity>
              ))}

              {selectedCat && (
                <View style={[styles.ipcWarning, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                  <Text style={styles.ipcWarningTitle}>⚖️ लागू कानूनी धाराएं</Text>
                  <Text style={styles.ipcWarningSection}>{selectedCat.ipc}</Text>
                  <Text style={styles.ipcWarningNote}>
                    दोषी पाए जाने पर 3–7 साल कारावास + जुर्माना।{'\n'}
                    आपका Aadhaar-linked record सुरक्षित है।
                  </Text>
                </View>
              )}

              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 12 }]}>
                धोखाधड़ी का पूरा विवरण *
              </Text>
              <TextInput
                style={[styles.input, {
                  backgroundColor: colors.muted,
                  color: colors.foreground,
                  borderColor: colors.border,
                }]}
                placeholder="धोखाधड़ी का पूरा विवरण यहाँ लिखें... (तारीख, समय, रकम)"
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={5}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { color: colors.mutedForeground }]}>
                {description.length}/500
              </Text>

              <View style={[styles.legalNote, { backgroundColor: '#FFF7ED', borderColor: '#FED7AA' }]}>
                <Feather name="info" size={13} color="#c2410c" />
                <Text style={[styles.legalNoteText, { color: '#9a3412' }]}>
                  झूठी Fraud Report पर <Text style={{ fontFamily: 'Inter_700Bold' }}>IPC 182 + IPC 211</Text> के तहत{' '}
                  आप पर भी कार्यवाही हो सकती है।
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: loading || !category ? '#94a3b8' : '#dc2626' }]}
                onPress={handleSubmit}
                disabled={loading || !category}
                activeOpacity={0.85}
              >
                <Feather name="alert-octagon" size={18} color="#fff" />
                <Text style={styles.submitBtnText}>
                  {loading ? 'दर्ज हो रहा है...' : '🚨 Fraud Report दर्ज करें'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.cancelBtn, { borderColor: colors.border }]} onPress={handleClose}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>रद्द करें</Text>
              </TouchableOpacity>

              <View style={{ height: 32 }} />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  alertHeader: {
    backgroundColor: '#7f1d1d',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  alertBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  alertBadgeText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold', letterSpacing: 1 },
  closeBtn: { padding: 4 },
  alertTitle: { backgroundColor: '#991b1b', paddingHorizontal: 20, paddingVertical: 12 },
  alertTitleText: { color: '#fff', fontSize: 18, fontFamily: 'Inter_700Bold' },
  alertTitleSub: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 3 },
  body: { padding: 16 },
  infoRow: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 14, gap: 6 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#dc2626' },
  infoValue: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#991b1b' },
  sectionTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  catCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 14, marginBottom: 8 },
  catIcon: { fontSize: 24 },
  catLabel: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  catIpc: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  ipcWarning: { borderRadius: 12, padding: 12, borderWidth: 1, marginBottom: 4 },
  ipcWarningTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#dc2626', marginBottom: 4 },
  ipcWarningSection: { fontSize: 14, fontFamily: 'Inter_700Bold', color: '#7f1d1d', marginBottom: 4 },
  ipcWarningNote: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#991b1b', lineHeight: 18 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 110, marginTop: 4 },
  charCount: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'right', marginTop: 4, marginBottom: 8 },
  legalNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 14, alignItems: 'flex-start' },
  legalNoteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16, borderRadius: 14, marginBottom: 10 },
  submitBtnText: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12, borderRadius: 14, borderWidth: 1.5 },
  cancelBtnText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  successBox: { padding: 28, alignItems: 'center' },
  successEmoji: { fontSize: 52, marginBottom: 12 },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', color: '#16a34a', marginBottom: 12 },
  successMsg: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22, textAlign: 'center', marginBottom: 14 },
  bookingRef: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginBottom: 20 },
  bookingRefText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#dc2626' },
  doneBtn: { backgroundColor: '#16a34a', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  doneBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
