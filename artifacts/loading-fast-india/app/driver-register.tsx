import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import TermsModal from '@/components/TermsModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateId } from '@/lib/utils';
import { INDIA_STATES } from '@/lib/types';

export default function DriverRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDriver, login } = useApp();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '', email: '', password: '', confirmPassword: '',
    aadhaarNumber: '', licenseNumber: '', licenseExpiry: '', rcBookNumber: '',
    address: '', city: '', state: 'राजस्थान', pincode: '',
    notificationRadius: '50',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const clearError = (k: string) => setErrors((p) => ({ ...p, [k]: '' }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'नाम आवश्यक है';
    if (!form.phone || form.phone.length !== 10) e.phone = 'सही फोन नंबर दर्ज करें';
    if (!form.email.includes('@')) e.email = 'सही Gmail/Email दर्ज करें';
    if (!form.password || form.password.length < 6) e.password = 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'पासवर्ड मेल नहीं खाता';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!form.aadhaarNumber || form.aadhaarNumber.replace(/\s/g, '').length !== 12)
      e.aadhaarNumber = 'आधार 12 अंकों का होना चाहिए';
    if (!form.licenseNumber.trim()) e.licenseNumber = 'लाइसेंस नंबर आवश्यक है';
    if (!form.licenseExpiry.trim()) e.licenseExpiry = 'लाइसेंस एक्सपायरी आवश्यक है';
    if (!form.rcBookNumber.trim()) e.rcBookNumber = 'RC Book नंबर आवश्यक है';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validateStep2()) return;
    if (!form.city.trim() || !form.address.trim()) {
      Alert.alert('त्रुटि', 'पता और शहर आवश्यक है');
      return;
    }
    if (!termsAgreed) {
      Alert.alert('नियम एवं शर्तें', 'रजिस्ट्रेशन से पहले नियम एवं शर्तें पढ़कर सहमति दें।');
      return;
    }
    setLoading(true);
    try {
      const id = generateId();
      const driver = {
        id,
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        aadhaarNumber: form.aadhaarNumber.trim(),
        licenseNumber: form.licenseNumber.trim(),
        licenseExpiry: form.licenseExpiry.trim(),
        rcBookNumber: form.rcBookNumber.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        state: form.state,
        pincode: form.pincode.trim(),
        notificationRadius: parseInt(form.notificationRadius) || 50,
        createdAt: new Date().toISOString(),
        isVerified: false,
        totalTrips: 0,
        rating: 4.5,
      };
      await addDriver(driver);
      await login({ id, role: 'driver', name: form.name, phone: form.phone, email: form.email.toLowerCase() });
      Alert.alert('रजिस्ट्रेशन सफल!', 'आपका ड्राइवर अकाउंट बन गया है।', [
        { text: 'आगे बढ़ें', onPress: () => router.replace('/(driver)') },
      ]);
    } catch (err: any) {
      console.error('Driver register error:', err);
      const msg = err?.code === 'permission-denied'
        ? 'Firebase permission denied — Admin से Firebase rules update कराएं।'
        : err?.message || 'रजिस्ट्रेशन में समस्या आई। Internet connection check करें।';
      Alert.alert('त्रुटि', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 50 : 0) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ड्राइवर रजिस्ट्रेशन</Text>
          <Text style={styles.headerSub}>Driver Registration • चरण {step}/2</Text>
        </View>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: '#fff' }]} />
          <View style={[styles.stepLine, { backgroundColor: step >= 2 ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
          <View style={[styles.stepDot, { backgroundColor: step >= 2 ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
        </View>
      </LinearGradient>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {step === 1 ? (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>व्यक्तिगत जानकारी</Text>
            <Input label="पूरा नाम" placeholder="आपका नाम" value={form.name} onChangeText={(v) => { set('name', v); clearError('name'); }} error={errors.name} icon="user" required />
            <Input label="मोबाइल नंबर" placeholder="10 अंक" value={form.phone} onChangeText={(v) => { set('phone', v); clearError('phone'); }} keyboardType="phone-pad" maxLength={10} error={errors.phone} icon="phone" required />
            <Input label="Gmail / Email" placeholder="example@gmail.com" value={form.email} onChangeText={(v) => { set('email', v); clearError('email'); }} keyboardType="email-address" autoCapitalize="none" error={errors.email} icon="mail" required />

            <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: 8 }]}>पासवर्ड बनाएं</Text>
            <View style={{ position: 'relative' }}>
              <Input
                label="पासवर्ड" placeholder="कम से कम 6 अक्षर"
                value={form.password} onChangeText={(v) => { set('password', v); clearError('password'); }}
                secureTextEntry={!showPass} error={errors.password} icon="lock" required
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={{ position: 'relative' }}>
              <Input
                label="पासवर्ड confirm करें" placeholder="पासवर्ड दोबारा दर्ज करें"
                value={form.confirmPassword} onChangeText={(v) => { set('confirmPassword', v); clearError('confirmPassword'); }}
                secureTextEntry={!showConfirmPass} error={errors.confirmPassword} icon="lock" required
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowConfirmPass(!showConfirmPass)}>
                <Feather name={showConfirmPass ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: 8 }]}>पता</Text>
            <Input label="पूरा पता" placeholder="गली, मोहल्ला, गांव" value={form.address} onChangeText={(v) => set('address', v)} multiline icon="map-pin" />
            <Input label="शहर/जिला" placeholder="आपका शहर" value={form.city} onChangeText={(v) => set('city', v)} icon="navigation" />
            <Input label="पिन कोड" placeholder="6 अंक" value={form.pincode} onChangeText={(v) => set('pincode', v)} keyboardType="numeric" maxLength={6} />

            <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: 8 }]}>Notification Range</Text>
            <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>ट्रिप notification कितनी दूर तक मिले? (किमी में)</Text>
            <View style={styles.rangeButtons}>
              {['25', '50', '100', '200', '500'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.rangeBtn, { backgroundColor: form.notificationRadius === r ? colors.primary : colors.card, borderColor: form.notificationRadius === r ? colors.primary : colors.border }]}
                  onPress={() => set('notificationRadius', r)}
                >
                  <Text style={[styles.rangeBtnText, { color: form.notificationRadius === r ? '#fff' : colors.foreground }]}>{r} km</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="अगला चरण →" onPress={() => { if (validateStep1()) setStep(2); }} style={{ marginTop: 8 }} />
          </View>
        ) : (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>दस्तावेज़ जानकारी</Text>
            <View style={[styles.docNote, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
              <Feather name="file-text" size={15} color={colors.primary} />
              <Text style={[styles.docNoteText, { color: colors.primary }]}>RC Book, Aadhaar Card और Driving License अनिवार्य है</Text>
            </View>
            <Input label="आधार कार्ड नंबर" placeholder="12 अंकों का आधार नंबर" value={form.aadhaarNumber} onChangeText={(v) => { set('aadhaarNumber', v); clearError('aadhaarNumber'); }} keyboardType="numeric" maxLength={14} error={errors.aadhaarNumber} icon="shield" required />
            <Input label="RC Book नंबर" placeholder="जैसे: RJ14CA0001" value={form.rcBookNumber} onChangeText={(v) => { set('rcBookNumber', v); clearError('rcBookNumber'); }} autoCapitalize="characters" error={errors.rcBookNumber} icon="truck" required />
            <Input label="ड्राइविंग लाइसेंस नंबर" placeholder="जैसे: RJ14 20230000001" value={form.licenseNumber} onChangeText={(v) => { set('licenseNumber', v); clearError('licenseNumber'); }} autoCapitalize="characters" error={errors.licenseNumber} icon="credit-card" required />
            <Input label="लाइसेंस एक्सपायरी तारीख" placeholder="DD/MM/YYYY" value={form.licenseExpiry} onChangeText={(v) => { set('licenseExpiry', v); clearError('licenseExpiry'); }} error={errors.licenseExpiry} icon="calendar" required />

            <View style={[styles.privacyBox, { borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
                आपके दस्तावेज़ सुरक्षित रहेंगे। Indian IT Act 2000 के तहत Privacy Protected है।
              </Text>
            </View>

            <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAgreed(!termsAgreed)} activeOpacity={0.8}>
              <View style={[styles.checkbox, { borderColor: termsAgreed ? colors.primary : colors.border, backgroundColor: termsAgreed ? colors.primary : 'transparent' }]}>
                {termsAgreed && <Feather name="check" size={12} color="#fff" />}
              </View>
              <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
                मैं{' '}
                <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold' }} onPress={() => setShowTerms(true)}>
                  नियम, शर्तें एवं गोपनीयता नीति
                </Text>
                {' '}से सहमत हूं। धोखाधड़ी पर IPC कार्यवाही स्वीकार्य है।
              </Text>
            </TouchableOpacity>
            <Button title="रजिस्ट्रेशन पूरा करें" onPress={handleRegister} loading={loading} style={{ marginBottom: 8 }} />
            <Button title="← वापस" onPress={() => setStep(1)} variant="outline" />
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, gap: 12 },
  back: { marginBottom: 8 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: 'Inter_400Regular' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  stepDot: { width: 10, height: 10, borderRadius: 5 },
  stepLine: { flex: 1, height: 2, marginHorizontal: 4 },
  body: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 14 },
  rangeLabel: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: 10 },
  rangeButtons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  rangeBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8, borderWidth: 1.5 },
  rangeBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
  docNote: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, alignItems: 'flex-start' },
  docNoteText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  privacyBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  privacyText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  termsText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  eyeBtn: { position: 'absolute', right: 14, top: 38 },
});
