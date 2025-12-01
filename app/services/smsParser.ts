export type ParsedTransaction = {
    amount: number;
    receiver: string;
    reference: string;
    date: string;
    bankName: string; // 'BOB', 'HDFC', 'RBL'
    timestamp: number;
    accountNo: string;
}

export type ParsedTransactionWithRawMessage = ParsedTransaction & {
    rawMessage: string;
}

const MONTHS = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12
}

// Regex Patterns
// Note: These are sample patterns and might need adjustment based on actual SMS formats.

const bobRegex =
    /^Rs\.?(?<amount>\d+(?:\.\d{2})?) Dr\. from A\/C (?<account>XXXXXX\d+) and Cr\. to (?<receiver>[^\s]+) .*?Ref:? ?(?<upi_ref>\d+)\. AvlBal:Rs[\d\.]+\((?<yy>\d{4}):(?<mm>\d{2}):(?<dd>\d{2}) \d{2}:\d{2}:\d{2}\)/m;

const rblRegex =
    /^Your a\/c (?<account>XX\d+) is debited for Rs\.?(?<amount>\d+(?:\.\d{2})?) on (?<dd>\d{2})-(?<mm>\d{2})-(?<yy>\d{2}) and credited to a\/c (?<receiver>XX\d+) .*?UPI Ref(?: no)? (?<upi_ref>\d+)/m;

const hdfcRegex =
    /^Sent Rs\.?(?<amount>\d+(?:\.\d{2})?)\s*From HDFC Bank A\/C [X*]*?(?<account>\d{4})\s*To (?<receiver>[A-Z ]+)\s*On (?<dd>\d{2})\/(?<mm>\d{2})\/(?<yy>\d{2})\s*Ref (?<upi_ref>\d+)/m;

const sbiRegex = /^Dear UPI user A\/C (?<account>X\d+) debited by (?<amount>\d+(?:\.\d+)?) on date (?<dd>\d{2})(?<month>[A-Za-z]{3})(?<yy>\d{2}) trf to (?<receiver>[A-Z\s]+) Refno (?<upi_ref>\d+)/m;

const kotakRegex = /^Sent Rs\.(?<amount>\d+\.\d{2}) from Kotak Bank AC (?<account>X\d+) to (?<receiver>[^\s]+) on (?<dd>\d{2})-(?<mm>\d{2})-(?<yy>\d{2})\.UPI Ref (?<upi_ref>\d+)/m;

const PATTERNS = {
    BOB: {
        regex: bobRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = match.groups?.yyyy ?? "";
            const mm = match.groups?.mm ?? "";
            const dd = match.groups?.dd ?? "";

            return {
                amount: parseFloat(match.groups?.amount ?? "0"),
                receiver: match.groups?.receiver ?? "NA",
                reference: match.groups?.upi_ref ?? "NA-REF",
                bankName: 'BOB',
                date: `${yyyy}-${mm}-${dd}`,
                timestamp: 0,
                accountNo: match.groups?.account ?? "XXX-NA"
            };
        }
    },
    HDFC: {
        regex: hdfcRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match.groups?.yy;
            const mm = match.groups?.mm;
            const dd = match.groups?.dd;

            return {
                amount: parseFloat(match.groups?.amount ?? "0"),
                receiver: match.groups?.receiver.trim() ?? "NA",
                reference: match.groups?.upi_ref ?? "NA-REF",
                bankName: 'HDFC',
                date: `${yyyy}-${mm}-${dd}`,
                timestamp: 0,
                accountNo: match.groups?.account ?? "XXX-NA"
            };
        }
    },
    RBL: {
        regex: rblRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match.groups?.yy;
            const mm = match.groups?.mm ?? "";
            const dd = match.groups?.dd ?? "";

            return {
                amount: parseFloat(match?.groups?.amount ?? "0"),
                receiver: match?.groups?.receiver ?? "NA",
                reference: match?.groups?.upi_ref ?? "NA-REF",
                bankName: 'RBL',
                date: `${yyyy}-${mm}-${dd}`,
                timestamp: 0,
                accountNo: match.groups?.account ?? "XXX-NA"
            };
        }
    },
    SBI: {
        regex: sbiRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match.groups?.yy;
            const mm = MONTHS[match.groups?.mm as keyof typeof MONTHS ?? MONTHS.Jan] ?? "";
            const dd = match.groups?.dd ?? "";

            return {
                amount: parseFloat(match?.groups?.amount ?? "0"),
                receiver: match?.groups?.receiver ?? "NA",
                reference: match?.groups?.upi_ref ?? "NA-REF",
                bankName: 'SBI',
                date: `${yyyy}-${mm}-${dd}`,
                timestamp: 0,
                accountNo: match.groups?.account ?? "XXX-NA"
            };
        }
    },
    KOTAK: {
        regex: kotakRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match.groups?.yy;
            const mm = match.groups?.mm ?? "";
            const dd = match.groups?.dd ?? "";

            return {
                amount: parseFloat(match?.groups?.amount ?? "0"),
                receiver: match?.groups?.receiver ?? "NA",
                reference: match?.groups?.upi_ref ?? "NA-REF",
                bankName: 'Kotak',
                date: `${yyyy}-${mm}-${dd}`,
                timestamp: 0,
                accountNo: match.groups?.account ?? "XXX-NA"
            };
        }
    }
};

export const parseSMS = (body: string): ParsedTransaction | null => {
    for (const key in PATTERNS) {
        const bank = PATTERNS[key as keyof typeof PATTERNS];
        const match = bank.regex.exec(body);
        if (match) {
            return bank.parse(match);
        }
    }
    return null;
};
