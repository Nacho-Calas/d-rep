import { BillStatus } from '../enums/bill_status.enum';
import { BillType } from '../enums/bill_type.enum';
import { BillChangeHistory } from '../value_objects/bill_change_history.vo';
import { UUID } from '../value_objects/uuid.vo';
import { S3EventData, S3ProcessData } from '../value_objects/bill_s3_data.vo';

interface BillConstructor {
  id: UUID;
  userId?: string;
  status: BillStatus;
  creationDate: string;
  type?: BillType;
  flag?: string;

  // Valores de S3
  s3Url?: string;
  s3Key?: string;
  s3EventData?: S3EventData,
  s3ProcessData?: S3ProcessData,
  
  // Historial de Cambios
  changeHistory?: BillChangeHistory[]; // <-- si le queremos agregar metodos, cambiar a clase.
  rawOcrData?: any; // <-- si le queremos agregar metodos, cambiar a clase.
}

export class Bill {
  public id: UUID;
  public userId?: string;
  public status: BillStatus;
  public creationDate: Date;
  public lastUpdated?: Date;
  public type: BillType;
  public s3Url?: string;
  public s3Key?: string;
  public s3UrlVideo?: string;
  public s3KeyVideo?: string;
  public changeHistory?: BillChangeHistory[];
  public rawOcrData?: any;
  public mappedOcrData?: any;
  public flag?: string;

  constructor( bill: BillConstructor) {
    this.id = bill.id;
    this.userId = bill.userId;
    this.status = bill.status;
    this.creationDate = new Date(bill.creationDate);
    this.type = bill.type;
    this.s3Url = bill.s3Url;
    this.s3Key = bill.s3Key;
    this.changeHistory = bill.changeHistory;
    this.rawOcrData = bill.rawOcrData;
    this.flag = bill.flag;
  }

  getId(): string {
    return this.id.getUUID();
  }

  public addChangeHistory(
    event: string,
    functionName: string,
    user: string
  ): void {
    const now = new Date().toISOString();
    this.changeHistory.push({
      timestamp: now,
      event,
      user,
      functionName,
    });
  }

  public updateStatus(newStatus: BillStatus, user: string): void {
    throw new Error("Method not implemented.");
  }

  public updateOcrData(rawOcrData: any): void {
    throw new Error("Method not implemented.");
  }

  public updateMappedOcrData(mappedOcrData: any): void {
    throw new Error("Method not implemented.");
  }

  public updateS3Url(s3Url: string): void {
    throw new Error("Method not implemented.");
  }

  public updateS3Key(s3Key: string): void {
    throw new Error("Method not implemented.");
  }

  public updateS3UrlVideo(s3UrlVideo: string): void {
    throw new Error("Method not implemented.");
  }

  public updateS3KeyVideo(s3KeyVideo: string): void {
    throw new Error("Method not implemented.");
  }

  public updateFlag(flag: string): void {
    throw new Error("Method not implemented.");
  }

}
