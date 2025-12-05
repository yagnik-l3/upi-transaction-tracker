import { COMPONENT_SIZE, FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, Elevation, FontFamily } from '@/constants/theme';
import { CARD_COLORS, CARD_ICONS, SelectAccount } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as accountQueries from '../../db/queries/account';

export default function EditAccountScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();
    const { accountId } = useLocalSearchParams();

    const [account, setAccount] = useState<SelectAccount | null>(null);
    const [friendlyName, setFriendlyName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [upiLimit, setUpiLimit] = useState('');
    const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);
    const [selectedIcon, setSelectedIcon] = useState(CARD_ICONS[0].value);
    const [loading, setLoading] = useState(true);

    const themeColors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadAccount();
    }, [accountId]);

    const loadAccount = async () => {
        if (!accountId) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Account not found',
            });
            router.back();
            return;
        }

        try {
            const acc = await accountQueries.findOne_And({ id: parseInt(accountId as string) });
            if (acc) {
                setAccount(acc);
                setFriendlyName(acc.name);
                setAccountNo(acc.accountNo);
                setUpiLimit(acc.upiLimit.toString());
                setSelectedColor(acc.cardColor || CARD_COLORS[0].value);
                setSelectedIcon(acc.cardIcon || CARD_ICONS[0].value);
            } else {
                Toast.show({
                    type: 'error',
                    text1: 'Error',
                    text2: 'Account not found',
                });
                router.back();
            }
        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load account',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAccount = async () => {
        if (!friendlyName || !upiLimit) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill all required fields',
            });
            return;
        }

        if (!account) return;

        try {
            await accountQueries.update({
                id: account.id,
                name: friendlyName,
                accountNo: accountNo,
                upiLimit: parseFloat(upiLimit),
                cardColor: selectedColor,
                cardIcon: selectedIcon,
            });

            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Account updated successfully',
            });
            router.back();
        } catch (e) {
            console.error(e);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to update account',
            });
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'Are you sure you want to delete this account? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        if (!account) return;
                        try {
                            await accountQueries.remove({ id: account.id });
                            Toast.show({
                                type: 'success',
                                text1: 'Success',
                                text2: 'Account deleted successfully',
                            });
                            router.back();
                        } catch (e) {
                            console.error(e);
                            Toast.show({
                                type: 'error',
                                text1: 'Error',
                                text2: 'Failed to delete account',
                            });
                        }
                    },
                },
            ]
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
                <View style={styles.loadingContainer}>
                    <Text style={{ color: themeColors.text }}>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: themeColors.background }]}>
            {/* Custom Header */}
            <View style={styles.customHeader}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={[styles.backButton, { backgroundColor: themeColors.card }]}
                >
                    <MaterialIcons name="arrow-back" size={ICON_SIZE.lg} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerTextContainer}>
                    <Text variant="titleLarge" style={[styles.headerTitle, { color: themeColors.text }]}>
                        Edit Account
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={handleDeleteAccount}
                    style={[styles.deleteButton, { backgroundColor: themeColors.error + '15' }]}
                >
                    <MaterialIcons name="delete" size={ICON_SIZE.lg} color={themeColors.error} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: themeColors.icon }]}>
                    Update your account details
                </Text>

                <Card style={[styles.card, { backgroundColor: themeColors.card, ...Elevation.md }]}>
                    <Card.Content>
                        {/* Bank Name (Read-only) */}
                        <View style={styles.readOnlyField}>
                            <Text variant="labelMedium" style={[styles.readOnlyLabel, { color: themeColors.icon }]}>
                                Bank
                            </Text>
                            <Text variant="bodyLarge" style={[styles.readOnlyValue, { color: themeColors.text }]}>
                                {account?.bankName}
                            </Text>
                        </View>

                        <TextInput
                            label="Friendly Name"
                            value={friendlyName}
                            onChangeText={setFriendlyName}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account-circle" size={ICON_SIZE.md} />}
                            outlineColor={themeColors.cardBorder}
                            activeOutlineColor={themeColors.text}
                        />
                        <TextInput
                            label="Last 4 Digits of Account Number"
                            value={accountNo}
                            onChangeText={setAccountNo}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="credit-card" size={ICON_SIZE.md} />}
                            outlineColor={themeColors.cardBorder}
                            activeOutlineColor={themeColors.text}
                        />
                        <TextInput
                            label="Daily UPI Limit"
                            value={upiLimit}
                            onChangeText={setUpiLimit}
                            keyboardType="numeric"
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="currency-inr" size={ICON_SIZE.md} />}
                            outlineColor={themeColors.cardBorder}
                            activeOutlineColor={themeColors.text}
                        />

                        {/* Card Color Selection */}
                        <Text variant="labelLarge" style={[styles.sectionLabel, { color: themeColors.text }]}>
                            Card Color
                        </Text>
                        <View style={styles.colorGrid}>
                            {CARD_COLORS.map((color) => (
                                <TouchableOpacity
                                    key={color.value}
                                    onPress={() => setSelectedColor(color.value)}
                                    style={[
                                        styles.colorOption,
                                        { backgroundColor: color.value },
                                        selectedColor === color.value && styles.colorOptionSelected,
                                    ]}
                                >
                                    {selectedColor === color.value && (
                                        <MaterialIcons name="check" size={ICON_SIZE.md} color="#fff" />
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Card Icon Selection */}
                        <Text variant="labelLarge" style={[styles.sectionLabel, { color: themeColors.text }]}>
                            Card Icon
                        </Text>
                        <View style={styles.iconGrid}>
                            {CARD_ICONS.map((icon) => (
                                <TouchableOpacity
                                    key={icon.value}
                                    onPress={() => setSelectedIcon(icon.value)}
                                    style={[
                                        styles.iconOption,
                                        { backgroundColor: themeColors.background },
                                        selectedIcon === icon.value && { backgroundColor: selectedColor, borderColor: selectedColor },
                                    ]}
                                >
                                    <MaterialIcons
                                        name={icon.value as keyof typeof MaterialIcons.glyphMap}
                                        size={ICON_SIZE.lg}
                                        color={selectedIcon === icon.value ? '#fff' : themeColors.icon}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Preview Card */}
                        <Text variant="labelLarge" style={[styles.sectionLabel, { color: themeColors.text }]}>
                            Preview
                        </Text>
                        <View style={[styles.previewCard, { backgroundColor: themeColors.background, borderLeftColor: selectedColor }]}>
                            <View style={[styles.previewIconContainer, { backgroundColor: selectedColor + '15' }]}>
                                <MaterialIcons
                                    name={selectedIcon as keyof typeof MaterialIcons.glyphMap}
                                    size={ICON_SIZE.lg}
                                    color={selectedColor}
                                />
                            </View>
                            <View style={styles.previewTextContainer}>
                                <Text style={[styles.previewName, { color: themeColors.text }]}>
                                    {friendlyName || 'Account Name'}
                                </Text>
                                <Text style={[styles.previewBank, { color: themeColors.icon }]}>
                                    {account?.bankName}
                                </Text>
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleUpdateAccount}
                            style={[styles.button, { backgroundColor: selectedColor }]}
                            labelStyle={styles.buttonLabel}
                            icon="check"
                        >
                            Save Changes
                        </Button>
                    </Card.Content>
                </Card>

                <View style={styles.spacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    deleteButton: {
        width: ICON_SIZE.xxl,
        height: ICON_SIZE.xxl,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTextContainer: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: SPACING.screenPadding,
    },
    headerTitle: {
        fontWeight: '700',
        fontFamily: FontFamily.bold,
        fontSize: FONT_SIZE.xl,
    },
    headerSubtitle: {
        opacity: 0.8,
        marginBottom: SPACING.md,
        fontSize: FONT_SIZE.md,
    },
    card: {
        marginBottom: SPACING.md,
        borderRadius: RADIUS.lg,
    },
    readOnlyField: {
        marginBottom: SPACING.md,
        paddingVertical: SPACING.sm,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    readOnlyLabel: {
        fontSize: FONT_SIZE.sm,
        marginBottom: SPACING.xs,
    },
    readOnlyValue: {
        fontWeight: '600',
        fontFamily: FontFamily.semiBold,
        fontSize: FONT_SIZE.lg,
    },
    input: {
        marginBottom: SPACING.md,
    },
    button: {
        marginTop: SPACING.md,
        borderRadius: RADIUS.md,
    },
    buttonLabel: {
        fontSize: FONT_SIZE.md,
        fontFamily: FontFamily.semiBold,
    },
    sectionLabel: {
        fontWeight: '600',
        marginBottom: SPACING.sm,
        marginTop: SPACING.sm,
        fontSize: FONT_SIZE.md,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    colorOption: {
        width: COMPONENT_SIZE.appIconSize,
        height: COMPONENT_SIZE.appIconSize,
        borderRadius: RADIUS.rounded,
        justifyContent: 'center',
        alignItems: 'center',
    },
    colorOptionSelected: {
        borderWidth: 3,
        borderColor: '#fff',
    },
    iconGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
    },
    iconOption: {
        width: COMPONENT_SIZE.avatarMd,
        height: COMPONENT_SIZE.avatarMd,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        gap: SPACING.md,
        marginBottom: SPACING.md,
        borderLeftWidth: 4,
    },
    previewIconContainer: {
        width: COMPONENT_SIZE.avatarMd,
        height: COMPONENT_SIZE.avatarMd,
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
    },
    previewTextContainer: {
        flex: 1,
    },
    previewName: {
        fontSize: FONT_SIZE.lg,
        fontWeight: '600',
        fontFamily: FontFamily.semiBold,
    },
    previewBank: {
        fontSize: FONT_SIZE.sm,
        marginTop: 2,
    },
    spacer: {
        height: SPACING.xl,
    },
});
