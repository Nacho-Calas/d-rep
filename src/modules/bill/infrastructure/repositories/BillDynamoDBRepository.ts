
import { Bill } from "../../domain/entities/bill";
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { PutCommand } from '@aws-sdk/lib-dynamodb';

interface BillDynamoDBRepositoryProps {
  tableName: string;
}

export class BillDynamoDBRepository {
  private readonly tableName: string;
  private docClient: DynamoDBClient;
  
  constructor(deps: BillDynamoDBRepositoryProps) {
    this.tableName = deps.tableName;
    this.docClient = new DynamoDBClient({})
  }

  public async createNewBill(bill: Bill): Promise<void> {
    await this.docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: bill
      })
    );
  }

  // Resto de los metodos
}