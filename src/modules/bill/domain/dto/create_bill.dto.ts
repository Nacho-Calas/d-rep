import { BillStatus } from "../enums/bill_status.enum";
import { UUID } from "../value_objects/uuid.vo";

type ICreateBill = {
  id: UUID;
  status?: BillStatus;
  creationDate: Date;
};

export class CreateBillDTO {
  public readonly id: UUID;
  public readonly status: BillStatus;
  public readonly creationDate: Date;

  constructor(bill: ICreateBill) {
    this.id = bill.id;
    this.status = bill.status;
    this.creationDate = bill.creationDate;
  }
}
