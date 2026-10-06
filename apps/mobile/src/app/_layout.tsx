import { DarkTheme, DefaultTheme, Tabs, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { ThemeProvider, useAppTheme } from '@/context/ThemeContext';

SplashScreen.preventAutoHideAsync();

function RootTabsLayout() {
  const { resolvedTheme, theme } = useAppTheme();
  const isDark = resolvedTheme === 'dark';

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
            height: Platform.OS === 'ios' ? 84 : 64,
            paddingBottom: Platform.OS === 'ios' ? 24 : 10,
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
    <ThemeProvider>
      <RootTabsLayout />
    </ThemeProvider>
  );
}
