export interface dataForReference {
    itemName: string,
    brandId: string
}

export interface productIdentifyServiceParams {
    newItemList: ItemInterface[];
    dataForReference: dataForReference[];
}

interface ItemInterface {
    id: string;
    brands: brandsIdentify[];
    productId: string;
    date: string;
    expenseRow: string;
    itemNameSource: string;
    itemName: string;
    itemNameList: string[];
    price: number;
    quantity: number;
    status: ItemStatus;
    billId: string;
    unitPrice: number;
}
interface brandsIdentify {
    name: string;
    id: string;
}

enum ItemStatus {
    CREATED = 'CREATED',
    VALIDATED = 'VALIDATED',
    WITHOUT_BRAND = 'WITHOUT_BRAND',
    NOT_VALIDATED = 'NOT_VALIDATED'
}