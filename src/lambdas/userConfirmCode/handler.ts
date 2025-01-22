import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { withApiLogging } from '../../common/lambda-utils';
import { StatusCodes } from 'http-status-codes';
import { userConfirmCodeReqDTO } from './userConfirmCodeDTO';
import { userConfirmCodeReqSchema } from './userConfirmCodeReqSchema';
import { userConfirmCodeService } from './userConfirmCodeService';

const userConfirmCodeLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: userConfirmCodeReqDTO = JSON.parse(event.body);
        const { error } = userConfirmCodeReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await userConfirmCodeService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(userConfirmCodeLambda);