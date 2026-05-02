import React from 'react';
import {
  Modal, View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

const colors = {
  primary: '#F97316',
  navy: '#0A2540',
  red: '#dc2626',
  green: '#16a34a',
  blue: '#2563eb',
  yellow: '#d97706',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  text: '#1e293b',
  muted: '#64748b',
};

interface Section {
  icon: string;
  title: string;
  color: string;
  items: string[];
}

const sections: Section[] = [
  {
    icon: 'shield',
    title: 'हमारे बारे में',
    color: colors.navy,
    items: [
      'Loading Fast India — भारत की भरोसेमंद माल ढुलाई मार्केटप्लेस।',
      'Transporter ID: 24BRLPS3959R1ZN',
      'maksudsaiyed888@oksbi',
      'यह Privacy Policy आपके डेटा, अधिकार और सुरक्षा नियमों को बताती है।',
      'App इस्तेमाल करके आप इन नियमों से सहमत होते हैं।',
    ],
  },
  {
    icon: 'database',
    title: 'हम क्या डेटा इकट्ठा करते हैं',
    color: colors.blue,
    items: [
      'नाम, मोबाइल नंबर, आधार कार्ड नंबर (masked)।',
      'GST नंबर (व्यापारी के लिए)।',
      'वाहन रजिस्ट्रेशन नंबर और ड्राइविंग लाइसेंस।',
      'GPS location (ट्रिप tracking के लिए)।',
      'Trip history, chat messages, ratings और complaints।',
      'Device ID और OS version (तकनीकी सुधार के लिए)।',
    ],
  },
  {
    icon: 'lock',
    title: 'आधार और दस्तावेज़ सुरक्षा',
    color: colors.green,
    items: [
      'आधार नंबर केवल verification के लिए — कभी share नहीं होता।',
      'GST नंबर verification badge के रूप में दिखाया जाता है।',
      'सभी दस्तावेज़ encrypted storage में सुरक्षित।',
      'तीसरे पक्ष को कोई दस्तावेज़ नहीं दिया जाता।',
      'आधार Act 2016 और IT Act 2000 का पूर्ण पालन।',
    ],
  },
  {
    icon: 'map-pin',
    title: 'Location और GPS नीति',
    color: colors.blue,
    items: [
      'GPS केवल ट्रिप active होने पर इस्तेमाल होता है।',
      'Location data किसी तीसरे पक्ष को नहीं दिया जाता।',
      'Location history 30 दिन बाद automatically delete होती है।',
    ],
  },
  {
    icon: 'navigation',
    title: 'Driver के लिए GPS — कड़ा निर्देश',
    color: colors.red,
    items: [
      '🔴 ट्रिप के दौरान Driver का GPS और Mobile हर हाल में चालू रहना अनिवार्य है।',
      '🔴 GPS या Mobile बंद करना — माल की सुरक्षा से समझौता माना जाएगा।',
      '⚠️ GPS बंद पाए जाने पर Driver को माल छुपाने या चोरी का अपराधी माना जाएगा।',
      '📌 GPS बंद रहने पर Driver के विरुद्ध IPC 406 (विश्वासघात) और IPC 378 (चोरी) के तहत FIR दर्ज होगी।',
      '🔴 "Battery खत्म थी" या "Signal नहीं था" — कोई भी बहाना मान्य नहीं होगा।',
      '✅ Trip accept करने का मतलब है Driver GPS चालू रखने की शर्त से पूरी तरह सहमत है।',
      '📌 Loading Fast India GPS data को trip proof के रूप में court में पेश कर सकता है।',
    ],
  },
  {
    icon: 'percent',
    title: 'कमीशन और भुगतान नीति',
    color: colors.primary,
    items: [
      'हर सफल ट्रिप पर 2% commission लिया जाता है।',
      'Payment: maksudsaiyed888@oksbi',
      'Commission तभी लागू होता है जब ट्रिप confirm हो।',
      'Refund की स्थिति में admin से contact करें।',
      'Payment विवाद — admin 24 घंटे में resolve करेगा।',
    ],
  },
  {
    icon: 'truck',
    title: 'किराया वसूली — Driver की जिम्मेदारी',
    color: '#E65100',
    items: [
      '⚠️ गाड़ी में माल loading के समय या उससे पहले व्यापारी से पूरा किराया लें।',
      '⚠️ माल loading के बाद किराया pending छोड़ना Driver की खुद की जिम्मेदारी है।',
      '🔴 Pending किराया छोड़ा तो Loading Fast India (LFI) जिम्मेदार नहीं होगा।',
      '📌 किराया विवाद में LFI कोई गारंटी या भुगतान नहीं देगा।',
      '✅ सलाह: Loading से पहले ही किराया नकद या UPI से confirm करें।',
    ],
  },
  {
    icon: 'alert-triangle',
    title: 'किराया — Sender (माल भेजने वाले) की जिम्मेदारी',
    color: '#E65100',
    items: [
      '📌 किराया देना हमेशा माल भेजने वाले (Sender/Vyapari) की जिम्मेदारी है।',
      '🔴 चाहे "Receiver Pay" option चुना हो या नहीं — अंतिम देनदारी सदैव Sender की होगी।',
      '⚠️ Receiver ने payment नहीं की तो Driver को किराया Sender को देना होगा — कोई बहाना मान्य नहीं।',
      '⚠️ Trip book करते समय Sender इस नियम से सहमत होता है — बाद में "मुझे नहीं पता था" मान्य नहीं होगा।',
      '🔴 Driver को किराया न देने पर IPC 420 (धोखाधड़ी) और IPC 406 (विश्वासघात) के तहत कड़ी कार्रवाई होगी।',
      '✅ सलाह: Trip confirm करने से पहले किराया नकद या UPI से तय कर लें।',
    ],
  },
  {
    icon: 'alert-octagon',
    title: 'धोखाधड़ी विरोधी नीति (Fraud Prevention)',
    color: colors.red,
    items: [
      '🔴 Fraud की गतिविधि पर तुरंत account suspend होगा।',
      'नकली आधार / GST — खाता permanently बंद + FIR।',
      'झूठी complaint — complainant पर कार्रवाई होगी।',
      'Fraud reports admin 24 घंटे में verify करता है।',
      'सभी chat messages और trips audit के लिए store होते हैं।',
    ],
  },
  {
    icon: 'book',
    title: 'धोखाधड़ी पर लागू IPC धाराएं',
    color: '#7c3aed',
    items: [
      '📌 IPC 420 — ठगी और धोखाधड़ी (Payment Fraud) → 7 साल जेल।',
      '📌 IPC 406 — विश्वासघात / माल न देना → 3 साल जेल।',
      '📌 IPC 378 — चोरी (माल की चोरी / गायब) → 3 साल जेल।',
      '📌 IPC 424 — बेईमानी से सामान हटाना → 2 साल जेल।',
      '📌 IPC 503 — आपराधिक धमकी / डराना → 2 साल जेल।',
      '📌 IPC 506 — धमकी देकर पैसे लेना → 7 साल जेल।',
      '📌 IPC 468 — नकली दस्तावेज़ बनाना → 7 साल जेल।',
      '📌 IPC 471 — जाली दस्तावेज़ इस्तेमाल → 2 साल जेल।',
      '📌 IPC 182 — झूठी FIR / शिकायत → 6 महीने जेल।',
      '📌 IPC 211 — झूठे आरोप लगाना → 7 साल जेल।',
      '📌 IT Act 66 — Online ठगी / धोखाधड़ी → 3 साल जेल।',
      '📌 IT Act 72 — Privacy का उल्लंघन → 2 साल जेल।',
    ],
  },
  {
    icon: 'message-square',
    title: 'Chat और Communication नीति',
    color: colors.green,
    items: [
      'Driver↔Vyapari chat केवल commission paid होने पर active।',
      'Chat messages audit के लिए 90 दिन store होते हैं।',
      'गाली-गलौज, धमकी वाले message — account block।',
      'Chat screenshots court evidence के रूप में मान्य।',
      'Personal नंबर share करना app नीति के विरुद्ध।',
    ],
  },
  {
    icon: 'star',
    title: 'Rating और Review नीति',
    color: colors.yellow,
    items: [
      'Rating केवल completed trip के बाद दी जा सकती है।',
      'झूठी rating / fake review — account suspend।',
      'Rating remove नहीं होती — सोच-समझकर दें।',
      'औसत rating profile पर दिखाई देती है।',
      'App rating से हम सेवा बेहतर बनाते हैं।',
    ],
  },
  {
    icon: 'user-check',
    title: 'आपके अधिकार',
    color: colors.blue,
    items: [
      'आप अपना डेटा delete करवा सकते हैं।',
      'Account बंद करने का पूरा अधिकार।',
      'किसी भी complaint की status जानने का अधिकार।',
      'Fraud report का 24 घंटे में जवाब पाने का अधिकार।',
      'किसी भी गलत rating को contest करने का अधिकार।',
    ],
  },
  {
    icon: 'refresh-cw',
    title: 'Auto Update नीति',
    color: colors.navy,
    items: [
      'App startup पर automatically नया update check होता है।',
      'Update मिलने पर background में download होकर apply होता है।',
      'User को re-download करने की जरूरत नहीं।',
      'Expo OTA (Over-the-Air) update system से powered।',
      'Privacy policy changes भी auto-update से मिलेंगी।',
    ],
  },
  {
    icon: 'info',
    title: 'Platform Disclaimer (अस्वीकरण)',
    color: colors.navy,
    items: [
      '📌 Loading Fast India केवल एक digital marketplace/platform है — transport company नहीं।',
      '🔴 Driver और Vyapari के बीच कोई भी लेन-देन, विवाद, दुर्घटना या नुकसान — LFI की जिम्मेदारी नहीं है।',
      '⚠️ माल की सुरक्षा, delivery और payment — पूरी तरह Driver और Vyapari की आपसी जिम्मेदारी है।',
      '📌 LFI केवल दोनों पक्षों को जोड़ता है — किसी भी trip का execution LFI नहीं करता।',
      '🔴 Platform use करने का मतलब है User इस Disclaimer से पूरी तरह सहमत है।',
      '📌 LFI को किसी Consumer Forum, Civil Court या Criminal Case में direct party नहीं बनाया जा सकता — जब तक LFI की खुद की गलती साबित न हो।',
    ],
  },
  {
    icon: 'shield-off',
    title: 'Indemnification (क्षतिपूर्ति)',
    color: colors.red,
    items: [
      '📌 User (Driver/Vyapari) agree करता है कि वह Loading Fast India को किसी भी legal claim, हानि, जुर्माने या कार्यवाही से मुक्त रखेगा।',
      '🔴 अगर User की गलती से LFI पर कोई case या नुकसान हुआ — तो उसका पूरा खर्च उस User को देना होगा।',
      '⚠️ नकली document, गलत जानकारी, या धोखाधड़ी से LFI को हानि हुई — तो User पर IPC 420 + हर्जाना लागू होगा।',
      '📌 यह नियम User के registration के समय से ही लागू होता है।',
    ],
  },
  {
    icon: 'flag',
    title: 'Governing Law और Jurisdiction (न्यायालय क्षेत्र)',
    color: '#7c3aed',
    items: [
      '📌 Loading Fast India से जुड़े सभी कानूनी विवाद भारतीय कानून के तहत आएंगे।',
      '⚖️ सभी मामलों का न्यायालय क्षेत्र (Jurisdiction): गुजरात, भारत।',
      '🔴 User किसी अन्य राज्य के Consumer Forum या Court में LFI के विरुद्ध case दर्ज नहीं कर सकता।',
      '📌 App use करने का मतलब है User इस Jurisdiction से सहमत है।',
      '⚠️ यह नियम भारत के Information Technology Act 2000 और Indian Contract Act 1872 के तहत मान्य है।',
    ],
  },
  {
    icon: 'git-merge',
    title: 'Dispute Resolution / Arbitration (विवाद समाधान)',
    color: colors.green,
    items: [
      '📌 किसी भी विवाद की स्थिति में — पहले LFI Admin से संपर्क करना अनिवार्य है।',
      '⏳ Admin को विवाद सुलझाने के लिए 30 दिन का समय दिया जाएगा।',
      '🔴 30 दिन में समाधान न हो तो Arbitration (मध्यस्थता) अनिवार्य होगी — सीधे Court में जाना मान्य नहीं।',
      '📌 Arbitration: Arbitration and Conciliation Act 1996 के तहत होगी।',
      '⚠️ बिना LFI को 30 दिन का notice दिए Court case — LFI द्वारा dismiss करवाया जाएगा।',
      '✅ यह नियम दोनों पक्षों (Driver और Vyapari) पर समान रूप से लागू होता है।',
    ],
  },
  {
    icon: 'phone',
    title: 'Contact और Grievance',
    color: colors.primary,
    items: [
      'App के अंदर Admin Panel से contact करें।',
      'Fraud report: Fraud Alert button दबाएं।',
      'Complaint: शिकायत button दबाएं।',
      'Admin response time: 24 घंटे।',
      'Emergency case में सीधे police को 100 पर call करें।',
    ],
  },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: Props) {
  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.navy }}>
        <StatusBar backgroundColor={colors.navy} barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Privacy Policy</Text>
            <Text style={styles.headerSub}>गोपनीयता नीति • Fraud नियम</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={styles.banner}>
            <Feather name="shield" size={28} color={colors.primary} />
            <Text style={styles.bannerTitle}>Loading Fast India</Text>
            <Text style={styles.bannerSub}>भारत की भरोसेमंद माल ढुलाई सेवा</Text>
            <View style={styles.bannerBadge}>
              <Text style={styles.bannerBadgeText}>Last Updated: April 2026</Text>
            </View>
          </View>

          {sections.map((sec, i) => (
            <View key={i} style={styles.card}>
              <View style={[styles.cardHeader, { borderLeftColor: sec.color }]}>
                <View style={[styles.iconBox, { backgroundColor: sec.color + '18' }]}>
                  <Feather name={sec.icon as any} size={18} color={sec.color} />
                </View>
                <Text style={[styles.cardTitle, { color: sec.color }]}>{sec.title}</Text>
              </View>
              {sec.items.map((item, j) => (
                <View key={j} style={styles.itemRow}>
                  <View style={[styles.dot, { backgroundColor: sec.color }]} />
                  <Text style={styles.itemText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.footer}>
            <Feather name="alert-circle" size={16} color={colors.muted} />
            <Text style={styles.footerText}>
              यह नीति Loading Fast India द्वारा बनाई गई है। App इस्तेमाल जारी रखने का मतलब है आप सभी नियमों से सहमत हैं।
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.navy,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { color: '#fff', fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.65)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: colors.bg },
  banner: {
    backgroundColor: colors.navy,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  bannerTitle: { color: '#fff', fontSize: 20, fontFamily: 'Inter_700Bold', marginTop: 10 },
  bannerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  bannerBadge: {
    marginTop: 12,
    backgroundColor: colors.primary + '30',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primary + '60',
  },
  bannerBadgeText: { color: colors.primary, fontSize: 12, fontFamily: 'Inter_500Medium' },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderLeftWidth: 4,
    paddingLeft: 10,
    borderRadius: 2,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  cardTitle: { fontSize: 15, fontFamily: 'Inter_700Bold', flex: 1 },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  dot: { width: 6, height: 6, borderRadius: 3, marginTop: 6, marginRight: 10 },
  itemText: { flex: 1, fontSize: 13.5, fontFamily: 'Inter_400Regular', color: colors.text, lineHeight: 20 },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    gap: 8,
  },
  footerText: { flex: 1, fontSize: 12.5, color: colors.muted, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
