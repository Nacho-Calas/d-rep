import { StatusCodes } from "http-status-codes";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from "../../common/logger";
import { UserPersonalInfoDTO } from "./userPersonalInfoDTO";
import { mergeObjects } from "../../common/mergeObjects";

const mainTable = new dynamoDBRepository();

export const userPersonalInfoService = async (body: UserPersonalInfoDTO): Promise<any> => {
    try {
        const userDataGSI = await mainTable.getUserWithGSI(body.username);
        const userId = userDataGSI[0].PK.split('#')[1];
        const userData = await mainTable.getUser(userId);

        mergeObjects(userData, {
            data: body
        });
        mergeObjects(userData, {
            data: {
                isFormCompleted: true,
                isDeleted: false
            }
        });

        await mainTable
            .postUser(userId, userData.data)
            .catch((error) => {
                logger.error({
                    msg: "Error in userPersonalInfoService - postUser with message: " + error,
                    error: error,
                });
                throw error;
            });

        return {
            statusCode: StatusCodes.OK,
            body: { message: "personal info saved" }
        };
    } catch (err) {
        logger.error({
            msg: "Error in userPersonalInfoService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to save user personal info.",
            },
        }
    }
};