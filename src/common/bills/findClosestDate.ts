/**
 * Finds the closest date from an array of dates to the current date.
 * @param {Date[]} dates - An array of dates to search from.
 * @returns {string} - The closest date in the format 'dd/mm/yyyy'.
 */
export const findClosestDate = (dates) => {
    let closestDate = '';
    let minDiff = Number.MAX_SAFE_INTEGER;
    const today = new Date();

    dates.forEach(date => {
        const diff = Math.abs(today.getTime() - date.getTime());
        if (diff < minDiff) {
            minDiff = diff;
            closestDate = date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        }
    });

    return closestDate;
};