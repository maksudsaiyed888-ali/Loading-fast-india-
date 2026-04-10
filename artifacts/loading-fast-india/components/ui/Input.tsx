import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  icon?: keyof typeof Feather.glyphMap;
  required?: boolean;
}

export default function Input({ label, error, containerStyle, icon, required, ...rest }: InputProps) {
  const colors = useColors();
  const [focused, setFocused] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const isPassword = rest.secureTextEntry;

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.foreground }]}>
          {label}
          {required && <Text style={{ color: colors.destructive }}> *</Text>}
        </Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error ? colors.destructive : focused ? colors.primary : colors.border,
            backgroundColor: colors.card,
          },
        ]}
      >
        {icon && (
          <Feather name={icon} size={18} color={focused ? colors.primary : colors.mutedForeground} style={styles.icon} />
        )}
        <TextInput
          style={[styles.input, { color: colors.foreground, flex: 1 }]}
          placeholderTextColor={colors.mutedForeground}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPwd}
          {...rest}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPwd(!showPwd)} style={styles.eye}>
            <Feather name={showPwd ? 'eye-off' : 'eye'} size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={[styles.error, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 14, fontFamily: 'Inter_500Medium', marginBottom: 6 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    minHeight: 50,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: { fontSize: 15, fontFamily: 'Inter_400Regular', paddingVertical: 10 },
  eye: { padding: 4 },
  error: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 4 },
});
