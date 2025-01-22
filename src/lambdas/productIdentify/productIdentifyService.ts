import { v4 as uuidv4 } from 'uuid';
import natural = require('natural');
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { UserInterfaceDynamoDB } from '../../common/dynamoDB/dynamoDBInterface.response';
import { billTableDynamoDBRepository } from '../../common/dynamoDB/billTableDynamoDBRepository';
import { commonTableDynamoDBRepository } from '../../common/dynamoDB/commonTableDynamoDBRepository';
import { DictionaryItem } from '../../common/dynamoDB/commonTableDynamoDBinterface.output';
import { ReferenceDTO } from '../../common/dynamoDB/referencesTableDynamoDBInterface';
import { referencesTableDynamoDBRepository } from '../../common/dynamoDB/referencesTableDynamoDBRepository';
import { dataForReference } from './productIdentifyInterface';
import { ItemInterface, ItemStatus, brandsIdentify } from '../../common/dynamoDB/itemsTableDynamoDBInterface';
import { itemsTableDynamoDBRepository } from '../../common/dynamoDB/itemsTableDynamoDBRepository';
import { BillStatus } from '../../common/dynamoDB/billTableDynamoDBInterface';
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';
import { mergeObjects } from "../../common/mergeObjects";

const mainTable = new dynamoDBRepository();
const billTable = new billTableDynamoDBRepository();
const commonTable = new commonTableDynamoDBRepository();
const referenceTable = new referencesTableDynamoDBRepository();
const itemTable = new itemsTableDynamoDBRepository();
const tokenizer = new natural.WordTokenizer();
const JaroWinkler = natural.JaroWinklerDistance;

export const productIdentifyService = async (body: any, userId: string, billId: string): Promise<any> => {
    try {
        console.log('objeto de parametros: ', JSON.stringify({userId, billId}))
        // se busca datos del bill
        const billData = await billTable.getBill(billId);
        console.log('billData: ', billData)
        // se agrega directamente desde aqui el casback de los 500 ya que ya habria pasado por el analisis y el pos procesamiento (el que corresponda)
        const user = await mainTable.getUser(userId);
        console.log('user principio: ', user)
        await cashbackApplied(billId, user, userId);
        // se busca el listado de marcas
        const brands: { name: string, id: string }[] = await getBrands();
        console.log('brands: ', brands)
        // se busca el listado de palabras para el diccionario
        const dictionary: DictionaryItem[] = await commonTable.getDictionary();
        console.log('dictionary: ', dictionary)
        // se procesa la data de textract
        const preProcessData = preprocessList(billId, JSON.parse(billData.bill.textractData), brands, dictionary);
        console.log('preProcessData: ', preProcessData)

        if (preProcessData.newItemList.length === 0) {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL,
                bill: {
                    status: BillStatus.BILL_SCAN_UNSUCCESSFUL
                }
            });
            await billTable.putBill(billData, billId, "productIdentifyService");
            return {
                statusCode: StatusCodes.OK,
                body: { billStatus: BillStatus.BILL_SCAN_UNSUCCESSFUL }
            };
        }

        let referenceList = [];
        let listWithoutReferencesFound = [];
        let defaultReferenceList: ReferenceDTO[] = [];

        if (preProcessData.dataForReference.length > 0) {
            referenceList = await referenceTable.getReferencesByIds(preProcessData.dataForReference);
            listWithoutReferencesFound = compareReferenceList(preProcessData.dataForReference, referenceList);

            if (listWithoutReferencesFound.length > 0) {
                defaultReferenceList = await referenceTable.getDefaultReferencesByIds(listWithoutReferencesFound);
            }
        }

        let productList = [];

        for (const item of preProcessData.newItemList) {
            const itemId = uuidv4();
            item.id = itemId;

            const itemWithreference = referenceList.find(ref => item.itemName == ref.reference);

            if (itemWithreference !== undefined) {
                // se encontro la referencia directa
                item.productId = itemWithreference.productId;
                item.selectedBrand = itemWithreference.brandId;
                item.status = ItemStatus.VALIDATED;
                await itemTable.newItem(item);
                productList.push({ productId: item.productId, item: item.id, brand: item.selectedBrand });
                continue;
            }

            if (item.brands.length === 0 || defaultReferenceList.length === 0) {
                item.status = ItemStatus.WITHOUT_BRAND;
                await itemTable.newItem(item);
                continue;
            }

            const resultProcess = processDefaultReferences(item, defaultReferenceList);
            mergeObjects(item, {
                bestSimilarity: resultProcess.bestSimilarity? resultProcess.bestSimilarity: null,
                bestPercentage: resultProcess.bestPercentage,
                itemName: resultProcess.itemName,
                listOfSimilarities: resultProcess.listOfProducts
            });

            if (resultProcess.bestPercentage <= 0 || resultProcess.bestSimilarity == null) {
                item.status = ItemStatus.NOT_VALIDATED;
                await itemTable.newItem(item);
                continue;
            }

            if (resultProcess.bestPercentage >= 0.5) {
                const date = new Date().toISOString().substring(0, 10); 
                item.productId = resultProcess.bestSimilarity.productId;
                item.selectedBrand = resultProcess.bestSimilarity.brandId;
                item.status = ItemStatus.VALIDATED;
                item.date = date;
                await itemTable.newItem(item);
                productList.push({ productId: item.productId, item: item.id, brandId: item.selectedBrand });
                continue;
            }
            item.selectedBrand = resultProcess.bestSimilarity.brandId;
            item.status = ItemStatus.BRAND_VALIDATED;
            await itemTable.newItem(item);
            productList.push({ productId: 'none', item: item.id, brandId: item.selectedBrand });
            
        }
        if (productList.length === 0) {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS,
                bill: {
                    status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS
                }
            });

            await billTable.putBill(billData, billId, "productIdentifyService");

            return {
                statusCode: StatusCodes.OK,
                body: { billStatus: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS }
            };
        } else {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.PRODUCT_FIELDS_IDENTIFIED,
                bill: {
                    status: BillStatus.PRODUCT_FIELDS_IDENTIFIED,
                    productFieldsIdentified: productList
                }
            });
            await billTable.putBill(billData, billId, "productIdentifyService");

            return {
                statusCode: StatusCodes.OK,
                body: {
                    billStatus: BillStatus.PRODUCT_FIELDS_IDENTIFIED
                }
            };
        }
    } catch (err) {
        logger.error({
            msg: `Error in productIdentifyService with message: ${err.msg}`,
            error: err,
        });
        const billNewData = await billTable.getBill(billId);
        mergeObjects(billNewData, {
            id: billId,
            status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS,
            bill: {
                status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS,
            },
        });
        await billTable.putBill(billNewData, billId, "productIdentifyService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                message: "Error trying to process the ticket.",
                status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS
            },
        };
    }
};


