import * as accountQueries from '@/db/queries/account';
import * as transactionQueries from '@/db/queries/transaction';
import { CARD_COLORS, CARD_ICONS, InsertAccount, InsertTransaction } from '@/db/schema';
import { readSms } from './smsReader';

export const syncSmsMessages = async (minDate: number): Promise<number> => {
    let totalNewTransactions = 0;
    let indexFrom = 0;
    const PROCESS_BATCH_SIZE = 20;
    let hasMore = true;

    try {
        while (hasMore) {
            console.log(`Syncing SMS: fetching batch from index ${indexFrom}`);
            const { transactions, count } = await readSms(minDate, PROCESS_BATCH_SIZE, indexFrom);

            if (count === 0) {
                console.log('Syncing SMS: No more messages to read.');
                hasMore = false;
                break;
            }

            // If we received fewer messages than requested, this is the last batch
            if (count < PROCESS_BATCH_SIZE) {
                hasMore = false;
            }

            // Process transactions in this batch
            if (transactions.length > 0) {
                await processTransactionsBatch(transactions);
                totalNewTransactions += transactions.length;
            }

            // Important: increment index by the number of RAW messages read
            indexFrom += count;
        }
    } catch (error) {
        console.error('Error syncing SMS messages:', error);
        throw error;
    }

    return totalNewTransactions;
};

const processTransactionsBatch = async (transactions: any[]) => {
    // Collect unique bank+account combinations from transactions
    const uniqueAccounts = new Map<string, { bankName: string; accountNo: string }>();
    const txs: InsertTransaction[] = [];

    for (const tx of transactions) {
        // Basic validation
        if (!tx.bankName || !tx.accountNo || !tx.amount) continue;

        const key = `${tx.bankName}:${tx.accountNo}`;
        if (!uniqueAccounts.has(key)) {
            uniqueAccounts.set(key, { bankName: tx.bankName, accountNo: tx.accountNo });
        }
        txs.push({
            bankName: tx.bankName,
            accountNo: tx.accountNo,
            amount: tx.amount,
            receiver: tx.receiver || 'Unknown',
            reference: tx.reference,
            date: tx.date,
            timestamp: tx.timestamp,
            rawMessage: tx.rawMessage
        });
    }

    if (txs.length === 0) return;

    // Get existing accounts in one query
    // Optimisation: We could potentially cache this if calling multiple times, but for now fetching is safe
    const existingAccounts = await accountQueries.findAll({});
    const existingKeys = new Set(
        existingAccounts.map(acc => `${acc.bankName}:${acc.accountNo}`)
    );

    // Create new accounts for bank+accountNo combinations that don't exist
    const newAccounts: InsertAccount[] = [];
    let colorIndex = existingAccounts.length;

    for (const [key, accInfo] of uniqueAccounts) {
        if (!existingKeys.has(key)) {
            // Auto-create account with default values
            newAccounts.push({
                bankName: accInfo.bankName,
                accountNo: accInfo.accountNo,
                name: `${accInfo.bankName} ****${accInfo.accountNo.slice(-4)}`,
                upiLimit: 100000, // Default limit
                cardColor: CARD_COLORS[colorIndex % CARD_COLORS.length].value,
                cardIcon: CARD_ICONS[0].value,
            });
            colorIndex++;
        }
    }

    // Batch create new accounts
    if (newAccounts.length > 0) {
        await accountQueries.createMany(newAccounts);
        console.log(`Auto-created ${newAccounts.length} new accounts`);
    }

    // Batch create transactions
    await transactionQueries.createMany(txs);
    console.log(`Added ${txs.length} new transactions in this batch`);
};
