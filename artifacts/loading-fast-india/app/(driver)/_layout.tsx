import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function DriverTabLayout() {
  const colors = useColors();
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user || user.role !== 'driver') {
      router.replace('/');
    }
  }, [user]);

  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 30 : Math.max(insets.bottom, 8);
  const tabHeight = isWeb ? 84 : 54 + bottomPad;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          elevation: 12,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          height: tabHeight,
          paddingBottom: bottomPad,
        },
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
