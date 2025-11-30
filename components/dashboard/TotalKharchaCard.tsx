import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
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

            <View style={styles.refreshRow}>
                <View style={styles.refreshIcon}>
                    <MaterialIcons name="sync" size={16} color="rgba(255, 255, 255, 0.7)" />
                </View>
                <Text style={styles.refreshText}>
                    Last updated: {formatRelativeTime(lastRefreshTime)}
                </Text>
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
    refreshRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    refreshIcon: {
        opacity: 0.7,
    },
    refreshText: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: 12,
    },
});
