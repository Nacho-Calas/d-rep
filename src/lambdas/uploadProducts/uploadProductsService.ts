import { v4 as uuidv4 } from 'uuid';
import { UploadProductsReqDTO } from './uploadProductsDTO';
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger'
import { StatusCodes } from 'http-status-codes';

export const uploadProductsService = async (req: UploadProductsReqDTO): Promise<any> => {
    try {
        let productsListIds = [];
        const dynamodb = new dynamoDBRepository();
        for await (const item of req.data) {
            const id = uuidv4();
            await dynamodb.postProduct(id, { product: item });
            productsListIds.push({
                id: id,
                name: item.name
            });
        };
        return {
            statusCode: StatusCodes.OK,
            body: productsListIds,
        };
    } catch (err) {
        logger.error({
            msg: "Error in uploadProductsService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to create the product.",
            },
        }
    }
};
