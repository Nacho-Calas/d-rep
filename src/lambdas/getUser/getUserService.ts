import { GetUserDTO } from "./getUserDTO";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { StatusCodes } from 'http-status-codes';
import { logger } from "../../common/logger";

const mainTable = new dynamoDBRepository();

export const getUserService = async (userId: string): Promise<any> => {
  try {
    const user = await mainTable.getUser(userId);
    return {
      statusCode: StatusCodes.OK,
      body: user.data
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