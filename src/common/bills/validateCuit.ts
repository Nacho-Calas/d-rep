/**
 * Validates a CUIT (Clave Única de Identificación Tributaria) string.
 * @param cuit - The CUIT string to validate.
 * @returns A boolean indicating whether the CUIT is valid or not.
 */
export const validateCuit = (cuit: string): boolean => {
    const mask = cuit.slice(0, 2);
    const digits = cuit.slice(2, 10);
    if (!['20', '23', '24', '27', '30', '33', '34'].includes(mask)) {
        return false;
    }

    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

    const cuitArray = cuit.split('').map(Number);

    const sumOfProducts = cuitArray.slice(0, 10).reduce((acc, digit, index) => {
        return acc + digit * weights[index];
    }, 0);

    const resto = sumOfProducts % 11;

    const verificationDigit = (resto === 0) ? 0 : (resto === 1) ? 9 : 11 - resto;

    return verificationDigit === cuitArray[10];
}