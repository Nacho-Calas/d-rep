/**
 * Preprocesses the given text by converting it to lowercase, removing special characters,
 * removing extra spaces, removing accents and punctuation marks, and removing common stop words.
 * 
 * @param text - The text to be preprocessed.
 * @returns The preprocessed text.
 */
export const preprocessText = (text: string): string => {
    // convetimos el texto en minusculas
    let cleanedText = text.toLowerCase();

    // removemos los caracteres especiales
    cleanedText = cleanedText.replace(/[^a-zA-Z0-9 ]/g, '');

    // removemos los espacios extras
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    // removemos los acentos y las tildes y signos de puntuacion y signos diacriticos
    cleanedText = cleanedText.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // removemos las palabras comunes (stop words)
    const stopWords = ['de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'en', 'con', 'por', 'para', 'a', 'ante', 'bajo', 'cabe', 'contra', 'desde', 'durante', 'entre', 'hacia', 'hasta', 'mediante', 'para', 'por', 'según', 'sin', 'sobre', 'tras'];
    cleanedText = cleanedText.split(' ').filter(word => !stopWords.includes(word)).join(' ');

    return cleanedText;
};