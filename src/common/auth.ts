import {
  CognitoIdentityProviderClient,
  GetUserCommand,
  GetUserCommandOutput,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  InitiateAuthCommandOutput,
} from "@aws-sdk/client-cognito-identity-provider";
import { decode, JwtPayload } from "jsonwebtoken";
import { logger } from "./logger";
import { DecryptCommand, KMSClient } from "@aws-sdk/client-kms";
const kms = new KMSClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({
  region: process.env.REGION_COGNITO,
});
const  clientEncripted = process.env.COGNITO_CLIENT_ID_ENCRYPTED;
export const authService = async (
  event
): Promise<{
  statusCode: number;
  body: GetUserCommandOutput | { message: string };
  userId?: string;
}> => {
  try {
    const token = event.headers.authorization.split(" ")[1];
    
    const params = {
      AccessToken: token,
    };
    const response: GetUserCommandOutput = await client.send(
      new GetUserCommand(params)
    );
    const decodedPayload: string | JwtPayload = decode(
      token
    );

    if (typeof decodedPayload === "string") {
      logger.error({
        msg: "Invalid token is string",
        error: "Invalid token is string",
      });
      return {
        statusCode: 401,
        body: { message: "Unauthorized" },
      };
    } else {
      logger.info({
        userId: decodedPayload.sub,
        userName: response.Username,
      });
      return {
        statusCode: 200,
        body: response,
        userId: decodedPayload.sub,
      };
    }
  } catch (error) {
    logger.error({
      msg: "Invalid token " + error.msg,
      error: error,
    });
    return {
      statusCode: 401,
      body: { message: "Unauthorized" },
    };
  }
};