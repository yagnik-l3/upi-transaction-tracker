import { BorderRadius, Colors, Elevation, Spacing } from '@/constants/theme';
import { SelectBank } from '@/db/schema';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, IconButton, Menu, Text, TextInput } from 'react-native-paper';
import * as accountQueries from '../../db/queries/account';
import * as bankQueries from '../../db/queries/bank';


export default function SetupScreen() {
    const colorScheme = useColorScheme();
    const router = useRouter();

    const [banks, setBanks] = useState<SelectBank[]>([]);
    const [selectedBank, setSelectedBank] = useState<SelectBank | null>(null);
    const [friendlyName, setFriendlyName] = useState('');
    const [upiLimit, setUpiLimit] = useState('');
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        loadBanks();
    }, []);

    const loadBanks = async () => {
        const b = await bankQueries.findAll({});
        setBanks(b);
    };

    const handleAddAccount = async () => {
        if (!selectedBank || !friendlyName || !upiLimit) {
            Alert.alert('Error', 'Please fill all fields');
            return;
        }

        try {
            await accountQueries.create({
                bankId: selectedBank.id,
                name: friendlyName,
                upiLimit: parseFloat(upiLimit)
            });

            setFriendlyName('');
            setUpiLimit('');
            setSelectedBank(null);
            Alert.alert('Success', 'Account added successfully');
            router.back();
        } catch (e) {
            Alert.alert('Error', 'Failed to add account');
        }
    };

    const themeColors = Colors[colorScheme ?? 'light'];

    return (
        <ScrollView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.header}>
                <Text variant="headlineMedium" style={[styles.headerTitle, { color: themeColors.text }]}>
                    Add New Account
                </Text>
                <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: themeColors.icon }]}>
                    Select your bank and configure your daily UPI limit
                </Text>
            </View>

            <Card style={[styles.card, { backgroundColor: themeColors.card, ...Elevation.md }]}>
                <Card.Content>
                    <View style={styles.cardHeader}>
                        <IconButton icon="account-plus" size={28} iconColor={themeColors.primary} />
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
                        left={<TextInput.Icon icon="account-circle" />}
                        outlineColor={themeColors.cardBorder}
                        activeOutlineColor={themeColors.primary}
                    />
                    <TextInput
                        label="Daily UPI Limit (e.g., 100000)"
                        value={upiLimit}
                        onChangeText={setUpiLimit}
                        keyboardType="numeric"
                        mode="outlined"
                        style={styles.input}
                        left={<TextInput.Icon icon="currency-inr" />}
                        outlineColor={themeColors.cardBorder}
                        activeOutlineColor={themeColors.primary}
                    />
                    <Button
                        mode="contained"
                        onPress={handleAddAccount}
                        style={[styles.button, { backgroundColor: themeColors.secondary }]}
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
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: Spacing.md,
    },
    header: {
        marginBottom: Spacing.lg,
    },
    headerTitle: {
        fontWeight: '700',
        marginBottom: Spacing.xs,
    },
    headerSubtitle: {
        opacity: 0.8,
    },
    card: {
        marginBottom: Spacing.md,
        borderRadius: BorderRadius.lg,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
        marginLeft: -Spacing.sm,
    },
    cardTitle: {
        fontWeight: '600',
        marginLeft: Spacing.xs,
    },
    input: {
        marginBottom: Spacing.md,
    },
    button: {
        marginTop: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    dropdownContainer: {
        marginBottom: Spacing.md,
    },
    selectButton: {
        borderRadius: BorderRadius.sm,
    },
    selectButtonContent: {
        flexDirection: 'row-reverse',
    },
    helpText: {
        marginTop: Spacing.sm,
        textAlign: 'center',
    },
    spacer: {
        height: Spacing.xl,
    }
});
