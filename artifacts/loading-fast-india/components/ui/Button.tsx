import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { useColors } from '@/hooks/useColors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'success';
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  small?: boolean;
}

export default function Button({
  title, onPress, variant = 'primary', loading, disabled, style, small,
}: ButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const bg =
    variant === 'primary' ? colors.primary
    : variant === 'secondary' ? colors.secondary
    : variant === 'danger' ? colors.destructive
    : variant === 'success' ? colors.success
    : 'transparent';

  const fg =
    variant === 'outline' ? colors.primary : '#fff';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[
        styles.btn,
        { backgroundColor: bg, borderColor: colors.primary, height: small ? 40 : 52 },
        variant === 'outline' && styles.outline,
        (disabled || loading) && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <Text style={[styles.text, { color: fg }, small && styles.smallText]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  outline: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  disabled: { opacity: 0.5 },
  text: { fontSize: 16, fontFamily: 'Inter_600SemiBold', letterSpacing: 0.3 },
  smallText: { fontSize: 14 },
});
