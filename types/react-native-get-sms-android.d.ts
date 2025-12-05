declare module 'react-native-get-sms-android' {
    interface SmsFilter {
        box?: string;
        minDate?: number;
        maxCount?: number;
        indexFrom?: number;
        bodyRegex?: string;
        read?: number;
        _id?: number;
        address?: string;
        body?: string;
    }

    const SmsAndroid: {
        list(
            filter: string,
            fail: (error: string) => void,
            success: (count: number, smsList: string) => void
        ): void;
    };

    export default SmsAndroid;
}
