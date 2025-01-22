import { HeaderTableInterface } from "../../common/dynamoDB/headersTableDynamoDBInterface";
import { v4 as uuidv4 } from 'uuid';
import { headersTableDynamoDBRepository } from "../../common/dynamoDB/headersTableDynamoDBRepository";
import { StatusCodes } from "http-status-codes";
import { logger } from "../../common/logger";
import { sumFields } from "../../common/bills/sumFields";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { BillStatus, BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";

const billTable = new billTableDynamoDBRepository();
const headerTable = new headersTableDynamoDBRepository();
export const addHeaderDictionaryService = async (billId: string): Promise<any> => {
    try {
        const billData = await billTable.getBill(billId);
        const billHeaderData = billData.bill.header;
        const billAddress: string = billHeaderData.adress;
        const headerData = await headerTable.getCuitWithGSI(billHeaderData.cuit);
        if (headerData.Items.length !== 0) {
            const firstItem = headerData.Items[0];
            const headerAddresses: string[] = firstItem?.address?.L?.map(item => item?.S);
            const itemsFormatted = {
                GSI2PK: firstItem?.GSI2PK?.S,
                GSI1PK: firstItem?.GSI1PK?.S,
                address: firstItem?.address?.L?.map(item => item?.S),
                GSI1SK: firstItem?.GSI1SK?.S,
                id: firstItem?.id?.S,
                GSI2SK: firstItem?.GSI2SK?.S
            };
            if (!headerAddresses?.includes(billAddress)) {
                mergeObjects(itemsFormatted, {
                    id: itemsFormatted.id,
                    address: [...headerAddresses, billAddress],
                })
                await headerTable.putHeaderData(itemsFormatted);
            }
        } else {
            const idHeader = uuidv4();
            const newHeaderData: HeaderTableInterface = {
                id: idHeader || "",
                name: billHeaderData.businessName || "",
                cuit: billHeaderData.cuit || "",
                address: [billAddress] || [""],
            }
            await headerTable.newHeaderData(newHeaderData, idHeader);
        }

        const isValidSum = await sumFields(JSON.parse(billData.bill.textractData));
        if (!isValidSum) {
            if (billData.type == BillType.VIDEO) {
                mergeObjects(billData, {
                    id: billId,
                    bill: {
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                    },
                    flag: billData.flag ? `${billData.flag}&INCORRECT_AMOUNTS` : 'INCORRECT_AMOUNTS'
                });
                await billTable.putBill(billData, billId, "addHeaderDictionaryService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "Add new Header and send data to Product identify process successfully",
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                    },
                };
            };
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                bill: {
                    status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                },
            })
            await billTable.putBill(billData, billId, "addHeaderDictionaryService");
            return {
                statusCode: StatusCodes.PROCESSING,
                body: {
                    message: "Add new Header and send data to BillTextractPreProcess successfully",
                    status: BillStatus.TEXTRACT_DATA_PREPROCESSED
                },
            };
        } else {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                bill: {
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                },
            });
            await billTable.putBill(billData, billId, "addHeaderDictionaryService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "Add new Header and send data to Product identify process successfully",
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                },
            };
        }
    } catch (error) {
        logger.error({
            msg: "Error in addHeaderDictionaryService trying to process the ticket, with message: " + JSON.stringify(error),
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
        await billTable.putBill(billNewData, billId, "addHeaderDictionaryService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error in addHeaderDictionaryService trying to process the ticket. " + error,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        }
    }
}