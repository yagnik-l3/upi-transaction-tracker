import { AccountLimitCard, RecentTransactionItem, TotalKharchaCard } from '@/components/dashboard';
import { COMPONENT_SIZE, FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, Elevation, FontFamily } from '@/constants/theme';
import * as accountQueries from '@/db/queries/account';
import * as settingQueries from '@/db/queries/setting';
import * as transactionQueries from '@/db/queries/transaction';
import { CARD_COLORS, CARD_ICONS, InsertAccount, InsertTransaction, SelectAccount, SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { Image, RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { FAB, IconButton, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleNotification } from '../../services/notifications';
import { readSms } from '../../services/smsReader';

interface AccountWithStats extends SelectAccount {
  dailyTotal: number;
  yesterdayTotal: number;
  todayTransactions: SelectTransaction[];
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [accounts, setAccounts] = useState<AccountWithStats[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<number | null>(null);
  const isMountedRef = useRef(true);
  // const [hasSmsPermission, setHasSmsPermission] = useState<boolean>(hasOnboarded);

  // Request SMS permission
  // const requestSmsPermission = async () => {
  //   if (Platform.OS !== 'android') return;
  //   try {
  //     const granted = await PermissionsAndroid.request(
  //       PermissionsAndroid.PERMISSIONS.READ_SMS,
  //       {
  //         title: 'SMS Permission Required',
  //         message: 'This app needs access to your SMS messages to automatically detect and track your UPI transactions.',
  //         buttonNeutral: 'Ask Me Later',
  //         buttonNegative: 'Cancel',
  //         buttonPositive: 'Grant Permission',
  //       }
  //     );
  //     const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
  //     setHasSmsPermission(isGranted);
  //     if (isGranted) {
  //       handleRefresh();
  //     }
  //   } catch (err) {
  //     console.error('SMS Permission error:', err);
  //   }
  // };

  // Computed totals
  const totalToday = accounts.reduce((sum, acc) => sum + acc.dailyTotal, 0);
  const totalYesterday = accounts.reduce((sum, acc) => sum + acc.yesterdayTotal, 0);
  const allTodayTransactions = accounts
    .flatMap(acc => acc.todayTransactions)
    .sort((a, b) => b.timestamp - a.timestamp);


  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      const fetchedAccounts = await accountQueries.findAll({});
      if (!isMountedRef.current) return;

      const today = format(new Date(), 'yyyy-MM-dd');

      const accountsWithStats = await Promise.all(fetchedAccounts.map(async (acc) => {
        const [dailyTotal, yesterdayTotal, todayTransactions] = await Promise.all([
          transactionQueries.getDailyTotal(acc.accountNo, acc.bankName, today),
          transactionQueries.getYesterdayTotal(acc.accountNo, acc.bankName),
          transactionQueries.getTodayTransactions(acc.accountNo, acc.bankName),
        ]);
        return { ...acc, dailyTotal, yesterdayTotal, todayTransactions };
      }));

      if (!isMountedRef.current) return;

      // Load last refresh time
      const savedRefreshTime = await settingQueries.getLastRefreshTime();
      if (!isMountedRef.current) return;

      setLastRefreshTime(savedRefreshTime);
      setAccounts(accountsWithStats);
    } catch (e) {
      console.error('Error loading data:', e);
    }
  }, [])

  const onRefresh = async () => {
    try {
      // Get last SMS timestamp
      const lastTimestamp = await settingQueries.getLastRefreshTime();

      // Read only new SMS messages
      const transactions = await readSms(lastTimestamp);
      if (transactions.length > 0) {
        // Collect unique bank+account combinations from transactions
        const uniqueAccounts = new Map<string, { bankName: string; accountNo: string }>();
        const txs: InsertTransaction[] = [];

        for (const tx of transactions) {
          const key = `${tx.bankName}:${tx.accountNo}`;
          if (!uniqueAccounts.has(key)) {
            uniqueAccounts.set(key, { bankName: tx.bankName, accountNo: tx.accountNo });
          }
          txs.push({
            bankName: tx.bankName,
            accountNo: tx.accountNo,
            amount: tx.amount,
            receiver: tx.receiver,
            reference: tx.reference,
            date: tx.date,
            timestamp: tx.timestamp,
            rawMessage: tx.rawMessage
          });
        }

        // Get existing accounts in one query
        const existingAccounts = await accountQueries.findAll({});
        const existingKeys = new Set(
          existingAccounts.map(acc => `${acc.bankName}:${acc.accountNo}`)
        );

        // Create new accounts for bank+accountNo combinations that don't exist
        const newAccounts: InsertAccount[] = [];
        let colorIndex = existingAccounts.length;

        for (const [key, accInfo] of uniqueAccounts) {
          if (!existingKeys.has(key)) {
            // Auto-create account with default values
            newAccounts.push({
              bankName: accInfo.bankName,
              accountNo: accInfo.accountNo,
              name: `${accInfo.bankName} ****${accInfo.accountNo.slice(-4)}`,
              upiLimit: 100000, // Default limit
              cardColor: CARD_COLORS[colorIndex % CARD_COLORS.length].value,
              cardIcon: CARD_ICONS[0].value,
            });
            colorIndex++;
          }
        }

        // Batch create new accounts
        if (newAccounts.length > 0) {
          await accountQueries.createMany(newAccounts);
          console.log(`Auto-created ${newAccounts.length} new accounts`);
        }

        // Batch create transactions
        await transactionQueries.createMany(txs);
        console.log(`Added ${txs.length} new transactions`);
      }

      // Update last SMS timestamp
      await settingQueries.setLastRefreshTime(Date.now());
    } catch (e) {
      console.error(e);
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
  };

  // Handle refresh with SMS reading (only if permission granted)
  const handleRefresh = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setRefreshing(true);
      await onRefresh();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      if (isMountedRef.current) {
        setRefreshing(false);
      }
    }
  }, []);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      isMountedRef.current = true;

      // Small delay to ensure database is ready after navigation
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          handleRefresh();
        }
      }, 100);

      return () => {
        isMountedRef.current = false;
        clearTimeout(timeoutId);
      };
    }, [handleRefresh])
  );

  const themeColors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[themeColors.text]} />
          }
        >
          <View style={styles.headerContainer}>
            <View style={styles.headerRow}>
              <View style={styles.headerTextContainer}>
                <Text variant="headlineMedium" style={[styles.header, { color: themeColors.text }]}>
                  My Accounts
                </Text>
                <Text variant="bodySmall" style={[styles.subtitle, { color: themeColors.icon }]}>
                  {format(new Date(), 'EEEE, MMMM d')}
                </Text>
              </View>
              <View style={styles.logoContainer}>
                <Image
                  source={require('../../assets/images/icon.png')}
                  style={styles.appIcon}
                />
              </View>
            </View>
          </View>

          {/* SMS Permission Banner */}
          {/* {hasSmsPermission === false && (
            <View style={[styles.permissionBanner, { backgroundColor: themeColors.warning + '15', borderColor: themeColors.warning }]}>
              <View style={styles.permissionBannerContent}>
                <MaterialIcons name="sms" size={ICON_SIZE.lg} color={themeColors.warning} />
                <View style={styles.permissionBannerText}>
                  <Text variant="titleSmall" style={[styles.permissionBannerTitle, { color: themeColors.text }]}>
                    SMS Permission Required
                  </Text>
                  <Text variant="bodySmall" style={{ color: themeColors.icon }}>
                    Grant permission to automatically track your UPI transactions
                  </Text>
                </View>
              </View>
              <Button
                mode="contained"
                onPress={requestSmsPermission}
                style={[styles.permissionBannerButton, { backgroundColor: themeColors.warning }]}
                labelStyle={styles.permissionBannerButtonLabel}
                compact
              >
                Grant
              </Button>
            </View>
          )} */}

          {accounts.length === 0 && !refreshing ? (
            <View style={[styles.emptyCard, { backgroundColor: themeColors.card, ...Elevation.md }]}>
              <IconButton icon="bank-off" size={ICON_SIZE.xxxl} iconColor={themeColors.icon} />
              <Text variant="titleLarge" style={[styles.emptyTitle, { color: themeColors.text }]}>
                No Accounts Yet
              </Text>
              <Text variant="bodyMedium" style={[styles.emptyText, { color: themeColors.icon }]}>
                Get started by adding your first bank account
              </Text>
              <FAB
                icon="plus"
                label="Add Account"
                color={themeColors.background}
                style={[styles.emptyButton, { backgroundColor: themeColors.text }]}
                onPress={() => router.push('/(protected)/setup')}
              />
            </View>
          ) : (
            <>
              {/* Total Kharcha Summary Card */}
              <TotalKharchaCard
                totalToday={totalToday}
                totalYesterday={totalYesterday}
                lastRefreshTime={lastRefreshTime}
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
                  onPress={() => router.push({ pathname: '/(protected)/transaction', params: { accountId: account.id, bankName: account.bankName, accountNo: account.accountNo } })}
                  activeOpacity={0.7}
                >
                  <AccountLimitCard
                    name={account.name}
                    bankName={account.bankName}
                    dailyTotal={account.dailyTotal}
                    yesterdayTotal={account.yesterdayTotal}
                    upiLimit={account.upiLimit}
                    cardColor={account.cardColor}
                    cardIcon={account.cardIcon}
                    onEdit={() => router.push({ pathname: '/(protected)/edit-account', params: { accountId: account.id } })}
                  />
                </TouchableOpacity>
              ))}

              {/* Recent Transactions Section */}
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: themeColors.text }]}>
                  {"Today's Transactions"}
                </Text>
                {allTodayTransactions.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: '#1f2937' }]}>
                    <Text style={[styles.countText, { color: '#fff' }]}>
                      {allTodayTransactions.length}
                    </Text>
                  </View>
                )}
              </View>

              {allTodayTransactions.length === 0 ? (
                <View style={[styles.emptyTransactions, { backgroundColor: themeColors.card }]}>
                  <MaterialIcons name="receipt-long" size={ICON_SIZE.xxl} color={themeColors.icon} />
                  <Text variant="bodyMedium" style={{ color: themeColors.icon, marginTop: SPACING.sm }}>
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
                        router.push({ pathname: '/(protected)/transaction', params: { accountId: account.id, bankName: account.bankName, accountNo: account.accountNo } });
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
                  <MaterialIcons name="chevron-right" size={ICON_SIZE.md} color={themeColors.primary} />
                </TouchableOpacity>
              )}
            </>
          )}
        </ScrollView>

        <FAB
          icon="cog"
          color={themeColors.background}
          style={[styles.fab, { backgroundColor: '#1f2937' }]}
          onPress={() => router.push('/(protected)/setup')}
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
    padding: SPACING.screenPadding,
    paddingBottom: SPACING.xxxl * 2,
  },
  headerContainer: {
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoContainer: {
    width: COMPONENT_SIZE.appIconSize,
    height: COMPONENT_SIZE.appIconSize,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  appIcon: {
    width: COMPONENT_SIZE.appIconSize,
    height: COMPONENT_SIZE.appIconSize,
    resizeMode: 'contain',
  },
  headerTextContainer: {
    flex: 1,
  },
  header: {
    fontWeight: '800',
    fontFamily: FontFamily.extraBold,
    fontSize: FONT_SIZE.xxl,
  },
  subtitle: {
    opacity: 0.6,
    fontSize: FONT_SIZE.sm,
    fontFamily: FontFamily.regular,
  },
  refreshButton: {
    width: ICON_SIZE.xxl,
    height: ICON_SIZE.xxl,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  emptyTitle: {
    fontWeight: '600',
    marginBottom: SPACING.sm,
    fontSize: FONT_SIZE.xxl
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZE.md
  },
  emptyButton: {
    marginTop: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyButtonLabel: {
    fontSize: FONT_SIZE.md,
    fontFamily: FontFamily.semiBold,
  },
  fab: {
    position: 'absolute',
    margin: SPACING.screenPadding,
    right: 0,
    bottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontWeight: '700',
    fontFamily: FontFamily.bold,
    fontSize: FONT_SIZE.lg,
  },
  countBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: RADIUS.rounded,
  },
  countText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '600',
  },
  emptyTransactions: {
    borderRadius: RADIUS.md,
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  viewAllText: {
    fontWeight: '600',
    fontSize: FONT_SIZE.md,
    fontFamily: FontFamily.semiBold,
  },
  permissionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  permissionBannerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  permissionBannerText: {
    flex: 1,
  },
  permissionBannerTitle: {
    fontFamily: FontFamily.semiBold,
    marginBottom: SPACING.xs / 2,
  },
  permissionBannerButton: {
    borderRadius: RADIUS.sm,
  },
  permissionBannerButtonLabel: {
    fontSize: FONT_SIZE.sm,
    fontFamily: FontFamily.semiBold,
  },
});
