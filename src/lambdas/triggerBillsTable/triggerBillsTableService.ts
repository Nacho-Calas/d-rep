import { StatusCodes } from 'http-status-codes';
import { logger } from "../../common/logger";
import { DynamoDBStreamEvent } from '../../common/dynamoDB/DynamoDBStreamEventInterface';
import { compareObjects } from '../../common/compareObjects';
import { convertDynamoDBtoJSON } from '../../common/convertDynamoDBtoJSON';
import { eventbridge } from '../../common/eventbridge/eventbridge';

export const triggerBillsTableService = async (event: DynamoDBStreamEvent): Promise<any> => {
  try {
    const processedNewImage = await convertDynamoDBtoJSON({ M: event.Records[0].dynamodb.NewImage});
    const processedOldImage = await convertDynamoDBtoJSON({M: event.Records[0].dynamodb.OldImage});
    const comparisonResult =  await compareObjects(processedOldImage,processedNewImage);
    const response = await eventbridge(process.env.EVENT_BUS_BILL_TABLE,"triggerBillsTable", "BillsTable", {
        statusCode: StatusCodes.OK,
        result: comparisonResult
    } )
    return {
      statusCode: StatusCodes.OK,
      result: comparisonResult
  };
  } catch (error) {
    logger.error({
      msg:
        "Error in triggerBillsTableService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};