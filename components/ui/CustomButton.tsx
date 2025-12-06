import { FONT_SIZE, ICON_SIZE, RADIUS, SPACING } from '@/constants/scaling';
import { Colors, FontFamily } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { Text } from 'react-native-paper';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';

interface CustomButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: ButtonVariant;
    icon?: keyof typeof MaterialIcons.glyphMap;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    color?: string;
    fullWidth?: boolean;
}

export function CustomButton({
    title,
    variant = 'primary',
    icon,
    iconPosition = 'left',
    loading = false,
    disabled,
    color,
    fullWidth = true,
    style,
    ...props
}: CustomButtonProps) {
    const colorScheme = useColorScheme();
    const themeColors = Colors[colorScheme ?? 'light'];

    const getBackgroundColor = () => {
        if (disabled) return themeColors.cardBorder;
        if (color && variant === 'primary') return color;
        switch (variant) {
            case 'primary':
                return themeColors.primary;
            case 'secondary':
                return themeColors.text;
            case 'outline':
            case 'ghost':
                return 'transparent';
            default:
                return themeColors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return themeColors.icon;
        switch (variant) {
            case 'primary':
            case 'secondary':
                return '#ffffff';
            case 'outline':
                return color || themeColors.primary;
            case 'ghost':
                return color || themeColors.text;
            default:
                return '#ffffff';
        }
    };

    const getBorderColor = () => {
        if (disabled) return themeColors.cardBorder;
        if (variant === 'outline') return color || themeColors.primary;
        return 'transparent';
    };

    const backgroundColor = getBackgroundColor();
    const textColor = getTextColor();
    const borderColor = getBorderColor();

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor,
                    borderColor,
                    borderWidth: variant === 'outline' ? 1.5 : 0,
                },
                fullWidth && styles.fullWidth,
                disabled && styles.disabled,
                style,
            ]}
            disabled={disabled || loading}
            activeOpacity={0.8}
            {...props}
        >
            {loading ? (
                <ActivityIndicator size="small" color={textColor} />
            ) : (
                <View style={styles.content}>
                    {icon && iconPosition === 'left' && (
                        <MaterialIcons
                            name={icon}
                            size={ICON_SIZE.md}
                            color={textColor}
                            style={styles.iconLeft}
                        />
                    )}
                    <Text style={[styles.text, { color: textColor }]}>{title}</Text>
                    {icon && iconPosition === 'right' && (
                        <MaterialIcons
                            name={icon}
                            size={ICON_SIZE.md}
                            color={textColor}
                            style={styles.iconRight}
                        />
                    )}
                </View>
            )}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        paddingVertical: SPACING.md,
        paddingHorizontal: SPACING.lg,
        borderRadius: RADIUS.md,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 52,
    },
    fullWidth: {
        width: '100%',
    },
    disabled: {
        opacity: 0.6,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    text: {
        fontSize: FONT_SIZE.md,
        fontFamily: FontFamily.semiBold,
        fontWeight: '600',
    },
    iconLeft: {
        marginRight: SPACING.sm,
    },
    iconRight: {
        marginLeft: SPACING.sm,
    },
});
