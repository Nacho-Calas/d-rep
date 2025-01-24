// src/modules/bills/infrastructure/repositories/BillDynamoDBRepository.ts
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Bill } from "../../domain/entities/bill";

export class BillDynamoDBRepository {
  private client: DocumentClient;
  private tableName: string;

  constructor() {
    this.client = new DocumentClient();
    this.tableName = process.env.BILLS_TABLE || "BillsTable";
  }

  public async createNewBill(bill: Bill): Promise<void> {
    await this.client
      .put({
        TableName: this.tableName,
        Item: item,
      })
      .promise();
  }

  // Otros métodos: getBill, updateBill, etc.
}
