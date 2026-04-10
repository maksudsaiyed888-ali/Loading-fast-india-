import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateId } from '@/lib/utils';

export default function VyapariRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addVyapari, login } = useApp();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', businessName: '', phone: '', email: '',
    aadhaarNumber: '', gstNumber: '',
    address: '', city: '', state: 'राजस्थान', pincode: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const handleRegister = async () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'नाम आवश्यक है';
    if (!form.businessName.trim()) e.businessName = 'व्यापार का नाम आवश्यक है';
    if (!form.phone || form.phone.length !== 10) e.phone = 'सही फोन नंबर दर्ज करें';
    if (!form.email.includes('@')) e.email = 'सही ईमेल दर्ज करें';
    if (!form.aadhaarNumber || form.aadhaarNumber.replace(/\s/g, '').length !== 12)
      e.aadhaarNumber = 'आधार 12 अंकों का होना चाहिए';
    if (!form.address.trim()) e.address = 'पता आवश्यक है';
    if (!form.city.trim()) e.city = 'शहर आवश्यक है';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      const id = generateId();
      await addVyapari({
        id,
        name: form.name.trim(),
        businessName: form.businessName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        aadhaarNumber: form.aadhaarNumber.trim(),
        gstNumber: form.gstNumber.trim() || undefined,
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        createdAt: new Date().toISOString(),
        isVerified: false,
        totalBookings: 0,
      });
      await login({ id, role: 'vyapari', name: form.name, phone: form.phone, email: form.email });
      Alert.alert('रजिस्ट्रेशन सफल!', 'आपका व्यापारी अकाउंट बन गया है।', [
        { text: 'आगे बढ़ें', onPress: () => router.replace('/(vyapari)') },
      ]);
    } catch {
      Alert.alert('त्रुटि', 'रजिस्ट्रेशन में समस्या आई। दोबारा कोशिश करें।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.navy, '#1a4a7a']} style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 50 : 0) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>व्यापारी रजिस्ट्रेशन</Text>
        <Text style={styles.headerSub}>Vyapari Registration</Text>
      </LinearGradient>

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>व्यक्तिगत जानकारी</Text>
        <Input label="मालिक का नाम" placeholder="आपका पूरा नाम" value={form.name} onChangeText={(v) => set('name', v)} error={errors.name} icon="user" required />
        <Input label="व्यापार/दुकान का नाम" placeholder="जैसे: राम ट्रेडर्स" value={form.businessName} onChangeText={(v) => set('businessName', v)} error={errors.businessName} icon="briefcase" required />
        <Input label="मोबाइल नंबर" placeholder="10 अंकों का नंबर" value={form.phone} onChangeText={(v) => set('phone', v)} keyboardType="phone-pad" maxLength={10} error={errors.phone} icon="phone" required />
        <Input label="Gmail / Email" placeholder="आपका email" value={form.email} onChangeText={(v) => set('email', v)} keyboardType="email-address" autoCapitalize="none" error={errors.email} icon="mail" required />

        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>दस्तावेज़ जानकारी</Text>
        <View style={[styles.docNote, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
          <Feather name="file-text" size={15} color={colors.primary} />
          <Text style={[styles.docNoteText, { color: colors.primary }]}>Aadhaar Card अनिवार्य • GST वैकल्पिक है</Text>
        </View>
        <Input label="आधार कार्ड नंबर" placeholder="12 अंकों का आधार नंबर" value={form.aadhaarNumber} onChangeText={(v) => set('aadhaarNumber', v)} keyboardType="numeric" maxLength={14} error={errors.aadhaarNumber} icon="shield" required />
        <Input label="GST नंबर (वैकल्पिक)" placeholder="GSTIN नंबर (यदि है)" value={form.gstNumber} onChangeText={(v) => set('gstNumber', v)} autoCapitalize="characters" icon="file" />

        <Text style={[styles.sectionTitle, { color: colors.secondary }]}>पता</Text>
        <Input label="पूरा पता" placeholder="गली, मोहल्ला, गांव" value={form.address} onChangeText={(v) => set('address', v)} error={errors.address} icon="map-pin" required multiline />
        <Input label="शहर/जिला" placeholder="आपका शहर" value={form.city} onChangeText={(v) => set('city', v)} error={errors.city} icon="navigation" required />
        <Input label="पिन कोड" placeholder="6 अंक" value={form.pincode} onChangeText={(v) => set('pincode', v)} keyboardType="numeric" maxLength={6} />

        <View style={[styles.legalBox, { borderColor: colors.destructive + '30', backgroundColor: colors.destructive + '08' }]}>
          <Feather name="alert-triangle" size={14} color={colors.destructive} />
          <Text style={[styles.legalText, { color: colors.destructive }]}>
            ड्राइवर का किराया न देने पर Indian Penal Code Section 420 के तहत कड़ी कार्यवाही होगी।
          </Text>
        </View>

        <View style={[styles.privacyBox, { borderColor: colors.border }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
            आपकी जानकारी Indian IT Act 2000 के तहत Privacy Protected है।
          </Text>
        </View>

        <Button title="रजिस्ट्रेशन पूरा करें" onPress={handleRegister} loading={loading} />
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, gap: 4 },
  back: { marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  body: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 14, marginTop: 4 },
  docNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, alignItems: 'center' },
  docNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium' },
  legalBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12 },
  legalText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  privacyBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  privacyText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
