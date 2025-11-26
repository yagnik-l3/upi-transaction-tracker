import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect } from 'react';
import { ActivityIndicator, MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import migrations from "../db/drizzle/migrations";

import { DATABASE_NAME } from '@/constants';
import { seedDefaultBanks } from '@/db/seed';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { drizzle } from "drizzle-orm/expo-sqlite";
import { migrate } from "drizzle-orm/expo-sqlite/migrator";
import { SQLiteProvider } from 'expo-sqlite';
import { registerForPushNotificationsAsync } from './services/notifications';
import { requestSmsPermission } from './services/smsReader';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

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

  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SQLiteProvider
        databaseName={DATABASE_NAME}
        options={{ enableChangeListener: true }}
        onInit={async (database) => {
          try {
            const db = drizzle(database);
            await migrate(db, migrations);
            console.log("Migration success");

            // Seed default banks
            await seedDefaultBanks();
          } catch (error) {
            console.error("Migration error", error);
          }
        }}
      >
        <PaperProvider theme={theme}>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen
                name="index"
                options={{
                  headerShown: false,
                }}
              />
              <Stack.Screen name="screens/SetupScreen" options={{ title: 'Setup' }} />
              <Stack.Screen name="screens/TransactionsScreen" options={{ title: 'Transactions' }} />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </PaperProvider>
      </SQLiteProvider>
    </Suspense>
  );
}
