import { logger } from "../../common/logger";
import { SQSEvent } from "aws-lambda";
import {
  VertexAI,
  HarmCategory,
  HarmBlockThreshold,
  GenerateContentRequest,
} from "@google-cloud/vertexai";
import * as fs from "fs";
import natural = require('natural');
import { S3RepositoryInstance } from "../../common/s3Repository";
import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
import { BillStatus, BillTableInterface, BillType } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { mergeObjects } from "../../common/mergeObjects";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";
import { HeaderTableInterface } from "../../common/dynamoDB/headersTableDynamoDBInterface";
import { validateCuit } from "../../common/bills/validateCuit";
import { normalizeCuit } from "../../common/bills/normalizeCuit";
import { correctCuit } from "../../common/bills/correctCuit";
import { headersTableDynamoDBRepository } from "../../common/dynamoDB/headersTableDynamoDBRepository";
import { headersTableVertexDynamoDBRepository } from "../../common/dynamoDB/headersTableVertexDynamoDBRepository";
const googleCredentials = JSON.parse(
  process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON!
);
process.env.GOOGLE_APPLICATION_CREDENTIALS = "/tmp/credentials.json";
fs.writeFileSync("/tmp/credentials.json", JSON.stringify(googleCredentials));

const billTableVertex = new billTableVertexDynamoDBRepository();
const headersTableVertex = new headersTableVertexDynamoDBRepository();
const billTable = new billTableDynamoDBRepository();
const tokenizer = new natural.WordTokenizer();
const videoFormatList = [
  "mp4",
  "mov"
];

