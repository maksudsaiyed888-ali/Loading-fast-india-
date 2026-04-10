import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { useColors } from '@/hooks/useColors';

interface CardProps extends ViewProps {
  elevated?: boolean;
}

export default function Card({ style, elevated, ...props }: CardProps) {
  const colors = useColors();
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
        elevated && styles.elevated,
        style,
      ]}
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  elevated: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 0,
  },
});
