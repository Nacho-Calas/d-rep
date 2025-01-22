import { StatusCodes } from "http-status-codes";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { UpdateCashbackAmountDTO } from "./updateCashbackAmountDTO";
import { mergeObjects } from "../../common/mergeObjects";
import { logger } from "../../common/logger";
const mainTable = new dynamoDBRepository();

export const updateCashbackAmountService = async (body: UpdateCashbackAmountDTO): Promise<any> => {
    try {
        const user = await mainTable.getUser(body.userId);
        let updatedCashbackAmount = user?.data?.cashbackAmount + body.cashbackAmount;

        mergeObjects(user, {
            data: {
            cashbackAmount: updatedCashbackAmount
            }
        });
        await mainTable.postUser(body.userId, user.data);

        return {
            statusCode: StatusCodes.OK,
            body: {
                message: `User updated successfully. New cashback amount: ${user.data.cashbackAmount}`
            }
        };
    } catch (err) {
        logger.error({
            msg: "Error in updateCashbackAmountService with message: " + err.msg,
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