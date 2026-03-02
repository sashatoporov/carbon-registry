/**
 * Robust date formatter to handle various date formats in the registry data.
 * Handles:
 * - ISO strings: "2020-04-06 00:00:00"
 * - Excel numeric dates: 44202.0 (days since 1899-12-30)
 * - Numeric timestamps/years
 * - Strings like "NaT", "NaN", "None"
 */
export function formatDate(val) {
    if (val == null) return "—";

    let date;
    const strVal = String(val).trim().toLowerCase();

    // Handle explicitly missing values from Python/Pandas
    if (['nat', 'nan', 'none', '-', ''].includes(strVal)) {
        return "—";
    }

    // Check if it's a numeric value (Excel date or timestamp)
    const numVal = Number(val);
    if (!isNaN(numVal)) {
        // Excel dates are roughly between 1 and 100,000
        // (44202 is early 2021)
        if (numVal > 0 && numVal < 100000) {
            // Excel's epoch is Dec 30, 1899
            date = new Date((numVal - 25569) * 86400 * 1000);
        } else {
            // Treat as Unix timestamp (seconds or milliseconds)
            date = new Date(numVal > 1e11 ? numVal : numVal * 1000);
        }
    } else {
        // Try parsing as standard date string
        date = new Date(val);
    }

    // Validate the resulting date object
    if (isNaN(date.getTime())) {
        return "—";
    }

    // Filter out unrealistic dates (e.g., year < 2000)
    if (date.getFullYear() < 2000) {
        return "—";
    }

    // Format as "Dec 31, 2025"
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

/**
 * Formats large numbers into readable strings (K/M/B)
 */
export function formatNum(num) {
    if (num == null || isNaN(num)) return "—";
    if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
    if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
    if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
    return num.toLocaleString();
}
