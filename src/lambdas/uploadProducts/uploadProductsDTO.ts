import { Category } from '../../common/enum';
export class UploadProductsReqDTO {
    data: [
        {
            supplierId: string, // v2 el supplier deberia sacarse del token o tener una forma para que solo cuando se conecte pueda cargar solo las promociones de sus marcas
            name: string,
            brandId: string,
            description: string,
            category: Category,
            imageUrl: string,
            weight: number,
            measure: string,
            active: boolean,
        }
    ]
}
