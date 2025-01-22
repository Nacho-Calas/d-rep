/**
 * Replaces non-numeric characters in a CUIT (Clave Única de Identificación Tributaria) with their corresponding numeric values.
 * @param cuit - The CUIT string to be corrected.
 * @returns The corrected CUIT string with non-numeric characters replaced.
 */
export const correctCuit = (cuit: string): string => {
    // reemplazo los caracteres no-numericos con regex
    const nonNumericMap: Record<string, string> = {
        '0': '[0oO]',
        '1': '[1iIl!¡]',
        '2': '[2zZ]',
        '3': '[3E]',
        '4': '[4HA]',
        '5': '[5sS]',
        '6': '[6G]',
        '7': '[7T]',
        '8': '[8B]',
        '9': '[9]',
    };
    for (const n in nonNumericMap) {
        cuit = cuit.replace(new RegExp(nonNumericMap[n], 'g'), n);
    }

    return cuit;
}