const cashbackApplied = async (billId, user: UserInterfaceDynamoDB, userId) => {
    const cashback = (user?.data?.cashbackAmount ?? 0) + 500
    mergeObjects(user, {
        data: { cashbackAmount: cashback }
    });
    console.log('user antes de postear solo el cashback: ', user)
    await mainTable.postUser(userId, user.data);
    const currentDate = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate(), new Date().getUTCHours(), new Date().getUTCMinutes(), new Date().getUTCSeconds())).toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'America/Argentina/Buenos_Aires'
      });
    const changeCashback = {
        timestamp: currentDate,
        amount: 500,
        billId: billId,
        promotionId: ""
      };
    if (!user.data.hasOwnProperty('cashbackHistory')) mergeObjects(user, ({ data: { cashbackHistory: [] } }));
    user.data.cashbackHistory.push(changeCashback);
    console.log('previo al post del user: ', user)
    await mainTable.postUser(userId, user.data);
    console.log('user despues de mergear: ', user)
}

//Funcion que crea una nueva lista con los datos importantes para identificar el producto
function preprocessList(billId: string, textractData: any, brands: { name: string, id: string }[], dictionary: DictionaryItem[]): { newItemList: ItemInterface[] | [], dataForReference: dataForReference[] } {
    const lineItems = textractData.LineItems || [];

    if (lineItems.length === 0) return { newItemList: [], dataForReference: [] };

    let newItemList: ItemInterface[] = [];
    let dataForReference: dataForReference[] = [];

    for (const itemList of lineItems) {
        let itemUpdated = false;
        let newItem: ItemInterface = {
            id: '',
            brands: [],
            selectedBrand: '',
            productId: '',
            date: '',
            expenseRow: '',
            itemNameSource: '',
            itemName: '',
            itemNameList: [],
            price: 0,
            quantity: 0,
            status: ItemStatus.CREATED,
            billId: billId,
            unitPrice: 0
        };

        for (const item of itemList) {
            const type = item.Type.Text;
            const valueText = (item.Value.Text).toLowerCase();

            switch (type) {
                case 'ITEM':
                    newItem.itemName = valueText;
                    newItem.itemNameSource = valueText;
                    newItem.itemNameList = generateVariations(valueText, dictionary);
                    for (const itemName of newItem.itemNameList) {
                        const brandsIdentify: brandsIdentify[] = findBrand(itemName, brands);
                        newItem.brands.push(...brandsIdentify);
                        const uniqueList = Array.from(new Set(newItem.brands.map(item => item.id)))
                            .map(id => newItem.brands.find(item => item.id === id));
                        newItem.brands = uniqueList;

                        if (brandsIdentify.length > 0) {
                            brandsIdentify.forEach(brand => {
                                dataForReference.push({
                                    itemName: valueText,
                                    brandId: brand.id
                                });
                            });
                        }
                    }
                    itemUpdated = true;
                    break;
                case 'PRICE':
                    newItem.price = valueText;
                    itemUpdated = true;
                    break;
                case 'QUANTITY':
                    newItem.quantity = valueText;
                    itemUpdated = true;
                    break;
                case 'UNIT_PRICE':
                    newItem.unitPrice = valueText;
                    itemUpdated = true;
                    break;
                case 'EXPENSE_ROW':
                    newItem.expenseRow = valueText;
                    itemUpdated = true;
                    break;
                default:
                    break;
            }
            // sumar el id del ticket
            // fecha de carga 
            // fecha de ticket
        };

        if (!itemUpdated) {
            logger.error(`The item does not respect the structure, billId: ${billId}`);
            // informar el error
        }
        newItemList.push(newItem);
    };
    const uniqueDataforReference = Array.from(new Set(dataForReference.map(item => item.brandId)))
        .map(id => dataForReference.find(item => item.brandId === id));
    return { newItemList: newItemList, dataForReference: uniqueDataforReference };
}

