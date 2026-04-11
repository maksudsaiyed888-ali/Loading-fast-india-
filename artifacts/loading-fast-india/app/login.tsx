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
  const { drivers, vyaparis, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [role, setRole] = useState<'driver' | 'vyapari' | 'admin'>('driver');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      if (role === 'admin') {
        if (adminPass === ADMIN_PASS) {
          await login({ id: 'admin', role: 'admin', name: 'Admin', phone: '', email: '' });
          router.replace('/admin');
        } else {
          Alert.alert('गलत पासवर्ड', 'Admin password गलत है');
        }
        return;
      }

      const emailTrimmed = email.trim().toLowerCase();
      if (!emailTrimmed.includes('@')) {
        Alert.alert('त्रुटि', 'सही Gmail/Email दर्ज करें');
        return;
      }
      if (!password.trim()) {
        Alert.alert('त्रुटि', 'पासवर्ड दर्ज करें');
        return;
      }

      if (role === 'driver') {
        const driver = drivers.find(
          (d) => d.email.toLowerCase() === emailTrimmed && d.password === password
        );
        if (!driver) {
          Alert.alert('गलत जानकारी', 'Email या पासवर्ड गलत है');
          return;
        }
        await login({ id: driver.id, role: 'driver', name: driver.name, phone: driver.phone, email: driver.email });
        router.replace('/(driver)');
      } else {
        const vyapari = vyaparis.find(
          (v) => v.email.toLowerCase() === emailTrimmed && v.password === password
        );
        if (!vyapari) {
          Alert.alert('गलत जानकारी', 'Email या पासवर्ड गलत है');
          return;
        }
        await login({ id: vyapari.id, role: 'vyapari', name: vyapari.name, phone: vyapari.phone, email: vyapari.email });
        router.replace('/(vyapari)');
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
              onPress={() => setRole(r)}
            >
              <Text style={[styles.tabText, { color: role === r ? '#fff' : colors.mutedForeground }]}>
                {r === 'driver' ? 'ड्राइवर' : r === 'vyapari' ? 'व्यापारी' : 'Admin'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {role !== 'admin' ? (
          <>
            <Input
              label="Gmail / Email"
              placeholder="example@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              required
            />
            <View style={{ position: 'relative' }}>
              <Input
                label="पासवर्ड"
                placeholder="अपना पासवर्ड दर्ज करें"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPass}
                icon="lock"
                required
              />
              <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowPass(!showPass)}>
                <Feather name={showPass ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={[styles.rememberBox, { backgroundColor: colors.accent, borderColor: colors.border }]}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.rememberText, { color: colors.mutedForeground }]}>
                लॉगिन हमेशा याद रहेगा — दोबारा login की जरूरत नहीं
              </Text>
            </View>
          </>
        ) : (
          <Input
            label="Admin Password"
            placeholder="पासवर्ड दर्ज करें"
            value={adminPass}
            onChangeText={setAdminPass}
            secureTextEntry
            icon="lock"
            required
          />
        )}

        <Button title="लॉगिन करें" onPress={handleLogin} loading={loading} />

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
  registerLink: { marginTop: 16, alignItems: 'center' },
  registerText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  eyeBtn: { position: 'absolute', right: 14, top: 38 },
  rememberBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, marginTop: 4 },
  rememberText: { flex: 1, fontSize: 12.5, fontFamily: 'Inter_400Regular' },
});
