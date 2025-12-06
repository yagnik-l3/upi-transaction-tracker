import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ActivityIndicator, MD3LightTheme, PaperProvider, configureFonts } from 'react-native-paper';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';

import { FontFamily } from '@/constants/theme';
import { db } from '@/db';
import migrations from "@/db/drizzle/migrations";
import { seedDefaultBanks } from '@/db/seed';
import { OnboardingProvider, useOnboarding } from '@/hooks/context';
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

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
  const router = useRouter();
  const segments = useSegments();

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
    const init = async () => {
      if (fontsLoaded && success && !isLoading) {
        try {
          // Seed default banks after migrations complete
          await seedDefaultBanks();
        } catch (e) {
          console.error('Seed error:', e);
        }
        SplashScreen.hideAsync();
      }
    };
    init();
  }, [fontsLoaded, success, isLoading]);

  // Handle navigation based on onboarding state
  useEffect(() => {
    if (isLoading || !fontsLoaded || !success) return;

    const inProtectedGroup = segments[0] === '(protected)';

    if (hasOnboarded && !inProtectedGroup) {
      // User has onboarded but is not in protected area, redirect to home
      router.replace('/(protected)');
    } else if (!hasOnboarded && inProtectedGroup) {
      // User hasn't onboarded but is in protected area, redirect to onboarding
      router.replace('/onboarding');
    }
  }, [hasOnboarded, isLoading, fontsLoaded, success, segments])

  // Show loading while migrations are running or fonts loading
  if (!success || !fontsLoaded || isLoading) {
    return <ActivityIndicator size="small" color='#1f2937' style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb', }} />;
  }

  if (error) {
    console.error('Migration error:', error);
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<ActivityIndicator size="small" color='#1f2937' style={{ flex: 1, justifyContent: 'center', backgroundColor: '#f9fafb', }} />}>
        <PaperProvider theme={customTheme}>
          <ThemeProvider value={lightNavigationTheme}>

            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(protected)" />
              <Stack.Screen name="onboarding" />
            </Stack>

            <StatusBar style="dark" />
          </ThemeProvider>
        </PaperProvider>
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