async function getBrands(): Promise<{ name: string, id: string }[]> {
    const brands = await mainTable.getAllBrands();
    let brandsNames = [];

    for (const b of brands) {
        brandsNames.push({
            name: (b.data.name).toLowerCase(),
            id: b.SK
        });
    }

    return brandsNames;
}

function findBrand(itemName: string, brandsList: { name: string, id: string }[]): brandsIdentify[] {
    const itemStringList = itemName.split(" ");
    let brandsIdentify = [];

    itemStringList.forEach(itemA => {
        const matchingItems = brandsList.filter(itemB => itemB.name.includes(itemA));
        brandsIdentify.push(...matchingItems);
    });

    const uniqueList = Array.from(new Set(brandsIdentify.map(item => item.id)))
        .map(id => brandsIdentify.find(item => item.id === id));

    const matchingItems = uniqueList.filter(itemB => itemName.includes(itemB.name));
    return matchingItems;
}

function compareReferenceList(dataForReference: dataForReference[], referenceList: ReferenceDTO[]): dataForReference[] {
    let listWithoutReferencesFound = [];

    for (const ref of dataForReference) {
        const itemFound = referenceList.find((elem) => elem.reference == ref.itemName);

        if (itemFound == undefined) {
            listWithoutReferencesFound.push(ref);
        }
    }

    return listWithoutReferencesFound;
}

function processDefaultReferences(itemData: ItemInterface, defaultReferenceList: ReferenceDTO[]) {

    const brandIds = itemData.brands.map(brand => brand.id);
    const listReferenceBrand = defaultReferenceList.filter(item => brandIds.includes(item.brandId));

    let listOfProducts: { itemName: string, ref: ReferenceDTO, similarities: { word: string, similarity: number }[] }[] = [];
    itemData.itemNameList.push(itemData.itemNameSource);

    for (const itemName of itemData.itemNameList) {
        const tokens = orderAlphabetically(tokenizer.tokenize(itemName));

        for (const ref of listReferenceBrand) {
            const keywords = orderAlphabetically(ref.keywords);
            let similarities = [];
            tokens.forEach((wordA: string) => {
                const similarity = keywords.includes(wordA) ? 1 : 0;
                similarities.push({
                    word: wordA,
                    similarity: similarity
                });
            });
            listOfProducts.push({
                itemName: itemName,
                ref: ref,
                similarities: similarities
            });
            const similaritiesLN = keywords.map(word => ({
                word,
                similarity: JaroWinkler(tokens.join(' '), word.toLowerCase(), {})
            }));
            if (similarities.length == similaritiesLN.length) {
                listOfProducts.push({
                    itemName: itemName,
                    ref: ref,
                    similarities: similaritiesLN
                });
            } 
        }

    }

    const { bestSimilarity, bestPercentage, itemName } = getBestSimilarity(listOfProducts);

    return { bestSimilarity, bestPercentage, itemName, listOfProducts }
}

function orderAlphabetically(list) {
    // Utiliza el método sort() para ordenar la lista alfabéticamente
    const orderedList = list.sort((a, b) => a.localeCompare(b));
    return orderedList;
}

function getBestSimilarity(listOfProducts: { itemName: string, ref: ReferenceDTO, similarities: { word: string, similarity: number }[] }[]) {
    let bestSimilarity: ReferenceDTO = null;
    let bestPercentage = -1;
    let itemName = "";

    for (const elem of listOfProducts) {
        const similarities = elem.similarities;

        // Calcula el porcentaje promedio de similitudes
        const average = similarities.reduce((sum, similarity) => sum + similarity.similarity, 0) / similarities.length;

        // Compara y actualiza si es el mejor
        if (average > bestPercentage) {
            bestPercentage = average;
            bestSimilarity = elem.ref;
            itemName = elem.itemName;
        }
    }

    return { bestSimilarity, bestPercentage, itemName };
}

function generateVariations(frase: string, lista: DictionaryItem[]): string[] {
    // Dividir la frase en palabras
    const palabras = frase.split(" ");
    function generateCombinations(index: number, current: string): string[] {
        if (index === palabras.length) {
            return [current.trim()];
        }

        const palabra = palabras[index];
        const objeto = lista.find(obj => obj.key === palabra);

        if (objeto) {
            return objeto.words.flatMap(word =>
                generateCombinations(index + 1, current + " " + word)
            );
        } else {
            return generateCombinations(index + 1, current + " " + palabra);
        }
    }

    // Iniciar la generación de combinaciones
    return generateCombinations(0, "");
}