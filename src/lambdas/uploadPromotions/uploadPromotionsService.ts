import { v4 as uuidv4 } from 'uuid';
import { UploadPromotionsReqDTO } from './uploadPromotionsDTO';
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger'
import { StatusCodes } from 'http-status-codes';

export const uploadPromotionsService = async (req: UploadPromotionsReqDTO): Promise<any> => {
    try {
        let promotionsListIds = [];
        const dynamodb = new dynamoDBRepository();
        for await (const item of req.data) {
            const id = uuidv4();
            await dynamodb.postPromotions(id, { promotion: item });
            promotionsListIds.push({
                id: id,
                name: item.name
            });
        };
        return {
            statusCode: StatusCodes.OK,
            body: promotionsListIds,
        };
    } catch (err) {
        logger.error({
            msg: "Error in uploadPromotionsService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to create the promotion.",
            },
        }
    }
};