export const billVertexIaService = async (event: SQSEvent): Promise<any> => {
  let billId: string = "";
  let urlBill: string = "";
  let bucketName: string = "";
  let format: string = "";
  try {
    const body = JSON.parse(event?.Records[0]?.body);
    billId = body?.detail?.response?.result?.id?.data;
    urlBill = body?.detail?.response?.result?.bill?.data?.s3ProcessData?.data?.key?.data;
    const dotIds = urlBill.split('.');
    format = dotIds[dotIds.length -1];
    const s3UrlBill = body?.detail?.response?.result?.bill?.data?.s3ProcessData?.data?.url?.data;
    const regex = /https:\/\/(.*?)\.s3/;
    const match = s3UrlBill.match(regex);
    bucketName = match[1];

  } catch (error) {
    logger.error("error in parse", error);
    throw error;
  }

  try {
    const vertex_ai = new VertexAI({
      project: process.env.GOOGLE_PROJECT,
    });
    const model = "gemini-1.5-pro-001";

    const generativeModel = vertex_ai.preview.getGenerativeModel({
      model: model,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0,
        topP: 0.2,
        topK: 16,
      },
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
      //   systemInstruction: {
      //     parts: [text1]
      //   },
    });

    const text1 = {
      text: `El modelo va a tener que analizar un ticket de supermercado en formato imagen o video y extraer sus datos.
      Primero borra tu cache con los datos de todos los otros tickets que haya procesado, es decir toma el ticket a procesar como uno nuevo e independiente
      Si no se detecta la estructura del ticket debe devolver el siguiente json: {message:"No se encontro un ticket valido"}
      Para actuar bien como un ocr tenes que fijarte la geometria y ver si esta derecho o no el texto y ajustar eso.Y hacerlo por cada linea para ir ajustando
      Identifica si el ticket esta en diagonal y enderezalo para que lo puedas leer correctamente.Usa la geometria para ver si las palabras estan derechas o no .PAra evitar el error de confundir las lineas


      Este ticket tiene 3 partes importantes.Los headers donde se encuentran los datos del comercio y datos sobre el ticket.Los productos con sus precios y cantidades de items. y el footer que tiene el total y otros datos como "descuentos" que tienen que aparecer.
      El modelo debera contestar en formato clave valor , para ser consumido por una api en javascript.

      En la parte de los headers vas a tener que encontrar los siguientes clave valor:

      nombreComercio : El nombre del local Que suele estar arriba y puede ser que todo en letra negrita en uno o dos renglones.
      razonSocial:suele estar arriba o abajo del nombreComercio
      cuit: Que puede aparecer con las palabras claves como por ejempo :'C.U.I.T.', 'cuit', 'CUIT Nro.', 'Nro :', 'C.U.I.T. Nro :','C.U.I.T. Nro.:', 'C.U.I.T. Nro. :', 'CUIT:', 'CUIT Nro.El cuit si o si tiene que tener 11 digitos numericos.
      domicilio : Puede aparecer con las claves 'Domicilio', 'DOMICILIO', 'Domicilio:' o similares.
      numeroDeTicket: Que puede aparecer con las claves 'Nro. T.', 'TIQUE', 'Nro ticket:', 'Número', 'Comp.:', 'NRO:'
      puntoDeVenta: que puede aparecer con las claves 'P.V. N°', 'NRO.TIENDA', 'P.V.', 'No. T.:', 'Punto de venta:', 'PV:', 'P.V:'
      fecha : Que puede tener las siguientes claves "Fecha", "Fecha y hora :" .Se deben ignorar las siguientes claves para fecha :"Inicio de Actividades:", "Inicio de Actividades :", "Actividades:".
      hora: Se deben tener en cuenta las siguientes claves "Hora", "Hora:", "Hora :"
      total: La clave es TOTAL

      Los productos pueden venir de varias formas, te voy a dar ejemplos para que puedas ver en que formatos vienen.No deben aparecer estos ejemplos en el resultado, son ejemplos de formato

      1,0000 u x 2769,9900
      Velitas 2769,99
      
      Donde 1,0000 u x 2769,9900 significa que es una sola unidad y que vale 2769,9900 cada una. en la linea de abajo va el nombre del producto.

      Otra forma es
      
      0,8493 kgs pata muslo 2.3000 1.950  
      Donde 0.83 kgs seria la cantidad del prodcuto pata muslo el nombre del producto. 2300 lo que valdria el kilo entero y 1950 lo que valdria los 0.83kgs del producto.

      otra forma es 

      1.646 x 1499,0000
      PERA RICA
      000000004567 (10,50%) 2467.35
        $1199xkg PERA $ - 493.80
      
      Donde 1.1646 x 1499.0000 significa que 1.1646 es la cantidad y 1499.0000 el precio."PERA RICA" es el producto.El numero "000000004567" que es largo y esta abajo de el nombre del producto no es el total y no me sirve. 2467.35 seria el total . y "$1199xkg PERA $ - 493.80" no me sirve. 
      
      otro ejemplo es

      Don triturado C (21,00)
      1x1.900,00 / 09182309  1.9000,00
      25% consev tomate   -475
      
      Donde "Don triturado C" es el nombre del producto. 1x1.900,00 sigifica que es una sola unidad que vale 1.900,00 y el 1.900,00 de la derecha es el total del valor del producto.Lo que dice "25% consev tomate   -475" al tener un "-" en el total significa que es un descuento y no tiene que ser tomada en cuenta esta linea.
      
      otro ejemplo es

      1,000 u x 207,0000
      puerta de vidrio
      0.180 x 1149,99 (10,50) 207
      
      Donde 1,000 u x 207 significa que es una unidad que vale 207 . puerta de vidrio es el nombre del producto. y 0.180 x 1149.99 la cuenta da 207 que tambien es el total del producto donde 0.180 seria la cantidad del producto y 1149.99 el valor si el producto fuera entero.
      
      
      en general el total esta en letra mas grande y resaltada .Lo mismo pasa con el nombre del producto.El cual puede tener mas de una palabra
      De los productos quiero que me des la cantidad, el precio , el total y el nombre.

      Hay que tener en cuenta que la lectura de los productos tiene que ser linea por linea.Y tratar de no mezclar lineas.
      En el footer aparece el total , el cambio y los descuentos.No confundir "cambio" con "descuentos".Los descuentos casisiempre dice descuentos y el total de descuentos tiene un "-" adelante del numero , por ejemplo "-60".No siempre aparecen cambio o descuentos.Pueden aparecer o no.
      Verifica el porcentaje de confianza de cada valor y si esta menos del 80%, entonces responde el siguiente json: {message:"Ticket no legible"}
      Esta es la imagen a analizar teniendo en cuenta los ejemplos proporcionados antes`,
    };

    //TO-DO: COMPRIMIR IMAGEN SI PESA MAS DE 5MB
    const imageData = await getImageVideo(urlBill, bucketName);
    const base64Image = imageData.toString("base64");
    const formatVideo = videoFormatList.find((value) => value == format);
    const image1 = {
      inlineData: {
        mimeType: formatVideo ? "video/mp4":"image/jpeg",
        data: base64Image,
      },
    };


    const req: GenerateContentRequest = {
      contents: [{ role: "user", parts: [text1, image1] }],
    };

    const streamingResp = await generativeModel.generateContentStream(req);
    const resp = await streamingResp.response;
    logger.info("aggregated response complete: " + JSON.stringify(resp));

    const vertexDataString = (resp.candidates[0]?.content?.parts[0]?.text)
      .replace("```json\n", "")
      .replace("\n```", "");
    let vertexDataObject = await JSON.parse(await convertUnquotedStringsToQuoted(await replaceCommasWithDots(vertexDataString)));
    logger.info("responsee: " + JSON.stringify(vertexDataObject));

    if (vertexDataObject.message) {
      logger.error(vertexDataObject.message);
      throw new Error;
    }
    const billVertexData: BillTableVertexInterface = await saveVertexData(billId, JSON.stringify(vertexDataObject));
    vertexDataObject = await processHeader(vertexDataObject, billId);
    if (process.env.ENV == 'insigths' || process.env.ENV == 'insights-dev') return;
    const textractData = transformToTextractData(vertexDataObject);
    const billData: BillTableInterface = await billTable.getBill(billVertexData.id);
    mergeObjects(billData, {
      status: BillStatus.TEXTRACT_COMPLETED,
      S3url: billVertexData.bill.s3url,
      bill: {
          S3url: billVertexData.bill.s3url,
          s3key: billVertexData.bill.s3key,
          status: BillStatus.TEXTRACT_COMPLETED,
          userId: billVertexData.bill.userId,
          textractData: textractData,
          textractMappedToVertexFormat: JSON.stringify(vertexDataObject)
      },
      type: billVertexData.type,
    });
    await billTable.putBill(billData, billId, "billVertexIa");
  } catch (err) {
    const billVertexData: BillTableVertexInterface = await billTableVertex.getBill(billId);
      mergeObjects(billVertexData, {
        id: billId,
        bill: {
          status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
        },
        status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
      });
    await billTableVertex.putBill(billVertexData, billId, "billVertexIa");
    if (process.env.ENV !== 'insigths' && process.env.ENV !== 'insights-dev') {
      const billData: BillTableInterface = await billTable.getBill(billVertexData.id);
      mergeObjects(billData, {
        id: billVertexData.id,
        status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
        S3url: billVertexData.bill.s3url,
        bill: {
          S3url: billVertexData.bill.s3url,
          s3key: billVertexData.bill.s3key,
          status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
          userId: billVertexData.bill.userId
        },
        type: billVertexData.type
      })
      await billTable.putBill(billData, billId, "billVertexIa");
    };
    logger.error({
      msg:
        "Error in billAnalysisVertexService with message: " +
        JSON.stringify(err),
      error: JSON.stringify(err),
    });
    throw err;
  }
};

