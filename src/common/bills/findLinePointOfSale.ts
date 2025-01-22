/**
 * Finds and returns the point of sale (PV) number from a given line of text.
 * 
 * @param {string} line - The line of text to search for the PV number.
 * @returns {string | null} The PV number if found, otherwise null.
 */
export const findLinePointOfSale = (line) => {
    const POS_REGEX = /\b(\d{4})\b\s+\d{4,8}\b/;
    const match = line.match(POS_REGEX);

    return match ? match[1] : null;
};