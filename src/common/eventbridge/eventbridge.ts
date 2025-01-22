import { EventBridgeClient, PutEventsCommand, PutEventsCommandInput } from "@aws-sdk/client-eventbridge";
import { logger } from "../logger";

const eventBridgeClient = new EventBridgeClient([{
  region: "us-east-2"
}]);

export async function eventbridge(eventBusName: string, source: string, detailType: string, data: Record<string, string|any>) {
  try {
    const event: PutEventsCommandInput = {
      Entries: [
        {
          Source: source,
          DetailType: detailType,
          Detail: JSON.stringify({response: data}),
          EventBusName: eventBusName
        },
      ],
    };
    const response = await eventBridgeClient.send(new PutEventsCommand(event));
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "eventbridge ok" }),
    };
  } catch (error) {
    logger.error({
        msg:
          "Error in eventbridge method with message: " +
          error.msg,
        error: error,
      });
    throw error;
  }
};
