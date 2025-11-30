import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface TotalKharchaCardProps {
    totalToday: number;
    totalYesterday: number;
    cumulativeTotal: number;
}

const formatAmount = (amount: number): string => {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
};

export const TotalKharchaCard: React.FC<TotalKharchaCardProps> = ({
    totalToday,
    totalYesterday,
    cumulativeTotal,
}) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const difference = totalToday - totalYesterday;
    const isLower = difference < 0;
    const percentChange = totalYesterday > 0
        ? Math.abs((difference / totalYesterday) * 100).toFixed(0)
        : totalToday > 0 ? '100' : '0';

    return (
        <View style={[styles.card, { backgroundColor: themeColors.primary }]}>
            <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                    {"Today's"} <Text style={styles.titleBold}>Kharcha</Text>
                </Text>
            </View>

            <View style={styles.amountContainer}>
                <Text variant="displaySmall" style={styles.amount}>
                    {formatAmount(totalToday)}
                </Text>
                <View style={[styles.trendBadge, { backgroundColor: isLower ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)' }]}>
                    <MaterialIcons
                        name={isLower ? 'arrow-downward' : 'arrow-upward'}
                        size={18}
                        color={isLower ? '#10b981' : '#ef4444'}
                    />
                    <Text style={[styles.trendText, { color: isLower ? '#10b981' : '#ef4444' }]}>
                        {percentChange}%
                    </Text>
                </View>
            </View>

            <Text style={styles.comparisonText}>
                {isLower ? 'Lower' : 'Higher'} than yesterday ({formatAmount(totalYesterday)})
            </Text>

            <View style={styles.divider} />

            <View style={styles.cumulativeRow}>
                <View style={styles.cumulativeIcon}>
                    <MaterialIcons name="account-balance-wallet" size={20} color="#fff" />
                </View>
                <View style={styles.cumulativeInfo}>
                    <Text style={styles.cumulativeLabel}>Total Cumulative Spending</Text>
                    <Text style={styles.cumulativeAmount}>{formatAmount(cumulativeTotal)}</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
        ...Elevation.lg,
    },
    header: {
        marginBottom: Spacing.sm,
    },
    title: {
        color: 'rgba(255, 255, 255, 0.8)',
        fontWeight: '400',
    },
    titleBold: {
        fontWeight: '700',
        color: '#fff',
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing.xs,
    },
    amount: {
        color: '#fff',
        fontWeight: '700',
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: 4,
    },
    trendText: {
        fontSize: 14,
        fontWeight: '700',
    },
    comparisonText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 13,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        marginVertical: Spacing.md,
    },
    cumulativeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    cumulativeIcon: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.full,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cumulativeInfo: {
        flex: 1,
    },
    cumulativeLabel: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
    cumulativeAmount: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
