import { CreateBillDTO } from "../../domain/dto/create_bill.dto";
import { Bill } from "../../domain/entities/bill";
import { BillStatus } from "../../domain/enums/bill_status.enum";
import { BillType } from "../../domain/enums/bill_type.enum";
import { UUID } from "../../domain/value_objects/uuid.vo";

export class BillFactory {
  static createBill(createBillDTO: CreateBillDTO): Bill {
    const id = UUID.create();
    const status = BillStatus.CREATED;
    const creationDate = new Date().toISOString();
    return new Bill({
      id,
      creationDate,
      status,
    });
  }
}
