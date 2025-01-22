import { StatusCodes } from "http-status-codes";
import { validateHeaderByName } from "../../common/bills/validateHeaderByName";
import { BillStatus, BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { headersTableDynamoDBRepository } from "../../common/dynamoDB/headersTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { sumFields } from "../../common/bills/sumFields";

const billTable = new billTableDynamoDBRepository();
const headerTable = new headersTableDynamoDBRepository();

export const seekHeaderRelationshipsService = async (billId: string): Promise<any> => {
    try {
        const billData = await billTable.getBill(billId);
        // const textractData = JSON.parse(billData.bill.textractData);
        // const blockTypes = textractData.Blocks;
        // const headerData = await headerTable.getAllHeaders();

        // const validateHeader = validateHeaderByName(blockTypes, headerData);

        // if (validateHeader) {
        const isValidSum = await sumFields(JSON.parse(billData.bill.textractData));
        if (isValidSum) {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                bill: {
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                    // header: headerData
                },
            });
            await billTable.putBill(billData, billId, "seekRelationShipsService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "SeekRelationShipsService send Data to IntelligentHeaderOCRService",
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                },
            };
        } else {
            if (billData.type == BillType.VIDEO) {
                mergeObjects(billData, {
                    id: billId,
                    bill: {
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED,
                        // header: headerData
                    },
                    flag: billData.flag ? `${billData.flag}&INCORRECT_AMOUNTS` : 'INCORRECT_AMOUNTS'
                });
                await billTable.putBill(billData, billId, "seekRelationShipsService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "SeekRelationShipsService send Data to IntelligentHeaderOCRService",
                        status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                    },
                };
            };
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                bill: {
                    status: BillStatus.TEXTRACT_DATA_PREPROCESSED,
                    // header: headerData
                },
            });
            await billTable.putBill(billData, billId, "seekRelationShipsService");
            return {
                statusCode: StatusCodes.PROCESSING,
                body: {
                    message: "SeekRelationShipsService send Data to BillTextractPreProcess",
                    status: BillStatus.TEXTRACT_DATA_PREPROCESSED
                },
            };
        }
    }
    // else {
    //     mergeObjects(billData, {
    //         id: billId,
    //         bill: {
    //             status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
    //         },
    //     });
    //     await billTable.putBill(billData, billId, "seekRelationShipsService");
    //     return {
    //         statusCode: StatusCodes.OK,
    //         body: {
    //             message: "SeekRelationShipsService send Data to BillScanUnsuccessfull",
    //             status: BillStatus.BILL_SCAN_UNSUCCESSFUL
    //         },
    //     };
    // }


    catch (error) {
        console.error('Error in seekHeaderRelationshipsService with message: ', error);
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                message: "Error in seekHeaderRelationshipsService",
                error: error
            },
        };
    }
}