const getImageVideo = async (urlBill: string, bucketName:string) => {
  return await S3RepositoryInstance.getFile(
    urlBill,
    bucketName
  ).catch((error) => {
    throw error;
  });
};

const saveVertexData = async (billId: string, vertexData: any) => {
  const billData: BillTableVertexInterface = await billTableVertex.getBill(billId);
  mergeObjects(billData, {
    id: billId,
    status: BillStatus.TEXTRACT_COMPLETED,
    bill: {
      vertexData: vertexData,
      status: BillStatus.TEXTRACT_COMPLETED,
    },
  });
  await billTableVertex.putBill(billData, billId, "billVertexIa");
  return billData;
};

const processHeader = async (vertexData: any, billId: string) => {
  try {
    // limpiar nombre de comercio
    const tokens = tokenizer.tokenize(vertexData.nombreComercio.toLowerCase());
    const tradeName = tokens.join(' ');
    vertexData.nombreComercio = tradeName;
    //buscar por cuit
    let headerList : any[] = await headersTableVertex.getHeadersWithCuit(vertexData.cuit);
    if (headerList.length > 0) {
      const findHeader = (headerList: any []) => {
        for (const header of headerList) {
          if (header.GSI2SK == vertexData.cuit && header.GSI1SK == vertexData.nombreComercio) {
            return header;
          };
        };
        return null;
      };
      const headerCuit: HeaderTableInterface = findHeader(headerList);
      if (headerCuit == null) {
        //sumar cuit con el nuevo comercio
        await headersTableVertex.newHeaderData(vertexData, billId);
      } else {
        // verificar que este la direccion sino sumarla
        if (!headerCuit.address.includes(vertexData.domicilio)) {
          headerCuit.address.push(vertexData.domicilio)
          mergeObjects(headerCuit, {
            address: headerCuit.address
          });
          await headersTableVertex.putHeaderData(headerCuit);
        }
      };
      return vertexData;
    };
    // no esta el cuit, buscar por comercio
    headerList = await headersTableVertex.getNameWithGSI(vertexData.nombreComercio);
    if (headerList.length > 0) {
      // se encuentra comercio, se modifica el objeto
      vertexData.cuit = headerList[0].GSI2SK;
      return vertexData;
    };
    // no se encontro ni cuit ni comercio, se verifica si es cuit valido
    const normalizedCuit = normalizeCuit(vertexData.cuit);
    const correctedCuit = correctCuit(normalizedCuit);
    if (validateCuit(vertexData.cuit)) {
      await headersTableVertex.newHeaderData(vertexData, billId);
      return vertexData;
    };
    // el cuit no es valido, se busca en tabla headers todas las posibles correspondencias
    const possibleHeadersList = await headersTableVertex.queryByKeywordsInName(tokens);
    if (possibleHeadersList.length == 0) {
      // si no se encontro nada se devuelve tal cual el objeto
      return vertexData;
    };
    // si se encontro algo se verifica que las direcciones concuerden, en caso de concordar se suma el cuit
    for (const item of possibleHeadersList) {
      if (item.address.includes(vertexData.domicilio)) {
        vertexData.cuit = item.GSI2SK;
        return vertexData;
      }
    };
    // en caso de no concordar se devuelve tal cual el objeto
    return vertexData;
  } catch (err) {
    logger.error("processHeader", err);
    throw err;
  }
};

