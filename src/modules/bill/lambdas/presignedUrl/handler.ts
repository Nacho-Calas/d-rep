import { APIGatewayEvent, APIGatewayProxyResult } from "aws-lambda";
import { withApiLoggingAuth } from "../../../../common/lambda-utils";
import { GetPresignedUrlUseCase } from "../../application/use_cases/getPresignedURL.case";
import { S3Adapter } from "../../infrastructure/adapters/S3.adapter";
import { BillDynamoDBRepository } from "../../infrastructure/repositories/BillDynamoDBRepository";

async function generatePresignedUrlLambda(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {
    // 1) Extraer user ID del token JWT
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: "Missing user identification" }),
      };
    }

    // 2) Configurar dependencias
    const billRepo = new BillDynamoDBRepository({
      tableName: process.env.TABLE_BILLS!,
    });
    const s3Adapter = new S3Adapter();

    // 3) Crear caso de uso
    const useCase = new GetPresignedUrlUseCase(billRepo, s3Adapter);

    // 4) Ejecutar caso de uso
    const result = await useCase.execute(userId);

    // Crear tipos de Respuestas  de API Gateway
    // return new ResponseApiGateway(result.statusCode, result.body, result.headers);
    return {
      statusCode: result.statusCode,
      body: JSON.stringify(result.body),
      headers: {
        "Content-Type": "application/json",
        ...result.headers,
      },
    };
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal server error" }),
    };
  }
}

export const handler = withApiLoggingAuth(generatePresignedUrlLambda);
