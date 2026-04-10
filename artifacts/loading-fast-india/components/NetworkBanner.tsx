import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { addNetworkListener, checkNetwork, NetworkState } from '@/lib/networkService';

export default function NetworkBanner() {
  const [state, setState] = useState<NetworkState>('unknown');
  const [visible, setVisible] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    checkNetwork().then(setState);
    const remove = addNetworkListener((s) => {
      setState(s);
    });
    return remove;
  }, []);

  useEffect(() => {
    if (state === 'offline') {
      setVisible(true);
      Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: false }).start();
    } else if (state === 'online') {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
        Animated.delay(1500),
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }),
      ]).start(() => setVisible(false));
    }
  }, [state]);

  if (!visible) return null;

  const isOffline = state === 'offline';
  const bg = isOffline ? '#dc2626' : '#16a34a';

  return (
    <Animated.View style={[styles.banner, { backgroundColor: bg, opacity }]}>
      <Feather name={isOffline ? 'wifi-off' : 'wifi'} size={14} color="#fff" />
      <Text style={styles.text}>
        {isOffline ? 'Internet नहीं है — Offline Mode में काम जारी है' : 'Internet जुड़ गया ✓'}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    zIndex: 9999,
    elevation: 20,
  },
  text: { color: '#fff', fontSize: 13, fontFamily: 'Inter_500Medium' },
});
