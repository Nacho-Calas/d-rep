import { v4 as uuidv4 } from 'uuid';
import { UploadSupplierReqDTO } from './uploadSupplierDTO';
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from '../../common/logger'
import { StatusCodes } from 'http-status-codes';

export const uploadSupplierService = async (req: UploadSupplierReqDTO): Promise<any> => {
    try {
        const dynamodb = new dynamoDBRepository();
        const supplierID = uuidv4();
        await dynamodb.postSupplier(supplierID, { supplier: req.data });
        return {
            statusCode: StatusCodes.OK,
            body: {id: supplierID},
        };
    } catch (err) {
        logger.error({
            msg: "Error in uploadSupplierService with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                error: "Error trying to create the supplier.",
            },
        }
    }
};
