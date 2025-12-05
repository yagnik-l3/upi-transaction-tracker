import { COMPONENT_SIZE, FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, Elevation, FontFamily } from '@/constants/theme';
import { CARD_COLORS, CARD_ICONS, SelectBank } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import * as accountQueries from '../../db/queries/account';
import * as bankQueries from '../../db/queries/bank';


export default function SetupScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();

    const [banks, setBanks] = useState<SelectBank[]>([]);
    const [selectedBank, setSelectedBank] = useState<SelectBank | null>(null);
    const [friendlyName, setFriendlyName] = useState('');
    const [accountNo, setAccountNo] = useState('');
    const [upiLimit, setUpiLimit] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);
    const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0].value);
    const [selectedIcon, setSelectedIcon] = useState(CARD_ICONS[0].value);


    const loadBanks = async () => {
        const b = await bankQueries.findAll({});
        setBanks(b);
    };

    const handleAddAccount = async () => {
        if (!selectedBank || !friendlyName || !upiLimit) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please fill all fields',
            });
            return;
        }

        try {
            await accountQueries.create({
                bankName: selectedBank.name,
                name: friendlyName,
                upiLimit: parseFloat(upiLimit),
                accountNo: accountNo,
                cardColor: selectedColor,
                cardIcon: selectedIcon,
            });

            setFriendlyName('');
            setUpiLimit('');
            setSelectedBank(null);
            Toast.show({
                type: 'success',
                text1: 'Success',
                text2: 'Account added successfully',
            });
            router.back();
        } catch (e) {
            Toast.show({
                type: "error",
                text1: "Error",
                text2: "Failed to add account",
            })
        }
    };

    const themeColors = Colors[colorScheme ?? 'light'];

    useEffect(() => {
        loadBanks();
    }, []);

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
                        Add Account
                    </Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: themeColors.icon }]}>
                    Select your bank and configure your daily UPI limit
                </Text>

                <Card style={[styles.card, { backgroundColor: themeColors.card, ...Elevation.md }]}>
                    <Card.Content>
                        <View style={styles.cardHeader}>
                            <IconButton icon="account-plus" size={ICON_SIZE.lg} iconColor={themeColors.text} />
                            <Text variant="titleLarge" style={[styles.cardTitle, { color: themeColors.text }]}>
                                Account Details
                            </Text>
                        </View>

                        <View style={styles.dropdownContainer}>
                            <Menu
                                visible={menuVisible}
                                onDismiss={() => setMenuVisible(false)}
                                anchor={
                                    <Button
                                        mode="outlined"
                                        onPress={() => setMenuVisible(true)}
                                        textColor={themeColors.text}
                                        style={[styles.selectButton, { borderColor: themeColors.cardBorder }]}
                                        icon="chevron-down"
                                        contentStyle={styles.selectButtonContent}
                                    >
                                        {selectedBank ? selectedBank.name : 'Select Bank'}
                                    </Button>
                                }
                            >
                                {banks.map((bank) => (
                                    <Menu.Item
                                        key={bank.id}
                                        onPress={() => {
                                            setSelectedBank(bank);
                                            setMenuVisible(false);
                                        }}
                                        title={bank.name}
                                    />
                                ))}
                            </Menu>
                        </View>

                        <TextInput
                            label="Friendly Name (e.g., Salary Account)"
                            value={friendlyName}
                            onChangeText={setFriendlyName}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account-circle" size={ICON_SIZE.md} />}
                            outlineColor={themeColors.cardBorder}
                            activeOutlineColor={themeColors.text}
                        />
                        <TextInput
                            label="Last 4 Digit of Account Number"
                            value={accountNo}
                            onChangeText={setAccountNo}
                            mode="outlined"
                            style={styles.input}
                            left={<TextInput.Icon icon="account-circle" size={ICON_SIZE.md} />}
                            outlineColor={themeColors.cardBorder}
                            activeOutlineColor={themeColors.text}
                        />
                        <TextInput
                            label="Daily UPI Limit (e.g., 100000)"
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
                        <View style={[styles.previewCard, { backgroundColor: themeColors.background }]}>
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
                                    {selectedBank?.name || 'Select Bank'}
                                </Text>
                            </View>
                        </View>

                        <Button
                            mode="contained"
                            onPress={handleAddAccount}
                            style={[styles.button, { backgroundColor: selectedColor }]}
                            labelStyle={styles.buttonLabel}
                            disabled={banks.length === 0}
                            icon="check"
                        >
                            Add Account
                        </Button>
                        {banks.length === 0 && (
                            <Text variant="bodySmall" style={[styles.helpText, { color: themeColors.warning }]}>
                                Please add a bank first before creating an account
                            </Text>
                        )}
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
    headerTextContainer: {
        flex: 1,
    },
    scrollContent: {
        flex: 1,
        paddingHorizontal: SPACING.screenPadding,
    },
    container: {
        flex: 1,
        padding: SPACING.md,
    },
    header: {
        marginBottom: SPACING.lg,
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
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.md,
        marginLeft: -SPACING.sm,
    },
    cardTitle: {
        fontWeight: '600',
        marginLeft: SPACING.xs,
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
    dropdownContainer: {
        marginBottom: SPACING.md,
    },
    selectButton: {
        borderRadius: RADIUS.md,
    },
    selectButtonContent: {
        flexDirection: 'row-reverse',
    },
    selectButtonLabel: {
        fontSize: FONT_SIZE.md,
    },
    helpText: {
        marginTop: SPACING.sm,
        textAlign: 'center',
        fontSize: FONT_SIZE.sm,
    },
    spacer: {
        height: SPACING.xl,
    },
    previewCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        gap: SPACING.md,
        marginBottom: SPACING.md,
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
});
