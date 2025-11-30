import { AccountLimitCard, RecentTransactionItem, TotalKharchaCard } from '@/components/dashboard';
import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import * as accountQueries from '@/db/queries/account';
import * as settingQueries from '@/db/queries/setting';
import * as transactionQueries from '@/db/queries/transaction';
import { InsertTransaction, SelectAccount, SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useDrizzleStudio } from 'expo-drizzle-studio-plugin';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleNotification } from './services/notifications';
import { readSms, requestSmsPermission } from './services/smsReader';

interface AccountWithStats extends SelectAccount {
  dailyTotal: number;
  yesterdayTotal: number;
  cumulativeTotal: number;
  todayTransactions: SelectTransaction[];
}

export default function HomeScreen() {
  const expoDb = useSQLiteContext();

  // **Provide the access of your SQLite DB to the Drizzle Studio***
  useDrizzleStudio(expoDb);

  const colorScheme = useColorScheme();
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Computed totals
  const totalToday = accounts.reduce((sum, acc) => sum + acc.dailyTotal, 0);
  const totalYesterday = accounts.reduce((sum, acc) => sum + acc.yesterdayTotal, 0);
  const cumulativeTotal = accounts.reduce((sum, acc) => sum + acc.cumulativeTotal, 0);
  const allTodayTransactions = accounts
    .flatMap(acc => acc.todayTransactions)
    .sort((a, b) => b.timestamp - a.timestamp);


  const loadData = async () => {
    try {
      const fetchedAccounts = await accountQueries.findAll({});
      const today = format(new Date(), 'yyyy-MM-dd');

      const accountsWithStats = await Promise.all(fetchedAccounts.map(async (acc) => {
        const [dailyTotal, yesterdayTotal, cumulativeTotal, todayTransactions] = await Promise.all([
          transactionQueries.getDailyTotal(acc.accountNo, acc.bankName, today),
          transactionQueries.getYesterdayTotal(acc.accountNo, acc.bankName),
          transactionQueries.getCumulativeTotal(acc.accountNo, acc.bankName),
          transactionQueries.getTodayTransactions(acc.accountNo, acc.bankName),
        ]);
        return { ...acc, dailyTotal, yesterdayTotal, cumulativeTotal, todayTransactions };
      }));

      setAccounts(accountsWithStats);
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

        for (const tx of transactions) {
          txs.push({
            bankName: tx.bankName,
            accountNo: tx.accountNo,
            amount: tx.amount,
            receiver: tx.receiver,
            reference: tx.reference,
            date: tx.date,
            timestamp: tx.timestamp,
            rawMessage: tx.rawMessage
          })
          newTxCount++;
        }

        if (txs.length > 0) {
          await transactionQueries.createMany(txs);
          console.log(`Added ${newTxCount} new transactions`);
        }

        // Update last SMS timestamp
        await settingQueries.setLastSmsTimestamp(Date.now());
      } catch (e) {
        console.error(e);
      }
    }

    await loadData();

    const updatedAccounts = await accountQueries.findAll({});
    const today = format(new Date(), 'yyyy-MM-dd');

    for (const acc of updatedAccounts) {
      const total = await transactionQueries.getDailyTotal(acc.accountNo, acc.bankName, today);
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
            <>
              {/* Total Kharcha Summary Card */}
              <TotalKharchaCard
                totalToday={totalToday}
                totalYesterday={totalYesterday}
                cumulativeTotal={cumulativeTotal}
              />

              {/* Account Limits Section */}
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
                  Daily Limits
                </Text>
              </View>

              {accounts.map((account) => (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => router.push({ pathname: '/screens/TransactionsScreen', params: { accountId: account.id, bankName: account.bankName, accountNo: account.accountNo } })}
                  activeOpacity={0.7}
                >
                  <AccountLimitCard
                    name={account.name}
                    bankName={account.bankName}
                    dailyTotal={account.dailyTotal}
                    yesterdayTotal={account.yesterdayTotal}
                    upiLimit={account.upiLimit}
                  />
                </TouchableOpacity>
              ))}

              {/* Recent Transactions Section */}
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {"Today's Transactions"}
                </Text>
                {allTodayTransactions.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: themeColors.primary + '20' }]}>
                    <Text style={[styles.countText, { color: themeColors.primary }]}>
                      {allTodayTransactions.length}
                    </Text>
                  </View>
                )}
              </View>

              {allTodayTransactions.length === 0 ? (
                <View style={[styles.emptyTransactions, { backgroundColor: themeColors.card }]}>
                  <MaterialIcons name="receipt-long" size={40} color={themeColors.icon} />
                  <Text variant="bodyMedium" style={{ color: themeColors.icon, marginTop: Spacing.sm }}>
                    No transactions today
                  </Text>
                </View>
              ) : (
                allTodayTransactions.slice(0, 5).map((tx) => (
                  <RecentTransactionItem
                    key={tx.id}
                    transaction={tx}
                    onPress={() => {
                      const account = accounts.find(a => a.accountNo.includes(tx.accountNo) || tx.accountNo.includes(a.accountNo));
                      if (account) {
                        router.push({ pathname: '/screens/TransactionsScreen', params: { accountId: account.id, bankName: account.bankName, accountNo: account.accountNo } });
                      }
                    }}
                  />
                ))
              )}

              {allTodayTransactions.length > 5 && (
                <TouchableOpacity style={[styles.viewAllButton, { borderColor: themeColors.primary }]}>
                  <Text style={[styles.viewAllText, { color: themeColors.primary }]}>
                    View All ({allTodayTransactions.length} transactions)
                  </Text>
                  <MaterialIcons name="chevron-right" size={20} color={themeColors.primary} />
                </TouchableOpacity>
              )}
            </>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
  },
  countBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: BorderRadius.full,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyTransactions: {
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.sm,
    gap: Spacing.xs,
  },
  viewAllText: {
    fontWeight: '600',
    fontSize: 14,
  },
});
