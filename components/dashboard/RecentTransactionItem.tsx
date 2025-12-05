import { FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, FontFamily } from '@/constants/theme';
import { SelectTransaction } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from 'react-native-paper';

interface RecentTransactionItemProps {
    transaction: SelectTransaction;
    onPress?: (transaction: SelectTransaction) => void;
}

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

const getCategoryIcon = (category: string): keyof typeof MaterialIcons.glyphMap => {
    switch (category) {
        case 'Food & Dining':
            return 'restaurant';
        case 'Personal Care & Beauty':
            return 'spa';
        default:
            return 'account-balance-wallet';
    }
};

export const RecentTransactionItem: React.FC<RecentTransactionItemProps> = ({
    transaction,
    onPress,
}) => {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const category = getCategoryFromReceiver(transaction.receiver);
    const categoryIcon = getCategoryIcon(category);

    const getCategoryColor = () => {
        switch (category) {
            case 'Food & Dining':
                return themeColors.warning;
            case 'Personal Care & Beauty':
                return themeColors.primary;
            default:
                return themeColors.icon;
        }
    };

    const categoryColor = getCategoryColor();

    return (
        <TouchableOpacity
            onPress={() => onPress?.(transaction)}
            style={[styles.container, { backgroundColor: themeColors.card }]}
            activeOpacity={0.7}
        >
            <View style={[styles.iconContainer, { backgroundColor: categoryColor + '20' }]}>
                <MaterialIcons name={categoryIcon} size={20} color={categoryColor} />
            </View>

            <View style={styles.infoContainer}>
                <Text variant="titleSmall" style={[styles.receiver, { color: themeColors.text }]} numberOfLines={1}>
                    {transaction.receiver}
                </Text>
                <Text variant="bodySmall" style={[styles.time, { color: themeColors.icon }]}>
                    {format(new Date(transaction.timestamp), 'hh:mm a')}
                </Text>
            </View>

            <View style={styles.amountContainer}>
                <Text variant="titleMedium" style={[styles.amount, { color: themeColors.error }]}>
                    -₹{transaction.amount.toLocaleString('en-IN')}
                </Text>
                <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '15' }]}>
                    <Text style={[styles.categoryText, { color: categoryColor }]}>{category}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        marginBottom: SPACING.sm,
        gap: SPACING.md,
    },
    iconContainer: {
        width: ICON_SIZE.xxl,
        height: ICON_SIZE.xxl,
        borderRadius: RADIUS.rounded,
        justifyContent: 'center',
        alignItems: 'center',
    },
    infoContainer: {
        flex: 1,
    },
    receiver: {
        fontWeight: '600',
        fontFamily: FontFamily.semiBold,
        marginBottom: 2,
        fontSize: FONT_SIZE.md,
    },
    time: {
        fontSize: FONT_SIZE.sm,
    },
    amountContainer: {
        alignItems: 'flex-end',
    },
    amount: {
        fontWeight: '700',
        fontFamily: FontFamily.bold,
        fontSize: FONT_SIZE.lg,
    },
    categoryBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: 2,
        borderRadius: RADIUS.sm,
        marginTop: SPACING.xs,
    },
    categoryText: {
        fontSize: FONT_SIZE.xs,
        fontWeight: '600',
    },
});
