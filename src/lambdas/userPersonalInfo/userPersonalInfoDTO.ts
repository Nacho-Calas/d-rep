import { Gender } from "../../common/enum";

export class UserPersonalInfoDTO {
    username?: string;
    nameAndLastName?: string;
    birthdate?: string;
    phoneNumber?: {
        code?: string;
        number: number;
    };
    dni?: number;
    localityCountry?: string;
    localityState?: string;
    localityCity?: string;
    localityNeighborhood?: string;
    gender?: Gender;
}