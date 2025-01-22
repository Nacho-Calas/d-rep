interface SQSMessageAttributes {
    [key: string]: {
      stringValue?: string;
      binaryValue?: string;
      stringListValues?: string[];
      binaryListValues?: string[];
      dataType: string;
    };
  }
  
  interface SQSRecord {
    messageId: string;
    receiptHandle: string;
    body: string;
    attributes: SQSMessageAttributes;
    messageAttributes: SQSMessageAttributes;
    md5OfBody: string;
    eventSource: string;
    eventSourceARN: string;
    awsRegion: string;
  }
  
export interface SQSEventInterface {
    Records: SQSRecord[];
  }
  