import { AttributeValue } from "@aws-sdk/client-dynamodb";

export async function convertDynamoDBtoJSON(attributeValue: AttributeValue | any): Promise<any> {
  if ("S" in attributeValue) {
    return attributeValue.S;
  } else if ("N" in attributeValue) {
    return Number(attributeValue.N);
  } else if ("BOOL" in attributeValue) {
    return attributeValue.BOOL;
  } else if ("NULL" in attributeValue) {
    return null;
  } else if ("M" in attributeValue) {
    const objectValue: Record<string, AttributeValue> = attributeValue.M;
    const jsonObject: Record<string, any> = {};
    
    for (const key in objectValue) {
      jsonObject[key] = await convertDynamoDBtoJSON(objectValue[key]);
    }

    return jsonObject;
  } else if ("L" in attributeValue) {
    const listValue: Array<AttributeValue> = attributeValue.L;
    return Promise.all(listValue.map(async (item) => await convertDynamoDBtoJSON(item)));
  } else {
    // Aquí puedes manejar otros tipos según sea necesario
    return null;
  }
}