import { GetUserDTO } from "./getUserDTO";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { StatusCodes } from 'http-status-codes';
import { mergeObjects } from "../../common/mergeObjects";
import { logger } from "../../common/logger";

const mainTable = new dynamoDBRepository();

export const getProfileSummaryService = async (userId: string): Promise<any> => {
  try {
    const user = await mainTable.getUser(userId);
    const response: GetUserDTO = {
        email: user.data.email,
        cashbackAmount: user.data.cashbackAmount
    }
    if (user.data.nameAndLastName != undefined) mergeObjects(response, {nameAndLastName: user.data.nameAndLastName})
    return {
      statusCode: StatusCodes.OK,
      body: response
  };
  } catch (error) {
    logger.error({
      msg:
        "Error in getBannersService on getBannersService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};