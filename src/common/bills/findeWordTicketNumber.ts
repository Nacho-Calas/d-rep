/**
 * Finds and returns the first occurrence of an 8-digit number (ticket) in the given word.
 * 
 * @param word The word to search for the ticket number.
 * @returns The first 8-digit number found in the word, or an empty string if no match is found.
 */
export const findWordTicketNumber = (word: string): string => {
    const TICKET_REGEX = /\b0\d{7}\b/g;
    const matches = word.match(TICKET_REGEX);
    return matches ? matches[0] : null;
}