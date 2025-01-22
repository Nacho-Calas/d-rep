import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import { AuthorizeUserReqDTO } from './authorizeUserDTO';
import { authorizeUserReqSchema } from './authorizeUserReqSchema';
import { authorizeUserService } from './authorizeUserService';

const authorizeUserLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
        const payload: AuthorizeUserReqDTO = JSON.parse(event.body);
        const { error } = authorizeUserReqSchema.validate(payload);

        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        const { statusCode, body } = await authorizeUserService(payload);
        return {
            statusCode: statusCode,
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw error
    }
}
export const handler = withApiLogging(authorizeUserLambda);