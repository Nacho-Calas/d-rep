import {
  AWSDynamoDBClient,
  awsDynamoDBClientInstance,
} from './AWSdynamoDBClient';
import { AttributeValue } from '@aws-sdk/client-dynamodb';
import {
  GetProductPromotionsContentDTO,
  BannersDTO,
} from './dynamoDBInterface.request';
import { logger } from '../logger';
import { ProductPromotionsContentDynamoDBResp } from './dynamoDBInterface.response';
import {
  AllCategoriesCache,
  CategoryItemCache,
  DictionaryItem
} from './commonTableDynamoDBinterface.output';

export class commonTableDynamoDBRepository {
  PRODUCTS_WITH_PROMOTION_KEY_PREFIX = 'PRODUCTS_WITH_PROMOTION#';
  CATEGORY_ICON_KEY = 'CATEGORY_ICONS';
  CATEGORY_CACHE_KEY = 'CATEGORY_CACHE';
  BANNERS_KEY = 'BANNERS';
  DICTIONARY_KEY = 'DICTIONARY'

  dynamoDbClient: AWSDynamoDBClient;

  constructor() {
    this.dynamoDbClient = awsDynamoDBClientInstance;
  }

  async getProductsWithPromotion(
    category: string
  ): Promise<ProductPromotionsContentDynamoDBResp> {
    return await this.dynamoDbClient
      .getItem(
        this.PRODUCTS_WITH_PROMOTION_KEY_PREFIX + category,
        process.env.COMMON_TABLE
      )
      .then((response: Record<string, AttributeValue| any> ) => {
        if (response == null) {
          logger.warn("Warning in commonTableDynamoDBRepository on getProductsWithPromotion return null")
          return null
        };
        if (!response.PK.hasOwnProperty('S')) {
         return {
           PK: response.PK,
           data: {
             date: new Date(response.data.date),
             result: response.data.result.map((product) => ({
              productName: product.productName,
              productDetail: product.productDetail,
              imageUrl: product.imageUrl,
              cashbackAmount: parseFloat(product.cashbackAmount),
              dueDate: new Date(product.dueDate),
              content: product.content,
              promotionTerms: product.promotionTerms,
              category: product.category,
              brand: product.brand,
             }))
           }
         }
        }
        return {
          PK: response.PK.S,
          data: {
            date: new Date(response.data.M.date.S),
            result: response.data.M.result.L.map((product) => ({
              productName: product.M.productName.S,
              productDetail: product.M.productDetail.S,
              imageUrl: product.M.imageUrl.S,
              cashbackAmount: parseFloat(product.M.cashbackAmount.N),
              dueDate: new Date(product.M.dueDate.S),
              content: product.M.content.S,
              promotionTerms: product.M.promotionTerms.S,
              category: product.M.category.S,
              brand: product.M.brand.S,
            })),
          },
        }
        })
      .catch((error) => {
        logger.error({
          msg:
            'Error in commonTableDynamoDBRepository on getProductsWithPromotion method with message: ' +
            JSON.stringify(error),
          error: error,
        });
        throw error;
      });
  }

