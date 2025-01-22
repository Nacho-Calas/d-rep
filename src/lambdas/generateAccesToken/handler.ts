import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLogging } from '../../common/lambda-utils';
import {generateAccesTokenWithRefreshTokenService} from './generateAccesTokenService';
import {GenerateAccesTokenDTO} from './generateAccesTokenDTO';
import { generateAccesTokenReqSchema } from './generateAccesTokenReqSchema';

async function generateAccesTokenWithRefreshTokenLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        const  refreshToken :GenerateAccesTokenDTO =  JSON.parse(event.body);
        const { error } = generateAccesTokenReqSchema.validate(refreshToken);

        if (error) {
            return {
                statusCode: StatusCodes.UNAUTHORIZED,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        }
        
        const {statusCode, body} = await generateAccesTokenWithRefreshTokenService(refreshToken.refreshToken);

        return {
            statusCode: statusCode,
            body: body.response,
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        throw {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: "Error trying to generate AccesToken." }),
            headers: { 'Content-Type': 'application/json' }
        }
    }

}
export const handler = withApiLogging(generateAccesTokenWithRefreshTokenLambda);