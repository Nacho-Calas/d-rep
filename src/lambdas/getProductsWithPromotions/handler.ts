import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { withApiLoggingAuth } from '../../common/lambda-utils';
import { GetProductPromotionsReqDTO } from './getProductsWithPromotionsDTO';
import { getProductsWithPromotionsReqSchema } from './getProductsWithPromotionsReqSchema';
import { getProductsWithPromotionsService } from './getProductsWithPromotionsService';

const getProductsWithPromotionsLambda = async (event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> => {
    const { pageNumber, pageSize, category, keyword, sortingSeed } = event.queryStringParameters;

    try {
        const payload: GetProductPromotionsReqDTO = {
            pageNumber: parseInt(pageNumber),
            pageSize: parseInt(pageSize),
            category: category,
            keyword: keyword,
            sortingSeed: sortingSeed
        };
        const { error } = getProductsWithPromotionsReqSchema.validate(payload);
        if (error) {
            return {
                statusCode: StatusCodes.BAD_REQUEST,
                body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
                headers: { 'Content-Type': 'application/json' }
            };
        };

        const response = await getProductsWithPromotionsService(payload);
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify(response),
            headers: { 'Content-Type': 'application/json' }
        }
    } catch (error) {
        throw error
    }
}
export const handler = withApiLoggingAuth(getProductsWithPromotionsLambda);