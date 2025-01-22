/**
 * Normalize the time format in the given text.
 * @param {string} text - The text to search for a time format.
 * @returns {string | null} The normalized time format if found, otherwise null.
 */
export const normalizeTime = (text) => {
    const TIME_REGEX = /\b([01]?[0-9]|2[0-3]):[0-5][0-9](?::[0-5][0-9])?\b/;
    const matches = text.match(TIME_REGEX);
    return matches ? matches[0] : null;
};