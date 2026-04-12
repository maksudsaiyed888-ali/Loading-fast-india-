import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import * as Updates from "expo-updates";
import * as KeepAwake from "expo-keep-awake";
import React, { useEffect, useState } from "react";
import { Alert, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider, useApp } from "@/context/AppContext";
import NetworkBanner from "@/components/NetworkBanner";
import { initNetworkMonitor, stopNetworkMonitor } from "@/lib/networkService";

SplashScreen.preventAutoHideAsync();
const queryClient = new QueryClient();

async function checkForUpdates() {
  try {
    if (__DEV__) return;
    const update = await Updates.checkForUpdateAsync();
    if (update.isAvailable) {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    }
  } catch {}
}

function AuthWatcher() {
  const { user, isLoading } = useApp();
  const [prevUser, setPrevUser] = React.useState(user);

  useEffect(() => {
    if (!isLoading && prevUser !== null && user === null) {
      router.replace('/');
    }
    setPrevUser(user);
  }, [user, isLoading]);

  return null;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1 }}>
      <AuthWatcher />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="driver-register" />
        <Stack.Screen name="vyapari-register" />
        <Stack.Screen name="(driver)" />
        <Stack.Screen name="(vyapari)" />
        <Stack.Screen name="admin/index" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <NetworkBanner />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    KeepAwake.activateKeepAwakeAsync("lfi-main");
    initNetworkMonitor();
    checkForUpdates();
    return () => {
      KeepAwake.deactivateKeepAwake("lfi-main");
      stopNetworkMonitor();
    };
  }, []);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <RootLayoutNav />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
