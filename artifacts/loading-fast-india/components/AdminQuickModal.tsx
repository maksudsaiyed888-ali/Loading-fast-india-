import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Alert, Modal, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';

const ADMIN_PASS = 'LFI@Admin2024';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AdminQuickModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { vyaparis, resetVyapariAdvancePaid } = useApp();
  const [pass, setPass] = useState('');
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleClose = () => {
    setPass('');
    setAuthed(false);
    onClose();
  };

  const handleLogin = () => {
    if (pass === ADMIN_PASS) {
      setAuthed(true);
    } else {
      Alert.alert('गलत पासवर्ड', 'Admin password गलत है।');
    }
  };

  const handleBlock = (id: string, name: string, phone: string) => {
    Alert.alert(
      '🔒 Block करें?',
      `${name} (${phone}) का Advance reset होगा — फिर से BLOCKED हो जाएंगे।`,
      [
        {
          text: 'हाँ, Block करें', style: 'destructive',
          onPress: async () => {
            setLoading(id);
            try {
              await resetVyapariAdvancePaid(id);
              Alert.alert('✅ Done', `${name} अब BLOCKED है।`);
            } finally {
              setLoading(null);
            }
          },
        },
        { text: 'रहने दो', style: 'cancel' },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>

          {/* Header */}
          <View style={[styles.header, { backgroundColor: '#1a1a2e' }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logo}>
                <Text style={styles.logoText}>LFI</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Admin Panel</Text>
                <Text style={styles.headerSub}>Loading Fast India</Text>
              </View>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {!authed ? (
            /* Password Screen */
            <View style={styles.passBody}>
              <Feather name="shield" size={40} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
              <Text style={[styles.passTitle, { color: colors.foreground }]}>Admin Password डालें</Text>
              <TextInput
                style={[styles.passInput, { borderColor: colors.border, color: colors.foreground, backgroundColor: colors.accent }]}
                placeholder="Password..."
                placeholderTextColor={colors.mutedForeground}
                value={pass}
                onChangeText={setPass}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[styles.loginBtn, { backgroundColor: '#1a1a2e' }]}
                onPress={handleLogin}
              >
                <Feather name="unlock" size={16} color="#fff" />
                <Text style={styles.loginBtnText}>Login करें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Admin Controls */
            <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 30 }}>
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
                VYAPARIS — {vyaparis.length} registered
              </Text>

              {vyaparis.length === 0 && (
                <Text style={[styles.empty, { color: colors.mutedForeground }]}>कोई व्यापारी नहीं</Text>
              )}

              {vyaparis.map((v) => (
                <View key={v.id} style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <View style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardName, { color: colors.foreground }]}>{v.name}</Text>
                      <Text style={[styles.cardPhone, { color: colors.mutedForeground }]}>{v.phone}</Text>
                      <Text style={[styles.cardBiz, { color: colors.mutedForeground }]}>{v.businessName}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: v.advancePaid ? '#E8F5E9' : '#FFF3E0' }]}>
                      <Text style={[styles.badgeText, { color: v.advancePaid ? '#2E7D32' : '#E65100' }]}>
                        {v.advancePaid ? '✅ Unlocked' : '🔒 Blocked'}
                      </Text>
                    </View>
                  </View>

                  {v.advancePaid && (
                    <>
                      <View style={[styles.utrRow, { backgroundColor: colors.accent, borderColor: colors.border }]}>
                        <Feather name="credit-card" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.utrText, { color: colors.foreground }]}>
                          UTR: <Text style={{ fontFamily: 'Inter_700Bold' }}>{v.advanceUTR || 'N/A'}</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.blockBtn, { backgroundColor: loading === v.id ? '#9E9E9E' : '#B71C1C' }]}
                        disabled={loading === v.id}
                        onPress={() => handleBlock(v.id, v.name, v.phone)}
                      >
                        <Feather name="lock" size={14} color="#fff" />
                        <Text style={styles.blockBtnText}>
                          {loading === v.id ? 'Block हो रहा है...' : 'Block करें (Advance Reset)'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_700Bold' },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontFamily: 'Inter_400Regular' },
  closeBtn: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, padding: 8 },
  passBody: { padding: 28, gap: 14 },
  passTitle: { fontSize: 16, fontFamily: 'Inter_600SemiBold', textAlign: 'center', marginBottom: 4 },
  passInput: { borderWidth: 1.5, borderRadius: 12, padding: 14, fontSize: 15, fontFamily: 'Inter_400Regular' },
  loginBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
  body: { paddingHorizontal: 16, paddingTop: 16 },
  sectionTitle: { fontSize: 11, fontFamily: 'Inter_600SemiBold', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 },
  empty: { textAlign: 'center', padding: 20, fontFamily: 'Inter_400Regular' },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 10 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  cardName: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  cardPhone: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cardBiz: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 11, fontFamily: 'Inter_600SemiBold' },
  utrRow: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 8, borderWidth: 1, padding: 8 },
  utrText: { fontSize: 12.5, fontFamily: 'Inter_400Regular' },
  blockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10 },
  blockBtnText: { color: '#fff', fontSize: 13, fontFamily: 'Inter_700Bold' },
});
