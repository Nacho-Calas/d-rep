export interface PromotionItemDynamoDBResp {
    GSI1PK: string,
    SK: string,
    PK: string,
    GSI1SK: string,
    data: {
        amount: number,
        supplierID: string,
        endDate: Date,
        brandID: string,
        listOfProducts: string[],
        name: string,
        description: string,
        type: string,
        startDate: Date
    }
};

export interface SupplierItemDynamoDBResp {
    GSI1PK: string,
    SK: string,
    PK: string,
    GSI1SK: string,
    data: {
        name: string,
        active: boolean,
        reputation: string,
        phoneNumber: number,
        email: string,
        imageUrl: string
    }
};

export interface ProductItemDynamoDBResp {
    GSI1PK: string,
    SK: string,
    PK: string,
    GSI1SK: string,
    data: {
        name: string,
        supplierId: string,
        imageUrl: string,
        active: boolean,
        description: string,
        weight: number,
        category: string,
        measure: string,
    }
};

export interface ProductPromotionsContentDynamoDBResp {
    PK: string,
    data: {
        date: Date
        result: GetProductPromotionsContentDTO[],
    }
};

export interface GetProductPromotionsContentDTO {
    productName: string;
    productDetail: string;
    imageUrl: string;
    cashbackAmount: number;
    dueDate: Date;
    promotionTerms: string;
    category: string;
    content: string;
    brand: string;
}

export interface CountryDTO {
    id: string,
    name: string,
    countryCode: string,
    language: string,
    locale: string,
    phoneCode: string,
    icon: string,
};

export interface StateDTO {
    id: string,
    name: string,
    countryID: string,
};

export interface CityDTO {
    id: string,
    name: string,
    countryID: string,
    stateID: string,
};

export interface BrandItemDynamoDBResp {
    PK: string;
    SK: string;
    GSI1PK: string;
    GSI1SK: string;
    data : {
        name: string,
        supplierId: string,
        imageUrl: string,
        active: boolean
    }
}

export interface UserInterfaceDynamoDB {
    PK: string;
    SK: string;
    GSI1PK?: string;
    GSI1SK?: string;
    data?: {
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
        cashbackAmount?: number;
        cashbackHistory?:CashbackHistoryInterface[];
        sumCashbackHistory?: number;
        email?: string;
        dni?: number;
    }
}
export interface CashbackHistoryInterface {
    amount: number;
    timestamp: string;
    billId: string;
    promotionId: string;
}