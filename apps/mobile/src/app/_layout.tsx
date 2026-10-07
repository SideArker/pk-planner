import { DarkTheme, DefaultTheme, Tabs, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';
import { requestNotificationPermission } from '@/utils/notifications';

SplashScreen.preventAutoHideAsync();

function RootTabsLayout() {
  const { resolvedTheme, theme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const isDark = resolvedTheme === 'dark';
  const tabBarBottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 28 : 12) + 8;

  useEffect(() => {
    // Automatyczne zapytanie o wysyłanie powiadomień po wejściu na apkę
    void requestNotificationPermission();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void requestNotificationPermission();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AnimatedSplashOverlay />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: isDark ? '#09090b' : '#ffffff',
            borderTopColor: theme.border,
            borderTopWidth: 1,
            height: 56 + tabBarBottomPadding,
            paddingBottom: tabBarBottomPadding,
            paddingTop: 8,
          },
          tabBarActiveTintColor: isDark ? '#fafafa' : '#0f172a',
          tabBarInactiveTintColor: theme.textSecondary,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Mój plan',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'calendar' : 'calendar-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: 'Wyszukiwarka',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Ustawienia',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? 'settings' : 'settings-outline'}
                size={22}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <RootTabsLayout />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
