/**
 * Validates a CUIT (Clave Única de Identificación Tributaria) label.
 * @param label - The CUIT label to validate.
 * @returns A boolean indicating whether the CUIT label is valid or not.
 */

export const possibleCuits = [
    'C.U.I.T.',
    'cuit',
    'CUIT Nro.',
    'Nro :',
    'C.U.I.T. Nro :',
    'C.U.I.T. Nro.:',
    'C.U.I.T. Nro. :',
    'CUIT:',
    'CUIT Nro.:',
    'C.U.I.T. N°',
    'CUIT N°',
    'C.U.I.T Nro',
    'C.U.I.T/Nro',
    'C.U.I.T-Nro',
    'C.U.I.T_Nro',
    'C.U.I.T Nro.',
    'C.U.I.T/Nro.',
    'C.U.I.T-Nro.',
    'C.U.I.T_Nro.',
    'C.U.I.T.:',
    'C.U.I.T-',
    'C.U.I.T/',
    'C.U.I.T_',
    'C.U.I.I. Nro.:',
    'C.U.I.I. Nro',
    'C.U.I.I. Nro:',
    'CUII',
    'CUII Nro.:',
    'CUII Nro',
    'CUII Nro:',
    'C.U.I.7 nro:.',
    'C.U.I.7 nro.',
    'C.U.I.7 nro',
    'CUIT Nro',
    'CUIT Nro:',
]