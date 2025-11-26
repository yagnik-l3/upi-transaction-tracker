import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { ParsedTransaction, parseSMS } from './smsParser';

export const requestSmsPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android') return false;

    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            {
                title: 'SMS Permission',
                message: 'This app needs access to your SMS to track transactions.',
                buttonNeutral: 'Ask Me Later',
                buttonNegative: 'Cancel',
                buttonPositive: 'OK',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
        console.warn(err);
        return false;
    }
};

export const readSms = async (minDate?: number): Promise<ParsedTransaction[]> => {
    return new Promise((resolve, reject) => {
        if (Platform.OS !== 'android') {
            resolve([]);
            return;
        }

        const filter = {
            box: 'inbox',
            minDate: minDate || 0, // 0 = all time
            maxCount: 1000, // Limit to avoid performance issues
            read: 1
        };

        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: string) => {
                console.log('Failed with this error: ' + fail);
                reject(fail);
            },
            (count: number, smsList: string) => {
                const arr = JSON.parse(smsList);
                const transactions: ParsedTransaction[] = [];

                arr.forEach((object: any) => {
                    const parsed = parseSMS(object.body);
                    if (parsed) {
                        transactions.push(parsed);
                    }
                });
                resolve(transactions);
            }
        );
    });
};
