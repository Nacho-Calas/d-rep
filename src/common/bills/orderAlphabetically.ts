/**
 * Orders a list of strings alphabetically.
 *
 * @param list - The list of strings to be ordered.
 * @returns The ordered list of strings.
 */
export const orderAlphabetically = (list: string[]): string[] => {
    const orderedList = list.sort((a, b) => a.localeCompare(b));
    return orderedList;
};