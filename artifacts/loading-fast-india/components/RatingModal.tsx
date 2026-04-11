import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { generateId } from '@/lib/utils';
import { Rating } from '@/lib/types';

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  toId: string;
  toName: string;
  toRole: 'driver' | 'vyapari';
}

const STAR_LABELS = ['', 'बहुत बुरा 😤', 'ठीक नहीं 😕', 'ठीक है 🙂', 'अच्छा 😊', 'बहुत बढ़िया 🌟'];

export default function RatingModal({ visible, onClose, tripId, toId, toName, toRole }: Props) {
  const colors = useColors();
  const { user, addRating, hasRated } = useApp();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const alreadyRated = user ? hasRated(tripId, user.id) : false;

  const handleSubmit = async () => {
    if (!user || stars === 0) return;
    setLoading(true);
    const rating: Rating = {
      id: generateId(),
      tripId,
      fromId: user.id,
      fromName: user.name,
      fromRole: user.role as 'driver' | 'vyapari',
      toId,
      toName,
      toRole,
      stars,
      comment: comment.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await addRating(rating);
    setSubmitted(true);
    setLoading(false);
    setTimeout(() => {
      setSubmitted(false);
      setStars(0);
      setComment('');
      onClose();
    }, 1800);
  };

  const handleClose = () => {
    setStars(0);
    setComment('');
    setSubmitted(false);
    onClose();
  };

  const roleLabel = toRole === 'driver' ? '🚛 ड्राइवर' : '🏪 व्यापारी';
  const bgGradient = toRole === 'driver' ? '#E07B39' : '#1B3A6B';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {submitted ? (
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>🌟</Text>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>रेटिंग दे दी गई!</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                {toName} को {stars} ⭐ रेटिंग मिली
              </Text>
            </View>
          ) : alreadyRated ? (
            <View style={styles.successBox}>
              <Text style={styles.successEmoji}>✅</Text>
              <Text style={[styles.successTitle, { color: colors.foreground }]}>रेटिंग दे चुके हैं</Text>
              <Text style={[styles.successSub, { color: colors.mutedForeground }]}>
                आप इस ट्रिप के लिए पहले ही रेटिंग दे चुके हैं।
              </Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.muted }]} onPress={handleClose}>
                <Text style={[styles.closeBtnText, { color: colors.foreground }]}>बंद करें</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <View style={[styles.toAvatar, { backgroundColor: bgGradient }]}>
                  <Text style={styles.toAvatarText}>{toName[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.headerTitle, { color: colors.foreground }]}>रेटिंग दें</Text>
                  <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
                    {roleLabel} • {toName}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleClose}>
                  <Feather name="x" size={22} color={colors.foreground} />
                </TouchableOpacity>
              </View>

              <View style={styles.body}>
                <Text style={[styles.question, { color: colors.foreground }]}>
                  {toRole === 'driver'
                    ? 'ड्राइवर का व्यवहार और सेवा कैसी रही?'
                    : 'व्यापारी का व्यवहार और भुगतान कैसा रहा?'}
                </Text>

                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setStars(s)}
                      activeOpacity={0.7}
                      style={styles.starBtn}
                    >
                      <Text style={[styles.starIcon, { opacity: s <= stars ? 1 : 0.25 }]}>⭐</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {stars > 0 && (
                  <Text style={[styles.starLabel, { color: bgGradient }]}>{STAR_LABELS[stars]}</Text>
                )}

                <View style={styles.quickRatings}>
                  {(toRole === 'driver'
                    ? ['समय पर पहुंचे', 'माल सुरक्षित', 'अच्छा व्यवहार', 'किराया उचित', 'सब ठीक रहा']
                    : ['समय पर भुगतान', 'अच्छा व्यवहार', 'माल सही था', 'भार सही बताया', 'कोई शिकायत नहीं']
                  ).map((label) => (
                    <TouchableOpacity
                      key={label}
                      style={[styles.quickTag, {
                        borderColor: comment === label ? bgGradient : colors.border,
                        backgroundColor: comment === label ? bgGradient + '18' : colors.card,
                      }]}
                      onPress={() => setComment(comment === label ? '' : label)}
                    >
                      <Text style={[styles.quickTagText, { color: comment === label ? bgGradient : colors.foreground }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.commentInput, {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    color: colors.foreground,
                  }]}
                  placeholder="अपनी राय लिखें (वैकल्पिक)..."
                  placeholderTextColor={colors.mutedForeground}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  maxLength={200}
                />

                <TouchableOpacity
                  style={[styles.submitBtn, {
                    backgroundColor: stars > 0 ? bgGradient : colors.muted,
                    opacity: loading ? 0.7 : 1,
                  }]}
                  onPress={handleSubmit}
                  disabled={stars === 0 || loading}
                >
                  <Feather name="star" size={16} color={stars > 0 ? '#fff' : colors.mutedForeground} />
                  <Text style={[styles.submitText, { color: stars > 0 ? '#fff' : colors.mutedForeground }]}>
                    {loading ? 'सेव हो रहा है...' : stars === 0 ? 'पहले ⭐ चुनें' : 'रेटिंग जमा करें'}
                  </Text>
                </TouchableOpacity>

                {Platform.OS !== 'web' && <View style={{ height: 20 }} />}
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingBottom: 20 },
  handle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, borderBottomWidth: 1 },
  toAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  toAvatarText: { fontSize: 18, fontFamily: 'Inter_700Bold', color: '#fff' },
  headerTitle: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2 },
  body: { padding: 20 },
  question: { fontSize: 15, fontFamily: 'Inter_500Medium', textAlign: 'center', marginBottom: 20, lineHeight: 22 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 10 },
  starBtn: { padding: 4 },
  starIcon: { fontSize: 36 },
  starLabel: { textAlign: 'center', fontSize: 16, fontFamily: 'Inter_700Bold', marginBottom: 18 },
  quickRatings: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14, justifyContent: 'center' },
  quickTag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  quickTagText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  commentInput: { borderRadius: 12, borderWidth: 1.5, padding: 12, fontSize: 14, fontFamily: 'Inter_400Regular', minHeight: 70, marginBottom: 16, textAlignVertical: 'top' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
  submitText: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  successBox: { padding: 40, alignItems: 'center', gap: 10 },
  successEmoji: { fontSize: 56 },
  successTitle: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  successSub: { fontSize: 14, fontFamily: 'Inter_400Regular', textAlign: 'center' },
  closeBtn: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
  closeBtnText: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});
