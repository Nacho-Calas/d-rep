import { StatusCodes } from "http-status-codes";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { processReceipt } from "../../common/textract-preprocessing";
import { AnalyzeExpenseCommandOutput } from '@aws-sdk/client-textract';
import { TextractInstance } from "../../common/textract";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from "../../common/logger";

const billTable = new billTableDynamoDBRepository();
const mainTable = new dynamoDBRepository();
export const billTextractPreProcessingService = async (billId: string, urlBill: string): Promise<any> => {
    try {
        const textractOutput: AnalyzeExpenseCommandOutput = await TextractInstance.analyzeExpense(urlBill);
        const billData = await billTable.getBill(billId);
        const textractData = await processReceipt(textractOutput);

        if (textractData.status === false) {
            mergeObjects(billData, {
                id: billId,
                bill: {
                    status: BillStatus.BILL_SCAN_UNSUCCESSFUL
                }
            });
            await billTable.putBill(billData, billId, "billTextractPreProcessingService");
            return {
                statusCode: StatusCodes.OK,
                body: { billStatus: BillStatus.BILL_SCAN_UNSUCCESSFUL }
            };
        } else {
            mergeObjects(billData, {
                id: billId,
                bill: {
                    textractData: JSON.stringify(textractData.data),
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                }
            });
            await billTable.putBill(billData, billId, "billTextractPreProcessingService");
            return {
                statusCode: StatusCodes.OK,
                body: {
                    message: "Bill processed successfully",
                    textractData: JSON.stringify(textractData.data),
                    status: BillStatus.TEXTRACT_RESPONSE_ANALYZED
                },
            };
        }
    } catch (error) {
        logger.error({
            msg: "Error in billTextractPreProcessingService trying to process the ticket, with message: " + JSON.stringify(error),
            error: error,
        });
        const billNewData = await billTable.getBill(billId);
        mergeObjects(billNewData, {
            id: billId,
            bill: {
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
            },
        });
        await billTable.putBill(billNewData, billId, "billTextractPreProcessingService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error in billTextractPreProcessingService trying to process the ticket. " + error,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        }
    }
};