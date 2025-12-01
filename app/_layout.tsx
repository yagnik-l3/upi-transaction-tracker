import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, MD3LightTheme, PaperProvider, configureFonts } from 'react-native-paper';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { DATABASE_NAME } from '@/constants';
import { FontFamily } from '@/constants/theme';
import { db } from '@/db';
import { seedDefaultBanks } from '@/db/seed';
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteProvider } from 'expo-sqlite';
import migrations from "../db/drizzle/migrations";
import { registerForPushNotificationsAsync } from './services/notifications';
import { requestSmsPermission } from './services/smsReader';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Custom font configuration for React Native Paper
const fontConfig = {
  fontFamily: FontFamily.regular,
};

const customTheme = {
  ...MD3LightTheme,
  fonts: configureFonts({ config: fontConfig }),
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6366f1',
    secondary: '#8b5cf6',
    background: '#f9fafb',
    surface: '#ffffff',
    surfaceVariant: '#f3f4f6',
  },
};

// Light theme for navigation
const lightNavigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366f1',
    background: '#f9fafb',
    card: '#ffffff',
    text: '#1f2937',
    border: '#e5e7eb',
  },
};

export default function RootLayout() {
  const { success, error } = useMigrations(db, migrations);

  // Load custom fonts
  const [fontsLoaded] = useFonts({
    'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
    'OpenSans-Medium': require('../assets/fonts/OpenSans-Medium.ttf'),
    'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
    'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
    'OpenSans-ExtraBold': require('../assets/fonts/OpenSans-ExtraBold.ttf'),
    'OpenSans-Light': require('../assets/fonts/OpenSans-Light.ttf'),
    'OpenSans-Italic': require('../assets/fonts/OpenSans-Italic.ttf'),
  });

  useEffect(() => {
    // Request permissions on app startup
    const requestPermissions = async () => {
      try {
        await requestSmsPermission();
        await registerForPushNotificationsAsync();
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    };

    requestPermissions();
  }, []);

  useEffect(() => {
    if (fontsLoaded && success) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, success]);

  // Show loading while migrations are running or fonts loading
  if (!success || !fontsLoaded) {
    return <ActivityIndicator size="large" style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb' }} />;
  }

  if (error) {
    console.error('Migration error:', error);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <SQLiteProvider
          databaseName={DATABASE_NAME}
          onInit={async () => {
            try {
              // Seed default banks
              await seedDefaultBanks();
            } catch (error) {
              console.error("Migration error", error);
            }
          }}
        >
          <PaperProvider theme={customTheme}>
            <ThemeProvider value={lightNavigationTheme}>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="screens/SetupScreen" />
                <Stack.Screen name="screens/TransactionsScreen" />
                <Stack.Screen name="screens/EditAccountScreen" />
              </Stack>
              <StatusBar style="dark" />
            </ThemeProvider>
          </PaperProvider>
        </SQLiteProvider>
        <Toast />
      </Suspense>
    </GestureHandlerRootView>
  );
}
