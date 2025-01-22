import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { logger } from "../../common/logger";
import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";

const mainTable = new dynamoDBRepository();
const sesClient = new SESv2Client({
  region: process.env.SES_CLIENT_REGION,
});

// NOTE: mejorar estructura del switch
export const sendEmailService = async (event: any): Promise<any> => {
  try {
    const user = await mainTable.getUser(event.detail.response.result.GSI1SK.data);
    const status = event.detail.response.result.bill.data.status.data;
    switch (status) {
      case "PROMOTION_AMOUNT_APPLIED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-ok-without-name", { name: user.data.nameAndLastName, sumcashbackhistory: user?.data?.sumCashbackHistory });
        } else {
          await sendEmail(user.data.email, "template-ok", { name: user.data.nameAndLastName, sumcashbackhistory: user?.data?.sumCashbackHistory });
        }
        break;
      case "BILL_DUPLICATED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-duplicate-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-duplicate", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_SCAN_UNSUCCESSFUL":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-scan-unsuccessful-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-scan-unsuccessful", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_LIMIT_DAY_REACHED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-bill-limit-day-reached-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-bill-limit-day-reached", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_LIMIT_WEEK_REACHED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-bill-limit-week-reached-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-bill-limit-week-reached", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_LIMIT_MONTH_REACHED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-bill-limit-month-reached-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-bill-limit-month-reached", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_LIMIT_24H_REACHED":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-after-24-hours-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-after-24-hours", { name: user.data.nameAndLastName });
        }
        break;
      case "BILL_WITHOUT_IDENTIFIED_PRODUCTS":
        if (user.data.nameAndLastName == undefined) {
          await sendEmail(user.data.email, "template-bill-without-identified-products-without-name", { name: user.data.nameAndLastName });
        } else {
          await sendEmail(user.data.email, "template-bill-without-identified-products", { name: user.data.nameAndLastName });
        }
        break;
    };
    return;
  } catch (error) {
    logger.error({
      msg:
        "Error in sendEmailService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};

const sendEmail = async (destinatario: string, template: string, templateData: any) => {
  const params = {
    Destination: {
      ToAddresses: [destinatario],
    },
    Content: {
      Template: {
        TemplateName: template,
        TemplateData: JSON.stringify(templateData)
      }
    },
    FromEmailAddress: process.env.EMAIL
  };
  try {
    const command = new SendEmailCommand(params);
    const data = await sesClient.send(command);
    return;
  } catch (err) {
    logger.error({
      msg:
        "Error in sendEmailService - sendEmail with message: " +
        err,
      error: err,
    });
    throw err;
  }
};