import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import React, { useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { auth, firebaseConfig } from '@/lib/firebase';

const ADMIN_PASS = 'LFI@Admin2024';

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, drivers, vyaparis } = useApp();

  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const [role, setRole] = useState<'driver' | 'vyapari' | 'admin'>('driver');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [adminPass, setAdminPass] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (r: 'driver' | 'vyapari' | 'admin') => {
    setRole(r);
    setStep(1);
    setPhone('');
    setOtp('');
    setConfirmationResult(null);
  };

  const handleGetOtp = async () => {
    if (!phone || phone.length !== 10) {
      Alert.alert('त्रुटि', '10 अंकों का मोबाइल नंबर दर्ज करें');
      return;
    }
    const roleList = role === 'driver' ? drivers : vyaparis;
    const found = roleList.find((u) => u.phone === phone.trim());
    if (!found) {
      Alert.alert('खाता नहीं मिला', 'इस नंबर से कोई खाता नहीं है। पहले रजिस्ट्रेशन करें।');
      return;
    }
    setLoading(true);
    try {
      const result = await signInWithPhoneNumber(auth, '+91' + phone.trim(), recaptchaVerifier.current!);
      setConfirmationResult(result);
      setStep(2);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('too-many-requests')) {
        Alert.alert('बहुत ज्यादा कोशिश', 'कुछ देर बाद दोबारा try करें।');
      } else if (msg.includes('invalid-phone-number')) {
        Alert.alert('गलत नंबर', 'सही 10 अंकों का नंबर दर्ज करें।');
      } else {
        Alert.alert('OTP Error', `OTP नहीं भेजा जा सका। (${msg || 'Network error'})`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('त्रुटि', '6 अंकों का OTP दर्ज करें');
      return;
    }
    if (!confirmationResult) {
      Alert.alert('त्रुटि', 'पहले OTP भेजें');
      return;
    }
    setLoading(true);
    try {
      await confirmationResult.confirm(otp.trim());
      const roleList = role === 'driver' ? drivers : vyaparis;
      const found = roleList.find((u) => u.phone === phone.trim());
      if (!found) {
        Alert.alert('त्रुटि', 'User नहीं मिला। Support से संपर्क करें।');
        return;
      }
      await login({ id: found.id, role: role as 'driver' | 'vyapari', name: found.name, phone: found.phone, email: (found as { email?: string }).email ?? '' });
      router.replace(role === 'driver' ? '/(driver)' : '/(vyapari)');
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message ?? '';
      if (msg.includes('invalid-verification-code') || msg.includes('code-expired')) {
        Alert.alert('गलत OTP', 'OTP गलत है या expire हो गया। नया OTP लें।', [
          { text: 'नया OTP लें', onPress: () => { setStep(1); setOtp(''); setConfirmationResult(null); } },
        ]);
      } else {
        Alert.alert('त्रुटि', 'OTP verify नहीं हुआ। दोबारा कोशिश करें।');
      }
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
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />

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
                पंजीकृत मोबाइल नंबर डालें — OTP Google द्वारा FREE SMS से आएगा
              </Text>
            </View>

            <Input
              label="मोबाइल नंबर"
              placeholder="10 अंकों का नंबर"
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
            <Button title="OTP भेजें →" onPress={handleGetOtp} loading={loading} />
          </>
        ) : (
          <>
            <View style={[styles.smsBanner, { backgroundColor: '#E8F5E9', borderColor: '#4CAF50' }]}>
              <Feather name="message-square" size={18} color="#388E3C" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.smsBannerTitle, { color: '#388E3C' }]}>OTP भेज दिया गया</Text>
                <Text style={[styles.smsBannerSub, { color: '#388E3C' }]}>
                  {phone} पर 6 अंकों का OTP Google द्वारा SMS से आया होगा
                </Text>
              </View>
            </View>

            <Input
              label="OTP दर्ज करें"
              placeholder="6 अंकों का OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="numeric"
              maxLength={6}
              icon="key"
              required
            />

            <View style={[styles.otpInfo, { borderColor: colors.border }]}>
              <Feather name="shield" size={13} color={colors.mutedForeground} />
              <Text style={[styles.otpInfoText, { color: colors.mutedForeground }]}>Firebase द्वारा secure OTP • Google का infrastructure • बिल्कुल FREE</Text>
            </View>

            <Button title="लॉगिन करें" onPress={handleVerifyOtp} loading={loading} />

            <TouchableOpacity style={styles.resendRow} onPress={() => { setStep(1); setOtp(''); setConfirmationResult(null); }}>
              <Feather name="refresh-cw" size={13} color={colors.primary} />
              <Text style={[styles.resendText, { color: colors.primary }]}>OTP नहीं आया? नया OTP लें</Text>
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
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16 },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: 'Inter_500Medium', lineHeight: 18 },
  rememberBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, marginTop: 4 },
  rememberText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_400Regular' },
  smsBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1.5, marginBottom: 20 },
  smsBannerTitle: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  smsBannerSub: { fontSize: 12.5, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  otpInfo: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 8, borderWidth: 1, marginBottom: 16, marginTop: 4 },
  otpInfoText: { flex: 1, fontSize: 11.5, fontFamily: 'Inter_400Regular', lineHeight: 16 },
  resendRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 },
  resendText: { fontSize: 13.5, fontFamily: 'Inter_500Medium' },
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
});
