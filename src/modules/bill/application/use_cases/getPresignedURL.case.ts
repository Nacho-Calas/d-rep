import { BillFactory } from "../../domain/factories/bill.factory";
import { UUID } from "../../domain/value_objects/uuid.vo";
import { S3Adapter } from "../../infrastructure/adapters/S3.adapter";
import { BillDynamoDBRepository } from "../../infrastructure/repositories/BillDynamoDBRepository";


interface GetPresignedUrlResult {
  statusCode: number;
  body: {
    url: string;
    id: string;
  };
  headers?: Record<string, string>;
}

export class GetPresignedUrlUseCase {
  constructor(
    private billRepo: BillDynamoDBRepository,
    private s3Adapter: S3Adapter
  ) {}

  public async execute(userId: string): Promise<GetPresignedUrlResult> {
    try {
        
        
      const fileName = `${userId}/${billId}_${Date.now()}.jpg`;

      // 1) obtener presignedUrl
      const result = await this.s3Adapter.getSignedUrl(
        process.env.BUCKET_BILLS!,
        fileName,
        true
      );

      const bill = BillFactory.createBill(
        new UUID(),
        userId,
      );

      await this.billRepo.createNewBill(bill);


      // Podemos crear hasta un ResponseDTO para manejar la respuesta
      // const response = new GetPresignedUrlResponse(result.presignedUrl, billId);
      return {
        statusCode: 200,
        body: {
          url: result.presignedUrl,
          id: billId,
        },
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (error) {
      console.error("Error in GetPresignedUrlUseCase", error);
      return {
        statusCode: 500,
        body: {
          url: "",
          id: "",
        },
      };
    }
  }
}
