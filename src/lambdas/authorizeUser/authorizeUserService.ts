import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandOutput,
  InitiateAuthCommandInput,
} from "@aws-sdk/client-cognito-identity-provider";
import { AuthorizeUserReqDTO } from "./authorizeUserDTO";
import { logger } from "../../common/logger";
import { StatusCodes } from "http-status-codes";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";

const kms = new KMSClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({ region: process.env.REGION_COGNITO });
const mainTable = new dynamoDBRepository();

export const authorizeUserService = async (
  req: AuthorizeUserReqDTO
): Promise<any> => {
  try {
    const clientId = await getClientId();

    const userDataGSI = await mainTable.getUserWithGSI(req.userName);
    const userId = userDataGSI[0].PK.split('#')[1];
    const userData = await mainTable.getUser(userId);
    logger.info({ userDataDeleted: userData?.data?.isDeleted })

    if (userData?.data?.isDeleted) {
      logger.error({
        msg: "Error in authorizeUserService - User is marked as deleted",
        error: "UserNotFoundException",
      });
      return {
        statusCode: StatusCodes.BAD_REQUEST,
        body: {
          error: "UserNotFoundException"
        }
      }
    }

    const params: InitiateAuthCommandInput = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        'USERNAME': req.userName,
        'PASSWORD': req.password
      }
    };

    const response: InitiateAuthCommandOutput = await client
      .send(new InitiateAuthCommand(params))
      .then((value) => value)
      .catch((error) => {
        logger.error({
          msg:
            "Error in authorizeUserService - InitiateAuthCommand with message: " +
            error,
          error: error,
        });
        throw error;
      });
    logger.info({ response: response });
    return {
      statusCode: StatusCodes.OK,
      body: response
    };

  } catch (err) {
    //FIXME manejo de errores y diccionario JSON de errores
    logger.error({
      msg: "Error in authorizeUserService catch with message: " + err.msg,
      error: err,
    });
    if (err.__type) {
      return {
        statusCode: err["$metadata"].httpStatusCode,
        body: {
          error: err.name
        }
      }
    };
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        error: "Error trying to create the user.",
      },
    };
  }
};

const getClientId = async () => {
  try {
    const params = {
      CiphertextBlob: Buffer.from(
        process.env.COGNITO_CLIENT_ID_ENCRYPTED,
        "base64"
      ),
    };

    const data = await kms
      .send(new DecryptCommand(params))
      .then((value) => value)
      .catch((err) => {
        logger.error({
          msg:
            "Error in registerUserService - getClientId with message: " +
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
        "Error in registerUserService - getClientId with message: " + error.msg,
      error: error,
    });
    throw error;
  }
};
