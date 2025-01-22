export class UploadSupplierReqDTO {
    data : {
        name: string,
        reputation: Reputation,
        email: string,
        phoneNumber: number,
        imageUrl: string,
        active: boolean
    }
}

enum Reputation {
    BLACK = 'BLACK',
    PLATINUM = 'PLATINUM',
    GOLD = 'GOLD'
}