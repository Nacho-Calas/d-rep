import { logger } from "./logger";

export function convertToDynamoDBFormat(input) {
  let dynamoDBAttributes = {};

  function convertObject(obj) {
    const attributes = {};

    for (const [key, value] of Object.entries(obj)) {
      attributes[key] = convertAttributeValue(value);
    }

    return attributes;
  }

  function convertAttributeValue(value) {
    if (value == null) {
      return { NULL: true };
    } else if (Array.isArray(value)) {
      return { L: value.map(convertAttributeValue) };
    } else if (typeof value === 'object' && value !== null) {
      return { M: convertObject(value) };
    } else if (typeof value === 'string') {
      return { S: value };
    } else if (typeof value === 'number') {
      return { N: value.toString() };
    } else {
      // Unsupported type, you might want to handle this case accordingly
      throw new Error(`Unsupported data type for value: ${value}`);
    }
  }

  dynamoDBAttributes = convertObject(input);
  logger.debug('dynamoDBAttributes', dynamoDBAttributes);

  return dynamoDBAttributes;
}
