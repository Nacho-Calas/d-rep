export class GetProductPromotionsReqDTO {
    pageNumber: number;
    pageSize: number;
    category: string;
    keyword: string;
    sortingSeed?: string;
}


export class GetProductPromotionsResDTO {
    lastPage: boolean;
    pageNumber: number;
    totalPages: number;
    totalResults: number;
    sortingSeed: string;
    pageContent: GetProductPromotionsContent[]
}

export interface GetProductPromotionsContent {
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
