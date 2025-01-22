import { Gender, Category } from '../enum';
export class productItemDTO {
    product : {
        name: string,
        supplierId: string,
        description: string,
        category: Category,
        imageUrl: string,
        measure: string,
        weight: number,
        active: boolean,
        brandId: string
      }
}

export class supplierItemDTO {
    supplier : {
        name: string,
        reputation: Reputation,
        email: string,
        phoneNumber: number,
        imageUrl: string,
        active: boolean
    }
}

export class promotionsItemDTO {
    promotion : {
        name: string,
        description: string,
        startDate: string, 
        endDate: string,
        type: PromotionType,
        amount: number,
        listOfProducts : string []
        brandID: string,
        supplierID: string
    }
};
export class brandItemDTO {
    brand : {
        supplierId: string,
        name: string,
        imageUrl: string,
        active: boolean
    }
}

export enum Reputation {
    BLACK = 'BLACK',
    PLATINUM = 'PLATINUM',
    GOLD = 'GOLD'
}

export enum PromotionType {
    BYUNIT = 'BYUNIT',
    BYBRAND = 'BYBRAND'
    //se pueden ir sumando mas tipos de promociones
}

// Cache
// TODO: Unificar esta clase con la response, podría llegar a crearse un interfaz para la common table
// sabiendo que se van a utilizar sus registros como caché.
export interface GetProductPromotionsContentDTO {
    productName: string,
    productDetail: string,
    imageUrl: string,
    cashbackAmount: number,
    dueDate: string,
    promotionTerms: string,
    category: string,
    content: string,
    brand: string,
}

export interface BannersDTO {
    index: number;
    imageUrl: string;
}

export interface UserInterface {
    PK?: string;
    SK?: string;
    GSI1PK?: string;
    GSI1SK?: string;
    isEmailVerified?: boolean;
    isFormCompleted?: boolean;
    isDeleted?: boolean;
    nameAndLastName?: string;
    phoneNumber?: {
        code?: string;
        number: number;
    };
    gender?: string;
    birthdate?: string;
    localityCountry?: string;
    localityState?: string;
    localityCity?: string;
    localityNeighborhood?: string;
    email?: string;
    cashbackAmount?: number;
    cashbackHistory?:CashbackHistoryInterface[];
    sumCashbackHistory?: number;
    family?: {
        adults: number;
        kids: number;
        birthdateKids?: string[]
    };
    dni?: number;
}

interface CashbackHistoryInterface {
    amount: number;
    timestamp: string;
    billId: string;
    promotionId: string;
}