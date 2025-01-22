import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';
import { UpdateUserDTO } from './updateUserDTO';
import { mergeObjects } from "../../common/mergeObjects";
const mainTable = new dynamoDBRepository();

export const updateUserService = async (body: UpdateUserDTO, userId: string): Promise<any> => {
    try {
        const user = await mainTable.getUser(userId);
        mergeObjects(user, {
            data: body
        });
        mergeObjects(user, {
            data :{ isFormCompleted: true }
        });
        await mainTable.postUser(userId, user.data);
        return {
            statusCode: StatusCodes.OK,
            body: user.data
        };
    } catch (err) {
        logger.error({
            msg: "Error in updateUserService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to update user.",
            },
        }
    }
};
