import { StatusCodes } from "http-status-codes";
import { validateCuit } from "../../common/bills/validateCuit";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { logger } from "../../common/logger";
import { mergeObjects } from "../../common/mergeObjects";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";

const billTable = new billTableDynamoDBRepository();

export const intelligentHeaderOCRService = async (billId: string): Promise<any> => {
    try {
        const billData = await billTable.getBill(billId);
        const textractData = JSON.parse(billData.bill.textractData);
        const blockTypes = textractData.Blocks;

        let cuit = null;

        for (let field of blockTypes) {
            if (field.BlockType === 'WORD' && validateCuit(field.Text) && field.Confidence >= 94) {
                cuit = field.Text;

                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.CHECK_DICTIONARY,
                    bill: {
                        status: BillStatus.CHECK_DICTIONARY,
                        header: {
                            cuit: cuit
                        }
                    },
                })
                await billTable.putBill(billData, billId, "intelligentHeaderOCRService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "intelligentHeaderOCRService send Data to CheckDictionaryService",
                        status: BillStatus.CHECK_DICTIONARY
                    },
                };
            } else { 
                mergeObjects(billData, {
                    id: billId,
                    status: BillStatus.SEEK_RELATIONSHIPS,
                    bill: {
                        status: BillStatus.SEEK_RELATIONSHIPS,
                    },
                })
                await billTable.putBill(billData, billId, "intelligentHeaderOCRService");
                return {
                    statusCode: StatusCodes.OK,
                    body: {
                        message: "intelligentHeaderOCRService send Data to SeekRelationshipsService",
                        status: BillStatus.SEEK_RELATIONSHIPS
                    },
                };
            }
        }
    } catch (error) {
        logger.error({
            msg: 'Error in intelligentHeaderOCRService with message: ' + error.msg,
            error: error
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: 'Error trying to read header in intelligentHeaderOCRService.',
                message: error.msg
            }
        };
    }
}

