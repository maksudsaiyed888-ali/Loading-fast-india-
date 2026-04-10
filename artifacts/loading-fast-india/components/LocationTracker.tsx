import { Feather } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { DriverLocation, getCurrentLocation, startLocationTracking, stopLocationTracking } from '@/lib/locationService';

interface Props {
  onLocationUpdate?: (loc: DriverLocation) => void;
  showBadge?: boolean;
}

export default function LocationTracker({ onLocationUpdate, showBadge = true }: Props) {
  const colors = useColors();
  const [location, setLocation] = useState<DriverLocation | null>(null);
  const [tracking, setTracking] = useState(false);
  const [permDenied, setPermDenied] = useState(false);

  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const loc = await getCurrentLocation();
      if (!mounted) return;
      if (loc) {
        setLocation(loc);
        onLocationUpdate?.(loc);
        setTracking(true);
        startLocationTracking((updated) => {
          if (!mounted) return;
          setLocation(updated);
          onLocationUpdate?.(updated);
        });
      } else {
        setPermDenied(true);
      }
    };
    init();
    return () => {
      mounted = false;
      stopLocationTracking();
    };
  }, []);

  const retry = async () => {
    setPermDenied(false);
    const loc = await getCurrentLocation();
    if (loc) {
      setLocation(loc);
      setTracking(true);
      onLocationUpdate?.(loc);
    } else {
      setPermDenied(true);
    }
  };

  if (!showBadge) return null;

  if (permDenied) {
    return (
      <TouchableOpacity style={[styles.badge, { backgroundColor: colors.warning + '20', borderColor: colors.warning }]} onPress={retry}>
        <Feather name="map-pin" size={12} color={colors.warning} />
        <Text style={[styles.text, { color: colors.warning }]}>GPS चालू करें</Text>
      </TouchableOpacity>
    );
  }

  if (!location) {
    return (
      <View style={[styles.badge, { backgroundColor: colors.muted, borderColor: colors.border }]}>
        <Feather name="loader" size={12} color={colors.mutedForeground} />
        <Text style={[styles.text, { color: colors.mutedForeground }]}>GPS खोज रहे हैं...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: colors.success + '15', borderColor: colors.success }]}>
      <Feather name="map-pin" size={12} color={colors.success} />
      <Text style={[styles.text, { color: colors.success }]}>GPS चालू ✓</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  text: { fontSize: 11, fontFamily: 'Inter_500Medium' },
});
