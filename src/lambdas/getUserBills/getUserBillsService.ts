import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { logger } from "../../common/logger";
import { BillResponseDTO, GetBillsBodyDTO } from "./getUserBillsDTO";

const billTable = new billTableDynamoDBRepository();

export const getUserBillsService = async (
  userId: string,
  body?: GetBillsBodyDTO
): Promise<any> => {
  try {
    const { lastEvaluatedKeyId, limit, status } = body;
    const bills = await billTable.getUserBillsById(
      userId,
      lastEvaluatedKeyId,
      limit,
      status
    );
    return bills;
  } catch (error) {
    logger.error({
      msg: "Error in getUserBillsService with message: " + error.msg,
      error: error,
    });
    throw error;
  }
};
