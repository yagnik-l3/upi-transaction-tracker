import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import * as transactionQueries from '@/db/queries/transaction';
import { SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { format } from 'date-fns';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Searchbar, Text } from 'react-native-paper';

export default function TransactionsScreen() {
    const colorScheme = useColorScheme();
    const { accountId } = useLocalSearchParams();
    const [transactions, setTransactions] = useState<SelectTransaction[]>([]);
    const [filteredTransactions, setFilteredTransactions] = useState<SelectTransaction[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (accountId) {
            loadTransactions();
        }
    }, [accountId]);

    const loadTransactions = async () => {
        const txs = await transactionQueries.findAll({ accountId: Number(accountId) });
        setTransactions(txs);
        setFilteredTransactions(txs);
    };

    const onChangeSearch = (query: string) => {
        setSearchQuery(query);
        if (!query) {
            setFilteredTransactions(transactions);
            return;
        }
        const lower = query.toLowerCase();
        const filtered = transactions.filter(t =>
            t.receiver.toLowerCase().includes(lower) ||
            t.reference.includes(lower) ||
            t.amount.toString().includes(lower)
        );
        setFilteredTransactions(filtered);
    };

    const themeColors = Colors[colorScheme ?? 'light'];

    const renderItem = ({ item }: { item: SelectTransaction }) => (
        <View style={[styles.listItem, { backgroundColor: themeColors.card, ...Elevation.sm }]}>
            <View style={styles.listItemContent}>
                <View style={styles.transactionHeader}>
                    <View style={[styles.iconContainer, { backgroundColor: themeColors.error + '15' }]}>
                        <Text style={[styles.iconText, { color: themeColors.error }]}>₹</Text>
                    </View>
                    <View style={styles.transactionDetails}>
                        <Text variant="titleMedium" style={[styles.receiver, { color: themeColors.text }]}>
                            {item.receiver}
                        </Text>
                        <Text variant="bodySmall" style={[styles.date, { color: themeColors.icon }]}>
                            {format(new Date(item.timestamp), 'dd MMM yyyy, hh:mm a')}
                        </Text>
                    </View>
                </View>
                <View style={styles.amountSection}>
                    <Text variant="titleLarge" style={[styles.transactionAmount, { color: themeColors.error }]}>
                        -₹{item.amount}
                    </Text>
                    <Text variant="bodySmall" style={[styles.reference, { color: themeColors.icon }]}>
                        Ref: {item.reference}
                    </Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: themeColors.background }]}>
            <Searchbar
                placeholder="Search transactions"
                onChangeText={onChangeSearch}
                value={searchQuery}
                style={[styles.searchBar, { backgroundColor: themeColors.card, ...Elevation.sm }]}
                iconColor={themeColors.icon}
                inputStyle={{ color: themeColors.text }}
            />
            <FlatList
                data={filteredTransactions}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text variant="bodyLarge" style={{ color: themeColors.icon }}>
                            No transactions found.
                        </Text>
                    </View>
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchBar: {
        margin: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    listContent: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    listItem: {
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
    },
    listItemContent: {
        gap: Spacing.md,
    },
    transactionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.full,
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconText: {
        fontSize: 24,
        fontWeight: '700',
    },
    transactionDetails: {
        flex: 1,
    },
    receiver: {
        fontWeight: '600',
        marginBottom: Spacing.xs / 2,
    },
    date: {
        opacity: 0.7,
    },
    amountSection: {
        alignItems: 'flex-end',
    },
    transactionAmount: {
        fontWeight: '700',
        marginBottom: Spacing.xs / 2,
    },
    reference: {
        opacity: 0.7,
    },
    separator: {
        height: Spacing.sm,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: Spacing.xxl,
    }
});
