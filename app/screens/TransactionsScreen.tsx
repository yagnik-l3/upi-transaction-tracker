import { BorderRadius, Colors, Spacing } from '@/constants/theme';
import * as transactionQueries from '@/db/queries/transaction';
import { InsertTransaction, SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { endOfDay, format, isToday, isYesterday, startOfDay, subDays } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, LayoutAnimation, Platform, StyleSheet, TextInput, TouchableOpacity, UIManager, View } from 'react-native';
import { Chip, FAB, Portal, Searchbar, Text } from 'react-native-paper';
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
type CategoryFilter = 'all' | 'Food & Dining' | 'Personal Care & Beauty' | 'Miscellaneous';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const navigation = useNavigation();
    const { accountId, accountNo, bankName } = useLocalSearchParams();
    const [transactions, setTransactions] = useState<SelectTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<SelectTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState<SelectTransaction | null>(null);
    const [dateFilter, setDateFilter] = useState<FilterType>('all');
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');

    // Bottom sheet refs
    const detailSheetRef = useRef<BottomSheet>(null);
    const addSheetRef = useRef<BottomSheet>(null);
    const filterSheetRef = useRef<BottomSheet>(null);

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

    // Set header with account number
    useEffect(() => {
        if (accountNo) {
            const lastFour = String(accountNo).slice(-4);
            navigation.setOptions({
                title: `Transactions \u2022 ****${lastFour}`,
                headerTitleStyle: {
                    fontSize: 16,
                    fontWeight: '600',
                },
            });
        }
    }, [accountNo, navigation]);

    useEffect(() => {
        loadTransactions();
    }, [accountNo, bankName]);

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
    }, [transactions, searchQuery, dateFilter, categoryFilter]);

    const loadTransactions = async () => {
        const txs = await transactionQueries.findAll({
            accountNo: accountNo as string,
            bankName: bankName as string
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

        // Date filter
        const now = new Date();
        if (dateFilter === 'today') {
            const todayStart = startOfDay(now).getTime();
            const todayEnd = endOfDay(now).getTime();
            filtered = filtered.filter(t => t.timestamp >= todayStart && t.timestamp <= todayEnd);
        } else if (dateFilter === 'week') {
            const weekStart = subDays(now, 7).getTime();
            filtered = filtered.filter(t => t.timestamp >= weekStart);
        } else if (dateFilter === 'month') {
            const monthStart = subDays(now, 30).getTime();
            filtered = filtered.filter(t => t.timestamp >= monthStart);
        }

        // Category filter
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(t => getCategoryFromReceiver(t.receiver) === categoryFilter);
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

    const handleTransactionPress = useCallback((transaction: SelectTransaction) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedTransaction(transaction);
        detailSheetRef.current?.expand();
    }, []);

    const handleAddTransaction = useCallback(async () => {
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to add transaction',
                position: 'bottom',
            });
        }
    }, [newTransaction, bankName, accountNo]);

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
                        <MaterialIcons name="account-balance-wallet" size={24} color={categoryColor} />
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
                                <MaterialIcons name="credit-card" size={12} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>Debit</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                                <MaterialIcons name="payment" size={12} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>UPI</Text>
                            </View>
                            <View style={[styles.badge, { backgroundColor: themeColors.card, borderColor: themeColors.cardBorder }]}>
                                <MaterialIcons name="receipt" size={12} color={themeColors.icon} />
                                <Text style={[styles.badgeText, { color: themeColors.icon }]}>A/C {item.reference}</Text>
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
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            {/* Header with Search */}
            <View style={[styles.header, { backgroundColor: themeColors.background }]}>
                <Searchbar
                    placeholder="Search here..."
                    onChangeText={onChangeSearch}
                    value={searchQuery}
                    style={[styles.searchBar, { backgroundColor: themeColors.card }]}
                    iconColor={themeColors.primary}
                    inputStyle={{ color: themeColors.text }}
                    elevation={0}
                />
            </View>

            {/* Transactions List */}
            <FlatList
                data={groupedTransactions}
                keyExtractor={(item) => item.date}
                renderItem={renderGroup}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <MaterialIcons name="receipt-long" size={64} color={themeColors.icon} />
                        <Text variant="bodyLarge" style={[styles.emptyText, { color: themeColors.icon }]}>
                            No transactions found
                        </Text>
                    </View>
                }
            />

            {/* Filter Chips */}
            <View style={styles.filterContainer}>
                <Chip
                    selected={dateFilter === 'all'}
                    onPress={() => setDateFilter('all')}
                    style={styles.filterChip}
                    textStyle={styles.filterChipText}
                >
                    All
                </Chip>
                <Chip
                    selected={dateFilter === 'today'}
                    onPress={() => setDateFilter('today')}
                    style={styles.filterChip}
                    textStyle={styles.filterChipText}
                >
                    Today
                </Chip>
                <Chip
                    selected={dateFilter === 'week'}
                    onPress={() => setDateFilter('week')}
                    style={styles.filterChip}
                    textStyle={styles.filterChipText}
                >
                    Week
                </Chip>
                <Chip
                    selected={dateFilter === 'month'}
                    onPress={() => setDateFilter('month')}
                    style={styles.filterChip}
                    textStyle={styles.filterChipText}
                >
                    Month
                </Chip>
            </View>

            {/* FAB for adding transaction */}
            <Portal>
                <FAB
                    icon="plus"
                    style={[styles.fab, { backgroundColor: themeColors.primary }]}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        addSheetRef.current?.expand();
                    }}
                    color="#fff"
                />
            </Portal>

            {/* Transaction Detail Bottom Sheet */}
            <BottomSheet
                ref={detailSheetRef}
                index={-1}
                snapPoints={['75%']}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: themeColors.card }}
            >
                <View style={styles.sheetHeader}>
                    <Text variant="headlineSmall" style={{ color: themeColors.text, fontWeight: '600' }}>
                        Transaction Details
                    </Text>
                    <TouchableOpacity onPress={() => detailSheetRef.current?.close()}>
                        <MaterialIcons name="close" size={24} color={themeColors.icon} />
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
                snapPoints={['65%']}
                enablePanDownToClose
                backdropComponent={renderBackdrop}
                backgroundStyle={{ backgroundColor: themeColors.card }}
            >
                <View style={styles.sheetHeader}>
                    <Text variant="headlineSmall" style={{ color: themeColors.text, fontWeight: '600' }}>
                        Add Transaction
                    </Text>
                    <TouchableOpacity onPress={() => addSheetRef.current?.close()}>
                        <MaterialIcons name="close" size={24} color={themeColors.icon} />
                    </TouchableOpacity>
                </View>

                <BottomSheetScrollView style={styles.sheetBody}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: themeColors.icon }]}>Receiver Name</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: themeColors.background,
                                color: themeColors.text,
                                borderColor: themeColors.cardBorder
                            }]}
                            placeholder="Enter receiver name"
                            placeholderTextColor={themeColors.icon}
                            value={newTransaction.receiver}
                            onChangeText={(text) => setNewTransaction({ ...newTransaction, receiver: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: themeColors.icon }]}>Amount</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: themeColors.background,
                                color: themeColors.text,
                                borderColor: themeColors.cardBorder
                            }]}
                            placeholder="Enter amount"
                            placeholderTextColor={themeColors.icon}
                            keyboardType="decimal-pad"
                            value={newTransaction.amount}
                            onChangeText={(text) => setNewTransaction({ ...newTransaction, amount: text })}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.inputLabel, { color: themeColors.icon }]}>Reference (Optional)</Text>
                        <TextInput
                            style={[styles.input, {
                                backgroundColor: themeColors.background,
                                color: themeColors.text,
                                borderColor: themeColors.cardBorder
                            }]}
                            placeholder="Enter reference"
                            placeholderTextColor={themeColors.icon}
                            value={newTransaction.reference}
                            onChangeText={(text) => setNewTransaction({ ...newTransaction, reference: text })}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.addButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleAddTransaction}
                    >
                        <Text style={styles.addButtonText}>Add Transaction</Text>
                    </TouchableOpacity>
                </BottomSheetScrollView>
            </BottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: Spacing.sm,
    },
    searchBar: {
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        borderRadius: BorderRadius.lg,
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.xxl * 2,
    },
    groupContainer: {
        marginBottom: Spacing.lg,
    },
    dateHeader: {
        fontWeight: '600',
        marginBottom: Spacing.md,
        marginTop: Spacing.sm,
    },
    transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.sm,
    },
    transactionLeft: {
        flexDirection: 'row',
        flex: 1,
        gap: Spacing.md,
    },
    iconCircle: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    transactionInfo: {
        flex: 1,
        gap: Spacing.xs,
    },
    receiver: {
        fontWeight: '600',
    },
    time: {
        fontSize: 12,
    },
    badges: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.xs,
        marginTop: Spacing.xs / 2,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        borderWidth: 1,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '500',
    },
    categoryBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: Spacing.sm,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
        marginTop: Spacing.xs / 2,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
    },
    transactionRight: {
        alignItems: 'flex-end',
        marginLeft: Spacing.sm,
    },
    amount: {
        fontWeight: '700',
        fontSize: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: Spacing.xxl * 2,
        gap: Spacing.md,
    },
    emptyText: {
        marginTop: Spacing.sm,
    },
    fab: {
        position: 'absolute',
        right: Spacing.md,
        bottom: Spacing.md,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: BorderRadius.xl,
        borderTopRightRadius: BorderRadius.xl,
        maxHeight: '80%',
        minHeight: '50%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    modalBody: {
        padding: Spacing.md,
    },
    detailRow: {
        marginBottom: Spacing.md,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.xs / 2,
        textTransform: 'uppercase',
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '500',
    },
    rawMessageContainer: {
        marginTop: Spacing.md,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    rawMessageLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: Spacing.sm,
        textTransform: 'uppercase',
    },
    rawMessageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    inputGroup: {
        marginBottom: Spacing.md,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: Spacing.xs,
    },
    input: {
        borderWidth: 1,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        fontSize: 16,
    },
    addButton: {
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm,
        gap: Spacing.sm,
        position: 'absolute',
        top: 70,
        left: 0,
        right: 0,
        zIndex: 10,
    },
    filterChip: {
        height: 32,
    },
    filterChipText: {
        fontSize: 12,
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    sheetBody: {
        padding: Spacing.md,
    },
});
