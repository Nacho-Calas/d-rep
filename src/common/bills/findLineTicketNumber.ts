/**
 * Finds and returns the last occurrence of a ticket number in a given string.
 * 
 * @param line The string to search for a ticket number.
 * @returns The last ticket number found in the string, or an empty string if no ticket number is found.
 */
export const findLineTicketNumber = (line) => {
    const TICKET_REGEX_8_DIGITS = /(?<=\s)0\d{7}\b/g;
    const matches8Digits = line.match(TICKET_REGEX_8_DIGITS);

    if (matches8Digits) {
        return matches8Digits[0];
    }
    const TICKET_REGEX_4_6_DIGITS = /(?<=\s)\d{4}\b|(?<=\s)\d{6}\b/g;
    const matches4_6Digits = line.match(TICKET_REGEX_4_6_DIGITS);

    if (matches4_6Digits) {
        return matches4_6Digits[matches4_6Digits.length - 1];
    }

    return null;
};