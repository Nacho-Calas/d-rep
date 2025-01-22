import { KMSClient, DecryptCommand } from "@aws-sdk/client-kms";
import { ForgotPasswordReqDTO } from "../forgotPassword/forgotPasswordDTO";
import { logger } from "../../common/logger";
import { StatusCodes } from "http-status-codes";
import {
  CognitoIdentityProviderClient,
  AdminSetUserPasswordCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { ForceResetPasswordReqDTO } from "./forceResetPasswordDTO";

const client = new CognitoIdentityProviderClient({
  region: process.env.REGION_COGNITO,
});

export const forceResetPasswordService = async (
  req: ForceResetPasswordReqDTO
): Promise<any> => {
  try {
    const input = {
      UserPoolId: process.env.USER_POOL_ID, 
      Username: req.userName, 
      Password: req.password, 
      Permanent: true
    };
    
    const response = await client
      .send(new AdminSetUserPasswordCommand(input))
      .then((value) => value)
      .catch((err) => {
        logger.error({
          msg:
            "Error in Force Password - sendCode with message: " +
            err.msg,
          error: err,
        });
        throw err;
      });
    logger.info({ response: response });
    return {
      statusCode: StatusCodes.OK,
      body: { message: "OK" },
    };
  } catch (err) {
    //FIXME manejo de errores y diccionario JSON de errores
    logger.error({
      msg: "Error in forgotPasswordService catch with message: " + err.msg,
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
