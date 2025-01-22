
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { updateCashbackAmountSchema } from './updateCashbackAmountSchema';
import { UpdateCashbackAmountDTO } from './updateCashbackAmountDTO';
import { updateCashbackAmountService } from './updateCashbackAmountService';

async function updateCashbackAmountLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const payload: UpdateCashbackAmountDTO = JSON.parse(event.body);
        const { error } = updateCashbackAmountSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        const { statusCode, body } = await updateCashbackAmountService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(updateCashbackAmountLambda);