import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: Props) {
  const colors = useColors();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: '#0A2540' }]}>
            <View>
              <Text style={styles.headerTitle}>📜 नियम, शर्तें एवं गोपनीयता</Text>
              <Text style={styles.headerSub}>Terms, Conditions & Privacy Policy</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>

            <Section title="🏢 Loading Fast India — Platform की भूमिका" color="#0A2540">
              <Para>Loading Fast India (LFI) एक Digital Marketplace / Connector Platform है। हमारा काम केवल ड्राइवर और व्यापारी को जोड़ना है।</Para>
              <Para>• किराये का लेन-देन सीधे ड्राइवर और व्यापारी के बीच होगा।</Para>
              <Para>• LFI प्रत्येक सफल ट्रिप पर 2% Commission लेता है।</Para>
              <Para>• LFI किसी भी किराये विवाद के लिए प्रत्यक्ष जिम्मेदार नहीं है, लेकिन शिकायत पर कानूनी सहायता प्रदान करेगा।</Para>
            </Section>

            <Section title="🚛 ड्राइवर की जिम्मेदारियां" color="#d97706">
              <Para>1. माल सुरक्षित और समय पर पहुंचाना ड्राइवर की जिम्मेदारी है।</Para>
              <Para>2. माल में कोई हेराफेरी या चोरी करने पर कठोर कानूनी कार्यवाही होगी।</Para>
              <Para>3. ट्रिप cancel बिना कारण नहीं करनी है — penalty लग सकती है।</Para>
              <Para>4. गाड़ी की RC, Insurance और License Valid होनी चाहिए।</Para>
            </Section>

            <Section title="🏪 व्यापारी की जिम्मेदारियां" color="#2563eb">
              <Para>1. ट्रिप confirm करने के बाद तय किराया देना अनिवार्य है।</Para>
              <Para>2. माल भेजने वाला और पाने वाला दोनों app में registered होना चाहिए।</Para>
              <Para>3. LFI का 2% Commission UPI पर तुरंत भेजना होगा।</Para>
              <Para>4. झूठी जानकारी देकर booking करना दंडनीय अपराध है।</Para>
            </Section>

            <Section title="⚖️ धोखाधड़ी — कानूनी धाराएं" color="#dc2626">
              <LegalRow
                title="किराया न देना (व्यापारी द्वारा)"
                sections="IPC 420 (धोखाधड़ी) + IPC 406 (विश्वास का आपराधिक भंग)"
                punishment="7 साल तक कारावास + जुर्माना"
              />
              <LegalRow
                title="माल चुराना / हेराफेरी (ड्राइवर द्वारा)"
                sections="IPC 378 (चोरी) + IPC 424 (बेईमानी से संपत्ति हटाना)"
                punishment="3-7 साल कारावास + पूरा हर्जाना"
              />
              <LegalRow
                title="माल लेने से इनकार (प्राप्तकर्ता)"
                sections="IPC 420 + IPC 406 (Criminal Breach of Trust)"
                punishment="7 साल तक कारावास + माल की कीमत का दोगुना हर्जाना"
              />
              <LegalRow
                title="झूठी बुकिंग / Fake Identity"
                sections="IPC 468 (जालसाजी) + IPC 471 (नकली दस्तावेज़)"
                punishment="7 साल कारावास + असीमित जुर्माना"
              />
              <LegalRow
                title="झूठी शिकायत दर्ज करना"
                sections="IPC 182 + IPC 211 (झूठा मुकदमा)"
                punishment="6 महीने से 2 साल कारावास"
              />
              <LegalRow
                title="एकाधिक लोगों द्वारा मिलकर धोखा"
                sections="IPC 34 (Common Intention) + IPC 120B (आपराधिक षड्यंत्र)"
                punishment="उम्रकैद तक"
              />
            </Section>

            <Section title="🔒 गोपनीयता नीति (Privacy Policy)" color="#16a34a">
              <Para>हम निम्न जानकारी एकत्र करते हैं:</Para>
              <Para>• नाम, फोन, ईमेल — पहचान के लिए</Para>
              <Para>• आधार नंबर — KYC verification के लिए</Para>
              <Para>• Driving License, RC — वाहन सत्यापन के लिए</Para>
              <Para>• GST Number — व्यापारी सत्यापन के लिए</Para>
              <Para>यह डेटा Indian IT Act 2000 और IT (Amendment) Act 2008 के तहत सुरक्षित है। आपकी जानकारी तीसरे पक्ष को नहीं बेची जाएगी।</Para>
              <Para>कानूनी आदेश या शिकायत पर ही जानकारी संबंधित अधिकारी को दी जाएगी।</Para>
            </Section>

            <Section title="⚡ तत्काल कार्यवाही (Immediate Action)" color="#7C3AED">
              <Para>Loading Fast India निम्न स्थिति में तुरंत कार्यवाही करेगा:</Para>
              <Para>✓ ड्राइवर/व्यापारी का account suspend होगा</Para>
              <Para>✓ पुलिस/न्यायालय को जानकारी दी जाएगी</Para>
              <Para>✓ Aadhaar-linked mobile पर legal notice भेजा जाएगा</Para>
              <Para>✓ Bilty record evidence के रूप में प्रस्तुत किया जाएगा</Para>
              <Para style={{ fontWeight: 'bold' }}>📞 Helpline: Platform Admin — LFI@Admin2024</Para>
            </Section>

            <Section title="✅ स्वीकृति" color="#0A2540">
              <Para>इस app में register करके आप स्वीकार करते हैं कि आपने उपरोक्त सभी नियम, शर्तें और गोपनीयता नीति पढ़ ली है और आप इनसे सहमत हैं।</Para>
              <Para>अनुपालन न करने पर Loading Fast India आपके विरुद्ध कानूनी कार्यवाही करने का अधिकार रखता है।</Para>
            </Section>

            <View style={{ height: 30 }} />
          </ScrollView>

          <TouchableOpacity style={[styles.closeFooter, { backgroundColor: '#0A2540' }]} onPress={onClose}>
            <Text style={styles.closeFooterText}>✓ समझ गया — बंद करें</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={[sectionStyles.box, { borderLeftColor: color }]}>
      <Text style={[sectionStyles.title, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

function Para({ children, style }: { children: React.ReactNode; style?: object }) {
  return <Text style={[paraStyles.text, style]}>{children}</Text>;
}

function LegalRow({ title, sections, punishment }: { title: string; sections: string; punishment: string }) {
  return (
    <View style={legalStyles.row}>
      <Text style={legalStyles.title}>⚠ {title}</Text>
      <Text style={legalStyles.section}>धारा: {sections}</Text>
      <Text style={legalStyles.punishment}>सजा: {punishment}</Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  box: { borderLeftWidth: 3, paddingLeft: 12, marginBottom: 20, paddingVertical: 4 },
  title: { fontSize: 14, fontFamily: 'Inter_700Bold', marginBottom: 8 },
});

const paraStyles = StyleSheet.create({
  text: { fontSize: 13, fontFamily: 'Inter_400Regular', color: '#444', lineHeight: 20, marginBottom: 4 },
});

const legalStyles = StyleSheet.create({
  row: { backgroundColor: '#FEF2F2', borderRadius: 8, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: '#FECACA' },
  title: { fontSize: 13, fontFamily: 'Inter_700Bold', color: '#dc2626', marginBottom: 3 },
  section: { fontSize: 12, fontFamily: 'Inter_500Medium', color: '#7f1d1d', marginBottom: 2 },
  punishment: { fontSize: 12, fontFamily: 'Inter_700Bold', color: '#991b1b' },
});

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 24 },
  headerTitle: { color: '#fff', fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: { padding: 4 },
  body: { padding: 20 },
  closeFooter: { padding: 18, alignItems: 'center' },
  closeFooterText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
