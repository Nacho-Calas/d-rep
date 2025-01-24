import { BillStatus } from "../../domain/enums/bill_status.enum";
import { BillType } from "../../domain/enums/bill_type.enum";
import { BillChangeHistory } from "../../domain/value_objects/bill_change_history.vo";
import { UUID } from '../value_objects/uuid.vo';

export interface BillDTO {
  id: UUID;
  userId: string;
  status: BillStatus;
  creationDate: string;

  type: BillType;
  s3Url?: string;
  s3Key?: string;

  /* Estas no iban? */
  s3UrlVideo?: string;
  s3KeyVideo?: string;

  /* Historial de Cambios */
  changeHistory?: BillChangeHistory[];

  /* Data cruda de OCR (Vertex). */
  rawOcrData?: any;

  flag?: string;
}
