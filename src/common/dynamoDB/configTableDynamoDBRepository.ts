import { AWSDynamoDBClient, awsDynamoDBClientInstance } from "./AWSdynamoDBClient";
import { AttributeValue, QueryOutput } from "@aws-sdk/client-dynamodb";
import { logger } from '../logger'
import { CityDTO, CountryDTO, StateDTO } from "./dynamoDBInterface.response";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";

export class configTableDynamoDBRepository {

  COUNTRIES_KEY = 'COUNTRIES';

  STATES_KEY_PREFIX = 'STATES#';

  CITIES_KEY_PREFIX = 'CITIES#';

  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  };

  async getCountries(): Promise<CountryDTO[]> {
    return await this.dynamoDbClient.getItemByQuery(this.COUNTRIES_KEY, process.env.CONFIG_TABLE)
      .then((responses: Record<string, AttributeValue>[]) => (
        responses.map((response) => ({
          id: response.SK.S,
          name: response.data.M.name.S,
          countryCode: response.data.M.countryCode.S,
          language: response.data.M.language.S,
          locale: response.data.M.locale.S,
          phoneCode: response.data.M.phoneCode.S,
          icon: response.data.M.icon.S,
        }))))
      .catch((error) => { throw error });
  }

  async getCountry(country: string): Promise<CountryDTO> {
    return await this.dynamoDbClient.getItem(this.COUNTRIES_KEY, process.env.CONFIG_TABLE, country)
      .then((response: Record<string, AttributeValue>) => ({
        id: response.SK.S,
        name: response.data.M.name.S,
        countryCode: response.data.M.countryCode.S,
        language: response.data.M.language.S,
        locale: response.data.M.locale.S,
        phoneCode: response.data.M.phoneCode.S,
        icon: response.data.M.icon.S,
      }))
      .catch((error) => { throw error });
  }

  async getStates(country: string, partialName?: string): Promise<StateDTO[]> {
    let params: GetItemsGSIInput;
    if (partialName) {
      params = {
        keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        expressionAttributeValues: {
          ':pk': { S: this.STATES_KEY_PREFIX + country },
          ':skPrefix': { S: partialName },
        },
      };
    } else {
      params = {
        keyConditionExpression: 'PK = :pk',
        expressionAttributeValues: {
          ':pk': { S: this.STATES_KEY_PREFIX + country }
        },
      };
    }

    try {
      const response: QueryOutput = await this.dynamoDbClient.getItemsGSI(params, process.env.CONFIG_TABLE);
      if (response.Count == 0) return [];
      const result: StateDTO[] = response.Items.map((item) => ({
        id: item.SK.S,
        name: item.data.M.name.S,
        countryID: item.PK.S.split('#')[1],
      }));
      return result;
    } catch (error) {
      logger.error({
        msg:
          "Error in commonTableDynamoDBRepository on getStates method with message: " +
          error.msg,
        paramsToGet: params,
        error: error,
      });
      throw error;
    }
  };

  async getState(country: string, state: string): Promise<StateDTO> {
    return await this.dynamoDbClient.getItem(this.STATES_KEY_PREFIX + country, process.env.CONFIG_TABLE, state)
      .then((response: Record<string, AttributeValue>) => ({
        id: response.SK.S,
        name: response.data.M.name.S,
        countryID: response.PK.S.split('#')[1],
      }))
      .catch((error) => { throw error });
  }

  async getCities(country: string, state: string, partialName?: string): Promise<CityDTO[]> {
    let params: GetItemsGSIInput;
    if (partialName) {
      params = {
        keyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        expressionAttributeValues: {
          ':pk': { S: this.CITIES_KEY_PREFIX + country + '#' + state },
          ':skPrefix': { S: partialName },
        },
      };
    } else {
      params = {
        keyConditionExpression: 'PK = :pk',
        expressionAttributeValues: {
          ':pk': { S: this.CITIES_KEY_PREFIX + country + '#' + state },
        },
      };
    }
    try {
      const response: QueryOutput = await this.dynamoDbClient.getItemsGSI(params, process.env.CONFIG_TABLE);
      if (response.Count == 0) return [];
      const result: CityDTO[] = response.Items.map((item) => ({
        id: item.SK.S,
        name: item.data.M.name.S,
        countryID: item.PK.S.split('#')[1],
        stateID: item.PK.S.split('#')[2],
      }));
      return result;
    } catch (error) {
      logger.error({
        msg:
          "Error in commonTableDynamoDBRepository on getCities method with message: " +
          error.msg,
        paramsToGet: params,
        error: error,
      });
      throw error;
    }
  };

  async getCity(country: string, state: string, city: string): Promise<StateDTO> {
    return await this.dynamoDbClient.getItem(this.CITIES_KEY_PREFIX + country + '#' + state, process.env.CONFIG_TABLE, city)
      .then((response: Record<string, AttributeValue>) => ({
        id: response.SK.S,
        name: response.data.M.name.S,
        countryID: response.PK.S.split('#')[1],
        stateID: response.PK.S.split('#')[2],
      }))
      .catch((error) => { throw error });
  }
};
