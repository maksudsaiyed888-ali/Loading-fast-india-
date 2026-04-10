import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function DriverTabLayout() {
  const colors = useColors();
  const { user } = useApp();

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      router.replace('/');
    }
  }, [user]);

  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
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
      <Tabs.Screen name="vehicles" options={{ title: 'गाड़ियां', tabBarIcon: ({ color }) => <Feather name="truck" size={22} color={color} /> }} />
      <Tabs.Screen name="post-trip" options={{ title: 'ट्रिप डालें', tabBarIcon: ({ color, focused }) => (
        <View style={[styles.addBtn, { backgroundColor: focused ? colors.primaryDark : colors.primary }]}>
          <Feather name="plus" size={24} color="#fff" />
        </View>
      ), tabBarLabel: () => null }} />
      <Tabs.Screen name="my-trips" options={{ title: 'मेरी ट्रिप', tabBarIcon: ({ color }) => <Feather name="list" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'प्रोफाइल', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -8,
    shadowColor: '#FF6B00', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 8,
  },
});
