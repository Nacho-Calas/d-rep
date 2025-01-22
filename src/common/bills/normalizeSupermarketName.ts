/**
 * Normalizes a supermarket name by removing unnecessary characters, replacing known abbreviations, and removing extra spaces.
 * @param name - The original supermarket name.
 * @returns The normalized supermarket name.
 */
export const normalizeSupermarketName = (name: string): string => {
    // 1. Elimina los caracteres innecesarios
    let normalized = name.replace(/[\n\-\'\“\”\"\.\/\,\(\)\[\]\{\}\!\?\@\#\$\%\^\&\*\+\=\>\<\~\`\_]/g, ' ');

    // 2. Reemplaza las abreviaturas conocidas
    const replacements = {
        'NJEVO': 'NUEVO',
        'NJEUD': 'NUEVO',
        'PREKIUM': 'PREMIUM',
        'SJFERMERCFIUS': 'SUPERMERCADO',
        'S.M.': 'SUPERMERCADO',
        'was': '',
    };
    for (let [key, value] of Object.entries(replacements)) {
        const regex = new RegExp(key, 'gi');
        normalized = normalized.replace(regex, value);
    }

    // 3. Elimina los espacios adicionales
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized;
};