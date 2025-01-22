import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { StatusCodes } from 'http-status-codes';
import { S3RepositoryInstance } from '../../common/s3Repository';
import { base64Decoded } from '../../common/base64DecodedImageVideo';
import { logger } from '../../common/logger';
import { withApiLogging } from '../../common/lambda-utils';

async function uploadImageLambda(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    try {
        // TODO: Revisar que retornar en la respuesta (por ej: el filepath en el S3).
        // cambiar a un service
        const fileData = await base64Decoded(event);
        const filename = fileData.userId != undefined ? fileData.userId : fileData.base64File.filename;
        const s3FileName = `${filename}_${Date.now()}.${fileData.base64File.contentType.split('/')[1]}`;
        logger.debug('Nombre del archivo a guardar en S3: ' + s3FileName);

        const response = await S3RepositoryInstance.uploadFileToS3(fileData.base64File.content, s3FileName, process.env.BUCKET_PRODUCTS, true);
        return {
            statusCode: StatusCodes.OK,
            body: JSON.stringify({ id: JSON.stringify(response.url) }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (err) {
        logger.error({
            msg: "Error in uploadImage with message: " + err.msg,
            error: err,
        });
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: JSON.stringify({ error: "Error trying to upload the file." }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
}
export const handler = withApiLogging(uploadImageLambda);