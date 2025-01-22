import {
  AnalyzeExpenseCommandOutput,
  LineItemFields,
  ExpenseType,
  ExpenseField,
  Block,
} from '@aws-sdk/client-textract';
import { TextractInstance } from '../../common/textract';
import { billTableDynamoDBRepository } from '../../common/dynamoDB/billTableDynamoDBRepository';
import {
  BillTableInterface,
  BillStatus,
} from '../../common/dynamoDB/billTableDynamoDBInterface';
import { logger } from '../../common/logger';
import { mergeObjects } from "../../common/mergeObjects";
import { StatusCodes } from 'http-status-codes';

interface FormattedLineItemsFields {
  Type: ExpenseType | undefined;
  Value: {
    Text: string | undefined;
    Confidence: number | undefined;
  };
}
interface FormattedSummaryFields {
  Type: ExpenseType | undefined;
  Label: {
    Text: string | undefined;
    Confidence: number | undefined;
  };
  Value: {
    Text: string | undefined;
    Confidence: number | undefined;
  };
}
interface FormattedBlocksFields {
  BlockType: string | undefined;
  Confidence: number | undefined;
  Text: string | undefined;
  Id: string | undefined;
}

const billTable = new billTableDynamoDBRepository();
export const billTextractService = async (
  billId: string,
  urlBill: string
): Promise<any> => {
  try {
    const textractOutput: AnalyzeExpenseCommandOutput = await TextractInstance.analyzeExpense(urlBill);
    const processResponse = processAnalyzedExpense(textractOutput);
    const billData = await billTable.getBill(billId);
    const status = (processResponse.SummaryFields.length == 0) || (processResponse.LineItems.length == 0)
      ? BillStatus.BILL_SCAN_UNSUCCESSFUL : BillStatus.TEXTRACT_COMPLETED

    mergeObjects(billData, {
      id: billId,
      status: status,
      bill: {
        textractData: JSON.stringify(processResponse),
        textractMappedToVertexFormat:JSON.stringify(mapperTextractToVertexFormat(processResponse)),
        status: status
      }
    });

    await billTable.putBill(billData, billId, "billTextractService");

    return {
      statusCode: StatusCodes.OK,
      body: { message: status },
    };
  } catch (err) {
    logger.error({
      msg: 'Error in billTextractService with message: ' + err.msg,
      error: err,
    });
    const billNewData = await billTable.getBill(billId);
    mergeObjects(billNewData, {
      id: billId,
      status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
      bill: {
        status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
      },
    });
    await billTable.putBill(billNewData, billId, "billTextractService");
    return {
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      body: {
        message: "Error trying to upload bill.",
        status: BillStatus.BILL_SCAN_UNSUCCESSFUL
      },
    };
  }
};

function processLineItems(
  lineItems: LineItemFields[]
): FormattedLineItemsFields[][] {
  const lineItemsResult: FormattedLineItemsFields[][] = [];
  for (const item of lineItems) {
    const fieldResults: FormattedLineItemsFields[] = [];

    if (item.LineItemExpenseFields) {
      for (const field of item.LineItemExpenseFields) {
        const res: FormattedLineItemsFields = {
          Type: field.Type,
          Value: {
            Text: field.ValueDetection?.Text,
            Confidence: field.ValueDetection?.Confidence,
          },
        };
        fieldResults.push(res);
      }
    }

    lineItemsResult.push(fieldResults);
  }

  return lineItemsResult;
}

function processSummaryFields(
  summaryFields: ExpenseField[]
): FormattedSummaryFields[] {
  return summaryFields.map((summaryField) => {
    return {
      Type: summaryField.Type,
      Label: {
        Text: summaryField.LabelDetection?.Text,
        Confidence: summaryField.LabelDetection?.Confidence,
      },
      Value: {
        Text: summaryField.ValueDetection?.Text,
        Confidence: summaryField.ValueDetection?.Confidence,
      },
    };
  });
}

function processBlockFields(blocks: Block[]): FormattedBlocksFields[] {
  return blocks.map((blockField) => {
    return {
      BlockType: blockField.BlockType,
      Confidence: blockField.Confidence,
      Text: blockField.Text,
      Id: blockField.Id,
    };
  });
};

function processAnalyzedExpense(response: AnalyzeExpenseCommandOutput) {
  const summaryFields = response.ExpenseDocuments?.[0].SummaryFields;

  const lineItems = response.ExpenseDocuments?.[0].LineItemGroups?.[0].LineItems;

  const blocks = response.ExpenseDocuments?.[0].Blocks;

  const fullData = {
    SummaryFields: summaryFields && processSummaryFields(summaryFields),
    LineItems: lineItems && processLineItems(lineItems),
    Blocks: blocks && processBlockFields(blocks),
    ResponseMetadata: response.$metadata,
    TicketId: response.$metadata.requestId,
  };

  return fullData;
}
function mapperTextractToVertexFormat(input) {

  const summaryFields = input.SummaryFields.reduce((acc, field) => {
    switch (field.Type.Text) {
      case "NAME":
        acc.nombreComercio = field.Value.Text;
        break;
      case "INVOICE_RECEIPT_DATE":
        acc.fecha = field.Value.Text;
        break;
      case "INVOICE_RECEIPT_ID":
        acc.numeroDeTicket = field.Value.Text;
      break;
      case "TOTAL":
        acc.total = field.Value.Text;
        break;
      case "AMOUNT_PAID":
        acc.cambio = field.Value.Text;
        break;
      case "SUBTOTAL":
        acc.descuentos = field.Value.Text;
        break;
      case "OTHER":
        const labelText = field.Label.Text;
        if (labelText.includes("P.V")) {
          acc.puntoDeVenta = field.Value.Text;
        } else if (labelText.includes("Nro. T.") || labelText.includes("No T.") ) {
          acc.numeroDeTicket = field.Value.Text;
        } else if (labelText.includes("Hora")) {
          acc.hora = field.Value.Text;
        } else if (labelText.includes("VENDOR_ADDRESS")) {
          acc.domicilio = field.Value.Text;
        } else if (labelText.includes("Cuit:") || labelText.includes("C.U.I.T. Nro.:")) {
          acc.cuit = field.Value.Text;
        }
        break;
    }
    return acc;
  }, {});


  const productos = input.LineItems.map((itemArray) => {
    const itemData = itemArray.reduce((itemAcc, item) => {
      switch (item.Type.Text) {
        case "ITEM":
          itemAcc.nombre = item.Value.Text;
          break;
        case "PRICE":
          itemAcc.precio = item.Value.Text;
          break;
        case "QUANTITY":
          itemAcc.cantidad = item.Value.Text;
          break;
        case "TOTAL":
          itemAcc.total = item.Value.Text;
          break;
        case "UNIT_PRICE":
          itemAcc.precioUnitario = item.Value.Text;
          break;
      }
      return itemAcc;
    }, {});

    return itemData;
  });

  return {
    ...summaryFields,
    productos,
  };
}