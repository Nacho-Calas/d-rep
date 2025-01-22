import {
    AnalyzeExpenseCommandOutput,
    LineItemFields,
    ExpenseType,
    ExpenseField,
    Block,
} from '@aws-sdk/client-textract';

interface FormattedLineItemsFields {
    Type: ExpenseType | undefined;
    Value: {
        Text: string | undefined;
        Confidence: number | undefined;
    };
}
interface FormattedSummaryFields {
    Type: ExpenseType | undefined;
    Label: {
        Text: string | undefined;
        Confidence: number | undefined;
    };
    Value: {
        Text: string | undefined;
        Confidence: number | undefined;
    };
}
interface FormattedBlocksFields {
    BlockType: string | undefined;
    Confidence: number | undefined;
    Text: string | undefined;
    Id: string | undefined;
}


export async function processReceipt(textractResponse): Promise<any> {
    try {
        const processableLines = parseTextractResponse(textractResponse);
        // const extractionMethods = [
        //     extractLineItemsForBuenDia1,
        //     extractLineItemsForBuenDia2,
        //     extractLineItemsForArcoiris,
        // ];

        // let processedLines, detectedProductLines;

        // for (const method of extractionMethods) {
        //     let result = method(processableLines);
        //     ({ processedLines, detectedProductLines } = result);
        //     if (
        //         processedLines && processedLines.length > 0 &&
        //         validateLinesExtraction(processedLines, detectedProductLines, textractResponse)
        //     ) {
        //         break;
        //     }
        // }

        // const processedLinesMapped =
        //     processedLines.map(line => [
        //         {
        //             "Type": { "Text": "ITEM" },
        //             "Value": { "Text": line.item }
        //         },
        //         {
        //             "Type": { "Text": "PRICE" }, // se formatea para que siempre lea algo
        //             "Value": { "Text": line.price ? line.price.toString() : "0" }
        //         },
        //         {
        //             "Type": { "Text": "QUANTITY" }, // aqui seria formateado en cantidad 1 para que siempre lea 1 producto al menos
        //             "Value": { "Text": line.quantity ? line.quantity.toString() : "1" }
        //         },
        //         {
        //             "Type": { "Text": "UNIT_PRICE" }, // se formatea para que siempre lea algo
        //             "Value": { "Text": line.unitPrice ? line.unitPrice.toString() : "0" }
        //         }
        //     ]);

        const processedLinesMapped =
        processableLines.map(line => [
            {
                "Type": { "Text": "ITEM" },
                "Value": { "Text": line }
            },
            {
                "Type": { "Text": "PRICE" }, // se formatea para que siempre lea algo
                "Value": { "Text": "0" }
            },
            {
                "Type": { "Text": "QUANTITY" }, // aqui seria formateado en cantidad 1 para que siempre lea 1 producto al menos
                "Value": { "Text":  "1" }
            },
            {
                "Type": { "Text": "UNIT_PRICE" }, // se formatea para que siempre lea algo
                "Value": { "Text":  "0" }
            }
        ]);

        const fullDataToMap = {
            ...textractResponse,
            ExpenseDocuments: [
                {
                    ...textractResponse.ExpenseDocuments[0],
                    LineItemGroups: [
                        {
                            ...textractResponse.ExpenseDocuments[0].LineItemGroups[0],
                            LineItems: processedLinesMapped
                        }
                    ]
                }
            ]
        }
        const fullDataMapped = processAnalyzedExpense(fullDataToMap);
        return {
            data: fullDataMapped,
            status: true,
        };
    } catch (error) {
        console.log('processReceipt error: ', error)
        return {
            data: null,
            status: false,
        };
    }
}

function processSummaryFields(
    summaryFields: ExpenseField[]
): FormattedSummaryFields[] {
    return summaryFields.map((summaryField) => {
        return {
            Type: summaryField.Type,
            Label: {
                Text: summaryField.LabelDetection?.Text,
                Confidence: summaryField.LabelDetection?.Confidence,
            },
            Value: {
                Text: summaryField.ValueDetection?.Text,
                Confidence: summaryField.ValueDetection?.Confidence,
            },
        };
    });
}

