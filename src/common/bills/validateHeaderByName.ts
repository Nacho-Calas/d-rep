import { orderAlphabetically } from './orderAlphabetically';
import { preprocessText } from './preprocessText';

interface Header {
    id: string;
    name: string;
    cuit: string;
    address: string[];
};

interface BlocksData {
    BlockType: string;
    Confidence: number;
    Text: string;
    Id: string;
};

/**
 * Validates the header by name and returns the best matching header.
 * @param blocksData - An array of blocks data.
 * @param headers - An array of headers.
 * @returns The best matching header or null if no match is found.
 */

export const validateHeaderByName = (blocksData: BlocksData[], headers: Header[]): Header | null => {
    let bestMatch: { header: Header, similarity: number } | null = null;
    
    for (const header of headers) {
        const headerTokens = orderAlphabetically(preprocessText(header.name).split(' '));

        for (const data of blocksData) {
            if (data.BlockType === 'LINE') {
                const dataTokens = orderAlphabetically(preprocessText(data.Text).split(' '));

                let similarities = [];

                headerTokens.forEach((wordA: string) => {
                    const similarity = dataTokens.includes(wordA) ? 1 : 0;
                    similarities.push(similarity);
                });

                const averageSimilarity = similarities.reduce((sum, similarity) => sum + similarity, 0) / similarities.length;

                if (averageSimilarity >= 0.8 && (!bestMatch || averageSimilarity > bestMatch.similarity)) {
                    bestMatch = { header, similarity: averageSimilarity };
                }
            }
        }
    }

    return bestMatch ? bestMatch.header : null;
};
