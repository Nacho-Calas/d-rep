export enum BillStatus {
    COMPRESS = 'COMPRESS', // instancia para comprimir, caso vertex
    COMPRESS_IN_PROGRESS = 'COMPRESS_IN_PROGRESS', // instancia para comprimir, caso vertex
    CREATED = 'CREATED', //se carga el ticket para procesar
    TEXTRACT_COMPLETED = 'TEXTRACT_COMPLETED', // se completo el paso de extraccion de datos de textract
    TEXTRACT_RESPONSE_ANALYZED = 'TEXTRACT_RESPONSE_ANALYZED',
    PRODUCT_FIELDS_IDENTIFIED = 'PRODUCT_FIELDS_IDENTIFIED',
    PROMOTIONS_FOUND = 'PROMOTIONS_FOUND',
    PROMOTION_AMOUNT_APPLIED = 'PROMOTION_AMOUNT_APPLIED',
    TEXTRACT_PROCESSING_FAILED = 'TEXTRACT_PROCESSING_FAILED',
    ANALYSIS_FAILED = 'ANALYSIS_FAILED',
    IDENTIFICATION_FAILED = 'IDENTIFICATION_FAILED',
    SEARCH_FAILED = 'SEARCH_FAILED',
    APPLICATION_FAILED = 'APPLICATION_FAILED',
    BILL_DUPLICATED = 'BILL_DUPLICATED',
    BILL_SCAN_UNSUCCESSFUL = 'BILL_SCAN_UNSUCCESSFUL',
    BILL_WITHOUT_IDENTIFIED_PRODUCTS = 'BILL_WITHOUT_IDENTIFIED_PRODUCTS',
    BILL_WITHOUT_CASHBACK = 'BILL_WITHOUT_CASHBACK',
    TEXTRACT_DATA_PREPROCESSED = 'TEXTRACT_DATA_PREPROCESSED',
    BILLUPLOAD = 'BILLUPLOAD',
    BILL_LIMIT_24H_REACHED = 'BILL_LIMIT_24H_REACHED',
    BILL_LIMIT_DAY_REACHED = 'BILL_LIMIT_DAY_REACHED',
    BILL_LIMIT_WEEK_REACHED = 'BILL_LIMIT_WEEK_REACHED',
    BILL_LIMIT_MONTH_REACHED = 'BILL_LIMIT_MONTH_REACHED',
    CASHBACK_APPLIED = 'CASHBACK_APPLIED',
    SIMPLE_HEADER_OCR = 'SIMPLE_HEADER_OCR',
    INTELLIGENT_HEADER_OCR = 'INTELLIGENT_HEADER_OCR',
    SEEK_RELATIONSHIPS = 'SEEK_RELATIONSHIPS',
    CHECK_DICTIONARY = 'CHECK_DICTIONARY',
    ADD_DICTIONARY = 'ADD_DICTIONARY',
    UPLOAD_ERROR = 'UPLOAD_ERROR',
}

export enum BillType {
    IMAGE = 'image',
    VIDEO = 'video'
};

export interface BillTableInterface {
    id?: string,
    S3url?: string,
    status?: BillStatus,
    bill?: {
        creationDate?: Date,
        status: BillStatus,
        userId?: string,
        S3urlVideo?: string,
        s3keyVideo?: string,
        S3url?: string,
        s3url?: string,
        s3key?: string,
        textractData?: any,
        textractMappedToVertexFormat?:any;
        changeHistory?: BillChange[]
    },
    type?: BillType,
    flag?: string
}

interface BillChange {
    timestamp?: Date|string,
    event: string,
    user: string,
    functionName: string
}