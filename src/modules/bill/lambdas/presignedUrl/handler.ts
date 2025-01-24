import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BillDynamoDBRepository } from "../../infrastructure/repositories/BillDynamoDBRepository";
import { S3Adapter } from "../../infrastructure/adapters/S3.adapter";
import { GetPresignedUrlUseCase } from "../../application/use_cases/getPresignedURL.case";
import { withApiLoggingAuth } from '../../../../common/lambda-utils';


const billRepo = new BillDynamoDBRepository();
const s3Adapter = new S3Adapter();
const getPresignedUrlUseCase = new GetPresignedUrlUseCase(billRepo, s3Adapter);

async function generatePresignedUrlLambda(
  event: APIGatewayEvent,
  context: Context,
  userId: string
): Promise<APIGatewayProxyResult> {
  try {
    // 1) ejecutas el UseCase
    const result = await getPresignedUrlUseCase.execute(userId);

    // 2) devuelves la respuesta
    return {
      statusCode: result.statusCode,
      body: JSON.stringify(result.body),
      headers: result.headers || { "Content-Type": "application/json" },
    };
  } catch (error) {
    // Manejo de error
    return {
    //   statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: JSON.stringify({ error: "Error trying to get presigned url." }),
      headers: { "Content-Type": "application/json" },
    };
  }
}

export const handler = withApiLoggingAuth(generatePresignedUrlLambda);
