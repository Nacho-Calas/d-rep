import { CreateBillDTO } from "../../domain/dto/create_bill.dto";
import { UUID } from "../../domain/value_objects/uuid.vo";
import { S3Adapter } from "../../infrastructure/adapters/S3.adapter";
import { BillDynamoDBRepository } from "../../infrastructure/repositories/BillDynamoDBRepository";
import { BillFactory } from "../factories/bill.factory";


// ARMAR REPSUESTA EN DTO
interface GetPresignedUrlResult {
  statusCode: number;
  body: {
    id: string;
    url: string;
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
      const billId = UUID.create()
      const bill = BillFactory.createBill(
        new CreateBillDTO({
          id: billId,
          creationDate: new Date()
        })
      );
        
      const fileName = `${userId}/${billId}_${Date.now()}.jpg`;

      // 1) obtener presignedUrl
      const result = await this.s3Adapter.getSignedUrl(
        process.env.BUCKET_BILLS!,
        fileName,
      );

      // 2) Crear bill en DynamoDB
      const response = await this.billRepo.createNewBill(bill);

      return {
        statusCode: 200,
        body: {
          id: billId.getUUID(),
          url: result,
        },
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      };
    } catch (error) {
      // Tambien podemos crear un ErrorResponse para manejar los errores
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
