import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import * as accountQueries from '@/db/queries/account';
import * as settingQueries from '@/db/queries/setting';
import * as transactionQueries from '@/db/queries/transaction';
import { InsertTransaction, SelectAccount, SelectBank } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { format } from 'date-fns';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Card, FAB, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleNotification } from './services/notifications';
import { readSms, requestSmsPermission } from './services/smsReader';

export default function HomeScreen() {
  const expoDb = useSQLiteContext();

  // **Provide the access of your SQLite DB to the Drizzle Studio***
  useDrizzleStudio(expoDb);

  const colorScheme = useColorScheme();
  const router = useRouter();
  const [accounts, setAccounts] = useState<(SelectAccount & { bank: SelectBank } & { dailyTotal: number })[]>([]);
  const [refreshing, setRefreshing] = useState(false);


  const loadData = async () => {
    try {
      const accounts = await accountQueries.findAll({});
      const today = format(new Date(), 'yyyy-MM-dd');

      const accountsWithTotal = await Promise.all(accounts.map(async (acc) => {
        const total = await transactionQueries.getDailyTotal(acc.id, today);
        return { ...acc, dailyTotal: total };
      }));

      setAccounts(accountsWithTotal);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);

    // Request permissions first
    const hasSmsPermission = await requestSmsPermission();

    if (hasSmsPermission) {
      try {
        // Get last SMS timestamp
        const lastTimestamp = await settingQueries.getLastSmsTimestamp();

        // Read only new SMS messages
        const transactions = await readSms(lastTimestamp);
        let newTxCount = 0;
        const txs: InsertTransaction[] = [];
        let maxTimestamp = lastTimestamp ?? 0;

        for (const tx of transactions) {
          const accounts = await accountQueries.findAll({});
          const account = accounts.find(a => a.bank.name.toLowerCase() === tx.bankName.toLowerCase());

          if (account) {
            txs.push({
              name: tx.bankName,
              accountId: account.id,
              amount: tx.amount,
              receiver: tx.receiver,
              reference: tx.reference,
              date: tx.date,
              timestamp: tx.timestamp,
              accountNo: tx.senderAccountNo
            })
            newTxCount++;
          }

          // Track the latest timestamp even if message is not of transaction
          const txTimestamp = tx.timestamp;
          if (txTimestamp > maxTimestamp) {
            maxTimestamp = txTimestamp;
          }
        }

        if (txs.length > 0) {
          await transactionQueries.createMany(txs);
          console.log(`Added ${newTxCount} new transactions`);
        }

        // Update last SMS timestamp
        await settingQueries.setLastSmsTimestamp(maxTimestamp + 1);
      } catch (e) {
        console.error(e);
      }
    }

    await loadData();

    const updatedAccounts = await accountQueries.findAll({});
    const today = format(new Date(), 'yyyy-MM-dd');

    for (const acc of updatedAccounts) {
      const total = await transactionQueries.getDailyTotal(acc.id, today);
      if (acc.upiLimit > 0 && total >= acc.upiLimit) {
        await scheduleNotification(
          'UPI Limit Reached',
          `You have reached your daily limit of ₹${acc.upiLimit} for ${acc.name}.`
        );
      } else if (acc.upiLimit > 0 && total >= acc.upiLimit * 0.9) {
        await scheduleNotification(
          'UPI Limit Near',
          `You have used 90% of your daily limit for ${acc.name}.`
        );
      }
    }

    setRefreshing(false);
  };

  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[themeColors.primary]} />
          }
        >
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <View>
                <Text variant="headlineLarge" style={[styles.header, { color: themeColors.text }]}>
                  My Accounts
                </Text>
                <Text variant="bodyMedium" style={[styles.subtitle, { color: themeColors.icon }]}>
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </Text>
              </View>
              <IconButton
                icon="refresh"
                size={24}
                iconColor={themeColors.primary}
                onPress={onRefresh}
                disabled={refreshing}
              />
            </View>
          </View>

          {accounts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card, ...Elevation.md }]}>
              <IconButton icon="bank-off" size={64} iconColor={themeColors.icon} />
              <Text variant="titleLarge" style={[styles.emptyTitle, { color: themeColors.text }]}>
                No Accounts Yet
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: themeColors.icon }]}>
                Get started by adding your first bank account
              </Text>
              <FAB
                icon="plus"
                label="Add Account"
                style={[styles.emptyButton, { backgroundColor: themeColors.primary }]}
                onPress={() => router.push('/screens/SetupScreen')}
              />
            </View>
          ) : (
            accounts.map((account) => {
              const progress = account.upiLimit > 0 ? Math.min(account.dailyTotal / account.upiLimit, 1) : 0;
              const isNearLimit = progress >= 0.9;
              const isOverLimit = progress >= 1;

              let statusColor = themeColors.success;
              let statusText = 'On Track';

              if (isOverLimit) {
                statusColor = themeColors.error;
                statusText = 'Limit Reached';
              } else if (isNearLimit) {
                statusColor = themeColors.warning;
                statusText = 'Near Limit';
              }

              return (
                <Card
                  key={account.id}
                  style={[styles.card, { backgroundColor: themeColors.card, ...Elevation.md }]}
                  onPress={() => router.push({ pathname: '/screens/TransactionsScreen', params: { accountId: account.id } })}
                >
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardTitleContainer}>
                        <Text variant="titleLarge" style={[styles.accountName, { color: themeColors.text }]}>
                          {account.name}
                        </Text>
                        <Text variant="bodyMedium" style={[styles.bankName, { color: themeColors.icon }]}>
                          {account.bank.name}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text variant="labelSmall" style={[styles.statusText, { color: statusColor }]}>
                          {statusText}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.amountContainer}>
                      <Text variant="headlineMedium" style={[styles.amount, { color: themeColors.text }]}>
                        ₹{account.dailyTotal.toLocaleString('en-IN')}
                      </Text>
                      <Text variant="bodySmall" style={{ color: themeColors.icon }}>
                        of ₹{account.upiLimit.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.progressContainer}>
                      <View style={[styles.progressTrack, { backgroundColor: themeColors.progressBg }]}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${progress * 100}%`,
                              backgroundColor: statusColor,
                            }
                          ]}
                        />
                      </View>
                      <Text variant="labelSmall" style={[styles.progressText, { color: themeColors.icon }]}>
                        {(progress * 100).toFixed(0)}% used
                      </Text>
                    </View>
                  </Card.Content>
                </Card>
              );
            })
          )}
        </ScrollView>

        <FAB
          icon="cog"
          style={[styles.fab, { backgroundColor: themeColors.primary }]}
          onPress={() => router.push('/screens/SetupScreen')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80,
  },
  headerContainer: {
    marginBottom: Spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 13,
  },
  card: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardTitleContainer: {
    flex: 1,
  },
  accountName: {
    fontWeight: '600',
    marginBottom: Spacing.xs / 2,
  },
  bankName: {
    opacity: 0.7,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  statusText: {
    fontWeight: '600',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  amountContainer: {
    marginBottom: Spacing.md,
  },
  amount: {
    fontWeight: '700',
    marginBottom: Spacing.xs / 2,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressTrack: {
    height: 8,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  progressText: {
    textAlign: 'right',
  },
  emptyCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.xxl,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  emptyButton: {
    marginTop: Spacing.sm,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.md,
    right: 0,
    bottom: 0,
  },
});
