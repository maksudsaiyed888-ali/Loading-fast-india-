import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import TermsModal from '@/components/TermsModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { generateId } from '@/lib/utils';
import { validateAadhaar, formatAadhaarInput } from '@/lib/verhoeff';
import { validateDrivingLicense, validateRCBook, validateLicenseExpiry, formatDLInput, formatRCInput, formatDateInput } from '@/lib/validators';
import { uploadPhotoToStorage } from '@/lib/uploadPhoto';

export default function DriverRegisterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addDriver, login } = useApp();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [form, setForm] = useState({
    name: '', phone: '',
    aadhaarNumber: '', licenseNumber: '', licenseExpiry: '', rcBookNumber: '',
    address: '', city: '', state: 'राजस्थान', pincode: '',
    notificationRadius: '50',
  });

  const [photos, setPhotos] = useState({
    aadhaarPhoto: '',
    licensePhoto: '',
    rcBookPhoto: '',
    selfiePhoto: '',
  });

  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }));
  const clearError = (k: string) => setErrors((p) => ({ ...p, [k]: '' }));

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'नाम आवश्यक है';
    if (!form.phone || form.phone.length !== 10) e.phone = 'सही फोन नंबर दर्ज करें';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    const aadhaarResult = validateAadhaar(form.aadhaarNumber);
    if (!aadhaarResult.valid) e.aadhaarNumber = aadhaarResult.error;
    const dlResult = validateDrivingLicense(form.licenseNumber);
    if (!dlResult.valid) e.licenseNumber = dlResult.error;
    const expiryResult = validateLicenseExpiry(form.licenseExpiry);
    if (!expiryResult.valid) e.licenseExpiry = expiryResult.error;
    const rcResult = validateRCBook(form.rcBookNumber);
    if (!rcResult.valid) e.rcBookNumber = rcResult.error;
    if (!photos.aadhaarPhoto) e.aadhaarPhoto = 'आधार कार्ड की फोटो आवश्यक है';
    if (!photos.licensePhoto) e.licensePhoto = 'लाइसेंस की फोटो आवश्यक है';
    if (!photos.rcBookPhoto) e.rcBookPhoto = 'RC Book की फोटो आवश्यक है';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const pickPhoto = async (key: keyof typeof photos, source: 'camera' | 'gallery') => {
    try {
      let result;
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) { Alert.alert('Camera Permission', 'Camera permission दें settings में।'); return; }
        result = await ImagePicker.launchCameraAsync({ quality: 0.6, base64: false, allowsEditing: true, aspect: key === 'selfiePhoto' ? [1, 1] : [4, 3] });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) { Alert.alert('Gallery Permission', 'Gallery permission दें settings में।'); return; }
        result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, base64: false, allowsEditing: true, aspect: key === 'selfiePhoto' ? [1, 1] : [4, 3] });
      }
      if (result.canceled || !result.assets?.[0]) return;
      const uri = result.assets[0].uri;
      setUploadingPhoto(key);
      try {
        const driverId = form.phone || 'temp';
        const url = await uploadPhotoToStorage(uri, `drivers/${driverId}/${key}_${Date.now()}.jpg`);
        setPhotos(p => ({ ...p, [key]: url }));
        clearError(key);
      } catch (_e) {
        setPhotos(p => ({ ...p, [key]: uri }));
        clearError(key);
      } finally {
        setUploadingPhoto(null);
      }
    } catch (_e) {
      Alert.alert('त्रुटि', 'फोटो नहीं मिली। फिर कोशिश करें।');
      setUploadingPhoto(null);
    }
  };

  const showPhotoPicker = (key: keyof typeof photos, label: string) => {
    Alert.alert(label, 'फोटो कैसे लें?', [
      { text: '📷 Camera से', onPress: () => pickPhoto(key, 'camera') },
      { text: '🖼️ Gallery से', onPress: () => pickPhoto(key, 'gallery') },
      { text: 'रहने दो', style: 'cancel' },
    ]);
  };

  const handleRegister = async () => {
    if (!photos.selfiePhoto) {
      Alert.alert('Selfie आवश्यक', 'KYC के लिए अपनी selfie लें।');
      return;
    }
    if (!termsAgreed) {
      Alert.alert('नियम एवं शर्तें', 'रजिस्ट्रेशन से पहले नियम एवं शर्तें पढ़कर सहमति दें।');
      return;
    }
    setLoading(true);
    try {
      const apiBase = `https://${process.env.EXPO_PUBLIC_DOMAIN}:8080`;
      try {
        const checkRes = await fetch(`${apiBase}/api/otp/check-phone`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: form.phone.trim() }),
        });
        const checkData = await checkRes.json() as { success: boolean; canRegister?: boolean; accountCount?: number };
        if (checkData.success && checkData.canRegister === false) {
          Alert.alert('सीमा पार', `इस नंबर से पहले से ${checkData.accountCount} खाता बना हुआ है।`);
          setLoading(false);
          return;
        }
      } catch (_e) {}
      const id = generateId();
      const driver = {
        id,
        name: form.name.trim(),
        phone: form.phone.trim(),
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
        kycStatus: 'pending' as const,
        totalTrips: 0,
        rating: 4.5,
        aadhaarPhoto: photos.aadhaarPhoto,
        licensePhoto: photos.licensePhoto,
        rcBookPhoto: photos.rcBookPhoto,
        selfiePhoto: photos.selfiePhoto,
      };
      await addDriver(driver);
      await login({ id, role: 'driver', name: form.name, phone: form.phone, email: '' });
      Alert.alert('रजिस्ट्रेशन सफल! 🎉', 'आपका ड्राइवर अकाउंट बन गया है। KYC verification pending है — Admin जल्द approve करेगा।', [
        { text: 'आगे बढ़ें', onPress: () => router.replace('/(driver)') },
      ]);
    } catch (err: any) {
      const msg = err?.code === 'permission-denied'
        ? 'Firebase permission denied — Admin से Firebase rules update कराएं।'
        : err?.message || 'रजिस्ट्रेशन में समस्या आई। Internet connection check करें।';
      Alert.alert('त्रुटि', msg);
    } finally {
      setLoading(false);
    }
  };

  const headerColors: [string, string] = [colors.primary, colors.primaryDark];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={headerColors} style={[styles.header, { paddingTop: insets.top + (Platform.OS === 'web' ? 50 : 0) }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Feather name="arrow-left" size={22} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>ड्राइवर रजिस्ट्रेशन</Text>
          <Text style={styles.headerSub}>Driver Registration • चरण {step}/3</Text>
        </View>
        <View style={styles.stepIndicator}>
          {[1, 2, 3].map((s, i) => (
            <React.Fragment key={s}>
              <View style={[styles.stepDot, { backgroundColor: step >= s ? '#fff' : 'rgba(255,255,255,0.3)' }]} />
              {i < 2 && <View style={[styles.stepLine, { backgroundColor: step > s ? '#fff' : 'rgba(255,255,255,0.3)' }]} />}
            </React.Fragment>
          ))}
        </View>
      </LinearGradient>

      <TermsModal visible={showTerms} onClose={() => setShowTerms(false)} />

      <ScrollView style={styles.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* ── STEP 1: Personal Info ── */}
        {step === 1 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>व्यक्तिगत जानकारी</Text>
            <Input label="पूरा नाम" placeholder="आपका नाम" value={form.name} onChangeText={(v) => { set('name', v); clearError('name'); }} error={errors.name} icon="user" required />
            <Input label="मोबाइल नंबर" placeholder="10 अंक" value={form.phone} onChangeText={(v) => { set('phone', v); clearError('phone'); }} keyboardType="phone-pad" maxLength={10} error={errors.phone} icon="phone" required />
            <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: 8 }]}>पता</Text>
            <Input label="पूरा पता" placeholder="गली, मोहल्ला, गांव" value={form.address} onChangeText={(v) => set('address', v)} multiline icon="map-pin" />
            <Input label="शहर/जिला" placeholder="आपका शहर" value={form.city} onChangeText={(v) => set('city', v)} icon="navigation" />
            <Input label="पिन कोड" placeholder="6 अंक" value={form.pincode} onChangeText={(v) => set('pincode', v)} keyboardType="numeric" maxLength={6} />
            <Text style={[styles.sectionTitle, { color: colors.secondary, marginTop: 8 }]}>Notification Range</Text>
            <Text style={[styles.rangeLabel, { color: colors.mutedForeground }]}>ट्रिप notification कितनी दूर तक मिले? (किमी में)</Text>
            <View style={styles.rangeButtons}>
              {['25', '50', '100', '200', '500'].map((r) => (
                <TouchableOpacity key={r}
                  style={[styles.rangeBtn, { backgroundColor: form.notificationRadius === r ? colors.primary : colors.card, borderColor: form.notificationRadius === r ? colors.primary : colors.border }]}
                  onPress={() => set('notificationRadius', r)}>
                  <Text style={[styles.rangeBtnText, { color: form.notificationRadius === r ? '#fff' : colors.foreground }]}>{r} km</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="अगला चरण →" onPress={() => { if (validateStep1()) setStep(2); }} style={{ marginTop: 8 }} />
          </View>
        )}

        {/* ── STEP 2: Documents + Photos ── */}
        {step === 2 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>दस्तावेज़ नंबर</Text>
            <View style={[styles.docNote, { backgroundColor: colors.accent, borderColor: colors.primary + '40' }]}>
              <Feather name="file-text" size={15} color={colors.primary} />
              <Text style={[styles.docNoteText, { color: colors.primary }]}>नंबर भरें और हर document की clear photo लें</Text>
            </View>

            <Input label="आधार कार्ड नंबर" placeholder="XXXX XXXX XXXX" value={form.aadhaarNumber}
              onChangeText={(v) => { set('aadhaarNumber', formatAadhaarInput(v)); clearError('aadhaarNumber'); }}
              keyboardType="numeric" maxLength={14} error={errors.aadhaarNumber} icon="shield" required />
            <PhotoUploadBox
              label="आधार कार्ड की फोटो"
              uri={photos.aadhaarPhoto}
              error={errors.aadhaarPhoto}
              uploading={uploadingPhoto === 'aadhaarPhoto'}
              onPress={() => showPhotoPicker('aadhaarPhoto', 'आधार कार्ड Photo')}
              colors={colors}
            />

            <Input label="RC Book नंबर (वाहन पंजीकरण)" placeholder="जैसे: RJ14CA0001" value={form.rcBookNumber}
              onChangeText={(v) => { set('rcBookNumber', formatRCInput(v)); clearError('rcBookNumber'); }}
              autoCapitalize="characters" error={errors.rcBookNumber} icon="truck" required />
            <PhotoUploadBox
              label="RC Book की फोटो"
              uri={photos.rcBookPhoto}
              error={errors.rcBookPhoto}
              uploading={uploadingPhoto === 'rcBookPhoto'}
              onPress={() => showPhotoPicker('rcBookPhoto', 'RC Book Photo')}
              colors={colors}
            />

            <Input label="ड्राइविंग लाइसेंस नंबर" placeholder="जैसे: RJ14 2023 0000001" value={form.licenseNumber}
              onChangeText={(v) => { set('licenseNumber', formatDLInput(v)); clearError('licenseNumber'); }}
              autoCapitalize="characters" error={errors.licenseNumber} icon="credit-card" required />
            <Input label="लाइसेंस एक्सपायरी तारीख" placeholder="DD/MM/YYYY" value={form.licenseExpiry}
              onChangeText={(v) => { set('licenseExpiry', formatDateInput(v)); clearError('licenseExpiry'); }}
              keyboardType="numeric" maxLength={10} error={errors.licenseExpiry} icon="calendar" required />
            <PhotoUploadBox
              label="ड्राइविंग लाइसेंस की फोटो"
              uri={photos.licensePhoto}
              error={errors.licensePhoto}
              uploading={uploadingPhoto === 'licensePhoto'}
              onPress={() => showPhotoPicker('licensePhoto', 'License Photo')}
              colors={colors}
            />

            <Button title="अगला चरण → (Selfie KYC)" onPress={() => { if (validateStep2()) setStep(3); }} style={{ marginTop: 8 }} />
            <Button title="← वापस" onPress={() => setStep(1)} variant="outline" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* ── STEP 3: Selfie KYC ── */}
        {step === 3 && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.secondary }]}>Face KYC Verification</Text>
            <View style={[styles.kycInfoBox, { backgroundColor: '#1D4ED810', borderColor: '#1D4ED830' }]}>
              <Feather name="user-check" size={20} color="#1D4ED8" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.kycInfoTitle, { color: '#1D4ED8' }]}>Selfie KYC क्यों?</Text>
                <Text style={[styles.kycInfoText, { color: colors.mutedForeground }]}>
                  आपकी पहचान verify करने के लिए selfie जरूरी है। Admin आपकी selfie और Aadhaar card से match करके account approve करेगा।
                </Text>
              </View>
            </View>

            <Text style={[styles.selfieGuide, { color: colors.foreground }]}>📸 Selfie के नियम:</Text>
            {['चेहरा साफ और पूरा दिखे', 'अच्छी रोशनी में लें', 'चश्मा/cap न पहनें', 'Background plain रखें'].map((tip) => (
              <View key={tip} style={styles.tipRow}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
              </View>
            ))}

            <PhotoUploadBox
              label="Selfie (Face KYC)"
              uri={photos.selfiePhoto}
              uploading={uploadingPhoto === 'selfiePhoto'}
              onPress={() => showPhotoPicker('selfiePhoto', 'Selfie KYC')}
              colors={colors}
              square
              placeholder="📷 Selfie लें"
            />

            <View style={[styles.privacyBox, { borderColor: colors.border }]}>
              <Feather name="lock" size={14} color={colors.mutedForeground} />
              <Text style={[styles.privacyText, { color: colors.mutedForeground }]}>
                आपके documents और selfie सुरक्षित रहेंगे। Indian IT Act 2000 के तहत Privacy Protected है।
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

            <Button title="रजिस्ट्रेशन पूरा करें ✓" onPress={handleRegister} loading={loading} style={{ marginBottom: 8 }} />
            <Button title="← वापस" onPress={() => setStep(2)} variant="outline" />
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

