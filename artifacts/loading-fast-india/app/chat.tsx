import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { generateId } from '@/lib/utils';
import { ChatMessage } from '@/lib/types';

export default function ChatScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, trips, getTripMessages, sendChatMessage } = useApp();

  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  const trip = trips.find((t) => t.id === tripId);
  const messages = getTripMessages(tripId ?? '');

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  if (!trip) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>ट्रिप नहीं मिली</Text>
      </View>
    );
  }

  if (!trip.commissionPaid) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 32 }]}>
        <Feather name="lock" size={48} color={colors.destructive} />
        <Text style={[styles.lockTitle, { color: colors.foreground }]}>चैट लॉक है</Text>
        <Text style={[styles.lockSub, { color: colors.mutedForeground }]}>
          2% कमीशन (₹{trip.commissionAmount?.toFixed(0) ?? '—'}) भुगतान के बाद चैट active होगी।
          {'\n\n'}भुगतान करें: Loading Fast India
        </Text>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnText}>वापस जाएं</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    setSending(true);
    const msg: ChatMessage = {
      id: generateId(),
      tripId: tripId!,
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role as 'driver' | 'vyapari',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    await sendChatMessage(msg);
    setText('');
    setSending(false);
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const QUICK_MSGS = [
    'माल कहाँ है? 📦',
    'कब पहुंचोगे? 🕐',
    'गाड़ी रवाना हो गई 🚛',
    'पहुंचने वाले हैं ✅',
    'ठीक है, धन्यवाद 🙏',
    'टोल पर हूं ⛽',
    'रात में पहुंचेंगे 🌙',
    'माल उतर गया 📤',
  ];

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const isMe = item.senderId === user?.id;
    const roleColor = item.senderRole === 'driver' ? '#E07B39' : '#1B3A6B';
    const roleLabel = item.senderRole === 'driver' ? '🚛 ड्राइवर' : '🏪 व्यापारी';

    return (
      <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther]}>
        {!isMe && (
          <View style={[styles.avatar, { backgroundColor: roleColor }]}>
            <Text style={styles.avatarText}>{item.senderName[0]?.toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe
          ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
          : { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
        ]}>
          {!isMe && (
            <Text style={[styles.senderLabel, { color: roleColor }]}>{item.senderName} • {roleLabel}</Text>
          )}
          <Text style={[styles.msgText, { color: isMe ? '#fff' : colors.foreground }]}>{item.text}</Text>
          <Text style={[styles.timeText, { color: isMe ? 'rgba(255,255,255,0.65)' : colors.mutedForeground }]}>
            {new Date(item.timestamp).toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        {isMe && (
          <View style={[styles.avatar, { backgroundColor: user?.role === 'driver' ? '#E07B39' : '#1B3A6B' }]}>
            <Text style={styles.avatarText}>{user?.name[0]?.toUpperCase()}</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={['#1B3A6B', '#2a5298']}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 50 : 8) }]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {trip.fromCity} → {trip.toCity}
          </Text>
          <Text style={styles.headerSub}>
            {trip.driverName} • {trip.vehicleTypeName} • {trip.vehicleNumber}
          </Text>
        </View>
        <View style={[styles.activeBadge, { backgroundColor: '#16a34a' }]}>
          <View style={styles.activeDot} />
          <Text style={styles.activeText}>Live</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={[styles.msgList, messages.length === 0 && styles.msgListEmpty]}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={{ fontSize: 40 }}>💬</Text>
              <Text style={[styles.emptyChatTitle, { color: colors.foreground }]}>चैट शुरू करें</Text>
              <Text style={[styles.emptyChatSub, { color: colors.mutedForeground }]}>
                ड्राइवर और व्यापारी यहाँ बात कर सकते हैं।
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />

        <View style={[styles.quickBar, { borderTopColor: colors.border }]}>
          <FlatList
            horizontal
            data={QUICK_MSGS}
            keyExtractor={(_, i) => String(i)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: colors.accent, borderColor: colors.border }]}
                onPress={() => setText(item)}
              >
                <Text style={[styles.quickChipText, { color: colors.foreground }]}>{item}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <View style={[styles.inputBar, {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 8,
        }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
            placeholder="संदेश लिखें..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: text.trim() ? colors.primary : colors.muted }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            <Feather name="send" size={18} color={text.trim() ? '#fff' : colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
  backIcon: { padding: 4 },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  activeText: { fontSize: 11, fontFamily: 'Inter_700Bold', color: '#fff' },
  msgList: { padding: 16, gap: 10 },
  msgListEmpty: { flex: 1, justifyContent: 'center' },
  emptyChat: { alignItems: 'center', padding: 40, gap: 8 },
  emptyChatTitle: { fontSize: 18, fontFamily: 'Inter_700Bold' },
  emptyChatSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  msgRow: { flexDirection: 'row', gap: 8, marginVertical: 3, alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#fff' },
  bubble: { maxWidth: '72%', padding: 10, borderRadius: 14, gap: 3 },
  senderLabel: { fontSize: 10, fontFamily: 'Inter_700Bold', marginBottom: 2 },
  msgText: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  timeText: { fontSize: 10, fontFamily: 'Inter_400Regular', alignSelf: 'flex-end', marginTop: 2 },
  quickBar: { borderTopWidth: 1, paddingVertical: 8 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 12, fontFamily: 'Inter_400Regular' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, fontFamily: 'Inter_400Regular', maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  lockTitle: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 16, textAlign: 'center' },
  lockSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginTop: 8 },
  backBtn: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  backBtnText: { color: '#fff', fontFamily: 'Inter_700Bold', fontSize: 15 },
});
