// import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
// import { StatusCodes } from 'http-status-codes';
// import { withApiLoggingAuth } from '../../common/lambda-utils';
// import { uploadBillVideoService } from './uploadBillVideoService';
// import { uploadBillReqSchema } from './uploadBillReqSchema';

// async function uploadBillVideoLambda(event: APIGatewayEvent, context: Context, userId: string): Promise<APIGatewayProxyResult> {
//     try {
//         const { error } = uploadBillReqSchema.validate(event.body);

//         if (error) {
//             return {
//                 statusCode: StatusCodes.BAD_REQUEST,
//                 body: JSON.stringify({ error: 'Solicitud no válida', details: error.details }),
//                 headers: { 'Content-Type': 'application/json' }
//             };
//         }
//         const { statusCode, body } = await uploadBillVideoService(event, userId);
//         return {
//             statusCode: statusCode,
//             body: JSON.stringify(body),
//             headers: { 'Content-Type': 'application/json' }
//         };
//     } catch (error) {
//         throw error
//     }
// }
// export const handler = withApiLoggingAuth(uploadBillVideoLambda);