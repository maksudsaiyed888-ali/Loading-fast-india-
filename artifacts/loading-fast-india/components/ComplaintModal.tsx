import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import Input from './ui/Input';
import Button from './ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  againstId?: string;
  againstName?: string;
  againstRole?: 'driver' | 'vyapari';
  tripId?: string;
}

const COMPLAINT_TYPES = [
  {
    id: 'kiraya',
    label: 'किराया नहीं दिया',
    icon: '💰',
    color: '#dc2626',
    sections: 'IPC 420 + IPC 406',
    desc: 'धोखाधड़ी और विश्वास का भंग',
    who: 'vyapari',
  },
  {
    id: 'maal_chori',
    label: 'माल चोरी / हेराफेरी',
    icon: '📦',
    color: '#7f1d1d',
    sections: 'IPC 378 + IPC 424',
    desc: 'चोरी और बेईमानी से संपत्ति हटाना',
    who: 'driver',
  },
  {
    id: 'inkar',
    label: 'माल लेने से इनकार',
    icon: '🚫',
    color: '#b45309',
    sections: 'IPC 420 + IPC 406',
    desc: 'माल receive करने से मना',
    who: 'vyapari',
  },
  {
    id: 'nuksaan',
    label: 'माल में नुकसान',
    icon: '⚠️',
    color: '#d97706',
    sections: 'IPC 425 + IPC 427',
    desc: 'शरारत और संपत्ति नुकसान',
    who: 'driver',
  },
  {
    id: 'fake',
    label: 'झूठी बुकिंग / नकली ID',
    icon: '🆔',
    color: '#7C3AED',
    sections: 'IPC 468 + IPC 471',
    desc: 'जालसाजी और नकली दस्तावेज़',
    who: 'both',
  },
  {
    id: 'durghatna',
    label: 'दुर्व्यवहार / धमकी',
    icon: '😡',
    color: '#be123c',
    sections: 'IPC 503 + IPC 506',
    desc: 'आपराधिक धमकी',
    who: 'both',
  },
  {
    id: 'cancel',
    label: 'बिना कारण ट्रिप cancel',
    icon: '🚛',
    color: '#0369a1',
    sections: 'IPC 420 (Breach of Contract)',
    desc: 'वादा तोड़ना और धोखा',
    who: 'both',
  },
  {
    id: 'other',
    label: 'अन्य समस्या',
    icon: '📋',
    color: '#374151',
    sections: 'Admin Investigation',
    desc: 'अन्य शिकायत',
    who: 'both',
  },
];

