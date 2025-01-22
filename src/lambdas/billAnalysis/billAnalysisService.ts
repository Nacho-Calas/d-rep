import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { billTableDynamoDBRepository } from '../../common/dynamoDB/billTableDynamoDBRepository';
//import { UserInterfaceDynamoDB } from '../../common/dynamoDB/dynamoDBInterface.response';
import {
    BillStatus,
} from '../../common/dynamoDB/billTableDynamoDBInterface';
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';
import { mergeObjects } from "../../common/mergeObjects";
import crypto = require('crypto');
import { normalizeDate } from "../../common/bills/normalizeDate";
import { findClosestDate } from "../../common/bills/findClosestDate";
import { normalizeTime } from "../../common/bills/normalizeTime";
import { findLineTicketNumber } from "../../common/bills/findLineTicketNumber";
import { findWordTicketNumber } from "../../common/bills/findeWordTicketNumber";
import { findLinePointOfSale } from "../../common/bills/findLinePointOfSale";
const mainTable = new dynamoDBRepository();
const billTable = new billTableDynamoDBRepository();

export const billAnalysisService = async (body: any, userId: string, billId: string): Promise<any> => {
    try {
        //const user: UserInterfaceDynamoDB = await mainTable.getUser(userId);
        const billData = await billTable.getBill(billId);
        const hash = generateTicketHash(JSON.parse(billData.bill.textractData));

        // const hashHeader = hash.hashStringLabel.find((el) => el.Label.Text === 'P.V. N°') 

        // const billDuplicateList = await billTable.getHashWithGSI(hash.hash)

        // if (billDuplicateList.length > 0 && hashHeader) {
        //     mergeObjects(billData, {
        //         id: billId,
        //         bill: {
        //             status: BillStatus.BILL_DUPLICATED
        //         },
        //         GSI2PK: 'hash',
        //         GSI2SK: hash.hash
        //     })
        //     await billTable.putBill(billData, billId, "billAnalysisService");
        //     return {
        //         statusCode: StatusCodes.OK,
        //         body: { billStatus: BillStatus.BILL_DUPLICATED }
        //     };
        // }

        const header = findHeader(JSON.parse(billData.bill.textractData));

        const cuitRequieredValidated = [
            'cuit',
        ];
        for (const field of cuitRequieredValidated) {
            if (!header[field] || header[field] === '') {
                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.SIMPLE_HEADER_OCR,
                    bill: {
                        status: BillStatus.SIMPLE_HEADER_OCR,
                        header: header
                    },
                    GSI2PK: 'hash',
                    GSI2SK: hash.hash
                });
                await billTable.putBill(billData, billId, "billAnalysisService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        billStatus: BillStatus.SIMPLE_HEADER_OCR,
                        message: `Falta el campo ${field} en la lectura principal del ticket`
                    }
                };
            } else {
                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.CHECK_DICTIONARY,
                    bill: {
                        status: BillStatus.CHECK_DICTIONARY,
                        header: header
                    },
                    GSI2PK: 'hash',
                    GSI2SK: hash.hash
                });
                await billTable.putBill(billData, billId, "billAnalysisService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        billStatus: BillStatus.CHECK_DICTIONARY,
                        message: `Se envia a CheckDictionaryService para buscar el CUIT en la base de datos`
                    }
                }
            }
        }

        // Valida fecha y hora de compra que no pase de las 24hrs
        // const ticket24Hours = await validatePurchaseDate(header.dateOfPurchase, header.purchaseTime);
        // if (ticket24Hours === false) {
        //     mergeObjects(billData, {
        //         id: billId,
        //         bill: {
        //             status: BillStatus.BILL_LIMIT_24H_REACHED
        //         }
        //     });
        //     await billTable.putBill(billData, billId, "billAnalysisService");
        //     return {
        //         statusCode: StatusCodes.BAD_REQUEST,
        //         body: {
        //             message: "Solo puede cargar tickets dentro de las 24 horas posteriores a su emisión.",
        //             billStatus: BillStatus.BILL_LIMIT_24H_REACHED
        //         }
        //     }
        // }

        // Límite por día: 3 (tres) tickets válidos (por CUIT)
        // const ticketsPerDay = await billTable.getNumberOfBillsUploadedByUserBySameDayAndSameCUIT(userId, header.dateOfPurchase, header.cuit);

        // if (ticketsPerDay.length >= 3) {
        //     mergeObjects(billData, {
        //         id: billId,
        //         bill: {
        //             status: BillStatus.BILL_LIMIT_DAY_REACHED
        //         }
        //     })
        //     await billTable.putBill(billData, billId, "billAnalysisService");
        //     return {
        //         statusCode: StatusCodes.BAD_REQUEST,
        //         body: {
        //             message: "Solo puede cargar 3 tickets por día por CUIT.",
        //             billStatus: BillStatus.BILL_LIMIT_DAY_REACHED
        //         }
        //     };
        // }

        // const ticketsPerWeekAndMonth = await billTable.getAllBillsUploadedByUser(userId, header.cuit);

        // // Límite por semana: 15 (quince) tickets válidos (por CUIT)
        // const ticketsPerWeek = ticketsPerWeekAndMonth.filter(async (item) => {
        //     const data = await item;
        //     const date = new Date(data.bill.creationDate);
        //     const today = new Date();
        //     const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
        //     return date >= weekAgo;
        // });

        // if (ticketsPerWeek.length >= 15) {
        //     mergeObjects(billData, {
        //         id: billId,
        //         bill: {
        //             status: BillStatus.BILL_LIMIT_WEEK_REACHED
        //         }
        //     })
        //     await billTable.putBill(billData, billId, "billAnalysisService");
        //     return {
        //         statusCode: StatusCodes.BAD_REQUEST,
        //         body: {
        //             message: "Solo puede cargar 15 tickets por semana por CUIT.",
        //             billStatus: BillStatus.BILL_LIMIT_WEEK_REACHED
        //         }
        //     };
        // }

        // // Límite por mes: 40 (cuarenta) tickets válidos (por CUIT)
        // const ticketsPerMonth = ticketsPerWeekAndMonth.filter(async (item) => {
        //     const data = await item;
        //     const date = new Date(data.bill.creationDate);
        //     const today = new Date();
        //     const monthAgo = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
        //     return date >= monthAgo;
        // });

        // if (ticketsPerMonth.length >= 40) {
        //     mergeObjects(billData, {
        //         id: billId,
        //         bill: {
        //             status: BillStatus.BILL_LIMIT_MONTH_REACHED
        //         }
        //     })
        //     await billTable.putBill(billData, billId, "billAnalysisService");
        //     return {
        //         statusCode: StatusCodes.BAD_REQUEST,
        //         body: {
        //             message: "Solo puede cargar 40 tickets por mes por CUIT.",
        //             billStatus: BillStatus.BILL_LIMIT_MONTH_REACHED
        //         }
        //     };
        // }
    } catch (err) {
        logger.error({
            msg: "Error in billAnalysisService with message: " + JSON.stringify(err),
            error: err,
        });
        const billNewData = await billTable.getBill(billId);
        mergeObjects(billNewData, {
            id: billId,
            status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
            bill: {
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
            },
        });
        await billTable.putBill(billNewData, billId, "billAnalysisService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                message: "BillAnalysis processed unsuccessfully",
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        };
    }
};

