import { commonTableDynamoDBRepository } from "../../common/dynamoDB/commonTableDynamoDBRepository";
import { PostBannersDTO } from './postBannersDTO';
import { logger } from '../../common/logger'
import { StatusCodes } from 'http-status-codes';

export const uploadBannersService = async (req: PostBannersDTO[]): Promise<any> => {
    try {
        const dynamodb = new commonTableDynamoDBRepository();
        await dynamodb.postBanners(req)
        return {
            statusCode: StatusCodes.OK,
            body: {mesagge: 'OK'},
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
