import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const ADMIN_PASS = 'LFI@Admin2024';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, generateLoginOtp, verifyLoginOtp } = useApp();

  const [role, setRole] = useState<'driver' | 'vyapari' | 'admin'>('driver');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: 'driver' | 'vyapari' | 'admin') => {
    setRole(r);
    setStep(1);
    setPhone('');
    setOtp('');
    setGeneratedOtp('');
  };

  const handleGetOtp = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('त्रुटि', '10 अंकों का मोबाइल नंबर दर्ज करें');
      return;
    }
    setLoading(true);
    try {
      const result = await generateLoginOtp(phone.trim(), role as 'driver' | 'vyapari');
      if (!result) {
        Alert.alert('नहीं मिला', 'इस नंबर से कोई खाता नहीं है। पहले रजिस्ट्रेशन करें।');
        return;
      }
      setGeneratedOtp(result);
      setStep(2);
    } catch (e) {
      Alert.alert('त्रुटि', 'कुछ गड़बड़ हुई, दोबारा कोशिश करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 4) {
      Alert.alert('त्रुटि', '4 अंकों का OTP दर्ज करें');
      return;
    }
    setLoading(true);
    try {
      const ok = await verifyLoginOtp(phone.trim(), otp.trim(), role as 'driver' | 'vyapari');
      if (!ok) {
        Alert.alert('गलत OTP', 'दर्ज किया गया OTP गलत है। दोबारा कोशिश करें।');
        return;
      }
      router.replace(role === 'driver' ? '/(driver)' : '/(vyapari)');
    } catch (e) {
      Alert.alert('त्रुटि', 'कुछ गड़बड़ हुई, दोबारा कोशिश करें।');
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    setLoading(true);
    try {
      if (adminPass === ADMIN_PASS) {
        await login({ id: 'admin', role: 'admin', name: 'Admin', phone: '', email: '' });
        router.replace('/admin');
      } else {
        Alert.alert('गलत पासवर्ड', 'Admin password गलत है');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 0) }]}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>लॉगिन करें</Text>
        <Text style={[styles.sub, { color: colors.mutedForeground }]}>अपने खाते में प्रवेश करें</Text>

        <View style={styles.tabs}>
          {(['driver', 'vyapari', 'admin'] as const).map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.tab, { borderColor: role === r ? colors.primary : colors.border, backgroundColor: role === r ? colors.primary : colors.card }]}
              onPress={() => handleRoleChange(r)}
            >
              <Text style={[styles.tabText, { color: role === r ? '#fff' : colors.mutedForeground }]}>
                {r === 'driver' ? 'ड्राइवर' : r === 'vyapari' ? 'व्यापारी' : 'Admin'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {role === 'admin' ? (
          <>
            <Input
              label="Admin Password"
              placeholder="पासवर्ड दर्ज करें"
              value={adminPass}
              onChangeText={setAdminPass}
              secureTextEntry
              icon="lock"
              required
            />
            <Button title="लॉगिन करें" onPress={handleAdminLogin} loading={loading} />
          </>
        ) : step === 1 ? (
          <>
            <View style={[styles.infoBanner, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
              <Feather name="smartphone" size={16} color={colors.primary} />
              <Text style={[styles.infoBannerText, { color: colors.primary }]}>
                पंजीकृत मोबाइल नंबर डालें — OTP स्क्रीन पर दिखेगा
              </Text>
            </View>
            <Input
              label="मोबाइल नंबर"
              placeholder="10 अंकों का नंबर दर्ज करें"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              maxLength={10}
              icon="phone"
              required
            />
            <View style={[styles.rememberBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.rememberText, { color: colors.mutedForeground }]}>
                लॉगिन हमेशा याद रहेगा — दोबारा login की जरूरत नहीं
              </Text>
            </View>
            <Button title="OTP लें →" onPress={handleGetOtp} loading={loading} />
          </>
        ) : (
          <>
            <View style={[styles.otpCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <Text style={[styles.otpLabel, { color: colors.primary }]}>आपका OTP</Text>
              <Text style={[styles.otpNumber, { color: colors.primary }]}>{generatedOtp}</Text>
              <Text style={[styles.otpHint, { color: colors.mutedForeground }]}>
                नीचे यही OTP दर्ज करें
              </Text>
            </View>

            <Input
              label="OTP दर्ज करें"
              placeholder="4 अंकों का OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={4}
              icon="key"
              required
            />

            <Button title="लॉगिन करें" onPress={handleVerifyOtp} loading={loading} />

            <TouchableOpacity style={styles.backStep} onPress={() => { setStep(1); setOtp(''); setGeneratedOtp(''); }}>
              <Feather name="arrow-left" size={14} color={colors.primary} />
              <Text style={[styles.backStepText, { color: colors.primary }]}>नंबर बदलें</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.registerLink} onPress={() => router.back()}>
          <Text style={[styles.registerText, { color: colors.primary }]}>
            खाता नहीं है? रजिस्टर करें
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  back: { padding: 20, paddingBottom: 0 },
  content: { padding: 20 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', marginBottom: 6 },
  sub: { fontSize: 14, fontFamily: 'Inter_400Regular', marginBottom: 28 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1.5 },
  tabText: { fontSize: 13, fontFamily: 'Inter_700Bold' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  rememberBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, marginTop: 4 },
  rememberText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_400Regular' },
  otpCard: { borderWidth: 2, borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  otpLabel: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8, letterSpacing: 1 },
  otpNumber: { fontSize: 52, fontFamily: 'Inter_700Bold', letterSpacing: 8, marginBottom: 8 },
  otpHint: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  backStep: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 12 },
  backStepText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
