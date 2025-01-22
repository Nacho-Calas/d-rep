import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';
import { mergeObjects } from "../../common/mergeObjects";
const mainTable = new dynamoDBRepository();

export const logicalEraseUSerService = async (userId: string): Promise<any> => {
    try {
        const user = await mainTable.getUser(userId);
        mergeObjects(user, {
            data: { isDeleted: true }
        });
        await mainTable.postUser(userId, user.data);
        return {
            statusCode: StatusCodes.OK,
            body: user.data
        };
    } catch (err) {
        logger.error({
            msg: "Error in logicalEraseUSerService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to delete user.",
            },
        }
    }
};
