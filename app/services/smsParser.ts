export interface ParsedTransaction {
    amount: number;
    receiver: string;
    reference: string;
    date: string; // ISO string
    bankName: string; // 'BOB', 'HDFC', 'RBL'
}

// Regex Patterns
// Note: These are sample patterns and might need adjustment based on actual SMS formats.
// Adapted for JS regex.
// BOB format:
// Rs.100.00 Dr. ... Cr. to JARRETAIL@ybl ... (2025:10:04 ...)
const bobRegex =
    /Rs\.([\d.]+)\s+Dr\..*?Cr\. to ([\w@.-]+).*?Ref:(\d+).*?AvlBal:Rs([\d.]+)\((\d{4}):(\d{2}):(\d{2})/g;

// HDFC format:
// Sent Rs.35000.00 ... On 05/10/25 ... Ref 112193812012
const hdfcRegex =
    /Sent Rs\.([\d.]+).*?From HDFC.*?To (.*?)\s+On (\d{2})\/(\d{2})\/(\d{2}).*?Ref (\d+)/gs;

// RBL UPI ONLY format:
// Your a/c XX5678 is debited for Rs.10000 on 21-11-25 ... (UPI Ref XXXXX)
const rblUPIRegex =
    /Your a\/c .*? is debited for Rs\.([\d.]+).*?on (\d{2})-(\d{2})-(\d{2}).*?\(UPI Ref (\d+)/g;

const PATTERNS = {
    BOB: {
        regex: bobRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = match[4];
            const mm = match[5];
            const dd = match[6];

            return {
                amount: parseFloat(match[1]),
                receiver: match[2],
                reference: match[3],
                bankName: 'BOB',
                date: `${yyyy}-${mm}-${dd}`,
            };
        }
    },
    HDFC: {
        regex: hdfcRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match[5];
            const mm = match[4];
            const dd = match[3];

            return {
                amount: parseFloat(match[1]),
                receiver: match[2].trim(),
                reference: match[6],
                bankName: 'HDFC',
                date: `${yyyy}-${mm}-${dd}`,
            };
        }
    },
    RBL: {
        regex: rblUPIRegex,
        parse: (match: RegExpMatchArray): ParsedTransaction => {
            const yyyy = "20" + match[4];
            const mm = match[3];
            const dd = match[2];

            return {
                amount: parseFloat(match[1]),
                receiver: "UPI Transfer (RBL)",
                reference: match[5],
                bankName: 'RBL',
                date: `${yyyy}-${mm}-${dd}`,
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
