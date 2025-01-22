export type DynamoDBStreamEvent = {
    Records: DynamoDBRecord[];
  };
  
export type DynamoDBRecord = {
    eventID: string;
    eventName: string; // Puede ser 'INSERT', 'MODIFY', o 'REMOVE'
    eventVersion: string;
    eventSource: string;
    awsRegion: string;
    dynamodb: {
      ApproximateCreationDateTime: number;
      Keys: { [key: string]: any };
      NewImage?: { [key: string]: any };
      OldImage?: { [key: string]: any };
      SequenceNumber: string;
      SizeBytes: number;
      StreamViewType: StreamViewType; // Utiliza el tipo definido a continuación
    };
  };
  
export type StreamViewType = 'NEW_IMAGE' | 'OLD_IMAGE' | 'NEW_AND_OLD_IMAGES' | 'KEYS_ONLY';  