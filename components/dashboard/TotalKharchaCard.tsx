import { BorderRadius, Colors, FontFamily, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface TotalKharchaCardProps {
    totalToday: number;
    totalYesterday: number;
    lastRefreshTime: number | null;
}

const formatAmount = (amount: number): string => {
    if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)}L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString('en-IN')}`;
};

const formatRelativeTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';

    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const TotalKharchaCard: React.FC<TotalKharchaCardProps> = ({
    totalToday,
    totalYesterday,
    lastRefreshTime,
}) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const difference = totalToday - totalYesterday;
    const isLower = difference <= 0;
    const percentChange = totalYesterday > 0
        ? Math.abs((difference / totalYesterday) * 100).toFixed(0)
        : totalToday > 0 ? '100' : '0';

    return (
        <View style={[styles.card, { backgroundColor: themeColors.text }]}>
            <View style={styles.header}>
                <Text variant="titleMedium" style={styles.title}>
                    {"Today's"} <Text style={styles.titleBold}>Spendings</Text>
                </Text>
            </View>

            <View style={styles.amountContainer}>
                <Text variant="displaySmall" style={styles.amount}>
                    {formatAmount(totalToday)}
                </Text>
                <View style={[styles.trendBadge, { backgroundColor: isLower ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)' }]}>
                    <MaterialIcons
                        name={isLower ? 'trending-down' : 'trending-up'}
                        size={16}
                        color={isLower ? themeColors.success : themeColors.error}
                    />
                    <Text style={[styles.trendText, { color: isLower ? themeColors.success : themeColors.error }]}>
                        {percentChange}%
                    </Text>
                </View>
            </View>

            <Text style={styles.comparisonText}>
                {isLower ? 'Lower' : 'Higher'} than yesterday ({formatAmount(totalYesterday)})
            </Text>

            <View style={styles.divider} />

            <View style={styles.refreshRow}>
                <MaterialIcons name="schedule" size={14} color="rgba(255, 255, 255, 0.5)" />
                <Text style={styles.refreshText}>
                    {/* Last updated: {formatRelativeTime(lastRefreshTime)} */}
                    Last updated: {format(lastRefreshTime ?? Date.now(), 'yyyy-MM-dd hh:mm:ss a')}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    header: {
        marginBottom: Spacing.xs,
    },
    title: {
        color: 'rgba(255, 255, 255, 0.6)',
        fontWeight: '400',
        fontSize: 14,
    },
    titleBold: {
        fontWeight: '700',
        fontFamily: FontFamily.bold,
        color: 'rgba(255, 255, 255, 0.6)',
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
        fontFamily: FontFamily.extraBold,
        fontSize: 36,
    },
    trendBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.full,
        gap: 2,
    },
    trendText: {
        fontSize: 13,
        fontWeight: '600',
        fontFamily: FontFamily.semiBold,
    },
    comparisonText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 13,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginVertical: Spacing.sm,
    },
    refreshRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
    },
    refreshText: {
        color: 'rgba(255, 255, 255, 0.5)',
        fontSize: 12,
    },
});
