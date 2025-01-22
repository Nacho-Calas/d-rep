export class UploadBrandsReqDTO {
    data : [
        {
            supplierId: string,
            name: string,
            imageUrl: string,
            active: boolean
        }
    ]
}