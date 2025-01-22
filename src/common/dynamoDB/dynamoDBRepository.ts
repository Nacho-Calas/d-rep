import {
  AttributeValue,
  QueryOutput,
  BatchGetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import {
  AWSDynamoDBClient,
  awsDynamoDBClientInstance,
} from "./AWSdynamoDBClient";
import {
  productItemDTO,
  supplierItemDTO,
  brandItemDTO,
  promotionsItemDTO,
  PromotionType,
  UserInterface
} from "./dynamoDBInterface.request";
import {
  PromotionItemDynamoDBResp,
  SupplierItemDynamoDBResp,
  ProductItemDynamoDBResp,
  BrandItemDynamoDBResp,
  UserInterfaceDynamoDB
} from "./dynamoDBInterface.response";
import { GetItemsGSIInput } from "./AWSdynamoDBClientInterface";
import { logger } from "../logger";
import { mergeObjects } from '../mergeObjects';

export class dynamoDBRepository {

  BRANDS_KEY = 'brand';

  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  }

  async postProduct(productID: string, dto: productItemDTO) {
    const params: Record<string, AttributeValue> = {
      PK: { S: "product#" + productID },
      SK: { S: "info" },
      data: {
        M: {
          name: { S: dto.product.name },
          supplierId: { S: dto.product.supplierId },
          description: { S: dto.product.description },
          category: { S: dto.product.category },
          imageUrl: { S: dto.product.imageUrl },
          measure: { S: dto.product.measure },
          weight: { N: JSON.stringify(dto.product.weight) },
          active: { BOOL: dto.product.active },
        },
      },
      GSI1PK: { S: "brand" },
      GSI1SK: { S: dto.product.brandId },
    };
    try {
      const response = await this.dynamoDbClient.postItem(params);
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on postProduct method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postSupplier(supplierID: string, dto: supplierItemDTO) {
    const params: Record<string, AttributeValue> = {
      PK: { S: "supplier" },
      SK: { S: supplierID },
      data: {
        M: {
          name: { S: dto.supplier.name },
          reputation: { S: dto.supplier.reputation },
          email: { S: dto.supplier.email },
          phoneNumber: { N: JSON.stringify(dto.supplier.phoneNumber) },
          imageUrl: { S: dto.supplier.imageUrl },
          active: { BOOL: dto.supplier.active },
        },
      },
      GSI1PK: { S: "supplier" },
      GSI1SK: { S: supplierID },
    };
    try {
      const response = await this.dynamoDbClient.postItem(params);
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on postSupplier method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postBrand(brandID: string, dto: brandItemDTO) {
    const params: Record<string, AttributeValue> = {
      PK: { S: "brand" },
      SK: { S: brandID },
      data: {
        M: {
          name: { S: dto.brand.name },
          supplierId: { S: dto.brand.supplierId },
          imageUrl: { S: dto.brand.imageUrl },
          active: { BOOL: dto.brand.active },
        },
      },
      GSI1PK: { S: "supplier" },
      GSI1SK: { S: dto.brand.supplierId },
    };
    try {
      const response = await this.dynamoDbClient.postItem(params);
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on postBrand method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postPromotions(promotionID: string, dto: promotionsItemDTO) {
    const startDate = new Date(dto.promotion.startDate).toISOString().substring(0, 10)
    const endDate = new Date(dto.promotion.endDate).toISOString().substring(0, 10)
    const params: Record<string, AttributeValue> = {
      PK: { S: "promotion" },
      SK: { S: promotionID },
      data: {
        M: {
          name: { S: dto.promotion.name },
          description: { S: dto.promotion.description },

          // FIXME: Corregir como se sube startDate y endDate, ya que se está enviando con comillas.
          startDate: { S: startDate },
          endDate: { S: endDate },

          type: { S: dto.promotion.type },
          amount: { N: JSON.stringify(dto.promotion.amount) },
          listOfProducts: {
            L: dto.promotion.listOfProducts.map((k) => ({ S: k })),
          },
          brandID: { S: dto.promotion.brandID },
          supplierID: { S: dto.promotion.supplierID },
        },
      },
      GSI1PK: { S: "promotion" },
      GSI1SK: { S: endDate },
    };
    try {
      const response = await this.dynamoDbClient.postItem(params);
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on postPromotions method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postUser(userID: string, dto: UserInterface, createdDate?: string) {
    try {
      let params: Record<string, AttributeValue> = {
        PK: { S: "user#" + userID },
        SK: { S: "info" }
      };
      if (dto.email) {
        mergeObjects(params, ({ data: { M: { email: { S: dto.email } } } }));
        mergeObjects(params, ({ GSI1PK: { S: "username" } }));
        mergeObjects(params, ({ GSI1SK: { S: dto.email } }));
      }
      if (createdDate) mergeObjects(params, ({ createdDate: { S: createdDate } }));
      if (dto.birthdate) mergeObjects(params, ({ data: { M: { birthdate: { S: dto.birthdate } } } }));
      if (dto.gender) mergeObjects(params, ({ data: { M: { gender: { S: dto.gender } } } }));
      if (dto.isEmailVerified) mergeObjects(params, ({ data: { M: { isEmailVerified: { BOOL: dto.isEmailVerified } } } }));
      if (dto.isFormCompleted) mergeObjects(params, ({ data: { M: { isFormCompleted: { BOOL: dto.isFormCompleted } } } }));
      if (dto.isDeleted) mergeObjects(params, ({ data: { M: { isDeleted: { BOOL: dto.isDeleted } } } }));
      if (dto.localityCity) mergeObjects(params, ({ data: { M: { localityCity: { S: dto.localityCity } } } }));
      if (dto.localityCountry) mergeObjects(params, ({ data: { M: { localityCountry: { S: dto.localityCountry } } } }));
      if (dto.localityState) mergeObjects(params, ({ data: { M: { localityState: { S: dto.localityState } } } }));
      if (dto.localityNeighborhood) mergeObjects(params, ({ data: { M: { localityNeighborhood: { S: dto.localityNeighborhood } } } }));
      if (dto.nameAndLastName) mergeObjects(params, ({ data: { M: { nameAndLastName: { S: dto.nameAndLastName } } } }));
      if (dto.phoneNumber) mergeObjects(params,
        ({
          data: {
            M: {
              phoneNumber: {
                M: {
                  code: { S: dto.phoneNumber.code },
                  number: { N: JSON.stringify(dto.phoneNumber.number) }
                }
              }
            }
          }
        }));
      if (dto.dni) mergeObjects(params, ({ data: { M: { dni: { N: JSON.stringify(dto.dni) } } } }));
      if (dto.cashbackAmount) mergeObjects(params, ({ data: { M: { cashbackAmount: { N: JSON.stringify(dto.cashbackAmount) } } } }));
      if (dto.cashbackHistory) mergeObjects(params, ({
        data: {
          M: {
            cashbackHistory: {
              L: dto.cashbackHistory.map(
                (record) => {
                  return {
                    M: {
                      amount: { N: JSON.stringify(record.amount) },
                      timestamp: { S: record.timestamp },
                      billId: { S: record.billId },
                      promotionId: { S: record.promotionId }
                    }
                  }
                }
              )
            }
          }
        }
      }));
      if (dto.sumCashbackHistory) mergeObjects(params, ({ data: { M: { sumCashbackHistory: { N: JSON.stringify(dto.sumCashbackHistory) } } } }));
      if (dto.cashbackHistory) mergeObjects(params, ({ data: { M: { cashbackAmount: { N: JSON.stringify(dto.cashbackAmount) } } } }));
      if (dto.family) {
        mergeObjects(params, {
          data:
          {
            M:
            {
              family:
              {
                M:
                {
                  adults: { N: JSON.stringify(dto.family.adults) },
                  kids: { N: JSON.stringify(dto.family.kids) }
                }
              }
            }
          }
        });

        if (dto.family.birthdateKids) {
          const birthdateKidsList = {
            L: Array.isArray(dto.family.birthdateKids)
              ? dto.family.birthdateKids.map((k) => {
                const birthdate = new Date(k).toISOString();
                return { S: birthdate };
              })
              : []
          };
          mergeObjects(params, { data: { M: { family: { M: { birthdateKids: birthdateKidsList } } } } })
        }
      }
      const response = await this.dynamoDbClient.postItem(params);
      return response;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on postUser method with message: " +
          error.msg,
        paramsToPost: dto,
        error: error,
      });
      throw error;
    }
  }

  async getUser(userID: string): Promise<UserInterfaceDynamoDB | null> {
    return await this.dynamoDbClient
      .getItem("user#" + userID, process.env.MAIN_TABLE, "info")
      .then((response) => {
        if (response == null) return null; 
        if (!response.data.hasOwnProperty('cashbackAmount')) mergeObjects(response, ({ data: { cashbackAmount: 0 } }));
        return response as UserInterfaceDynamoDB;
      })
      .catch((error) => {
        logger.error({
          msg:
            "Error in dynamoDBRepository on getUser method with message: " +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async getUserWithGSI(userName: string): Promise<UserInterface[]> {
    const params: GetItemsGSIInput = {
      indexName: "GSI1",
      keyConditionExpression: "GSI1PK = :user AND GSI1SK = :username",
      expressionAttributeValues: {
        ":user": { S: "username" },
        ":username": { S: userName }
      }
    };
    try {
      const response: QueryOutput = await this.dynamoDbClient.getItemsGSI(
        params
      );
      if (response.Count == 0) return [];
      const result = response.Items.map(
        (item) => { return mergeUserDBtoJson(item) }
      );
      return result;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on getUserWithGSI method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getActivePromotions() {
    // FIXME: Mejorar el cálculo de currentDate para que envíe únicamente la fecha sin realizar un substring(...)
    const currentDate = new Date().toISOString().substring(0, 10);
    // const currentDate = new Date().toLocaleString('es-AR', { // TODO: mejora el formato de la fecha
    //   day: '2-digit',
    //   month: '2-digit',
    //   year: 'numeric',
    //   hour: '2-digit',
    //   minute: '2-digit',
    //   second: '2-digit',
    //   hour12: false,
    // });

    const params: GetItemsGSIInput = {
      indexName: "GSI1",
      keyConditionExpression: "GSI1PK = :promotion AND GSI1SK >= :currentDate",
      filterExpression: "#data.startDate <= :currentDate",
      expressionAttributeNames: {
        "#data": "data",
      },
      expressionAttributeValues: {
        ":promotion": { S: "promotion" },
        ":currentDate": { S: currentDate },
      },
    };
    try {
      const response: QueryOutput = await this.dynamoDbClient.getItemsGSI(
        params
      );
      if (response.Count == 0) return [];

      const result: PromotionItemDynamoDBResp[] = response.Items.map(
        (item) => ({
          GSI1PK: item.GSI1PK.S,
          GSI1SK: item.GSI1SK.S,
          PK: item.PK.S,
          SK: item.SK.S,
          data: {
            name: item.data.M.name.S,
            brandID: item.data.M.brandID.S,
            endDate: new Date(item.data.M.endDate.S),
            description: item.data.M.description.S,
            startDate: new Date(item.data.M.startDate.S),
            type: item.data.M.type.S as PromotionType,
            listOfProducts: item.data.M.listOfProducts.L.map(
              (product) => product.S
            ),
            amount: parseInt(item.data.M.amount.N),
            supplierID: item.data.M.supplierID.S,
          },
        })
      );
      return result;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on getActivePromotions method with message: " +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async getSupplierByIds(idList: string[]) {
    const batchSize = 100;
    const supplierList: SupplierItemDynamoDBResp[] = [];
    try {
      for (let i = 0; i < idList.length; i += batchSize) {
        const batchIds = idList.slice(i, i + batchSize);
        const keys = batchIds.map((pk) => {
          return {
            PK: { S: "supplier" },
            SK: { S: pk },
          };
        });
        const table = process.env.MAIN_TABLE;
        const responseSearchByKeys: BatchGetItemCommandOutput =
          await this.dynamoDbClient.searchByKeys(keys);
        if (responseSearchByKeys.Responses == undefined) return [];
        const batchSupplierList: SupplierItemDynamoDBResp[] =
          responseSearchByKeys.Responses[table].map((item) => ({
            GSI1PK: item.GSI1PK.S,
            GSI1SK: item.GSI1SK.S,
            PK: item.PK.S,
            SK: item.SK.S,
            data: {
              name: item.data.M.name.S,
              active: item.data.M.active.BOOL,
              reputation: item.data.M.reputation.S,
              phoneNumber: parseInt(item.data.M.phoneNumber.N),
              email: item.data.M.email.S,
              imageUrl: item.data.M.imageUrl.S,
            },
          }));
        supplierList.push(...batchSupplierList);
      }

      return supplierList;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on getSupplierByIds method with message: " +
          error.msg,
        paramsToPost: idList,
        error: error,
      });
      throw error;
    }
  }

  async getBrandsByIds(idList: string[]) {
    const batchSize = 100;
    const brandList: BrandItemDynamoDBResp[] = [];
    try {
      for (let i = 0; i < idList.length; i += batchSize) {
        const batchIds = idList.slice(i, i + batchSize);
        const keys = batchIds.map((pk) => {
          return {
            PK: { S: "brand" },
            SK: { S: pk },
          };
        });
        const table = process.env.MAIN_TABLE;
        const responseSearchByKeys: BatchGetItemCommandOutput =
          await this.dynamoDbClient.searchByKeys(keys);
        if (responseSearchByKeys.Responses == undefined) return [];
        const batchBrandList: BrandItemDynamoDBResp[] =
          responseSearchByKeys.Responses[table].map((item) => ({
            GSI1PK: item.GSI1PK.S,
            GSI1SK: item.GSI1SK.S,
            PK: item.PK.S,
            SK: item.SK.S,
            data: {
              supplierId: item.data.M.supplierId.S,
              name: item.data.M.name.S,
              active: item.data.M.active.BOOL,
              imageUrl: item.data.M.imageUrl.S,
            },
          }));
        brandList.push(...batchBrandList);
      }

      return brandList;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on getBrandsByIds method with message: " +
          error.msg,
        paramsToPost: idList,
        error: error,
      });
      throw error;
    }
  }

  async getAllBrands(): Promise<BrandItemDynamoDBResp[]> {
    return await this.dynamoDbClient.getItemByQuery(this.BRANDS_KEY, process.env.MAIN_TABLE)
      .then((responses: Record<string, AttributeValue>[]) => (
        responses.map((response) => ({
          GSI1PK: response.GSI1PK.S,
          GSI1SK: response.GSI1SK.S,
          PK: response.PK.S,
          SK: response.SK.S,
          data: {
            supplierId: response.data.M.supplierId.S,
            name: response.data.M.name.S,
            active: response.data.M.active.BOOL,
            imageUrl: response.data.M.imageUrl.S,
          },
        }))))
      .catch((error) => {
        logger.error({
          msg:
            "Error in DynamoDBRepository on getAllBrands method with message: " +
            error.msg,
          paramsToPost: "",
          error: error,
        });
        throw error;
      }
      );
  }


  async getProductsByIds(idList: string[]) {
    const batchSize = 100;
    const productList: ProductItemDynamoDBResp[] = [];
    try {
      for (let i = 0; i < idList.length; i += batchSize) {
        const batchIds = idList.slice(i, i + batchSize);
        const keys = batchIds.map((pk) => {
          return {
            PK: { S: "product#" + pk },
            SK: { S: "info" },
          };
        });
        const table = process.env.MAIN_TABLE;
        const responseSearchByKeys: BatchGetItemCommandOutput =
          await this.dynamoDbClient.searchByKeys(keys);
        if (responseSearchByKeys.Responses == undefined) return [];
        const batchProductList: ProductItemDynamoDBResp[] =
          responseSearchByKeys.Responses[table].map((item) => ({
            GSI1PK: item.GSI1PK.S,
            GSI1SK: item.GSI1SK.S,
            PK: item.PK.S,
            SK: item.SK.S,
            data: {
              name: item.data.M.name.S,
              active: item.data.M.active.BOOL,
              category: item.data.M.category.S,
              description: item.data.M.description.S,
              imageUrl: item.data.M.imageUrl.S,
              supplierId: item.data.M.supplierId.S,
              weight: parseFloat(item.data.M.weight.N),
              measure: item.data.M.measure.S
              // FIXME: sumar brandID, cambiar los Id por ID
            },
          }));
        productList.push(...batchProductList);
      }

      return productList;
    } catch (error) {
      logger.error({
        msg:
          "Error in DynamoDBRepository on getProductsByIds method with message: " +
          error.msg,
        paramsToPost: idList,
        error: error,
      });
      throw error;
    }
  }
}

function mergeUserDBtoJson(item: any) {
  let result = {
    GSI1PK: item.GSI1PK.S,
    GSI1SK: item.GSI1SK.S,
    PK: item.PK.S,
    SK: item.SK.S
  };
  if (!item.data) {
    return result;
  };
  if (item.data.M.cashbackHistory) mergeObjects(result, ({
    data: {
      cashbackHistory: item.data.M.cashbackHistory.L.map(
        (record) => {
          return {
            amount: record.M.amount.N,
            timestamp: record.M.timestamp.S,
            billId: record.M.billId.S,
            promotionId: record.M.promotionId.S
          }
        }
      )
    }
  }));
  if (item.data.M.email) mergeObjects(result, ({ data: { email: item.data.M.email.S } }));
  if (item.data.M.birthdate) mergeObjects(result, ({ data: { birthdate: item.data.M.birthdate.S } }));
  if (item.data.M.gender) mergeObjects(result, ({ data: { gender: item.data.M.gender.S } }));
  if (item.data.M.isEmailVerified) mergeObjects(result, ({ data: { isEmailVerified: item.data.M.isEmailVerified.BOOL } }));
  if (item.data.M.isFormCompleted) mergeObjects(result, ({ data: { isEmailVerified: item.data.M.isFormCompleted.BOOL } }));
  if (item.data.M.localityCity) mergeObjects(result, ({ data: { localityCity: item.data.M.localityCity.S } }));
  if (item.data.M.localityCountry) mergeObjects(result, ({ data: { localityCountry: item.data.M.localityCountry.S } }));
  if (item.data.M.localityState) mergeObjects(result, ({ data: { localityState: item.data.M.localityState.S } }));
  if (item.data.M.localityNeighborhood) mergeObjects(result, ({ data: { localityNeighborhood: item.data.M.localityNeighborhood.S } }));
  if (item.data.M.nameAndLastName) mergeObjects(result, ({ data: { nameAndLastName: item.data.M.nameAndLastName.S } }));
  if (item.data.M.phoneNumber) mergeObjects(result,
    ({
      data: {
        phoneNumber: {
          code: item.data.M.phoneNumber.M.code.S,
          number: parseInt(item.data.M.phoneNumber.M.number.N),
        }
      }
    }));
  if (item.data.M.dni) mergeObjects(result, ({ data: { dni: parseInt(item.data.M.dni.N) } }));
  if (item.data.M.family) mergeObjects(result, ({
    data: {
      family: {
        adults: parseInt(item.data.M.family.M.adults.N),
        kids: parseInt(item.data.M.family.M.kids.N)
      }
    }
  }));
  if (item.data.M.cashbackAmount) {
    mergeObjects(result, ({ data: { cashbackAmount: item.data.M.cashbackAmount.N } }));
  } else {
    mergeObjects(result, ({ data: { cashbackAmount: 0 } }));
  }
  if (item.data.M.sumCashbackHistory) mergeObjects(result, ({ data: { sumCashbackHistory: item.data.M.sumCashbackHistory.N } }));
  return result;
}
