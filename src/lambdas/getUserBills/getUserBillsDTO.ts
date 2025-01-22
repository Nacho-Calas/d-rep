export class GetBillsBodyDTO {
    lastEvaluatedKeyId?: lastEvaluatedKeyDTO;
    limit?: number;
    status?: string;
}

export class lastEvaluatedKeyDTO{
    GSI1SK: string
    id: string
    creationDate: string
}

export class BillDTO {
    billId: string;
    creationDate: string;
    status: string;
}

export class BillResponseDTO {
    bills: BillDTO[];
    lastEvaluatedKey?: lastEvaluatedKeyDTO;
}