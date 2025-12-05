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
import migrations from "@/db/drizzle/migrations";
import { seedDefaultBanks } from '@/db/seed';
import { OnboardingProvider, useOnboarding } from '@/hooks/context';
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteProvider } from 'expo-sqlite';

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

function RootLayoutNav() {
  const { success, error } = useMigrations(db, migrations);
  const { hasOnboarded, isLoading } = useOnboarding();

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
    if (fontsLoaded && success && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, success, isLoading]);

  useEffect(() => {
    console.log("has-onboarded", hasOnboarded)
  }, [hasOnboarded])

  // Show loading while migrations are running or fonts loading
  if (!success || !fontsLoaded || isLoading) {
    return <ActivityIndicator size="large" color='#1f2937' style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb', }} />;
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
                <Stack.Protected guard={hasOnboarded}>
                  <Stack.Screen name="(protected)" />
                </Stack.Protected>

                <Stack.Protected guard={!hasOnboarded}>
                  <Stack.Screen name="onboarding" />
                </Stack.Protected>
              </Stack>

              <StatusBar style="dark" />
            </ThemeProvider>
          </PaperProvider>
        </SQLiteProvider>
        <Toast />
      </Suspense>
    </GestureHandlerRootView>
  )
}

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <RootLayoutNav />
    </OnboardingProvider>
  );
}
