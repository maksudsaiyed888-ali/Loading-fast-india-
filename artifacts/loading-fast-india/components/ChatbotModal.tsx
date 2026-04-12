import { Feather } from '@expo/vector-icons';
import React, { useState, useRef, useEffect } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface BotMessage {
  id: string;
  text: string;
  isBot: boolean;
}

const FAQ: { keywords: string[]; answer: string }[] = [
  {
    keywords: ['रजिस्ट्रेशन', 'register', 'sign up', 'account', 'खाता', 'बनाना'],
    answer: '📝 रजिस्ट्रेशन के लिए:\n1. होम स्क्रीन पर "ड्राइवर" या "व्यापारी" चुनें\n2. आधार नंबर, मोबाइल, ईमेल भरें\n3. नियम पढ़कर सहमति दें\n4. "रजिस्ट्रेशन पूरा करें" बटन दबाएं',
  },
  {
    keywords: ['कमीशन', 'commission', '2%', 'शुल्क', 'fees', 'charge'],
    answer: '💰 कमीशन:\n• प्रति ट्रिप 2% कमीशन लिया जाता है\n• UPI: maksudsaiyed888@oksbi\n• कमीशन भुगतान के बाद ही चैट और बिलटी सुविधा मिलती है',
  },
  {
    keywords: ['बिलटी', 'bilty', 'receipt', 'रसीद', 'document'],
    answer: '📄 डिजिटल बिलटी:\n• बुकिंग confirm होने और 2% कमीशन देने के बाद बिलटी बनती है\n• Transporter ID: 24BRLPS3959R1ZN\n• बिलटी में माल, वाहन और किराए की पूरी जानकारी होती है',
  },
  {
    keywords: ['ट्रिप', 'trip', 'post', 'डालना', 'माल', 'booking'],
    answer: '🚛 ट्रिप पोस्ट करने के लिए:\n• ड्राइवर: "ट्रिप डालें" → गंतव्य, किराया, वाहन भरें\n• व्यापारी: "ट्रिप ढूंढें" → शहर और वाहन से फ़िल्टर करें\n• बुकिंग confirm होने पर दोनों को सूचना मिलती है',
  },
  {
    keywords: ['वाहन', 'vehicle', 'truck', 'गाड़ी', 'add vehicle', 'जोड़ना'],
    answer: '🚗 वाहन जोड़ने के लिए:\n• ड्राइवर डैशबोर्ड → "मेरी गाड़ियां" → "नई गाड़ी जोड़ें"\n• एक ID से unlimited गाड़ियां जोड़ सकते हैं\n• 18 प्रकार के वाहन उपलब्ध हैं',
  },
  {
    keywords: ['शिकायत', 'complaint', 'problem', 'समस्या', 'धोखा', 'fraud'],
    answer: '⚖️ शिकायत के लिए:\n• ट्रिप स्क्रीन पर "शिकायत" बटन दबाएं\n• शिकायत का प्रकार चुनें\n• प्रत्येक शिकायत के साथ IPC धाराएं लागू होती हैं\n• झूठी शिकायत पर IPC 182/211 के तहत कार्यवाही होगी',
  },
  {
    keywords: ['status', 'स्टेटस', 'location', 'कहाँ', 'कहां', 'रास्ते', 'tracking'],
    answer: '📍 माल की स्थिति:\n• ड्राइवर: "मेरी ट्रिप्स" → ट्रिप चुनें → "Status Update"\n• लोडिंग हो रही है / रास्ते में है / डिलीवर हो गया\n• चैट में ड्राइवर से सीधे पूछें (2% कमीशन बाद)',
  },
  {
    keywords: ['chat', 'चैट', 'बात', 'contact', 'संपर्क', 'message', 'संदेश'],
    answer: '💬 चैट सुविधा:\n• 2% कमीशन भुगतान के बाद ड्राइवर और व्यापारी चैट कर सकते हैं\n• "मेरी बुकिंग" या "मेरी ट्रिप" → "चैट" बटन\n• Quick messages भी उपलब्ध हैं',
  },
  {
    keywords: ['login', 'लॉगिन', 'sign in', 'पहले से', 'account', 'खाता'],
    answer: '🔑 लॉगिन करने के लिए:\n• होम स्क्रीन पर "पहले से खाता है? लॉगिन करें"\n• मोबाइल नंबर या Email डालें\n• पहले रजिस्ट्रेशन जरूरी है',
  },
  {
    keywords: ['aadhaar', 'आधार', 'document', 'दस्तावेज़', 'verification'],
    answer: '🪪 दस्तावेज़:\n• आधार कार्ड अनिवार्य है\n• GST नंबर वैकल्पिक है\n• लाइसेंस नंबर और RC ड्राइवर के लिए जरूरी है\n• सभी जानकारी IT Act 2000 के तहत सुरक्षित है',
  },
  {
    keywords: ['help', 'मदद', 'support', 'सहायता', 'helpline', 'contact'],
    answer: '📞 सहायता:\n• App: Loading Fast India\n• Email: maksudsaiyed888@gmail.com\n• Commission UPI: maksudsaiyed888@oksbi\n• Transporter ID: 24BRLPS3959R1ZN\n\nआप नीचे अपना सवाल टाइप करें, मैं जवाब दूंगा!',
  },
];

