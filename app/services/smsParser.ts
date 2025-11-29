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

// Regex Patterns
// Note: These are sample patterns and might need adjustment based on actual SMS formats.

// BOB format:
// Rs.100.00 Dr. ... Cr. to JARRETAIL@ybl ... (2025:10:04 ...)
const bobRegex =
    /^Rs\.?(?<amount>\d+(?:\.\d{2})?)\s+Dr\. from A\/C\s+(?<account>X+\d+)\s+and Cr\. to\s+(?<receiver>[A-Za-z0-9@\-.]+)\.\s+Ref:(?<upi_ref>\d+)\.\s+AvlBal:Rs\d+(?:\.\d+)?\/(?<yyyy>\d{4}):(?<mm>\d{2}):(?<dd>\d{2}) (?<hh>\d{2}):(?<min>\d{2}):(?<ss>\d{2})/gm;

// RBL UPI ONLY format:
// Your a/c XX5678 is debited for Rs.10000 on 21-11-25 ... (UPI Ref XXXXX)
const rblUPIRegex =
    /Your a\/c (?<account>XX\d+) is debited for Rs\.?(?<amount>\d+(?:\.\d{2})?) on (?<dd>\d{2})-(?<mm>\d{2})-(?<yy>\d{2}) and credited to a\/c (?<receiver>XX\d+) .*?UPI Ref(?: no)? (?<upi_ref>\d+)/gm;

const hdfcRegex =
    /^Sent Rs\.?(?<amount>\d+(?:\.\d{2})?)\s*From HDFC Bank A\/C [X*]*?(?<account>\d{4})\s*To (?<receiver>[A-Z ]+)\s*On (?<dd>\d{2})\/(?<mm>\d{2})\/(?<yy>\d{2})\s*Ref (?<upi_ref>\d+)/gm;

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
        regex: rblUPIRegex,
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
