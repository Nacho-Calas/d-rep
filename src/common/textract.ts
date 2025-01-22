import { TextractClient, AnalyzeExpenseCommand, AnalyzeExpenseCommandOutput, AnalyzeExpenseCommandInput } from "@aws-sdk/client-textract";
import { logger } from "./logger";

export class Textract {
  client: TextractClient;
  constructor() {
    this.client = new TextractClient({ region: 'us-east-2' });
  }

  async analyzeExpense(key) {
    try {
      const input: AnalyzeExpenseCommandInput = {
        Document: {
          S3Object: {
            Bucket: process.env.BUCKET_BILLS,
            Name: key
          },
        },
      };
      const command = new AnalyzeExpenseCommand(input);
      const response: AnalyzeExpenseCommandOutput = await this.client.send(command);
      return response;

    } catch (error) {
      logger.error({
        msg:
          "Error in authorizeUserService - InitiateAuthCommand with message: " +
          error,
        data: key,
        error: error,
      });
      throw error
    }

  }
}

export const TextractInstance = new Textract();