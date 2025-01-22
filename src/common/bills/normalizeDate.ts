/**
 * Normalizes a date string by replacing hyphens with slashes.
 * @param {string} text - The input text containing a date.
 * @returns {string | null} - The normalized date string, or null if no match is found.
 */
export const normalizeDate = (text) => {
    const DATE_REGEX = /\d{2}[\/-]\d{2}[\/-]\d{4}/;
    const matches = text.match(DATE_REGEX);
    return matches ? matches[0].replace(/-/g, '/') : null;
};