const transformToTextractData = (vertexData: any) : string =>  {
  try {
    let summaryFields = [];
    let blocks = [];
    const listName = vertexData.items ? "items": "productos";
    vertexData[listName]= cleanLineItems(vertexData[listName]);
    let descuentos = vertexData.descuentos && vertexData.descuentos != 'null' ? parseFloat(vertexData.descuentos.toString().replace('-', '').replace(',', '.')) : 0;
    descuentos = descuentos > 0 ? descuentos : vertexData.descuento && vertexData.descuento != 'null' ? parseFloat(vertexData.descuento.toString().replace('-', '').replace(',', '.')) : 0;
    if (vertexData.nombreComercio) {
      summaryFields.push({
        "Type": {"Confidence": 98.3212661743164, "Text": "NAME"},
        "Label": {},
        "Value": {"Text": `${vertexData.nombreComercio}`, "Confidence": 82.04283142089844}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.nombreComercio}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.nombreComercio}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.cambio) {
      summaryFields.push({
        "Type": {"Confidence": 51.64982223510742, "Text": "AMOUNT_PAID"},
        "Label": {"Text": "MC Debit", "Confidence": 51.559593200683594},
        "Value": {"Text": `${vertexData.cambio}`, "Confidence": 51.559593200683594}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.cambio}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.cambio}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.fecha) {
      summaryFields.push({
        "Type": {"Confidence": 97.41565704345703, "Text": "INVOICE_RECEIPT_DATE"},
        "Label": {"Text": "Fecha", "Confidence": 95.94363403320312},
        "Value": {"Text": `${vertexData.fecha}`, "Confidence": 95.99618530273438}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.fecha}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.fecha}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.total) {
      const total = parseFloat(vertexData.total.toString().replace(',', '.')) + descuentos;
      summaryFields.push({
        "Type": {"Confidence": 99.99898529052734, "Text": "TOTAL"},
        "Label": {"Text": "TOTAL", "Confidence": 99.8982162475586},
        "Value": {"Text": `${total}`, "Confidence": 88.8127670288086}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${total}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${total}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.puntoDeVenta) {
      summaryFields.push({
        "Type": {"Confidence": 99.76547241210938, "Text": "OTHER"},
        "Label": {"Text": "PV:", "Confidence": 75.48894500732422},
        "Value": {"Text": `${vertexData.puntoDeVenta}`, "Confidence": 99.60527038574219}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `PV: ${vertexData.puntoDeVenta}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `PV: ${vertexData.puntoDeVenta}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.numeroDeTicket) {
      summaryFields.push({
        "Type": {"Confidence": 99.97151184082031, "Text": "OTHER"},
        "Label": {"Text": "Número de Ticket", "Confidence": 96.29356384277344},
        "Value": {"Text": `${vertexData.numeroDeTicket}`, "Confidence": 99.79502868652344}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.numeroDeTicket}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.numeroDeTicket}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.hora) {
      summaryFields.push({
        "Type": {"Confidence": 99.99340057373047, "Text": "OTHER"},
        "Label": {"Text": "Hora", "Confidence": 99.7703628540039},
        "Value": {"Text": `${vertexData.hora}`, "Confidence": 98.35765838623047}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.hora}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.hora}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.domicilio) {
      summaryFields.push({
        "Type": {"Confidence": 99.99340057373047, "Text": "OTHER"},
        "Label": {"Text": "Domicilio", "Confidence": 99.7703628540039},
        "Value": {"Text": `${vertexData.domicilio}`, "Confidence": 98.35765838623047}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${vertexData.domicilio}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${vertexData.domicilio}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if (vertexData.cuit) {
      summaryFields.push({
        "Type": {"Confidence": 99.99340057373047, "Text": "OTHER"},
        "Label": {"Text": "CUIT:", "Confidence": 99.7703628540039},
        "Value": {"Text": `${vertexData.cuit}`, "Confidence": 98.35765838623047}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `CUIT: ${vertexData.cuit}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `CUIT: ${vertexData.cuit}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    if ( descuentos > 0) {
      let subtotal = vertexData.total? parseFloat(vertexData.total.toString().replace(',', '.')) : 0;
      subtotal = subtotal == 0 ? 0 : subtotal + descuentos;
      summaryFields.push({
        "Type": {"Confidence": 99.99898529052734, "Text": "SUBTOTAL"},
        "Label": {"Text": "Descuentos", "Confidence": 99.93385314941406},
        "Value": {"Text": `${subtotal}`, "Confidence": 97.19562530517578}
      });
      blocks.push({
        "BlockType": "LINE",
        "Confidence": 98.84986877441406,
        "Text": `${subtotal}`,
        "Id": "08f310be-661a-4cd3-b749-60a798b90084"
      });
      blocks.push({
        "BlockType": "WORD",
        "Confidence": 99.57685852050781,
        "Text": `${subtotal}`,
        "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
      });
    };
    const lineItems = vertexData[listName].map(producto => {
      let itemData = [];
      if (producto.nombre) {
        itemData.push({
          "Type": {"Confidence": 99.97061157226562, "Text": "ITEM"},
          "Value": {"Text": `${producto.nombre}`, "Confidence": 99.33887481689453}
        });
        blocks.push({
          "BlockType": "LINE",
          "Confidence": 98.84986877441406,
          "Text": `${producto.nombre}`,
          "Id": "08f310be-661a-4cd3-b749-60a798b90084"
        });
        blocks.push({
          "BlockType": "WORD",
          "Confidence": 99.57685852050781,
          "Text": `${producto.nombre}`,
          "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
        });
      };
      if (producto.total) {
        const price = parseFloat(producto.total.toString().replace(',', '.'));
        itemData.push({
          "Type": {"Confidence": 99.99197387695312, "Text": "PRICE"},
          "Value": {"Text": `${price}`, "Confidence": 96.53030395507812}
        });
        itemData.push({
          "Type": {"Confidence": 98.77790832519531, "Text": "UNIT_PRICE"},
          "Value": {"Text": `${price}`, "Confidence": 93.53462219238281}
        });
        blocks.push({
          "BlockType": "LINE",
          "Confidence": 98.84986877441406,
          "Text": `${price}`,
          "Id": "08f310be-661a-4cd3-b749-60a798b90084"
        });
        blocks.push({
          "BlockType": "WORD",
          "Confidence": 99.57685852050781,
          "Text": `${price}`,
          "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
        });
      };
      if (producto.cantidad) {
        itemData.push({
          "Type": {"Confidence": 99.97858428955078, "Text": "QUANTITY"},
          "Value": {"Text": `${producto.cantidad}`, "Confidence": 99.52635955810547}
        });
        itemData.push({
          "Type": {"Confidence": 99.99635314941406, "Text": "EXPENSE_ROW"},
            "Value": {"Text": `${producto.cantidad} u X ${producto.precio}\n${producto.total}\n${producto.nombre}`, "Confidence": 95.5713119506836}
        });
        blocks.push({
          "BlockType": "LINE",
          "Confidence": 98.84986877441406,
          "Text": `${producto.cantidad}`,
          "Id": "08f310be-661a-4cd3-b749-60a798b90084"
        });
        blocks.push({
          "BlockType": "WORD",
          "Confidence": 99.57685852050781,
          "Text": `${producto.cantidad}`,
          "Id": "934a9a91-7fff-4958-b2a7-8bb6c0774bde"
        });
      };
      return itemData;
    });

    return JSON.stringify({
        SummaryFields: summaryFields,
        LineItems: lineItems,
        Blocks: blocks
    });
  } catch (error) {
    logger.error("Error in transformToTextractData: ", error);
    throw error;
  }
};

async function convertUnquotedStringsToQuoted(input) {
  return input.replace(/"([^"]+)"\s*:\s*([^",{}\[\]\s]+(?:\.\d+)?)/g, '"$1": "$2"');
}

async function replaceCommasWithDots(text) {
  // Usar una expresión regular para encontrar números decimales con comas y reemplazarlos por puntos
  return text.replace(/(\d+)\.(\d{3}),(\d{2})/g, '$1$2.$3').replace(/(\d+),(\d{2})/g, '$1.$2');;
}

function cleanLineItems(lineItems) {
  //const itemsWithoutDup = removeDuplicatesByMultipleKeys(lineItems, ['cantidad', 'precio', 'total', 'nombre']);
  const validItem = (nombre) => {
    const relevantTagsType = ['Desc', 'desc', 'Total', 'total'];
    return !relevantTagsType.includes(nombre);
  };
  return lineItems.map(item => {
    const isValid = validItem(item.nombre);
    if (isValid) return item;
  });
};

function removeDuplicatesByMultipleKeys(objectsArray, keys) {
  const seen = new Set();
  return objectsArray.filter(item => {
    const compositeKey = keys.map(key => item[key]).join('|');
    if (seen.has(compositeKey)) {
      return false;
    } else {
      seen.add(compositeKey);
      return true;
    }
  });
}