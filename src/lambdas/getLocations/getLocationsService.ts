import { configTableDynamoDBRepository } from "../../common/dynamoDB/configTableDynamoDBRepository";
import { CityDTO, CountryDTO, StateDTO } from "../../common/dynamoDB/dynamoDBInterface.response";
import { logger } from "../../common/logger";
import { GetCitiesDTO, GetCountriesDTO, GetStatesDTO } from "./getLocationsDTO";

const configTable = new configTableDynamoDBRepository();

export async function getCountriesService(): Promise<GetCountriesDTO> {
  let countryList: CountryDTO[] = await configTable.getCountries();
  let response: GetCountriesDTO = {
    countries: countryList,
  };
  return response;
}

export const getStatesService = async (country: string, beginsWith?: string): Promise<GetStatesDTO> => {
  let stateList: StateDTO[] = await configTable.getStates(country, beginsWith);

  let response: GetStatesDTO = {
    states: stateList,
  };
  return response;
};

export const getCitiesService = async (country: string, state: string, beginsWith?: string): Promise<GetCitiesDTO> => {
  let cityList: CityDTO[] = await configTable.getCities(country, state, beginsWith);

  let response: GetCitiesDTO = {
    cities: cityList,
  };
  return response;
};
