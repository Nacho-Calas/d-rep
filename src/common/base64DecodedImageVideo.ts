import { APIGatewayEvent } from 'aws-lambda';
import { parse } from './aws-lambda-multipart-parser';
import { logger } from './logger';

export async function base64Decoded(event: APIGatewayEvent): Promise<any> {
    try {
        const { body, isBase64Encoded } = event;
        if (body == null) return {};
        // Verifica si la solicitud está codificada en base64
        const rawData = isBase64Encoded ? Buffer.from(body, 'base64').toString('binary') : body;

        logger.debug(rawData);

        // Analiza los datos multipart/form-data
        const fileData = await parse(event, true);

        // Ahora puedes acceder a los datos de la solicitud como un objeto formData
        logger.debug('Datos del formulario: ' + fileData);
        return fileData;
    } catch (error){
        logger.error({
            msg: "Error in uploadImage with message: " + JSON.stringify(error),
            error: error,
        });
        throw error;
    }
}
