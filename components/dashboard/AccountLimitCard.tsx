import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

interface AccountLimitCardProps {
    name: string;
    bankName: string;
    dailyTotal: number;
    yesterdayTotal: number;
    upiLimit: number;
    onPress?: () => void;
}

export const AccountLimitCard: React.FC<AccountLimitCardProps> = ({
    name,
    bankName,
    dailyTotal,
    yesterdayTotal,
    upiLimit,
}) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const progress = upiLimit > 0 ? Math.min(dailyTotal / upiLimit, 1) : 0;
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

    // Calculate comparison with yesterday
    const difference = dailyTotal - yesterdayTotal;
    const isLower = difference < 0;
    const percentChange = yesterdayTotal > 0
        ? Math.abs((difference / yesterdayTotal) * 100).toFixed(0)
        : dailyTotal > 0 ? '100' : '0';

    return (
        <View style={[styles.card, { backgroundColor: themeColors.card, ...Elevation.md }]}>
            <View style={styles.cardHeader}>
                <View style={styles.cardTitleContainer}>
                    <Text variant="titleMedium" style={[styles.accountName, { color: themeColors.text }]}>
                        {name}
                    </Text>
                    <Text variant="bodySmall" style={[styles.bankName, { color: themeColors.icon }]}>
                        {bankName}
                    </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                    <Text variant="labelSmall" style={[styles.statusText, { color: statusColor }]}>
                        {statusText}
                    </Text>
                </View>
            </View>

            <View style={styles.amountRow}>
                <View style={styles.amountContainer}>
                    <Text variant="headlineSmall" style={[styles.amount, { color: themeColors.text }]}>
                        ₹{dailyTotal.toLocaleString('en-IN')}
                    </Text>
                    <Text variant="bodySmall" style={{ color: themeColors.icon }}>
                        of ₹{upiLimit.toLocaleString('en-IN')} limit
                    </Text>
                </View>

                {/* Yesterday comparison */}
                <View style={[styles.comparisonBadge, { backgroundColor: isLower ? themeColors.success + '15' : themeColors.error + '15' }]}>
                    <MaterialIcons
                        name={isLower ? 'trending-down' : 'trending-up'}
                        size={16}
                        color={isLower ? themeColors.success : themeColors.error}
                    />
                    <Text style={[styles.comparisonText, { color: isLower ? themeColors.success : themeColors.error }]}>
                        {percentChange}%
                    </Text>
                </View>
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
                    {(progress * 100).toFixed(0)}% used today
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        marginBottom: Spacing.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.sm,
    },
    cardTitleContainer: {
        flex: 1,
    },
    accountName: {
        fontWeight: '600',
    },
    bankName: {
        opacity: 0.7,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    statusText: {
        fontWeight: '600',
        fontSize: 10,
        textTransform: 'uppercase',
    },
    amountRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    amountContainer: {
        flex: 1,
    },
    amount: {
        fontWeight: '700',
    },
    comparisonBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
        gap: 4,
    },
    comparisonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressContainer: {
        marginTop: Spacing.xs,
    },
    progressTrack: {
        height: 6,
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
        fontSize: 11,
    },
});