function generateTicketHash(billData) {
    // Define las etiquetas que quieres incluir en el hash
    const relevantTagsType = ['ADDRESS', 'ZIP_CODE', 'NAME', 'AMOUNT_PAID', 'INVOICE_RECEIPT_DATE', 'TAX_PAYER_ID', 'NAME', 'VENDOR_NAME'];
    const relevantTagsLabels = ['CUIT', "TICKET", "TIENDA", 'P.V. N°', 'NRO.TIENDA', 'Nro. T.', 'C.U.I.T.', 'cuit', 'Domicilio', 'DOMICILIO', 'Fecha', 'Hora'];

    // Construye una cadena combinada de los valores de las etiquetas relevantes
    const hashStringType = relevantTagsType
        .map(tag => {
            // Busca la etiqueta en el JSON
            const tagInfo = billData.SummaryFields.find(field => field.Type.Text === tag);

            // Retorna el valor de la etiqueta o una cadena vacía si no se encuentra
            return tagInfo ? tagInfo.Value.Text : '';
        })
        .join(',');
    const hashStringLabel = relevantTagsLabels.map(tag => {
        const tagInfo = billData.SummaryFields.find((field) => {
            if (!field.Label.Text) return;
            const label = field.Label.Text;
            if (label.includes(tag)) {
                return field
            }
        });
        return tagInfo ? tagInfo.Value.Text : '';
    }).join(',')

    const hashString = hashStringType.concat('', hashStringLabel);
    // Aplica una función hash (en este caso, MD5)
    const hash = crypto.createHash('md5').update(hashString).digest('hex');

    return {
        hash: hash,
        hashStringLabel: billData.SummaryFields
    }
}

