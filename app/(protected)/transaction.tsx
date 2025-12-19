import { CustomButton, CustomInput } from '@/components/ui';
import { FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, FontFamily } from '@/constants/theme';
import * as transactionQueries from '@/db/queries/transaction';
import { InsertTransaction, SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { endOfDay, format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, LayoutAnimation, Platform, TextInput as RNTextInput, StyleSheet, TouchableOpacity, UIManager, View } from 'react-native';
import { ActivityIndicator, Chip, FAB, Portal, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface GroupedTransactions {
    date: string;
    displayDate: string;
    transactions: SelectTransaction[];
}

type FilterType = 'all' | 'today' | 'week' | 'month';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { accountNo, bankName } = useLocalSearchParams();

    const [transactions, setTransactions] = useState<SelectTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<SelectTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<SelectTransaction | null>(null);
    const [dateFilter, setDateFilter] = useState<FilterType>('all');
    const [isLoading, setIsLoading] = useState(true);

    // Bottom sheet refs
    const detailSheetRef = useRef<BottomSheet>(null);
    const addSheetRef = useRef<BottomSheet>(null);

    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;

    // Add transaction form state
    const [newTransaction, setNewTransaction] = useState({
        amount: '',
        receiver: '',
        reference: '',
        category: 'Miscellaneous',
    });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await loadTransactions();
            } catch (error) {
                console.error('Failed to load transactions:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [accountNo, bankName, dateFilter]);

    useEffect(() => {
        // Animate list on mount
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, searchQuery]);

    const loadTransactions = async () => {
        const now = new Date();
        let startDate: number | undefined;
        let endDate: number | undefined;

        if (dateFilter === 'today') {
            startDate = startOfDay(now).getTime();
            endDate = endOfDay(now).getTime();
        } else if (dateFilter === 'week') {
            startDate = subDays(now, 7).getTime();
        } else if (dateFilter === 'month') {
            startDate = subDays(now, 30).getTime();
        }

        const txs = await transactionQueries.findAll({
            accountNo: accountNo as string,
            bankName: bankName as string,
            startDate,
            endDate,
            limit: 500 // Hard limit to prevent OOM
        });
        setTransactions(txs);
    };

    const applyFilters = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        let filtered = [...transactions];

        // Search filter
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(t =>
                t.receiver.toLowerCase().includes(lower) ||
                t.reference.includes(lower) ||
                t.amount.toString().includes(lower)
            );
        }

        setFilteredTransactions(filtered);
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
    };

    const groupedTransactions = useMemo(() => {
        const groups: { [key: string]: GroupedTransactions } = {};

        filteredTransactions.forEach(tx => {
            const date = format(startOfDay(new Date(tx.timestamp)), 'yyyy-MM-dd');
            if (!groups[date]) {
                const txDate = new Date(tx.timestamp);
                let displayDate = format(txDate, 'EEEE, dd MMM yyyy');
                if (isToday(txDate)) {
                    displayDate = 'Today, ' + format(txDate, 'dd MMM yyyy');
                } else if (isYesterday(txDate)) {
                    displayDate = 'Yesterday, ' + format(txDate, 'dd MMM yyyy');
                } else {
                    displayDate = format(txDate, 'EEEE, dd MMM yyyy');
                }
                groups[date] = {
                    date,
                    displayDate,
                    transactions: [],
                };
            }
            groups[date].transactions.push(tx);
        });

        return Object.values(groups).sort((a, b) => b.date.localeCompare(a.date));
    }, [filteredTransactions]);

    const getCategoryFromReceiver = (receiver: string): string => {
        const lower = receiver.toLowerCase();
        if (lower.includes('zomato') || lower.includes('swiggy') || lower.includes('food') || lower.includes('restaurant') || lower.includes('juice') || lower.includes('shake')) {
            return 'Food & Dining';
        }
        if (lower.includes('paytm') || lower.includes('payment')) {
            return 'Personal Care & Beauty';
        }
        return 'Miscellaneous';
    };

    const getCategoryColor = (category: string, themeColors: any) => {
        switch (category) {
            case 'Food & Dining':
                return themeColors.warning;
            case 'Personal Care & Beauty':
                return themeColors.primary;
            default:
                return themeColors.icon;
        }
    };

    const handleTransactionPress = (transaction: SelectTransaction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setTimeout(() => {
            detailSheetRef.current?.expand();
        }, 50);
        setSelectedTransaction(transaction);
    };

    // Calculate stats based on filtered transactions
    const stats = useMemo(() => {
        const totalSpent = filteredTransactions.reduce((sum, tx) => sum + tx.amount, 0);
        const avgTransaction = filteredTransactions.length > 0 ? totalSpent / filteredTransactions.length : 0;
        const maxTransaction = filteredTransactions.length > 0 ? Math.max(...filteredTransactions.map(tx => tx.amount)) : 0;
        return { totalSpent, avgTransaction, maxTransaction, count: filteredTransactions.length };
    }, [filteredTransactions]);

    const handleAddTransaction = async () => {
        if (!newTransaction.amount || !newTransaction.receiver) {
            Toast.show({
                type: 'error',
                text1: 'Missing Information',
                text2: 'Please fill in receiver name and amount',
                position: 'bottom',
                visibilityTime: 3000,
            });
            return;
        }

        try {
            const transaction: InsertTransaction = {
                amount: parseFloat(newTransaction.amount),
                receiver: newTransaction.receiver,
                reference: newTransaction.reference || 'Manual Entry',
                date: format(new Date(), 'yyyy-MM-dd'),
                bankName: bankName as string,
                timestamp: Date.now(),
                accountNo: accountNo as string,
                rawMessage: `Manual transaction: ${newTransaction.receiver} - ₹${newTransaction.amount}`,
            };

            await transactionQueries.create(transaction);
            await loadTransactions();

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Toast.show({
                type: 'success',
                text1: 'Transaction Added',
                text2: `₹${newTransaction.amount} to ${newTransaction.receiver}`,
                position: 'bottom',
                visibilityTime: 2000,
            });

            // Reset form
            setNewTransaction({
                amount: '',
                receiver: '',
                reference: '',
                category: 'Miscellaneous',
            });
            addSheetRef.current?.close();
        } catch (error) {
            console.error(error)
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add transaction',
                position: 'bottom',
            });
        }
    };

    const handleAddSheetChange = (index: number) => {
        if (index === -1) {
            addSheetRef.current?.close();
        }
    };
    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const themeColors = Colors[colorScheme ?? 'light'];

    const renderTransaction = (item: SelectTransaction) => {
        const category = getCategoryFromReceiver(item.receiver);
        const categoryColor = getCategoryColor(category, themeColors);

        return (
            <TouchableOpacity
                onPress={() => handleTransactionPress(item)}
                style={[styles.transactionItem, { backgroundColor: themeColors.card }]}
            >
                <View style={styles.transactionLeft}>
                    <View style={[styles.iconCircle, { backgroundColor: categoryColor + '20' }]}>
                        <MaterialIcons name="account-balance-wallet" size={ICON_SIZE.lg} color={categoryColor} />
                    </View>
                    <View style={styles.transactionInfo}>
                        <Text variant="titleMedium" style={[styles.receiver, { color: themeColors.text }]}>
                            {item.receiver}
                        </Text>
                        <Text variant="bodySmall" style={[styles.time, { color: themeColors.icon }]}>
                            {format(new Date(item.timestamp), 'hh:mm a')}
                        </Text>
                        <View style={styles.badges}>
                            <View style={[styles.badge, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                                <MaterialIcons name="credit-card" size={ICON_SIZE.xs} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>Debit</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                                <MaterialIcons name="payment" size={ICON_SIZE.xs} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>UPI</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                                <MaterialIcons name="receipt" size={ICON_SIZE.xs} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>REF - {item.reference}</Text>
                            </View>
                        </View>
                        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '20' }]}>
                            <Text style={[styles.categoryText, { color: categoryColor }]}>{category}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.transactionRight}>
                    <Text variant="titleLarge" style={[styles.amount, { color: themeColors.error }]}>
                        ₹{item.amount}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    const renderGroup = ({ item }: { item: GroupedTransactions }) => (
        <View style={styles.groupContainer}>
            <Text variant="titleMedium" style={[styles.dateHeader, { color: themeColors.text }]}>
                {item.displayDate}
            </Text>
            {item.transactions.map(tx => (
                <View key={tx.id}>
                    {renderTransaction(tx)}
                </View>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
            <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                {/* Custom Header with Back Button and Search */}
                <View style={styles.customHeader}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: themeColors.card }]}
                    >
                        <MaterialIcons name="arrow-back" size={ICON_SIZE.lg} color="#1f2937" />
                    </TouchableOpacity>
                    <View style={[styles.searchContainer, { backgroundColor: themeColors.card }]}>
                        <MaterialIcons name="search" size={ICON_SIZE.md} color={themeColors.icon} />
                        <RNTextInput
                            placeholder="Search transactions..."
                            placeholderTextColor={themeColors.icon}
                            onChangeText={onChangeSearch}
                            value={searchQuery}
                            style={[styles.searchInput, { color: themeColors.text }]}
                        />
                        {searchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <MaterialIcons name="close" size={ICON_SIZE.sm} color={themeColors.icon} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Filter Chips */}
                <View style={styles.filterContainer}>
                    <Chip
                        mode='flat'
                        selected={dateFilter === 'all'}
                        onPress={() => setDateFilter('all')}
                        style={[styles.filterChip, dateFilter === 'all' ? { backgroundColor: themeColors.text } : { backgroundColor: themeColors.cardBorder }]}
                        textStyle={[styles.filterChipText, dateFilter === 'all' ? { color: themeColors.background } : { color: themeColors.text }]}
                        selectedColor={themeColors.background}
                    >
                        All
                    </Chip>
                    <Chip
                        selected={dateFilter === 'today'}
                        onPress={() => setDateFilter('today')}
                        style={[styles.filterChip, dateFilter === 'today' ? { backgroundColor: themeColors.text } : { backgroundColor: themeColors.cardBorder }]}
                        textStyle={[styles.filterChipText, dateFilter === 'today' ? { color: themeColors.background } : { color: themeColors.text }]}
                        selectedColor={themeColors.background}
                    >
                        Today
                    </Chip>
                    <Chip
                        selected={dateFilter === 'week'}
                        onPress={() => setDateFilter('week')}
                        style={[styles.filterChip, dateFilter === 'week' ? { backgroundColor: themeColors.text } : { backgroundColor: themeColors.cardBorder }]}
                        textStyle={[styles.filterChipText, dateFilter === 'week' ? { color: themeColors.background } : { color: themeColors.text }]}
                        selectedColor={themeColors.background}
                    >
                        Week
                    </Chip>
                    <Chip
                        selected={dateFilter === 'month'}
                        onPress={() => setDateFilter('month')}
                        style={[styles.filterChip, dateFilter === 'month' ? { backgroundColor: themeColors.text } : { backgroundColor: themeColors.cardBorder }]}
                        textStyle={[styles.filterChipText, dateFilter === 'month' ? { color: themeColors.background } : { color: themeColors.text }]}
                        selectedColor={themeColors.background}
                    >
                        Month
                    </Chip>
                </View>

                {/* Transactions List */}
                {isLoading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color={themeColors.text} />
                    </View>
                ) : (
                    <FlashList
                        data={groupedTransactions}
                        keyExtractor={(item) => item.date}
                        renderItem={renderGroup}
                        contentContainerStyle={styles.listContent}
                        ListEmptyComponent={
                            <View style={styles.emptyContainer}>
                                <MaterialIcons name="receipt-long" size={ICON_SIZE.xxxl} color={themeColors.icon} />
                                <Text variant="bodyLarge" style={[styles.emptyText, { color: themeColors.icon }]}>
                                    No transactions found
                                </Text>
                            </View>
                        }
                    />
                )}
                {/* <FlatList
                            data={groupedTransactions}
                            keyExtractor={(item) => item.date}
                            renderItem={renderGroup}
                            contentContainerStyle={styles.listContent}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialIcons name="receipt-long" size={ICON_SIZE.xxxl} color={themeColors.icon} />
                                    <Text variant="bodyLarge" style={[styles.emptyText, { color: themeColors.icon }]}>
                                        No transactions found
                                    </Text>
                                </View>
                            }
                        /> */}

                {/* FAB for adding transaction */}
                <Portal>
                    <FAB
                        icon="plus"
                        style={[styles.fab, { backgroundColor: themeColors.text }]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            addSheetRef.current?.expand();
                        }}
                        color={themeColors.background}
                    />
                </Portal>

                {/* Transaction Detail Bottom Sheet */}
                <BottomSheet
                    ref={detailSheetRef}
                    snapPoints={['75%']}
                    enablePanDownToClose
                    backdropComponent={renderBackdrop}
                    backgroundStyle={{ backgroundColor: themeColors.card }}
                    onChange={(index) => {
                        if (index === -1) {
                            setSelectedTransaction(null);
                        }
                    }}
                >
                    <View style={styles.sheetHeader}>
                        <Text variant="headlineSmall" style={{ color: themeColors.text, fontWeight: '600' }}>
                            Transaction Details
                        </Text>
                        <TouchableOpacity onPress={() => detailSheetRef.current?.close()}>
                            <MaterialIcons name="close" size={ICON_SIZE.lg} color={themeColors.icon} />
                        </TouchableOpacity>
                    </View>

                    {selectedTransaction && (
                        <BottomSheetScrollView style={styles.sheetBody}>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Receiver</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                    {selectedTransaction.receiver}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Amount</Text>
                                <Text style={[styles.detailValue, { color: themeColors.error }]}>
                                    ₹{selectedTransaction.amount}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Reference</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                    {selectedTransaction.reference}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Date & Time</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                    {format(new Date(selectedTransaction.timestamp), 'dd MMM yyyy, hh:mm a')}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Bank</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                    {selectedTransaction.bankName}
                                </Text>
                            </View>
                            <View style={styles.detailRow}>
                                <Text style={[styles.detailLabel, { color: themeColors.icon }]}>Account</Text>
                                <Text style={[styles.detailValue, { color: themeColors.text }]}>
                                    {selectedTransaction.accountNo}
                                </Text>
                            </View>
                            <View style={[styles.rawMessageContainer, { backgroundColor: themeColors.background }]}>
                                <Text style={[styles.rawMessageLabel, { color: themeColors.icon }]}>
                                    Raw Message
                                </Text>
                                <Text style={[styles.rawMessageText, { color: themeColors.text }]}>
                                    {selectedTransaction.rawMessage}
                                </Text>
                            </View>
                        </BottomSheetScrollView>
                    )}
                </BottomSheet>

                {/* Add Transaction Bottom Sheet */}
                <BottomSheet
                    ref={addSheetRef}
                    index={-1}
                    snapPoints={['55%']}
                    enablePanDownToClose
                    onChange={handleAddSheetChange}
                    backdropComponent={renderBackdrop}
                    backgroundStyle={{ backgroundColor: themeColors.card }}
                >
                    <View style={styles.sheetHeader}>
                        <Text variant="headlineSmall" style={{ color: themeColors.text, fontWeight: '600' }}>
                            Add Transaction
                        </Text>
                        <TouchableOpacity onPress={() => addSheetRef.current?.close()}>
                            <MaterialIcons name="close" size={ICON_SIZE.lg} color={themeColors.icon} />
                        </TouchableOpacity>
                    </View>

                    <BottomSheetScrollView style={styles.sheetBody}>
                        <View style={styles.inputGroup}>
                            <CustomInput
                                label="Receiver Name"
                                placeholder="e.g., Swiggy, Amazon"
                                value={newTransaction.receiver}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, receiver: text })}
                                icon="person"
                            />
                            <CustomInput
                                label="Amount"
                                placeholder="e.g., 500"
                                value={newTransaction.amount}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                                keyboardType="numeric"
                                icon="currency-rupee"
                            />
                            <CustomInput
                                label="Reference (Optional)"
                                placeholder="e.g., Order #12345"
                                value={newTransaction.reference}
                                onChangeText={(text) => setNewTransaction({ ...newTransaction, reference: text })}
                                icon="receipt"
                            />
                        </View>

                        <CustomButton
                            title="Add Transaction"
                            onPress={handleAddTransaction}
                            variant="secondary"
                            icon="add"
                        />
                    </BottomSheetScrollView>
                </BottomSheet>
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
    customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    backButton: {
        width: ICON_SIZE.xxl,
        height: ICON_SIZE.xxl,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: SPACING.screenPadding,
        paddingTop: SPACING.sm,
        paddingBottom: SPACING.xs,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SPACING.md,
        paddingVertical: SPACING.sm,
        borderRadius: RADIUS.md,
        gap: SPACING.sm,
    },
    searchInput: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontFamily: FontFamily.regular,
        paddingVertical: 3,
    },
    statsCard: {
        flexDirection: 'row',
        marginHorizontal: SPACING.screenPadding,
        marginVertical: SPACING.sm,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        alignItems: 'center',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '700',
        fontFamily: FontFamily.bold,
    },
    statLabel: {
        fontSize: FONT_SIZE.xs,
        marginTop: 2,
        fontFamily: FontFamily.regular,
    },
    statDivider: {
        width: 1,
        height: 28,
    },
    listContent: {
        paddingHorizontal: SPACING.screenPadding,
        paddingBottom: SPACING.xxl * 2,
    },
    groupContainer: {
        marginBottom: SPACING.lg,
    },
    dateHeader: {
        fontWeight: '600',
        marginBottom: SPACING.md,
        marginTop: SPACING.sm,
        fontSize: FONT_SIZE.lg,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
    },
    transactionLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: SPACING.md,
    },
    iconCircle: {
        width: ICON_SIZE.xxxl,
        height: ICON_SIZE.xxxl,
        borderRadius: RADIUS.rounded,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionInfo: {
        flex: 1,
        gap: SPACING.xs,
    },
    receiver: {
        fontWeight: '600',
        fontSize: FONT_SIZE.lg,
    },
    time: {
        fontSize: FONT_SIZE.sm,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.xs,
        marginTop: SPACING.xs / 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.xs,
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '500',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs,
        borderRadius: RADIUS.sm,
        marginTop: SPACING.xs / 2,
    },
    categoryText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
    transactionRight: {
        alignItems: 'flex-end',
        marginLeft: SPACING.sm,
    },
    amount: {
        fontWeight: '700',
        fontSize: FONT_SIZE.xxl,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: SPACING.xxl * 2,
        gap: SPACING.md,
    },
    emptyText: {
        marginTop: SPACING.sm,
        fontSize: FONT_SIZE.lg,
    },
    fab: {
        position: 'absolute',
        right: SPACING.md,
        bottom: SPACING.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: RADIUS.xl,
        borderTopRightRadius: RADIUS.xl,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalBody: {
        padding: SPACING.md,
    },
    detailRow: {
        marginBottom: SPACING.md,
    },
    detailLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: SPACING.xs / 2,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '500',
    },
    rawMessageContainer: {
        marginTop: SPACING.md,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
    },
    rawMessageLabel: {
        fontSize: FONT_SIZE.sm,
        fontWeight: '600',
        marginBottom: SPACING.sm,
        textTransform: 'uppercase',
    },
    rawMessageText: {
        fontSize: FONT_SIZE.md,
        lineHeight: FONT_SIZE.md * 1.5,
    },
    inputGroup: {
        marginBottom: SPACING.md,
    },
    inputLabel: {
        fontSize: FONT_SIZE.md,
        fontWeight: '600',
        marginBottom: SPACING.xs,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.sm,
        gap: SPACING.sm,
    },
    filterChip: {
    },
    filterChipText: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FontFamily.medium,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sheetBody: {
        padding: SPACING.screenPadding,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
