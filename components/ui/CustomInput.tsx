import { FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, FontFamily } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { Text } from 'react-native-paper';

interface CustomInputProps extends TextInputProps {
    label: string;
    icon?: keyof typeof MaterialIcons.glyphMap;
    error?: string;
}

export function CustomInput({ label, icon, error, style, ...props }: CustomInputProps) {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: themeColors.text }]}>{label}</Text>
            <View
                style={[
                    styles.inputContainer,
                    {
                        backgroundColor: themeColors.background,
                        borderColor: error
                            ? themeColors.error
                            : isFocused
                                ? themeColors.primary
                                : themeColors.cardBorder,
                    },
                ]}
            >
                {icon && (
                    <MaterialIcons
                        name={icon}
                        size={ICON_SIZE.md}
                        color={isFocused ? themeColors.primary : themeColors.icon}
                        style={styles.icon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        { color: themeColors.text },
                        style,
                    ]}
                    placeholderTextColor={themeColors.icon}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    {...props}
                />
            </View>
            {error && (
                <Text style={[styles.errorText, { color: themeColors.error }]}>{error}</Text>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.md,
    },
    label: {
        fontSize: FONT_SIZE.sm,
        fontFamily: FontFamily.medium,
        marginBottom: SPACING.xs,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1.5,
        borderRadius: RADIUS.md,
        paddingHorizontal: SPACING.md,
        minHeight: 52,
    },
    icon: {
        marginRight: SPACING.sm,
    },
    input: {
        flex: 1,
        fontSize: FONT_SIZE.md,
        fontFamily: FontFamily.regular,
        paddingVertical: SPACING.sm,
    },
    errorText: {
        fontSize: FONT_SIZE.xs,
        fontFamily: FontFamily.regular,
        marginTop: SPACING.xs,
    },
});
