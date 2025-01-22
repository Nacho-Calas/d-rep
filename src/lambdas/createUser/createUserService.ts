import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  SignUpCommandOutput,
  AdminGetUserCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { CreateUserReqDTO } from "./createUserDTO";
import { logger } from "../../common/logger";
import { StatusCodes } from "http-status-codes";

const kms = new KMSClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({
  region: process.env.REGION_COGNITO,
});
const mainTable = new dynamoDBRepository();

export const createUserService = async (
  req: CreateUserReqDTO
): Promise<any> => {
  try {
    const clientId = await getClientId();
  
    const userData = {
      ClientId: clientId,
      Username: req.userName,
      Password: req.password,
    };
    const response: SignUpCommandOutput | void = await client
      .send(new SignUpCommand(userData))
      .then((value) => value)
      .catch((error) => {
        logger.error({
          msg:
            "Error in registerUserService - SignUpCommand with message: " +
            error,
          error: error,
        });
        throw error;
      });
    if (!response) {
      logger.error({
        msg: "Error in registerUserService !response with message: " + response,
        error: response,
      });
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          error: "Error trying to create the user.",
        },
      };
    }
  // -------------------------------------------------------------
    // Obtener la createdDate del user recien creado en Cognito y mandarsela a save user con la informacion de cognito
    const adminGetUserCommand = new AdminGetUserCommand({
      UserPoolId: process.env.USER_POOL_ID,
      Username: req.userName,
    });

    const adminGetUserResponse = await client.send(adminGetUserCommand);
    const date = adminGetUserResponse.UserCreateDate;


    if (!date) {
      logger.error({
        msg: "Error retrieving createdDate for user: " + req.userName,
      });
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          error: "Error trying to retrieve user creation date.",
        },
      };
    }
    const createdDate = date.toISOString();

  // -------------------------------------------------------------

    await saveUser(response, req.userName, createdDate);
    logger.info({ response: response });

    return {
      statusCode: StatusCodes.OK,
      body: { message: "OK" },
    };
  } catch (err) {
    //FIXME manejo de errores y diccionario JSON de errores
    logger.error({
      msg: "Error in registerUserService catch with message: " + err.msg,
      error: err,
    });
    if (err.__type) {
      return {
        statusCode: err["$metadata"].httpStatusCode,
        body: {
          error: err.name,
        },
      };
    }
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

const saveUser = async (response: SignUpCommandOutput, email: string, createdDate?: string) => {
  await mainTable
    .postUser(
      response.UserSub,
      {
        isEmailVerified: response.UserConfirmed,
        email: email,
        isFormCompleted: false,
      },
      createdDate,
    )
    .catch((error) => {
      logger.error({
        msg:
          "Error in registerUserService - saveUser with message: " + error.msg,
        error: error,
      });
      throw error;
    });
};