function getBotAnswer(input: string): string {
  const lower = input.toLowerCase();
  for (const faq of FAQ) {
    if (faq.keywords.some((k) => lower.includes(k))) {
      return faq.answer;
    }
  }
  return '🤔 माफ़ करें, मैं यह समझ नहीं पाया।\n\nआप इनमें से पूछ सकते हैं:\n• रजिस्ट्रेशन कैसे करें\n• कमीशन क्या है\n• ट्रिप कैसे डालें\n• बिलटी कैसे पाएं\n• चैट कब मिलेगी\n• शिकायत कैसे करें';
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ChatbotModal({ visible, onClose }: Props) {
  const colors = useColors();
  const flatRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<BotMessage[]>([
    {
      id: '0',
      isBot: true,
      text: '👋 नमस्ते! मैं Loading Fast India का सहायक हूं।\n\nआपका क्या सवाल है? नीचे टाइप करें या कोई विषय चुनें:',
    },
  ]);
  const [input, setInput] = useState('');

  useEffect(() => {
    if (visible && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages.length, visible]);

  const QUICK = ['रजिस्ट्रेशन', 'कमीशन', 'बिलटी', 'ट्रिप', 'चैट', 'शिकायत', 'लॉगिन', 'सहायता'];

  const sendMsg = (text: string) => {
    if (!text.trim()) return;
    const userMsg: BotMessage = { id: Date.now().toString(), isBot: false, text: text.trim() };
    const botReply: BotMessage = { id: (Date.now() + 1).toString(), isBot: true, text: getBotAnswer(text) };
    setMessages((prev) => [...prev, userMsg, botReply]);
    setInput('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 150);
  };

  const renderMsg = ({ item }: { item: BotMessage }) => (
    <View style={[styles.msgRow, item.isBot ? styles.botRow : styles.userRow]}>
      {item.isBot && (
        <View style={[styles.botAvatar, { backgroundColor: '#E07B39' }]}>
          <Text style={styles.botAvatarText}>LFI</Text>
        </View>
      )}
      <View style={[
        styles.bubble,
        item.isBot
          ? { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }
          : { backgroundColor: '#1B3A6B', borderBottomRightRadius: 4 },
      ]}>
        <Text style={[styles.msgText, { color: item.isBot ? colors.foreground : '#fff' }]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: '#1B3A6B', paddingTop: Platform.OS === 'web' ? 60 : 52 }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerAvatar, { backgroundColor: '#E07B39' }]}>
              <Feather name="message-circle" size={20} color="#fff" />
            </View>
            <View>
              <Text style={styles.headerTitle}>LFI सहायक</Text>
              <Text style={styles.headerSub}>स्वचालित चैटबॉट • 24/7</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Feather name="x" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={renderMsg}
            contentContainerStyle={styles.msgList}
            showsVerticalScrollIndicator={false}
          />

          <View style={[styles.quickBar, { borderTopColor: colors.border }]}>
            <FlatList
              horizontal
              data={QUICK}
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.quickChip, { backgroundColor: colors.accent, borderColor: '#E07B39' }]}
                  onPress={() => sendMsg(item)}
                >
                  <Text style={[styles.quickText, { color: '#E07B39' }]}>{item}</Text>
                </TouchableOpacity>
              )}
            />
          </View>

          <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
              placeholder="सवाल टाइप करें..."
              placeholderTextColor={colors.mutedForeground}
              value={input}
              onChangeText={setInput}
              returnKeyType="send"
              onSubmitEditing={() => sendMsg(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: input.trim() ? '#E07B39' : colors.muted }]}
              onPress={() => sendMsg(input)}
              disabled={!input.trim()}
            >
              <Feather name="send" size={16} color={input.trim() ? '#fff' : colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerSub: { fontSize: 11, fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  closeBtn: { padding: 6 },
  msgList: { padding: 16, gap: 12 },
  msgRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  botRow: { justifyContent: 'flex-start' },
  userRow: { justifyContent: 'flex-end' },
  botAvatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  botAvatarText: { fontSize: 9, fontFamily: 'Inter_700Bold', color: '#fff' },
  bubble: { maxWidth: '78%', padding: 12, borderRadius: 16, gap: 4 },
  msgText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  quickBar: { borderTopWidth: 1, paddingVertical: 8 },
  quickChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  quickText: { fontSize: 12, fontFamily: 'Inter_700Bold' },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontFamily: 'Inter_400Regular' },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
});
