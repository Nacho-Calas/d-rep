import { Gender } from '../../common/enum';
export class UpdateUserDTO {
    nameAndLastName?: string;
    phoneNumber?: {
        code?: string;
        number: number;
    };
    gender?: Gender;
    birthdate?: string;
    localityCountry?: string;
    localityState?: string;
    localityCity?: string;
    localityNeighborhood?: string;
    email?: string;
    family?: {
        adults: number;
        kids: number;
        birthdateKids?: string[];
    };
    dni?: number;
};