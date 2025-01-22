import { AWSDynamoDBClient, awsDynamoDBClientInstance } from "./AWSdynamoDBClient";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";
import { ReferenceDTO } from './referencesTableDynamoDBInterface';
import { AttributeValue, BatchGetItemCommandOutput, QueryOutput } from "@aws-sdk/client-dynamodb";
import { logger } from '../logger'

export class referencesTableDynamoDBRepository {
    
  BRAND_KEY = 'brand';
  DEFAULT_KEY = 'default';
  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  };

  async getReferenceWithBrand(brand: string): Promise<ReferenceDTO[]> {
    return await this.dynamoDbClient.getItemByQuery(this.BRAND_KEY +  '#' + brand, process.env.REFERENCES_TABLE)
      .then((responses: Record<string, AttributeValue>[]) => (
        responses.map((response) => ({
          brandName: response.PK.S,
          reference: response.SK.S,
          brandId: response.brandId.S,
          companyName: response.companyName.S,
          productId: response.GSI1SK.S
        }))))
      .catch((error) => { throw error });
  }

  async getReferencesByIds( data: {brandId: string, itemName: string}[]) {
    const batchSize = 100;
    const referenceList: ReferenceDTO[]= [];
    try {
      for (let i = 0; i < data.length; i += batchSize) {
        const batchIds = data.slice(i, i + batchSize);
        const keys = batchIds.map((elem) => {
          return {
            PK: { S: this.BRAND_KEY + '#' + elem.brandId },
            SK: { S: elem.itemName}
          };
        });
        const table = process.env.REFERENCES_TABLE;
        const responseSearchByKeys: BatchGetItemCommandOutput =
        await this.dynamoDbClient.searchByKeys(keys, process.env.REFERENCES_TABLE);
        if (responseSearchByKeys.Responses == undefined) return [];
        const batchReferenceList: ReferenceDTO[] =
          responseSearchByKeys.Responses[table].map((response) => ({
            brandName: response.PK.S,
            reference: response.SK.S,
            brandId: response.brandId.S,
            companyName: response.companyName.S,
            productId: response.GSI1SK.S
          }));
        referenceList.push(...batchReferenceList);
      }
      
      return referenceList;
      } catch (error) {
        logger.error({
          msg:
            "Error in DynamoDBRepository on getReferencesByIds method with message: " +
            error.msg,
          paramsToPost: data,
          error: error,
        });
        throw error;
      }
  }

  async getDefaultReferencesByIds( data: {brandId: string, itemName: string}[]) {
    let referenceList : ReferenceDTO[] = [];
    let params: GetItemsGSIInput;
    try {
        for await (const elem of data) {
            params = {
                keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
                expressionAttributeValues: {
                  ':pk': { S: this.BRAND_KEY + '#' + elem.brandId },
                  ':skPrefix': { S: this.DEFAULT_KEY },
                },
              };
            const response: QueryOutput = await this.dynamoDbClient.getItemsGSI(params, process.env.REFERENCES_TABLE);
            if (response.Count > 0) {
                const result = response.Items.map((response) => ({
                    brandName: response.brandName.S,
                    reference: response.SK.S,
                    keywords: response.keywords.L.map(
                        (key) => key.S.toString()
                      ),
                    brandId: response.PK.S.split('#')[1],
                    productId: response.GSI1SK.S
                }))
                referenceList = referenceList.concat(result);
            }   
        }
        return referenceList;
    } catch (error) {
        logger.error({
            msg:
              "Error in getDefaultReferencesByIds with message: " +
              error.msg,
            paramsToGet: params,
            error: error,
          });
          throw error;
    }
  }
};
