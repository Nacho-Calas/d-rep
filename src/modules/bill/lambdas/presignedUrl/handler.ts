import { APIGatewayEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { BillDynamoDBRepository } from "../../infrastructure/repositories/BillDynamoDBRepository";
import { S3Adapter } from "../../infrastructure/adapters/S3.adapter";
import { GetPresignedUrlUseCase } from "../../application/use_cases/getPresignedURL.case";
import { withApiLoggingAuth } from "../../../../common/lambda-utils";



async function generatePresignedUrlLambda(
  event: APIGatewayEvent
): Promise<APIGatewayProxyResult> {
  try {


  }
}

export const handler = withApiLoggingAuth(generatePresignedUrlLambda);
