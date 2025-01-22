import { AttributeValue } from '@aws-sdk/client-dynamodb';

export interface GetItemsGSIInput {
    indexName?: string,
    keyConditionExpression: string,
    expressionAttributeNames?: Record<string, string>,
    expressionAttributeValues: Record<string, AttributeValue>,
    filterExpression?: string,
    exclusiveStartKey?: Record<string, AttributeValue>,
    limit?: number,
    scanIndexForward?: boolean,
}
