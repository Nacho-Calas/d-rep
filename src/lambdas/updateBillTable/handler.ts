import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { updateBillTableService } from './updateBillTableService';
import { UpdateBillTableDTO } from './updateBillTableDTO';
import { updateBillTableSchema } from './updateBillTableSchema';
import { logger } from '../../common/logger';

async function updateBillTableLambda(event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> {
    try {
        const payload: UpdateBillTableDTO = JSON.parse(event.body);
        const { error } = updateBillTableSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await updateBillTableService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        logger.error("Error in updateBillTableLambda", error);
        throw {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            message: "Error trying to update bill table.",
            error: error
        }
    }
}
export const handler = withApiLoggingAuth(updateBillTableLambda);