function findHeader(billData) {
    const header = {
        businessName: findBusinessName(billData),
        cuit: findCuit(billData),
        adress: findAdress(billData),
        pointOfSale: findPointOfSale(billData),
        ticketNumber: findTicketNumber(billData),
        dateOfPurchase: findDateOfPurchase(billData),
        purchaseTime: findPurchaseTime(billData),
        totalAmount: findTotalAmount(billData)
    };
    return header;
}

const findBusinessName = (billData) => {
    const relevantTagsType = ['NAME', 'VENDOR_NAME'];
    const businessNameInTags = relevantTagsType
        .map(tag => {
            // Busca la etiqueta en el JSON
            const tagInfo = billData.SummaryFields.find(field => field.Type.Text === tag && Object.keys(field.Label).length === 0);

            // Retorna el valor de la etiqueta o una cadena vacía si no se encuentra
            return tagInfo ? tagInfo.Value.Text : '';
        });
    const businessNameInTagsNew = businessNameInTags.filter((elem) => elem !== "")
    return businessNameInTagsNew.length > 0 ? businessNameInTagsNew[0] : ""
};

const findCuit = (billData) => {
    const relevantTagsLabels = [
        'C.U.I.T.',
        'cuit',
        'CUIT Nro.',
        'Nro :',
        'C.U.I.T. Nro :',
        'C.U.I.T. Nro.:',
        'C.U.I.T. Nro. :',
        'CUIT:',
        'CUIT Nro.:',
    ];

    const cuitInLabels = relevantTagsLabels.map(tag => {
        const tagInfo = billData.SummaryFields.find((field) => {
            if (!field.Label.Text) return;
            const label = field.Label.Text;
            if (label.includes(tag)) {
                return field
            }
        });
        return tagInfo ? tagInfo.Value.Text : '';
    })

    const cuitInLabelsNew = cuitInLabels.filter((elem) => elem !== "")
    const cuit = cuitInLabelsNew.length > 0 ? cuitInLabelsNew[0] : "";
    return cuit;
};

const findAdress = (billData) => {
    const relevantTagsLabels = ['Domicilio', 'DOMICILIO', 'Domicilio:'];

    const adressInLabels = relevantTagsLabels.map(tag => {
        const tagInfo = billData.SummaryFields.find((field) => {
            if (!field.Label.Text) return;
            const label = field.Label.Text;
            if (label.includes(tag)) {
                return field
            }
        });
        return tagInfo ? tagInfo.Value.Text : '';
    })

    const adressInLabelsNew = adressInLabels.filter((elem) => elem !== "")
    return adressInLabelsNew.length > 0 ? adressInLabelsNew[0] : ""
};

const findPointOfSale = (billData) => {
    const TARGET_LABELS = new Set(['P.V. N°', 'NRO.TIENDA', 'P.V.', 'No. T.:', 'Punto de venta:', 'PV:', 'P.V:']);

    const pointOfSale = billData.SummaryFields.find(({ Label }) => 
        TARGET_LABELS.has(Label.Text)
    );
    if (pointOfSale && pointOfSale.Value.Text !== undefined) return pointOfSale.Value.Text;

    for (const block of billData.Blocks) {
        if (block.BlockType === 'LINE') {
            const line_pv = findLinePointOfSale(block.Text);
            if (line_pv) {
                return line_pv;
            } else {
                continue
            }
        }
    }
    return "";
};

