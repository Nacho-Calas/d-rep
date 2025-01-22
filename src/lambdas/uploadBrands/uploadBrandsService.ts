import { v4 as uuidv4 } from 'uuid';
import { UploadBrandsReqDTO } from './uploadBrandsDTO';
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger'
import { StatusCodes } from 'http-status-codes';

export const uploadBrandsService = async (req: UploadBrandsReqDTO): Promise<any> => {
    try {
        let brandsListIds = [];
        const dynamodb = new dynamoDBRepository();
        for await (const item of req.data) {
            const id = uuidv4();
            await dynamodb.postBrand(id, { brand: item })
            brandsListIds.push({
                id: id,
                name: item.name
            });
        }
        return {
            statusCode: StatusCodes.OK,
            body: brandsListIds,
        };
    } catch (err) {
        logger.error({
            msg: "Error in uploadBrandsService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to create the brand.",
            },
        }
    };
};
