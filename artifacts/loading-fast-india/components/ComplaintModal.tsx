import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

const SUBJECTS = [
  'किराया नहीं मिला',
  'माल नुकसान',
  'समय पर नहीं आया',
  'दुर्व्यवहार',
  'धोखाधड़ी',
  'गाड़ी खराब',
  'अन्य समस्या',
];

export default function ComplaintModal({ visible, onClose, againstId, againstName, againstRole, tripId }: Props) {
  const colors = useColors();
  const { user, addComplaint } = useApp();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject || !description.trim()) {
      Alert.alert('त्रुटि', 'कृपया विषय और विवरण भरें');
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
        subject,
        description: description.trim(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      Alert.alert(
        'शिकायत दर्ज हुई',
        'आपकी शिकायत दर्ज हो गई है। Indian IPC के तहत उचित कार्यवाही की जाएगी।',
        [{ text: 'ठीक है', onPress: onClose }]
      );
      setSubject('');
      setDescription('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>शिकायत दर्ज करें</Text>
            <TouchableOpacity onPress={onClose}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          {againstName && (
            <View style={[styles.againstBox, { backgroundColor: colors.muted }]}>
              <Feather name="user" size={14} color={colors.mutedForeground} />
              <Text style={[styles.againstText, { color: colors.mutedForeground }]}>
                {againstName} के खिलाफ
              </Text>
            </View>
          )}

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={[styles.sectionLabel, { color: colors.foreground }]}>विषय चुनें *</Text>
            <View style={styles.subjectsGrid}>
              {SUBJECTS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.subjectChip,
                    {
                      backgroundColor: subject === s ? colors.primary : colors.card,
                      borderColor: subject === s ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setSubject(s)}
                >
                  <Text style={[styles.subjectText, { color: subject === s ? '#fff' : colors.foreground }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Input
              label="विस्तृत विवरण *"
              placeholder="अपनी शिकायत विस्तार से लिखें..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              style={{ minHeight: 100 }}
            />

            <View style={[styles.legalNote, { backgroundColor: colors.destructive + '10', borderColor: colors.destructive + '30' }]}>
              <Feather name="alert-circle" size={15} color={colors.destructive} />
              <Text style={[styles.legalText, { color: colors.destructive }]}>
                झूठी शिकायत करने पर IPC 182 के तहत कार्यवाही होगी। किराया न देने पर IPC 420 लागू होगा।
              </Text>
            </View>

            <Button title="शिकायत दर्ज करें" onPress={handleSubmit} loading={loading} variant="danger" style={{ marginTop: 8 }} />
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  againstBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginHorizontal: 20, marginTop: 12, padding: 10, borderRadius: 8 },
  againstText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  body: { padding: 20 },
  sectionLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 10 },
  subjectsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  subjectChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  subjectText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  legalNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  legalText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