function processBlockFields(blocks: Block[]): FormattedBlocksFields[] {
    return blocks.map((blockField) => {
        return {
            BlockType: blockField.BlockType,
            Confidence: blockField.Confidence,
            Text: blockField.Text,
            Id: blockField.Id,
        };
    });
};

function processAnalyzedExpense(response: AnalyzeExpenseCommandOutput) {
    const summaryFields = response.ExpenseDocuments?.[0].SummaryFields;
    const lineItems = response.ExpenseDocuments?.[0].LineItemGroups?.[0].LineItems;
    const blocks = response.ExpenseDocuments?.[0].Blocks;
    const fullData = {
        SummaryFields: summaryFields && processSummaryFields(summaryFields),
        LineItems: lineItems,
        Blocks: blocks && processBlockFields(blocks),
        ResponseMetadata: response.$metadata,
        TicketId: response.$metadata.requestId,
    };

    return fullData;
}

function parseTextractResponse(response) {
    try {
        const blocks = response.ExpenseDocuments[0].Blocks;
        const lines = blocks.filter(block => block.BlockType === 'LINE');
        return lines
            .map(line => line.Text)
            // .filter(text => !text.includes('(') && !text.includes(')'))
            // .filter(text => !text.includes('[') && !text.includes(']'))
            // .filter(text => text.length > 2);
    } catch (error) {
        return [];
    }
}

function extractLineItemsForBuenDia1(lines) {
    const startIndex =
        lines.findIndex(line => line.includes('Fecha') && line.includes('Hora')) +
        1;
    const endIndex = lines.findIndex(line => line.includes('Subtotal'));
    let detectedProductLines = 0;


    let processedLines = [];
    for (let i = startIndex; i < endIndex;) {
        //cambios agregados aqui 
        let product: any = {};
        // Check if the line matches the pattern for quantity and unit price
        if (lines[i].match(/\d+[,.]\d+ [uU] ?[xXnN] \d+[,.]\d+/i)) {
            // Matches "1,0000 u X 546,0000"
            product.filaCantidad = lines[i];
            detectedProductLines++; // First line: Quantity and unit price
            i++;
            // Add the next line as the product name
            if (i < endIndex) {
                product.item = lines[i]; // Second line: Product name
                i++;
            }

            // Check for an optional third line with additional pricing information
            if (i < endIndex && lines[i].match(/\d+\.\d+ [xX] \d+\.\d+/)) {
                // Matches "0.420 X 1299.99"
                product.filaPeso = lines[i]; // Third line: Additional pricing
                i++;
            }

            processedLines.push(product);
        } else {
            i++;
        }
    }

    processedLines = processedLines.map(processedLine => {
        const quantity = parseFloat(processedLine?.filaCantidad?.split(' ')[0].replace(',', '.'));
        const unitPricePreProcess = processedLine?.filaCantidad?.split(' ');
        const unitPrice = parseFloat(unitPricePreProcess[unitPricePreProcess.length - 1].replace(',', '.'));
        const data = {
            item: processedLine.item,
            unitPrice: unitPrice ? unitPrice : 0,
            quantity: quantity ? quantity : 1,
            price: quantity * unitPrice ? quantity * unitPrice : 0
        }
        return {
            item: processedLine.item,
            unitPrice: unitPrice,
            quantity: quantity,
            price: quantity * unitPrice
        };
    });
    return { processedLines, detectedProductLines };
}

