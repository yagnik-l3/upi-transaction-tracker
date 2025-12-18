// import fs from "node:fs";
import { PermissionsAndroid, Platform } from 'react-native';
import SmsAndroid from 'react-native-get-sms-android';
import { ParsedTransactionWithRawMessage, parseSMS } from './smsParser';

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

export const readSms = async (minDate: number, maxCount: number = 20, indexFrom: number = 0): Promise<{ transactions: ParsedTransactionWithRawMessage[], count: number }> => {
    return new Promise((resolve, reject) => {
        if (Platform.OS !== 'android') {
            resolve({ transactions: [], count: 0 });
            return;
        }

        const filter = {
            box: 'inbox',
            minDate, // 0 = all time
            maxCount,
            indexFrom
        };

        const tran: string[] = [];
        SmsAndroid.list(
            JSON.stringify(filter),
            (fail: string) => {
                console.log('Failed with this error: ' + fail);
                reject(fail);
            },
            (count: number, smsList: string) => {
                const arr = JSON.parse(smsList);
                const transactions: ParsedTransactionWithRawMessage[] = [];

                arr.forEach((object: any) => {
                    tran.push(object.body)
                    const parsed = parseSMS(object.body);
                    if (parsed) {
                        transactions.push({ ...parsed, timestamp: object.date, rawMessage: object.body });
                    }
                });
                resolve({
                    transactions,
                    count: arr.length
                });
            }
        );
    });

};
