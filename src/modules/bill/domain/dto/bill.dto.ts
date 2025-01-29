import { BillStatus } from "../../domain/enums/bill_status.enum";
import { BillType } from "../../domain/enums/bill_type.enum";
import { BillChangeHistory } from "../../domain/value_objects/bill_change_history.vo";
import { UUID } from '../value_objects/uuid.vo';
import { S3EventData, S3ProcessData } from '../../domain/value_objects/bill_s3_data.vo';

export interface BillDTO {
  id: UUID;
  userId: string;
  status: BillStatus;
  creationDate: string;

  type: BillType;
  s3Url?: string;
  s3Key?: string;

  s3EventData?: S3EventData;
  s3ProcessData?: S3ProcessData;

  /* Historial de Cambios */
  changeHistory?: BillChangeHistory[];

  /* Data cruda de OCR (Vertex). */
  rawOcrData?: any;

  flag?: string;
}
