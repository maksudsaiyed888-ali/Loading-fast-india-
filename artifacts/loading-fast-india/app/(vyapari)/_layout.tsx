import { Feather } from '@expo/vector-icons';
import { Tabs, router } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';

export default function VyapariTabLayout() {
  const colors = useColors();
  const { user } = useApp();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!user || user.role !== 'vyapari') {
      router.replace('/');
    }
  }, [user]);

  const isWeb = Platform.OS === 'web';
  const bottomPad = isWeb ? 30 : Math.max(insets.bottom, 8);
  const tabHeight = isWeb ? 84 : 54 + bottomPad;

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
          height: tabHeight,
          paddingBottom: bottomPad,
        },
        tabBarLabelStyle: { fontSize: 10, fontFamily: 'Inter_500Medium', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'होम', tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="browse" options={{ title: 'ट्रिप खोजें', tabBarIcon: ({ color }) => <Feather name="search" size={22} color={color} /> }} />
      <Tabs.Screen name="post-trip" options={{
        title: 'ट्रिप डालें',
        tabBarIcon: ({ color, focused }) => (
          <View style={[styles.addBtn, { backgroundColor: focused ? '#08203a' : colors.navy }]}>
            <Feather name="upload" size={20} color="#fff" />
          </View>
        ),
        tabBarLabel: () => null,
      }} />
      <Tabs.Screen name="bookings" options={{ title: 'मेरी बुकिंग', tabBarIcon: ({ color }) => <Feather name="package" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'प्रोफाइल', tabBarIcon: ({ color }) => <Feather name="user" size={22} color={color} /> }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    marginTop: -6,
    shadowColor: '#0A2540', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
});