function extractLineItemsForBuenDia2(lines) {
    const startIndex = lines.findIndex(line => line.includes('Fecha')) + 2;
    const endIndex = lines.findIndex(line => line.includes('Subtotal'));

    let processedLines = [];
    let detectedProductLines = 0;
    for (let i = startIndex; i < endIndex;) {
        // Skip lines with parentheses
        if (lines[i].includes('(') && lines[i].includes(')')) {
            i++;
            continue;
        }

        // Initialize an empty product object
        let product = { filaCantidad: null, item: null, filaPeso: null };

        // Process up to 3 lines for each product
        let potentialNames = [];
        for (let j = 0; j < 2 && i < endIndex; j++, i++) {
            if (lines[i].match(/\d+[,.]\d+ [uU] [xX] \d+[,.]\d+/i)) {
                // Matches "100,00 U x 299,00" - Quantity and unit price line
                detectedProductLines++
                product.filaCantidad = lines[i];
            } else if (lines[i].match(/\d+\.\d+ [xX] \d+\.\d+/)) {
                // Matches "0.420 X 1299.99" - Weight-based pricing line
                product.filaPeso = lines[i];
            } else {
                // Potential product name
                potentialNames.push(lines[i]);
            }
        }

        // Assign the product name if it's not already set
        if (potentialNames.length > 0) {
            product.item = potentialNames.reduce((a, b) =>
                countAlphabets(a) > countAlphabets(b) ? a : b
            );
        }

        // Add the product to items if it has at least a name or filaCantidad
        if (product.item || product.filaCantidad) {
            processedLines.push(product);
        }
    }

    processedLines = processedLines.map(product => {

        const quantity = parseFloat(product?.filaCantidad?.split(' ')[0].replace(',', '.'));
        const unitPricePreProcess = product?.filaCantidad?.split(' ');
        const unitPrice = parseFloat(unitPricePreProcess[unitPricePreProcess.length - 1].replace(',', '.'));

        return {
            item: product.item,
            unitPrice: unitPrice,
            quantity: quantity,
            price: quantity * unitPrice
        };
    });
    return { processedLines, detectedProductLines };
}

function countAlphabets(str) {
    return (str.match(/[a-zA-Z]/g) || []).length;
}

function extractLineItemsForArcoiris(lines) {
    const startIndex = lines.findIndex(line => line.includes('Cliente:')) + 1;
    const endIndex = lines.findIndex(line => line.includes('SUBTOT'));

    let processedLines = [];
    let detectedProductLines = 0;

    for (let i = startIndex; i < endIndex;) {
        //cambios agregados aqui 
        let product: any = {};

        // Check if the line is a large digit number (combined code, weight, and price)
        if (lines[i].match(/^\d{4,}/)) {
            product.weightPrice = lines[i++];
        }
        // Check if the line is a 3-digit number (separate product code)
        else if (lines[i].match(/^\d{3}$/)) {
            product.code = lines[i++];
            product.weightPrice = lines[i++];
        }

        // Next line is product name
        product.item = lines[i++];
        // Following line is final price
        product.finalPrice = lines[i++];

        processedLines.push(product);
        detectedProductLines++
    }

    processedLines = processedLines.map(processedLine => {
        // Extraction and parsing logic for quantity, unitPrice, and ITEM name
        // ...


        return {
            item: processedLine.item,
            unitPrice: null,
            quantity: null,
            price: processedLine.finalPrice
        };
    });

    return { processedLines, detectedProductLines };
}

function validateLinesExtraction(processedLines, detectedProductLines, textractResponse) {
    const calculatedSubtotal = calculateSubtotal(processedLines);
    const detectedSubtotal = parseFloat(
        textractResponse.ExpenseDocuments[0].SummaryFields.find(
            item =>
                item.Type &&
                (item.Type.Text === 'SUBTOTAL' || item.Type.Text === 'SUBTOT')
        ).ValueDetection.Text
    );

    const isValid =
        detectedProductLines === processedLines.length
    // &&
    // Math.abs(calculatedSubtotal - detectedSubtotal) < 9;

    return isValid;
}

function calculateSubtotal(lineItems) {
    return lineItems.reduce((subtotal, item) => {
        const price = parseFloat(item.price);
        return subtotal + (isNaN(price) ? 0 : price);
    }, 0);
}
