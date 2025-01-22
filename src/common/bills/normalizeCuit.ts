/**
 * Normalizes a CUIT (Clave Única de Identificación Tributaria) by removing spaces and dashes and formatting it as MM-BBBBBBBB-V.
 * 
 * @param cuit - The CUIT to be normalized.
 * @returns The normalized CUIT in the format MM-BBBBBBBB-V, or null if the input is invalid.
 */
export const normalizeCuit = (cuit: string): string | null => {

    // Eliminar guiones y espacios en blanco
    cuit = cuit.replace(/[-\s]/g, '');

    // Asegurarse de que el CUIT tenga exactamente 11 dígitos
    if (cuit.length !== 11) {
        return '';
    }

    return cuit;
};