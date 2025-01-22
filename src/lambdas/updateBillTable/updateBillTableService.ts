import { StatusCodes } from "http-status-codes";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { mergeObjects } from "../../common/mergeObjects";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { logger } from "../../common/logger";
import { UpdateBillTableDTO } from "./updateBillTableDTO";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";

const billTable = new billTableDynamoDBRepository();
const billTableVertex = new billTableVertexDynamoDBRepository();

export const updateBillTableService = async (
  body: UpdateBillTableDTO
): Promise<any> => {
  try {
    const billData = await billTableVertex.getBill(body.billId);
    if (billData === null) {
      return {
        statusCode: StatusCodes.NOT_FOUND,
        body: {
          error: "Bill not found in DynamoDB",
        },
      };
    }
    console.log("billData", billData);
    console.log(process.env.BUCKET_BILLS);

      mergeObjects(billData, {
        status: BillStatus.UPLOAD_ERROR,
        bill: {
          status: BillStatus.UPLOAD_ERROR,
        },
      });

      await billTable.newBill(billData, billData.id, "updateBillTableService");
      await billTableVertex.putBill(billData, billData.id, "updateBillTableService");

      return {
        statusCode: StatusCodes.OK,
        body: {
          message: "OK",
          id: billData.id,
        },
      };
  } catch (err) {
    logger.error({
      msg: "Error in updateBillTableService with message: " + err.msg,
      error: err,
    });
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        error: "Error trying to check bill table and S3 file.",
      },
    };
  }
};
