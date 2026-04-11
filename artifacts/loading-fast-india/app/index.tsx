import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import AppRatingModal from '@/components/AppRatingModal';

export default function WelcomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, isLoading, getAppAvgRating, appRatings } = useApp();
  const [showRating, setShowRating] = useState(false);

  React.useEffect(() => {
    if (!isLoading && user) {
      if (user.role === 'driver') router.replace('/(driver)');
      else if (user.role === 'vyapari') router.replace('/(vyapari)');
      else if (user.role === 'admin') router.replace('/admin');
    }
  }, [user, isLoading]);

  if (isLoading) return null;

  return (
    <LinearGradient
      colors={[colors.navy, '#0d3260', colors.primary + 'aa']}
      style={[styles.container, { paddingTop: insets.top + (Platform.OS === 'web' ? 40 : 0) }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.logoArea}>
        <Image
          source={require('../assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.appName}>Loading Fast India</Text>
        <Text style={styles.tagline}>भारत की सबसे तेज़ लोडिंग सेवा</Text>
      </View>

      <View style={styles.flagStripe}>
        <View style={[styles.stripe, { backgroundColor: '#FF9933' }]} />
        <View style={[styles.stripe, { backgroundColor: '#ffffff' }]} />
        <View style={[styles.stripe, { backgroundColor: '#138808' }]} />
      </View>

      <View style={[styles.card, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
        <Text style={[styles.selectTitle, { color: colors.navy }]}>आप कौन हैं?</Text>
        <Text style={[styles.selectSub, { color: colors.mutedForeground }]}>अपनी भूमिका चुनें</Text>

        <TouchableOpacity
          style={[styles.roleBtn, { backgroundColor: colors.primary }]}
          activeOpacity={0.85}
          onPress={() => router.push('/driver-register')}
        >
          <Feather name="truck" size={28} color="#fff" />
          <View style={styles.roleBtnText}>
            <Text style={styles.roleBtnTitle}>ड्राइवर</Text>
            <Text style={styles.roleBtnSub}>Driver Registration</Text>
          </View>
          <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleBtn, { backgroundColor: colors.navy }]}
          activeOpacity={0.85}
          onPress={() => router.push('/vyapari-register')}
        >
          <Feather name="briefcase" size={28} color="#fff" />
          <View style={styles.roleBtnText}>
            <Text style={styles.roleBtnTitle}>व्यापारी</Text>
            <Text style={styles.roleBtnSub}>Vyapari Registration</Text>
          </View>
          <Feather name="chevron-right" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.adminBtn, { borderColor: colors.border }]}
          activeOpacity={0.85}
          onPress={() => router.push('/admin')}
        >
          <Feather name="settings" size={16} color={colors.mutedForeground} />
          <Text style={[styles.adminBtnText, { color: colors.mutedForeground }]}>Admin Panel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginLink}
          onPress={() => router.push('/login')}
        >
          <Text style={[styles.loginLinkText, { color: colors.primary }]}>
            पहले से खाता है? लॉगिन करें
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.trustBadge} onPress={() => setShowRating(true)} activeOpacity={0.85}>
        <Text style={styles.trustStars}>
          {'⭐'.repeat(Math.round(getAppAvgRating() || 5))}
        </Text>
        <View>
          <Text style={styles.trustScore}>
            {getAppAvgRating() > 0 ? getAppAvgRating().toFixed(1) : '5.0'} / 5
          </Text>
          <Text style={styles.trustCount}>
            {appRatings.length > 0 ? `${appRatings.length} Users ने Rate किया` : 'App को Rate करें ➜'}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={styles.footer}>
        2% Commission • UPI: hemaksudsaiyed888@oksbi
      </Text>
      <View style={{ height: insets.bottom + 8 }} />

      <AppRatingModal visible={showRating} onClose={() => setShowRating(false)} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20 },
  logoArea: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 90, height: 90, borderRadius: 20, marginBottom: 14 },
  appName: { color: '#fff', fontSize: 30, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  tagline: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontFamily: 'Inter_400Regular', marginTop: 4 },
  flagStripe: { flexDirection: 'row', height: 4, width: 120, borderRadius: 4, overflow: 'hidden', marginBottom: 24 },
  stripe: { flex: 1 },
  card: {
    width: '100%', borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
  },
  selectTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  selectSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', marginBottom: 20, marginTop: 4 },
  roleBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 18, borderRadius: 16, marginBottom: 12,
  },
  roleBtnText: { flex: 1 },
  roleBtnTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold' },
  roleBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 4,
  },
  adminBtnText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  loginLink: { marginTop: 14, alignItems: 'center' },
  loginLinkText: { fontSize: 14, fontFamily: 'Inter_500Medium' },
  footer: { color: 'rgba(255,255,255,0.55)', fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 8, textAlign: 'center' },
  trustBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 18, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  trustStars: { fontSize: 16, lineHeight: 20 },
  trustScore: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold', lineHeight: 18 },
  trustCount: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
});
