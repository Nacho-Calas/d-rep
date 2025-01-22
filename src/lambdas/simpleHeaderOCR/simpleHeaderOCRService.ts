import { StatusCodes } from "http-status-codes";
import { BillStatus, BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { logger } from "../../common/logger";
import { validateCuit } from "../../common/bills/validateCuit";
import { normalizeCuit } from "../../common/bills/normalizeCuit";
import { correctCuit } from "../../common/bills/correctCuit";
import { normalizeSupermarketName } from "../../common/bills/normalizeSupermarketName";

const billTable = new billTableDynamoDBRepository();
export const simpleHeaderOCRService = async (billId: string): Promise<any> => {
    try {
        const billData = await billTable.getBill(billId);
        const textractData = JSON.parse(billData.bill.textractData);
        const summaryFields = textractData.SummaryFields;
        const normalizedSupermarketName = normalizeSupermarketName(billData.bill.header.businessName);
        let cuitFound = false;
        let cuit = '';

        for (let field of summaryFields) {
            if (
                field.Value &&
                field.Value.Confidence >= 95 &&
                field.Value.Text
            ) {
                let normalizedCuit = normalizeCuit(field.Value.Text);
                let correctedCuit = correctCuit(normalizedCuit);
                if (validateCuit(correctedCuit)) {
                    cuitFound = true;
                    cuit = correctedCuit;
                    break;
                }
            }
        }

        if (cuitFound) {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.CHECK_DICTIONARY,
                bill: {
                    status: BillStatus.CHECK_DICTIONARY,
                    header: {
                        cuit: cuit,
                        businessName: normalizedSupermarketName
                    }
                },
            })
            await billTable.putBill(billData, billId, "simpleHeaderOCRService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "SimpleHeaderOCRService send Data to CheckDictionaryService",
                    status: BillStatus.CHECK_DICTIONARY
                },
            };
        } else {
            if (billData.type == BillType.VIDEO) {
                const flag = billData.flag ? `${billData.flag}&INCORRECT_HEADERS` : 'INCORRECT_HEADERS';
                mergeObjects(billData, {
                    id: billId,
                    bill: {
                        status: BillStatus.CHECK_DICTIONARY,
                        header: {
                            cuit: cuit,
                            businessName: normalizedSupermarketName
                        }
                    },
                    flag: flag
                })
                await billTable.putBill(billData, billId, "simpleHeaderOCRService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "SimpleHeaderOCRService send Data to CheckDictionaryService",
                        status: BillStatus.CHECK_DICTIONARY
                    },
                };
            };
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
                bill: {
                    status: BillStatus.BILL_SCAN_UNSUCCESSFUL
                },
            })
            await billTable.putBill(billData, billId, "simpleHeaderOCRService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "SimpleHeaderOCRService processed unsuccessfully",
                    status: BillStatus.BILL_SCAN_UNSUCCESSFUL
                },
            };
        }

    } catch (error) {
        logger.error({
            msg: "Error in SimpleHeaderOCRService trying to process the ticket, with message: " + JSON.stringify(error),
            error: error,
        });
        const billNewData = await billTable.getBill(billId);
        mergeObjects(billNewData, {
            id: billId,
            status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
            bill: {
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
            },
        });
        await billTable.putBill(billNewData, billId, "SimpleHeaderOCRService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error in SimpleHeaderOCRService trying to process the ticket. " + error,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        }
    }
}