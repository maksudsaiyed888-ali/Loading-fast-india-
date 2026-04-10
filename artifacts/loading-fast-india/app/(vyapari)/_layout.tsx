import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function VyapariTabLayout() {
  const colors = useColors();
  const { user } = useApp();

  useEffect(() => {
    if (!user || user.role !== 'vyapari') {
      router.replace('/');
    }
  }, [user]);

  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 8,
          ...(isWeb ? { height: 84, paddingBottom: 30 } : { height: 62, paddingBottom: 8 }),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={100} tint="light" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ),
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'होम', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="browse" options={{ title: 'ट्रिप खोजें', tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} /> }} />
      <Tabs.Screen name="bookings" options={{ title: 'मेरी बुकिंग', tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'प्रोफाइल', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}
