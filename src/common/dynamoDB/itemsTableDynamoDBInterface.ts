export interface ItemInterface {
    id: string;
    billId: string;
    productId: string;
    itemNameSource: string;
    itemName: string;
    itemNameList: string[];
    quantity: number;
    unitPrice: number;
    price: number;
    expenseRow: string;
    date: string;
    selectedBrand: string;
    brands: brandsIdentify[],
    status: ItemStatus;   
    listOfSimilarities?: any[],
    bestSimilarity?:any,
    bestPercentage?: number,
    GSI1PK?: string,
    GSI1SK?: string
};

export interface brandsIdentify {
    id: string
}


export enum ItemStatus {
    CREATED = 'CREATED',
    VALIDATED = 'VALIDATED',
    NOT_VALIDATED = 'NOT_VALIDATED',
    BRAND_VALIDATED = 'BRAND_VALIDATED',
    WITHOUT_BRAND = 'WITHOUT_BRAND'
}