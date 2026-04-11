import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform } from 'react-native';
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

  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.navy,
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
          ...(isWeb ? { height: 84, paddingBottom: 30 } : { height: 62, paddingBottom: 8 }),
        },
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
