import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { userConfirmCodeReqDTO } from "./userConfirmCodeDTO";
import { mergeObjects } from '../../common/mergeObjects';
import { logger } from "../../common/logger";
import { StatusCodes } from "http-status-codes";
import { DecryptCommand, KMSClient } from "@aws-sdk/client-kms";
import { CognitoIdentityProviderClient, ConfirmSignUpCommand } from "@aws-sdk/client-cognito-identity-provider";

const mainTable = new dynamoDBRepository();
const kms = new KMSClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({ region: process.env.REGION_COGNITO });

export const userConfirmCodeService = async (body: userConfirmCodeReqDTO): Promise<any> => {
  try {
    const clientId = await getClientId()

    const userDataToCognito = {
      ClientId: clientId,
      Username: body.userName,
      ConfirmationCode: body.code
    };

    const responseConfirmSignUp = await client
      .send(new ConfirmSignUpCommand(userDataToCognito))
      .catch((error) => {
        logger.error({
          msg:
            "Error in userConfirmCodeService - ConfirmSignUpCommand with message: " +
            error,
          error: error,
        });
        throw error;
      });
    if (!responseConfirmSignUp) {
      logger.error({
        msg: "Error in userConfirmCodeService !response with message responseConfirmSignUp not found ",
        error: "responseConfirmSignUp not found",
      });
      return {
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        body: {
          error: "Error trying to verify code. Error in userConfirmCodeService !response with message responseConfirmSignUp not found",
        },
      };
    };

    const userDataGSI = await mainTable.getUserWithGSI(body.userName);
    const userId = userDataGSI[0].PK.split('#')[1];
    const userData = await mainTable.getUser(userId);

    mergeObjects(userData, {
      data: body
    });
    mergeObjects(userData, {
      data: {
        isEmailVerified: true
      }
    });

    await mainTable
      .postUser(userId, userData.data)
      .catch((error) => {
        logger.error({
          msg: "Error in userConfirmCodeService - postUser with message: " + error,
          error: error,
        });
        throw error;
      });

    return {
      statusCode: StatusCodes.OK,
      body: { message: "confirmed code" },
    };
  } catch (err) {
    logger.error({
      msg: "Error in userConfirmCodeService catch with message: " + err.msg,
      error: err,
    });
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        error: "Error trying to verify code with message: "
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
            "Error in userConfirmCodeService - getClientId with message: " +
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
        "Error in userConfirmCodeService - getClientId with message: " + error.msg,
      error: error,
    });
    throw error;
  }
};