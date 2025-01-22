export class UploadPromotionsReqDTO {
    data : [
        {
            name: string,
            description: string,
            startDate: string, 
            endDate: string,
            type: PromotionType,
            amount: number,
            listOfProducts : [string],
            brandID: string,
            supplierID: string
        }
    ]
}

enum PromotionType {
    BYUNIT = 'BYUNIT',
    BYBRAND = 'BYBRAND'
    //se pueden ir sumando mas tipos de promociones
}