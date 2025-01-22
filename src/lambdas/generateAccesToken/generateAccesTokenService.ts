import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { logger } from "../../common/logger";
import { DecryptCommand, KMSClient } from "@aws-sdk/client-kms";
import { StatusCodes } from "http-status-codes";
import { decode, JwtPayload } from "jsonwebtoken";
import AWS from "aws-sdk";

const clientEncripted = process.env.COGNITO_CLIENT_ID_ENCRYPTED;
const tableName = process.env.MAIN_TABLE;
const dynamoDB = new AWS.DynamoDB.DocumentClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({
  region: process.env.REGION_COGNITO,
});
const kms = new KMSClient({ region: "us-east-2" });

export const generateAccesTokenWithRefreshTokenService = async (
  refreshToken: string,
): Promise<any> => {
  try {
    const clientId = await getClientId();

    const params: InitiateAuthCommandInput = {
      AuthFlow: "REFRESH_TOKEN_AUTH",
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };
    const response = await client.send(new InitiateAuthCommand(params));

    const lastTokendate = new Date().toISOString();
    await saveLastRefreshToDB(
      lastTokendate,
      response.AuthenticationResult.AccessToken
    );

    return {
      statusCode: StatusCodes.OK,
      body: {
        response: response.AuthenticationResult.AccessToken,
      },
    };
  } catch (error) {
    logger.error({
      msg: "Error in GenerateAccesToken: " + error.msg,
      error: error,
    });
    return {
      statusCode: StatusCodes.UNAUTHORIZED,
      body: {
        error: "Error trying generate acces token.",
      },
    };
  }
};

const getClientId = async () => {
  try {
    const params = {
      CiphertextBlob: Buffer.from(clientEncripted, "base64"),
    };

    const data = await kms
      .send(new DecryptCommand(params))
      .then((value) => value)
      .catch((err) => {
        logger.error({
          msg:
            "Error in registerUserService - getClientId with message: 123" +
            err.msg,
          error: err,
        });
        throw err;
      });
    const clientId = String.fromCharCode.apply(
      null,
      new Uint16Array(data.Plaintext)
    );
    return clientId;
  } catch (error) {
    logger.error({
      msg:
        "Error in registerUserService - getClientId with message: 12" +
        error.msg,
      error: error,
    });
    throw error;
  }
};

const saveLastRefreshToDB = async (date: string, accessToken: string) => {
  const decodedPayload: string | JwtPayload = decode(accessToken);
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
    const userName = decodedPayload.sub;
    logger.info("userId", userName);
    try {
      const params = {
        TableName: tableName,
        Key: {
          PK: `user#${userName}`,
          SK: "info",
        },
        UpdateExpression: "set #lastTokenRequest = :lastTokenRequest",
        ExpressionAttributeNames: {
          "#lastTokenRequest": "lastTokenRequest",
        },
        ExpressionAttributeValues: {
          ":lastTokenRequest": date,
        },
        ReturnValues: "UPDATED_NEW",
      };
      try {
        logger.info(JSON.stringify(params));
        await dynamoDB.update(params).promise();
        logger.info(`lastTokenRequest saved to DynamoDB`);
      } catch (error) {
        logger.error(`Error saving lastTokenRequest to DynamoDB:`, error);
      }
    } catch (error) {
      logger.error(`Error saving lastTokenRequest ${userName} to DynamoDB:`, error);
    }
  }
};
