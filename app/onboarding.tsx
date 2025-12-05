import { FONT_SIZE, ICON_SIZE, RADIUS, SPACING, scaleSize } from '@/constants/scaling';
import { Colors, FontFamily } from '@/constants/theme';
import { useOnboarding } from '@/hooks/context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
    const colorScheme = useColorScheme();
    const { completeOnboarding, hasOnboarded } = useOnboarding();
    const themeColors = Colors[colorScheme ?? 'light'];
    const router = useRouter();

    const [permission, setPermissions] = useState<boolean>(false);

    const requestSmsPermission = async (): Promise<boolean> => {
        if (Platform.OS !== 'android') return false;

        try {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.READ_SMS,
                {
                    title: 'SMS Permission Required',
                    message: 'This app needs access to your SMS messages to automatically detect and track your UPI transactions from bank messages.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'Grant Permission',
                }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
            console.warn('SMS Permission error:', err);
            return false;
        }
    };

    const handleRequestPermission = async () => {
        const granted = await requestSmsPermission();
        setPermissions(granted);
    };

    const handleContinue = async () => {
        await completeOnboarding(true);
        router.replace('/(protected)');
    };

    useEffect(() => {
        handleRequestPermission();
    }, []);

    // Redirect to protected area once onboarding is complete
    // if (hasOnboarded) {
    //     return <Redirect href="/(protected)" />;
    // }

    // const handleSkip = () => {
    //     Alert.alert(
    //         'Skip Permission?',
    //         'Without SMS permission, you won\'t be able to automatically track transactions. You can grant permission later from the home screen.',
    //         [
    //             { text: 'Cancel', style: 'cancel' },
    //             { text: 'Skip', onPress: () => completeOnboarding(false) }
    //         ]
    //     );
    // };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: themeColors.background }]}>
            <View style={styles.content}>
                {/* Header */}
                <Animated.View entering={FadeInUp.delay(100).duration(600)} style={styles.header}>
                    <View style={[styles.iconContainer, { backgroundColor: themeColors.primary + '20' }]}>
                        <MaterialIcons name="security" size={ICON_SIZE.xxxl} color={themeColors.primary} />
                    </View>
                    <Text variant="headlineLarge" style={[styles.title, { color: themeColors.text }]}>
                        Permissions
                    </Text>
                    <Text variant="bodyLarge" style={[styles.subtitle, { color: themeColors.icon }]}>
                        We need a few permissions to help you track your expenses automatically
                    </Text>
                </Animated.View>

                {/* Permission Cards */}
                <View style={styles.permissionsContainer}>
                    <Animated.View
                        entering={FadeInDown.delay(100).duration(500)}
                    >
                        <View style={[styles.permissionCard, { backgroundColor: themeColors.card }]}>
                            <View style={styles.permissionHeader}>
                                <View style={[styles.permissionIcon, { backgroundColor: permission ? themeColors.success + '20' : themeColors.primary + '20' }]}>
                                    <MaterialIcons
                                        name={permission ? 'check-circle' : "sms"}
                                        size={ICON_SIZE.lg}
                                        color={permission ? themeColors.success : themeColors.primary}
                                    />
                                </View>
                                <View style={styles.permissionInfo}>
                                    <View style={styles.permissionTitleRow}>
                                        <Text variant="titleMedium" style={[styles.permissionTitle, { color: themeColors.text }]}>
                                            SMS Access
                                        </Text>

                                        <View style={[styles.requiredBadge, { backgroundColor: themeColors.error + '20' }]}>
                                            <Text style={[styles.requiredText, { color: themeColors.error }]}>Required</Text>
                                        </View>

                                    </View>
                                    <Text variant="bodySmall" style={[styles.permissionDescription, { color: themeColors.icon }]}>
                                        Read your bank transaction SMS to automatically track expenses
                                    </Text>
                                </View>
                            </View>
                            <Button
                                mode={permission ? 'outlined' : 'contained'}
                                onPress={() => handleRequestPermission()}
                                disabled={permission}
                                style={styles.permissionButton}
                                labelStyle={styles.permissionButtonLabel}
                            >
                                {permission ? 'Granted' : 'Grant'}
                            </Button>
                        </View>
                    </Animated.View>
                </View>

                {/* Footer */}
                <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.footer}>
                    <Button
                        mode="contained"
                        onPress={handleContinue}
                        style={[styles.continueButton, { backgroundColor: themeColors.primary }]}
                        labelStyle={styles.continueButtonLabel}
                        disabled={!permission}
                    >
                        Continue to App
                    </Button>
                    {/* <Button
                        mode="text"
                        onPress={handleSkip}
                        style={styles.skipButton}
                        labelStyle={[styles.skipButtonLabel, { color: themeColors.icon }]}
                    >
                        Skip for now
                    </Button> */}
                </Animated.View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: SPACING.screenPadding,
    },
    header: {
        alignItems: 'center',
        marginTop: SPACING.xxl,
        marginBottom: SPACING.xxl,
    },
    iconContainer: {
        width: scaleSize(80),
        height: scaleSize(80),
        borderRadius: RADIUS.xxl,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    title: {
        fontFamily: FontFamily.bold,
        fontSize: FONT_SIZE.xxxl,
        textAlign: 'center',
        marginBottom: SPACING.sm,
    },
    subtitle: {
        fontFamily: FontFamily.regular,
        fontSize: FONT_SIZE.md,
        textAlign: 'center',
        paddingHorizontal: SPACING.lg,
    },
    permissionsContainer: {
        flex: 1,
        gap: SPACING.md,
    },
    permissionCard: {
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        marginBottom: SPACING.sm,
    },
    permissionHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: SPACING.md,
    },
    permissionIcon: {
        width: scaleSize(48),
        height: scaleSize(48),
        borderRadius: RADIUS.md,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: SPACING.md,
    },
    permissionInfo: {
        flex: 1,
    },
    permissionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginBottom: SPACING.xs,
    },
    permissionTitle: {
        fontFamily: FontFamily.semiBold,
        fontSize: FONT_SIZE.lg,
    },
    requiredBadge: {
        paddingHorizontal: SPACING.sm,
        paddingVertical: SPACING.xs / 2,
        borderRadius: RADIUS.xs,
    },
    requiredText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FontFamily.semiBold,
    },
    permissionDescription: {
        fontFamily: FontFamily.regular,
        fontSize: FONT_SIZE.sm,
        lineHeight: FONT_SIZE.sm * 1.4,
    },
    permissionButton: {
        borderRadius: RADIUS.md,
        marginTop: SPACING.md
    },
    permissionButtonLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: FONT_SIZE.md,
    },
    footer: {
        paddingTop: SPACING.lg,
    },
    continueButton: {
        borderRadius: RADIUS.md,
    },
    continueButtonLabel: {
        fontFamily: FontFamily.semiBold,
        fontSize: FONT_SIZE.md,
    },
    skipButton: {
        marginTop: SPACING.sm,
    },
    skipButtonLabel: {
        fontFamily: FontFamily.regular,
        fontSize: FONT_SIZE.md,
    },
});
