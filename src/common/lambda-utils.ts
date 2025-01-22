import { APIGatewayEvent, APIGatewayProxyResult, Context, S3Event, SQSEvent } from 'aws-lambda';
import { logger } from './logger';
import { authService } from './auth';
import { DynamoDBStreamEvent } from './dynamoDB/DynamoDBStreamEventInterface';
import { SQSEventInterface } from './sqsEventInterface';


export const withApiLogging = (fn: (event1: APIGatewayEvent, context1: Context) => Promise<APIGatewayProxyResult>) => async (event: APIGatewayEvent, context: Context) => {
    logger.info({
        "requestBody": event.body,
        "requestHeaders": event.headers,
        "requestMethod": event.httpMethod,
        "requestPath": event.path,
        "requestQueryParams": event.queryStringParameters
    });
    
    const result = await fn(event, context);
    logger.info({
        "response": result
    });
    return result;
};

export const withApiLoggingAuth = (fn: (event1: APIGatewayEvent, context1: Context, userId1: string) => Promise<APIGatewayProxyResult>) => async (event: APIGatewayEvent, context: Context, userId: string ) => {
    const authResponse = await authService(event);
    logger.info({
        "authResponse": authResponse.body,
        "requestBody": event.body,
        "requestHeaders": event.headers,
        "requestMethod": event.httpMethod,
        "requestPath": event.path,
        "requestQueryParams": event.queryStringParameters
    });
    if ('message' in authResponse.body) return { statusCode: authResponse.statusCode, body: JSON.stringify(authResponse.body), headers: { 'Content-Type': 'application/json' } }
    const result = await fn(event, context, authResponse.userId);
    logger.info({
        "response": result
    });
    return result;
};

export const withDynamoDBLogging = (fn: (event1: DynamoDBStreamEvent, context1: Context) => Promise<any>) => async (event: DynamoDBStreamEvent, context: Context) => {
    logger.info(event);
    const result = await fn(event, context);
    logger.info({
        "response": result
    });
    return {response: result} ;
};

export const withSQSLogging = (fn: (event1: SQSEventInterface, context1: Context) => Promise<any>) => async (event: SQSEventInterface, context: Context) => {
    logger.info(event);
    const result = await fn(event, context);
    logger.info({
        "response": result
    });
    return {response: result} ;
};

export const withSQSLogging1 = (fn: (event1: SQSEvent, context1: Context) => Promise<any>) => async (event: SQSEvent, context: Context) => {
    logger.info(event);
    const result = await fn(event, context);
    logger.info({
        "response": result
    });
    return {response: result} ;
};

export const withS3Logging = (fn: (event1: S3Event, context1: Context) => Promise<any>) => async (event: S3Event, context: Context) => {
    logger.info(event);
    const result = await fn(event, context);
    logger.info({
        "response": result
    });
    return {response: result} ;
};