export default function ComplaintModal({ visible, onClose, againstId, againstName, againstRole, tripId }: Props) {
  const colors = useColors();
  const { user, addComplaint } = useApp();
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const selectedTypeObj = COMPLAINT_TYPES.find(c => c.id === selectedType);

  const handleSubmit = async () => {
    if (!selectedType) {
      Alert.alert('शिकायत का प्रकार चुनें', 'कृपया शिकायत का प्रकार चुनें।');
      return;
    }
    if (!description.trim() || description.trim().length < 20) {
      Alert.alert('विवरण लिखें', 'कम से कम 20 अक्षरों में विवरण लिखें।');
      return;
    }
    if (!agreed) {
      Alert.alert('चेतावनी', 'झूठी शिकायत पर IPC 182 और 211 के तहत आप पर भी कार्यवाही होगी। सहमत होने पर चेकबॉक्स चुनें।');
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await addComplaint({
        id: generateId(),
        complainantId: user.id,
        complainantName: user.name,
        complainantRole: user.role as 'driver' | 'vyapari',
        againstId: againstId || '',
        againstName: againstName || '',
        againstRole: againstRole || 'driver',
        tripId,
        subject: `${selectedTypeObj?.label} (${selectedTypeObj?.sections})`,
        description: description.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      Alert.alert(
        '✅ शिकायत दर्ज हुई',
        `आपकी शिकायत दर्ज हो गई है।\n\nधारा: ${selectedTypeObj?.sections}\n\nAdmin 24 घंटे में कार्यवाही करेगा। Aadhaar-linked record की जाँच की जाएगी।`,
        [{ text: 'ठीक है', onPress: () => { onClose(); setSelectedType(''); setDescription(''); setAgreed(false); } }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: '#7f1d1d' }]}>
            <View>
              <Text style={styles.headerTitle}>⚖️ शिकायत दर्ज करें</Text>
              <Text style={styles.headerSub}>Legal Complaint System • IPC Protected</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {againstName && (
            <View style={[styles.againstBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
              <Feather name="user" size={14} color="#dc2626" />
              <Text style={[styles.againstText, { color: '#dc2626' }]}>
                {againstName} ({againstRole === 'driver' ? 'ड्राइवर' : 'व्यापारी'}) के खिलाफ शिकायत
              </Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>शिकायत का प्रकार चुनें *</Text>
            {COMPLAINT_TYPES.map((ct) => (
              <TouchableOpacity
                key={ct.id}
                style={[styles.complaintOption, {
                  backgroundColor: selectedType === ct.id ? ct.color + '15' : colors.card,
                  borderColor: selectedType === ct.id ? ct.color : colors.border,
                  borderWidth: selectedType === ct.id ? 2 : 1,
                }]}
                onPress={() => setSelectedType(ct.id)}
                activeOpacity={0.8}
              >
                <Text style={styles.optionIcon}>{ct.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: selectedType === ct.id ? ct.color : colors.foreground }]}>
                    {ct.label}
                  </Text>
                  <Text style={[styles.optionSection, { color: colors.mutedForeground }]}>{ct.sections} — {ct.desc}</Text>
                </View>
                {selectedType === ct.id && <Feather name="check-circle" size={18} color={ct.color} />}
              </TouchableOpacity>
            ))}

            {selectedTypeObj && (
              <View style={[styles.ipcBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                <Text style={styles.ipcTitle}>⚖️ लागू कानूनी धाराएं:</Text>
                <Text style={styles.ipcSection}>{selectedTypeObj.sections}</Text>
                <Text style={styles.ipcDesc}>{selectedTypeObj.desc}</Text>
                <Text style={styles.ipcNote}>दोषी पाए जाने पर 3-7 साल कारावास + जुर्माना हो सकता है।</Text>
              </View>
            )}

            <Input
              label="विस्तृत विवरण *"
              placeholder="घटना का पूरा विवरण लिखें (कम से कम 20 अक्षर)..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />

            <TouchableOpacity style={styles.agreeRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.8}>
              <View style={[styles.checkbox, { borderColor: agreed ? '#dc2626' : colors.border, backgroundColor: agreed ? '#dc2626' : 'transparent' }]}>
                {agreed && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.agreeText, { color: colors.mutedForeground }]}>
                मैं पुष्टि करता/करती हूं कि यह शिकायत सच्ची है। झूठी शिकायत पर <Text style={{ color: '#dc2626', fontFamily: 'Inter_700Bold' }}>IPC 182 + 211</Text> के तहत मेरे विरुद्ध भी कार्यवाही हो सकती है।
              </Text>
            </TouchableOpacity>

            <Button
              title="शिकायत दर्ज करें"
              onPress={handleSubmit}
              loading={loading}
              variant="danger"
              style={{ marginTop: 8 }}
            />

            <View style={[styles.footerNote, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Feather name="shield" size={13} color={colors.mutedForeground} />
              <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
                आपकी शिकायत Admin को भेजी जाएगी। Aadhaar-linked record से दोनों पक्षों की जाँच होगी।
              </Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: { padding: 4 },
  againstBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginTop: 12, padding: 10, borderRadius: 8, borderWidth: 1 },
  againstText: { fontSize: 13, fontFamily: 'Inter_500Medium', flex: 1 },
  body: { padding: 20 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  complaintOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, marginBottom: 8 },
  optionIcon: { fontSize: 22 },
  optionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  optionSection: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 2 },
  ipcBox: { borderRadius: 10, padding: 12, borderWidth: 1, marginBottom: 14 },
  ipcTitle: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#dc2626', marginBottom: 4 },
  ipcSection: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#7f1d1d', marginBottom: 2 },
  ipcDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', color: '#991b1b', marginBottom: 4 },
  ipcNote: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#b91c1c' },
  agreeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  agreeText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  footerNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginTop: 8 },
  footerText: { flex: 1, fontSize: 11, fontFamily: 'Inter_400Regular', lineHeight: 16 },
});