  async getCategoryIcons() {
    return await this.dynamoDbClient
      .getItem(this.CATEGORY_ICON_KEY, process.env.COMMON_TABLE)
      .then((response: Record<string, any>) => ({
        data: {
          date: new Date(response.data.date),
          result: response.data.result.map((category) => ({
            id: category.id,
            icon: category.icon,
            name: category.name,
          })),
          /*
          date: new Date(response.data.M.date.S),
          result: response.data.M.result.L.map((category) => ({
            id: category.M.id.S,
            icon: category.M.icon.S,
            name: category.M.name.S,
          })),
          */
        },
      }))
      .catch((error) => {
        logger.error({
          msg:
            'Error in commonTableDynamoDBRepository on getCategoryIcons method with message: ' +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async getAllCategories(): Promise<AllCategoriesCache> {
    return await this.dynamoDbClient
      .getItem(this.CATEGORY_CACHE_KEY, process.env.COMMON_TABLE)
      .then((response: Record<string, AttributeValue | any>) => {
        if (response == null) {
          logger.warn("Warning in commonTableDynamoDBRepository on getAllCategories return null")
          return null
        };
        if (!response.data.hasOwnProperty('M')) return {
          data: {
            date: new Date(response.data.date),
            result: response.data.result.map((category) => ({
              id: category.id,
              name: category.name,
              totalResults: parseInt(category.totalResults),
              icon: category.icon,
            }))}};
        return {
          data: {
            date: new Date(response.data.M.date.S),
            result: response.data.M.result.L.map((category) => ({
              id: category.M.id.S,
              name: category.M.name.S,
              totalResults: parseInt(category.M.totalResults.N),
              icon: category.M.icon.S,
            })),
          },
        };
      })
      .catch((error) => {
        logger.error({
          msg:
            'Error in commonTableDynamoDBRepository on getAllCategories method with message: ' +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async getBanners() {
    return await this.dynamoDbClient
      .getItem(this.BANNERS_KEY, process.env.COMMON_TABLE)
      .then((response: Record<string, any>) => {
        const banners = {
          data: {
            result: response.data.result.map((banner) => ({
              index: parseInt(banner.index),
              imageUrl: banner.imageUrl,
            })),
          },
        };
        return banners.data.result;
      })
      .catch((error) => {
        logger.error({
          msg:
            'Error in commonTableDynamoDBRepository on getBanners method with message: ' +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async getDictionary() {
    return await this.dynamoDbClient
      .getItem(this.DICTIONARY_KEY, process.env.COMMON_TABLE)
      .then((response: Record<string, any>) => {
        const dictionary : DictionaryItem[]=  response.data.result.map((elem) => ({
              key: elem.key,
              words: elem.words
            }))
        return dictionary;
      })
      .catch((error) => {
        logger.error({
          msg:
            'Error in commonTableDynamoDBRepository on getDictionary method with message: ' +
            error.msg,
          error: error,
        });
        throw error;
      });
  }

  async postBanners(bannerList: BannersDTO[]) {
    // FIXME: Mejorar el cálculo de currentDate para que envíe únicamente la fecha sin realizar un substring(...)
    const currentDate = new Date().toISOString();
    const params: Record<string, AttributeValue> = {
      PK: { S: this.BANNERS_KEY },
      data: {
        M: {
          date: { S: currentDate },
          result: {
            L: bannerList.map((banner) => ({
              M: {
                index: { N: JSON.stringify(banner.index) },
                imageUrl: { S: banner.imageUrl },
              },
            })),
          },
        },
      },
    };
    try {
      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.COMMON_TABLE
      );
      return response;
    } catch (error) {
      logger.error({
        msg:
          'Error in commonTableDynamoDBRepository on postBanners method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postProductsWithPromotion(
    productList: GetProductPromotionsContentDTO[],
    category: string
  ) {
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
    const params: Record<string, AttributeValue> = {
      PK: { S: this.PRODUCTS_WITH_PROMOTION_KEY_PREFIX + category },
      data: {
        M: {
          date: { S: currentDate },
          result: {
            L: productList.map((product) => ({
              M: {
                productName: { S: product.productName },
                productDetail: { S: product.productDetail },
                imageUrl: { S: product.imageUrl },
                cashbackAmount: { N: product.cashbackAmount.toString() },
                dueDate: { S: product.dueDate.toString() },
                promotionTerms: { S: product.promotionTerms },
                category: { S: product.category },
                content: { S: product.content },
                brand: { S: product.brand },
              },
            })),
          },
        },
      },
    };
    try {
      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.COMMON_TABLE
      );
      return response;
    } catch (error) {
      logger.error({
        msg:
          'Error in commonTableDynamoDBRepository on postProductsWithPromotion method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }

  async postCategoryListCache(productList: CategoryItemCache[]) {
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
    const params: Record<string, AttributeValue> = {
      PK: { S: this.CATEGORY_CACHE_KEY },
      data: {
        M: {
          date: { S: currentDate },
          result: {
            L: productList.map((category) => ({
              M: {
                id: { S: category.id },
                name: { S: category.name },
                totalResults: { N: JSON.stringify(category.totalResults) },
                icon: { S: category.icon },
              },
            })),
          },
        },
      },
    };
    try {
      const response = await this.dynamoDbClient.postItem(
        params,
        process.env.COMMON_TABLE
      );
      return response;
    } catch (error) {
      logger.error({
        msg:
          'Error in commonTableDynamoDBRepository on postProductsWithPromotion method with message: ' +
          error.msg,
        paramsToPost: params,
        error: error,
      });
      throw error;
    }
  }
}
