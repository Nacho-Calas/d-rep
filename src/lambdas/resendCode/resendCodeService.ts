import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import {
  CognitoIdentityProviderClient,
  ResendConfirmationCodeCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ResendCodeReqDTO } from "./resendCodeDTO";
import { logger } from "../../common/logger";
import { StatusCodes } from "http-status-codes";

const kms = new KMSClient({ region: "us-east-2" });
const client = new CognitoIdentityProviderClient({ region: process.env.REGION_COGNITO });

export const resendCodeService = async (
  req: ResendCodeReqDTO
): Promise<any> => {
  try {
    const clientId = await getClientId();
  
    const userData = {
        ClientId: clientId,
        Username: req.userName
      };
      const response = await client.send(new ResendConfirmationCodeCommand(userData))
      .then((value) => value)
      .catch((err) => {
        logger.error({
          msg:
            "Error in resendCodeService - sendCode with message: " +
            err.msg,
          error: err,
        });
        throw err;
      });;
    logger.info({ response: response });
    return {
      statusCode: StatusCodes.OK,
      body: { message: "OK" },
    };
  } catch (err) {
    //FIXME manejo de errores y diccionario JSON de errores
    logger.error({
      msg: "Error in resendCodeService catch with message: " + err.msg,
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
            "Error in resendCodeService - getClientId with message: " +
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
        "tryCatch Error in resendCodeService - getClientId with message: " + error.msg,
      error: error,
    });
    throw error;
  }
};