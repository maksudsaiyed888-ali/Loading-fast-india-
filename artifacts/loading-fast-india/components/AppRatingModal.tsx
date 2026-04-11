import React, { useState } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { AppRating } from '@/lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const QUICK_COMMENTS = [
  'बहुत बढ़िया app है!',
  'Easy to use',
  'भरोसेमंद सेवा',
  'और features चाहिए',
  'बहुत अच्छा अनुभव',
  'Speed बेहतर करें',
];

const STAR_LABELS = ['', 'बहुत खराब', 'खराब', 'ठीक है', 'अच्छा', 'बेहतरीन!'];

export default function AppRatingModal({ visible, onClose }: Props) {
  const colors = useColors();
  const { user, addAppRating, hasRatedApp, getAppAvgRating, appRatings } = useApp();
  const [stars, setStars] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const alreadyRated = user ? hasRatedApp(user.id) : false;
  const avgRating = getAppAvgRating();
  const totalRatings = appRatings.length;

  const activeStar = hoveredStar || stars;

  const handleSubmit = async () => {
    if (!user || stars === 0) return;
    const r: AppRating = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      userRole: user.role as 'driver' | 'vyapari',
      stars,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await addAppRating(r);
    setSubmitted(true);
  };

  const handleClose = () => {
    setStars(0);
    setHoveredStar(0);
    setComment('');
    setSubmitted(false);
    onClose();
  };

  const displayAvg = avgRating > 0 ? avgRating.toFixed(1) : '5.0';
  const displayCount = totalRatings > 0 ? totalRatings : 0;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.header, { backgroundColor: colors.navy }]}>
            <Text style={styles.headerEmoji}>🚛</Text>
            <Text style={styles.headerTitle}>Loading Fast India</Text>
            <Text style={styles.headerSub}>भारत की सबसे तेज़ लोडिंग सेवा</Text>
            <View style={styles.appScoreRow}>
              <Text style={styles.appScore}>{displayAvg}</Text>
              <View>
                <Text style={styles.appStars}>{'⭐'.repeat(Math.round(avgRating || 5))}</Text>
                <Text style={styles.appRatingCount}>{displayCount > 0 ? `${displayCount} रेटिंग` : 'पहली रेटिंग दें'}</Text>
              </View>
            </View>
          </View>

          {submitted || alreadyRated ? (
            <View style={styles.thankYou}>
              <Text style={styles.thankYouEmoji}>🙏</Text>
              <Text style={[styles.thankYouTitle, { color: colors.foreground }]}>
                धन्यवाद!
              </Text>
              <Text style={[styles.thankYouSub, { color: colors.mutedForeground }]}>
                आपकी रेटिंग से हमें बेहतर बनने में मदद मिलती है।{'\n'}
                आपका भरोसा हमारी ताक़त है! 🇮🇳
              </Text>
              <TouchableOpacity
                style={[styles.closeBtn, { backgroundColor: colors.navy }]}
                onPress={handleClose}
              >
                <Text style={styles.closeBtnText}>बंद करें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={[styles.prompt, { color: colors.foreground }]}>
                Loading Fast India को Rate करें
              </Text>
              <Text style={[styles.promptSub, { color: colors.mutedForeground }]}>
                आपका अनुभव कैसा रहा?
              </Text>

              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setStars(s)}
                    activeOpacity={0.7}
                    style={styles.starBtn}
                  >
                    <Text style={[styles.starIcon, { opacity: s <= activeStar ? 1 : 0.25 }]}>
                      ⭐
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {activeStar > 0 && (
                <Text style={[styles.starLabel, { color: colors.primary }]}>
                  {STAR_LABELS[activeStar]}
                </Text>
              )}

              <View style={styles.quickRow}>
                {QUICK_COMMENTS.map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[
                      styles.quickChip,
                      {
                        backgroundColor: comment === q ? colors.primary + '20' : colors.muted,
                        borderColor: comment === q ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setComment(comment === q ? '' : q)}
                  >
                    <Text style={[styles.quickChipText, { color: comment === q ? colors.primary : colors.mutedForeground }]}>
                      {q}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.input, { backgroundColor: colors.muted, color: colors.foreground, borderColor: colors.border }]}
                placeholder="अपनी राय लिखें (optional)..."
                placeholderTextColor={colors.mutedForeground}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={2}
                maxLength={200}
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={handleClose}
                >
                  <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>बाद में</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    { backgroundColor: stars > 0 ? colors.navy : colors.muted },
                  ]}
                  onPress={handleSubmit}
                  disabled={stars === 0}
                >
                  <Text style={[styles.submitBtnText, { color: stars > 0 ? '#fff' : colors.mutedForeground }]}>
                    रेटिंग दें ⭐
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.trustNote, { color: colors.mutedForeground }]}>
                🔒 आपकी रेटिंग सुरक्षित है • Made in India 🇮🇳
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, overflow: 'hidden' },
  header: { padding: 20, alignItems: 'center', paddingBottom: 24 },
  headerEmoji: { fontSize: 36, marginBottom: 6 },
  headerTitle: { color: '#fff', fontSize: 22, fontFamily: 'Inter_700Bold' },
  headerSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  appScoreRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 16 },
  appScore: { color: '#fff', fontSize: 40, fontFamily: 'Inter_700Bold', lineHeight: 44 },
  appStars: { fontSize: 18, lineHeight: 22 },
  appRatingCount: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'Inter_400Regular' },
  body: { padding: 20 },
  prompt: { fontSize: 18, fontFamily: 'Inter_700Bold', textAlign: 'center' },
  promptSub: { fontSize: 13, fontFamily: 'Inter_400Regular', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 8 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 38 },
  starLabel: { fontSize: 16, fontFamily: 'Inter_700Bold', textAlign: 'center', marginBottom: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  quickChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  quickChipText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  input: { borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular',
    minHeight: 60, textAlignVertical: 'top', marginBottom: 16 },
  btnRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, alignItems: 'center' },
  cancelBtnText: { fontSize: 15, fontFamily: 'Inter_500Medium' },
  submitBtn: { flex: 2, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  submitBtnText: { fontSize: 15, fontFamily: 'Inter_700Bold' },
  trustNote: { fontSize: 11, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  thankYou: { padding: 32, alignItems: 'center' },
  thankYouEmoji: { fontSize: 56, marginBottom: 12 },
  thankYouTitle: { fontSize: 24, fontFamily: 'Inter_700Bold', marginBottom: 10 },
  thankYouSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  closeBtn: { paddingHorizontal: 36, paddingVertical: 14, borderRadius: 14 },
  closeBtnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_700Bold' },
});