interface PhotoUploadBoxProps {
  label: string;
  uri: string;
  error?: string;
  uploading: boolean;
  onPress: () => void;
  colors: any;
  square?: boolean;
  placeholder?: string;
}

function PhotoUploadBox({ label, uri, error, uploading, onPress, colors, square, placeholder }: PhotoUploadBoxProps) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[photoStyles.label, { color: colors.foreground }]}>{label} <Text style={{ color: colors.destructive }}>*</Text></Text>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          photoStyles.box,
          {
            borderColor: error ? colors.destructive : uri ? colors.success : colors.border,
            backgroundColor: uri ? 'transparent' : colors.card,
            aspectRatio: square ? 1 : 4 / 3,
            height: square ? 180 : undefined,
          }
        ]}
      >
        {uploading ? (
          <View style={photoStyles.center}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[photoStyles.subText, { color: colors.mutedForeground, marginTop: 8 }]}>Upload हो रहा है...</Text>
          </View>
        ) : uri ? (
          <View style={{ flex: 1 }}>
            <Image source={{ uri }} style={photoStyles.preview} resizeMode="cover" />
            <View style={photoStyles.editOverlay}>
              <Feather name="edit-2" size={14} color="#fff" />
              <Text style={photoStyles.editText}>बदलें</Text>
            </View>
          </View>
        ) : (
          <View style={photoStyles.center}>
            <Feather name="camera" size={28} color={colors.mutedForeground} />
            <Text style={[photoStyles.mainText, { color: colors.mutedForeground }]}>{placeholder || 'Photo लें'}</Text>
            <Text style={[photoStyles.subText, { color: colors.mutedForeground }]}>Camera या Gallery से</Text>
          </View>
        )}
      </TouchableOpacity>
      {error ? <Text style={[photoStyles.error, { color: colors.destructive }]}>{error}</Text> : null}
      {uri && !uploading && <Text style={[photoStyles.success, { color: colors.success }]}>✓ Photo ready</Text>}
    </View>
  );
}

const photoStyles = StyleSheet.create({
  label: { fontSize: 13, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  box: { borderWidth: 1.5, borderRadius: 12, borderStyle: 'dashed', overflow: 'hidden', minHeight: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 6 },
  mainText: { fontSize: 14, fontFamily: 'Inter_600SemiBold', textAlign: 'center' },
  subText: { fontSize: 12, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  preview: { width: '100%', height: '100%' },
  editOverlay: { position: 'absolute', bottom: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.6)', flexDirection: 'row', gap: 4, padding: 8, borderTopLeftRadius: 8, alignItems: 'center' },
  editText: { color: '#fff', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  error: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  success: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 4 },
});

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
  kycInfoBox: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 16, alignItems: 'flex-start' },
  kycInfoTitle: { fontSize: 13, fontFamily: 'Inter_700Bold', marginBottom: 4 },
  kycInfoText: { fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  selfieGuide: { fontSize: 14, fontFamily: 'Inter_600SemiBold', marginBottom: 8 },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 6 },
  tipText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  privacyBox: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 16, marginTop: 8 },
  privacyText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2, flexShrink: 0 },
  termsText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 18 },
});