const findTicketNumber = (billData) => {
    const TARGET_LABELS = new Set(['Nro. T.', 'TIQUE', 'Nro ticket:', 'Número', 'Comp.:', 'NRO:']);

    const ticketNumber = billData.SummaryFields.find(({ Label }) =>
        TARGET_LABELS.has(Label.Text)
    );
    if (ticketNumber && ticketNumber !== undefined) return ticketNumber.Value.Text;

    for (const block of billData.Blocks) {
        if (block.BlockType === 'LINE') {
            const line_ticket = findLineTicketNumber(block.Text);
            if (line_ticket) {
                return line_ticket;
            } else {
                continue
            }
        } else if (block.BlockType === 'WORD') {
            const word_ticket = findWordTicketNumber(block.Text);
            if (word_ticket) {
                return word_ticket;
            } else {
                continue
            }
        }
    }
    return "";
};

const findDateOfPurchase = (billData) => {
    const RELEVANT_TYPE_TAGS = new Set(['INVOICE_RECEIPT_DATE', 'OTHER']);
    const IGNORE_LABELS = new Set(["Inicio de Actividades:", "Inicio de Actividades :", "Actividades:"]);
    const TARGET_LABELS = new Set(["Fecha", "Fecha y hora :"]);

    const dateOfPurchase = billData.SummaryFields.find(({ Type, Label }) =>
        RELEVANT_TYPE_TAGS.has(Type.Text) &&
        TARGET_LABELS.has(Label.Text) &&
        !IGNORE_LABELS.has(Label.Text)
    );
    if (dateOfPurchase) return dateOfPurchase?.Value?.Text;

    const dates = billData.Blocks
        .filter(({ BlockType }) => BlockType === 'WORD')
        .map(({ Text }) => normalizeDate(Text))
        .filter(Boolean)
        .map(dateStr => new Date(dateStr.split('/').reverse().join('-')));
    return dates.length > 0 ? findClosestDate(dates) : '';
};

const findPurchaseTime = (billData) => {
    const RELEVANT_TYPE_TAGS = new Set(['OTHER']);
    const TARGET_LABELS = new Set(["Hora", "Hora:", "Hora :"]);

    const purchaseTime = billData.SummaryFields.find(({ Type, Label }) =>
        RELEVANT_TYPE_TAGS.has(Type.Text) &&
        TARGET_LABELS.has(Label.Text)
    );
    if (purchaseTime) return purchaseTime?.Value?.Text;

    for (const block of billData.Blocks) {
        if (block.BlockType === 'WORD') {
            const time = normalizeTime(block.Text);
            if (time) {
                return time;
            } else {
                continue
            }
        }
    }
    return '';
};

const findTotalAmount = (billData) => {
    const relevantTagsType = ['TOTAL'];

    const totalAmountInTags = relevantTagsType
        .map(tag => {
            // Busca la etiqueta en el JSON
            const tagInfo = billData.SummaryFields.find(field => field.Type.Text === tag);

            // Retorna el valor de la etiqueta o una cadena vacía si no se encuentra
            return tagInfo ? tagInfo.Value.Text : '';
        });
    const totalAmountInTagsNew = totalAmountInTags.filter((elem) => elem !== "")

    if (totalAmountInTagsNew.length > 0) return totalAmountInTagsNew[0];

    const relevantTagsLabels = ['TOTAL'];


    const totalAmountInLabels = relevantTagsLabels.map(tag => {
        const tagInfo = billData.SummaryFields.find((field) => {
            if (!field.Label.Text) return;
            const label = field.Label.Text;
            if (label.includes(tag)) {
                return field
            }
        });
        return tagInfo ? tagInfo.Value.Text : '';
    })

    const totalAmountInLabelsNew = totalAmountInLabels.filter((elem) => elem !== "");
    return totalAmountInLabelsNew.length > 0 ? totalAmountInLabelsNew[0] : "";
};

const validatePurchaseDate = (dateOfPurchase: string, purchaseTime: string): Promise<boolean> => {
    const purchaseDateTimeStr = `${dateOfPurchase} ${purchaseTime}`;
    const purchaseDateTime = new Date(purchaseDateTimeStr);
    const currentDateTime = new Date();

    const timeDifference = currentDateTime.getTime() - purchaseDateTime.getTime();
    const timeDifferenceInHours = timeDifference / (1000 * 3600);

    if (timeDifferenceInHours > 24) {
        return Promise.resolve(false);
    }
    return Promise.resolve(true);
}
