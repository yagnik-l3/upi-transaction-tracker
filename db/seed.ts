import * as bankQueries from './queries/bank';

const DEFAULT_BANKS = [
    'SBI',
    'HDFC',
    'ICICI',
    'Axis',
    'Kotak',
    'PNB',
    'BOB',
    'Canara',
    'Union',
    'IDBI',
    'IndusInd',
    'Yes Bank',
    'Federal',
    'RBL',
    'IDFC First',
    'Paytm Payments Bank',
    'Airtel Payments Bank',
    'Jio Payments Bank',
];

export async function seedDefaultBanks() {
    try {
        const existingBanks = await bankQueries.findAll({});

        // Only seed if no banks exist
        if (existingBanks.length === 0) {
            for (const bankName of DEFAULT_BANKS) {
                await bankQueries.create({ name: bankName });
            }
            console.log(`Seeded ${DEFAULT_BANKS.length} default banks`);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error seeding banks:', error);
        return false;
    }
}
