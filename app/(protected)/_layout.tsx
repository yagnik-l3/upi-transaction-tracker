import { Stack } from 'expo-router';

export default function ProtectedLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="setup" />
            <Stack.Screen name="transaction" />
            <Stack.Screen name="edit-account" />
        </Stack>
    );
}
