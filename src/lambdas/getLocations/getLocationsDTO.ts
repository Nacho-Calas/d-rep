export class GetCountriesDTO {
    countries: CountryDTO[]
};

export interface CountryDTO {
    id: string,
    name: string,
    countryCode: string,
    language: string,
    locale: string,
    phoneCode: string,
    icon: string,
};

export class GetStatesDTO {
    states: StateDTO[]
};

export interface StateDTO {
    id: string,
    name: string,
    countryID: string,
};

export class GetCitiesDTO {
    cities: CityDTO[]
};

export interface CityDTO {
    id: string,
    name: string,
    countryID: string,
    stateID: string,
};
