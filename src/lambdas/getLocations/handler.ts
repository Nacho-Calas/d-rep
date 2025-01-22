import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../../common/logger';
import { withApiLogging } from '../../common/lambda-utils';
import { getCitiesService, getStatesService, getCountriesService } from './getLocationsService';

const getLocationsLambda = async (event: APIGatewayEvent | any, context: Context): Promise<APIGatewayProxyResult> => {
    const citiesURLPattern = /^\/countries\/[^/]+\/states\/[^/]+\/cities$/;
    const statesURLPattern = /^\/countries\/[^/]+\/states$/;
    const countriesURLPattern = /^\/countries$/;

    const path = event.requestContext.http.path;

    let country, response, beginsWithParam;

    switch (true) {
        case citiesURLPattern.test(path):
            const { country: cityCountry, state } = event.pathParameters;
            country = cityCountry;
            beginsWithParam = event.queryStringParameters == undefined ? undefined : event.queryStringParameters.beginsWith;
            response = await getCitiesService(country, state, beginsWithParam);
            break;
        case statesURLPattern.test(path):
            const { country: stateCountry } = event.pathParameters;
            country = stateCountry;
            beginsWithParam = event.queryStringParameters == undefined ? undefined : event.queryStringParameters.beginsWith;
            response = await getStatesService(country, beginsWithParam);
            break;
        case countriesURLPattern.test(path):
            response = await getCountriesService();
            break;
        default:
            logger.error({
                msg: "URL not found"
            });
            return {
                statusCode: StatusCodes.NOT_FOUND,
                body: 'URL not found',
                headers: { 'Content-Type': 'application/json' }
            }
    }
    return {
        statusCode: StatusCodes.OK,
        body: JSON.stringify(response),
        headers: { 'Content-Type': 'application/json' }
    }
}
export const handler = withApiLogging(getLocationsLambda);