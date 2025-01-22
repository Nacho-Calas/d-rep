import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { headersTableDynamoDBRepository } from "../../common/dynamoDB/headersTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { StatusCodes } from "http-status-codes";
import { sumFields } from "../../common/bills/sumFields";
import { logger } from "../../common/logger";

const billTable = new billTableDynamoDBRepository();
const headerTable = new headersTableDynamoDBRepository();

export const checkHeaderDictionaryService = async (billId: string): Promise<any> => {
    try {
        const billData = await billTable.getBill(billId);
        const billHeaderData = billData.bill.header;
        const cuit = billHeaderData.cuit;
        const billAddress = billHeaderData.adress;

        const headerData = await headerTable.getCuitWithGSI(cuit);
        const firstItem = headerData.Items[0];
        const headerAddresses: string[] = firstItem?.address?.L?.map(item => item?.S);
        const headerName = firstItem?.GSI1SK?.S;
        let name = billHeaderData?.businessName ? billHeaderData.businessName : headerName;
        if (!name) {
            name = '';
        }

        if ((headerData.Items.length !== 0 && 
            (billAddress && (headerAddresses)?.includes(billAddress))) ||
            !name
        ) {
            const isValidSum = await sumFields(JSON.parse(billData.bill.textractData));
            if (!isValidSum) {
                if (billData.type == BillType.VIDEO) {
                    mergeObjects(billData, {
                        id: billId,
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                        bill: {
                            status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                            header: {
                                businessName: name,
                            }
                        },
                        flag: billData.flag ? `${billData.flag}&INCORRECT_AMOUNTS` : 'INCORRECT_AMOUNTS'
                    });
                    await billTable.putBill(billData, billId, "checkHeaderDictionaryService");
                    return {
                        statusCode: StatusCodes.OK,
                        body: {
                            message: "Check Header Dictionary Service send Data to Product identify process successfully",
                            status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                        },
                    };
                }
                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                    bill: {
                        status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                        header: {
                            businessName: name,
                        }
                    },
                })
                await billTable.putBill(billData, billId, "checkHeaderDictionaryService");
                return {
                    statusCode: StatusCodes.PROCESSING,
                    body: {
                        message: "Check Header Dictionary Service send Data to BillTextractPreProcess successfully",
                        status: BillStatus.TEXTRACT_DATA_PREPROCESSED
                    },
                };
            } else {
                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                    bill: {
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                        header: {
                            businessName: name,
                        }
                    },
                });
                await billTable.putBill(billData, billId, "checkHeaderDictionaryService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "Check Header Dictionary Service send Data to Product identify process successfully",
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                    },
                };
            }
        } else {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.ADD_DICTIONARY,
                bill: {
                    status: BillStatus.ADD_DICTIONARY,
                    header: {
                        businessName: name,
                    }
                },
            });
            await billTable.putBill(billData, billId, "checkHeaderDictionaryService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "CheckHeaderDictionaryService send Data to AddDictionaryService",
                    status: BillStatus.ADD_DICTIONARY
                },
            };
        }
    } catch (error) {
        logger.error({
            msg: "Error in checkHeaderDictionaryService trying to process the ticket, with message: " + JSON.stringify(error),
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
        await billTable.putBill(billNewData, billId, "checkHeaderDictionaryService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error in checkHeaderDictionaryService trying to process the ticket. " + error,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        }
    }
}