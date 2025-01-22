import seedrandom = require('seedrandom');
import { v4 as uuidv4 } from 'uuid';
import { dynamoDBRepository } from '../../common/dynamoDB/dynamoDBRepository';
import { commonTableDynamoDBRepository } from '../../common/dynamoDB/commonTableDynamoDBRepository';
import {
  GetProductPromotionsReqDTO,
  GetProductPromotionsContent,
  GetProductPromotionsResDTO
} from './getProductsWithPromotionsDTO';
import { PromotionItemDynamoDBResp } from '../../common/dynamoDB/dynamoDBInterface.response';
import { PromotionType, Reputation, GetProductPromotionsContentDTO } from '../../common/dynamoDB/dynamoDBInterface.request';
import { logger } from '../../common/logger';

const mainTable = new dynamoDBRepository();
const commonTable = new commonTableDynamoDBRepository();
const DEFAULT_PAGE_NUMBER = 1;
const DEFAULT_PAGE_SIZE = 10;
const REPUTATION_LIST = [Reputation.BLACK, Reputation.PLATINUM, Reputation.GOLD];
const REPUTATION_MAP = {
  BLACK: 1,
  PLATINUM: 2,
  GOLD: 3,
};

export interface ItemProductProm {
  id?: number;
  promotionId: string;
  promotionName?: string;
  promotionTerms?: string;
  promotionEndDate?: Date;
  productId: string;
  productDetail?: string;
  productImageUrl?: string;
  productName?: string;
  productCategory?: string;
  productWeight?: number;
  productWeightUnit?: string;
  promotionAmount?: number;
  supplierId?: string;
  supplierReputation?: string;
  supplierReputationIndex?: number;
  brandId?: string;
  brandName?: string;
};

const paginateProducts = async (
  productPromList: GetProductPromotionsContent[],
  sortingSeed: string,
  pageNumber: number = DEFAULT_PAGE_NUMBER,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<GetProductPromotionsResDTO> => {
  pageNumber = pageNumber < 1 ? DEFAULT_PAGE_NUMBER : pageNumber;
  pageSize = pageSize <= 0 ? DEFAULT_PAGE_SIZE : pageSize;
  const totalPages = Math.ceil(productPromList.length / pageSize);
  pageNumber = Math.min(pageNumber, totalPages);
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, productPromList.length);
  const pageContent = productPromList.slice(startIndex, endIndex);

  return {
    lastPage: pageNumber === totalPages,
    pageNumber,
    totalPages,
    totalResults: productPromList.length,
    sortingSeed,
    pageContent,
  };
};

const orderListWithSeed = async (list: any[], sortingSeed: any) => {
  try {
    if (list.length == 0) return [];
    let randomGenerator = seedrandom(sortingSeed);
    let orderedList = list.slice();

    function randomComparison(a, b) {
        return randomGenerator() - 0.5;
    };

    orderedList.sort(randomComparison);
    return orderedList;
  } catch (err) {
    throw err;
  };
};

const getCache = async (
  category: string
): Promise<GetProductPromotionsContent[]> => {
  try {
    const responseAllProducts = await commonTable.getProductsWithPromotion(
      category
    );
    if (!responseAllProducts) return [];
    const currentDate = new Date().toISOString().substring(0, 10);
    // const currentDate = new Date().toLocaleString('es-AR', { // TODO: mejora el formato de la fecha
    //   day: '2-digit',
    //   month: '2-digit',
    //   year: 'numeric',
    //   hour: '2-digit',
    //   minute: '2-digit',
    //   second: '2-digit',
    //   hour12: false,
    // });<
    if (new Date(currentDate).valueOf() !== responseAllProducts.data.date.valueOf()) {
      return [];
    };
    if (responseAllProducts.data.result.length == 0) {
      return [];
    };
    return responseAllProducts.data.result.map((product) => ({
      productName: product.productName,
      productDetail: product.productDetail,
      imageUrl: product.imageUrl,
      content: product.content,
      cashbackAmount: product.cashbackAmount,
      dueDate: product.dueDate.toISOString().substring(0, 10),
      promotionTerms: product.promotionTerms,
      category: product.category,
      brand: product.brand,
    }));
  } catch (error) {
    logger.error({
      msg:
        "Error in getProductsWithPromotionsService on getProductsWithPromotionCache method with message: " +
        error.msg,
      paramsToPost: category,
      error: error,
    });
    return [];
  };
};
const saveCache = async (
  products: GetProductPromotionsContentDTO[],
  category: string
) => {
  try {
    await commonTable.postProductsWithPromotion(products, category);
    return products;
  } catch (error) {
    logger.error({
      msg:
        "Error in getProductsWithPromotionsService on saveAllProductsCache method with message: " +
        error.msg,
      paramsToPost: products,
      error: error,
    });
  };
  return;
};

const getProductsWithPromotionCache = async (category:string, sortingSeed:string) => {
  const getPromotionsPromiseCache = REPUTATION_LIST.map( async (rep) => {
    return await getCache(`${category}#${rep}`);
  });

  const allProductPromListCache: GetProductPromotionsContent[] = await Promise.all(getPromotionsPromiseCache).then(async (listWithProm) => {
    if (listWithProm.length < 1) return [];
    let finalList = [];
    for (const listProm of listWithProm) {
      const orderList = await orderListWithSeed(listProm, sortingSeed)
      finalList = [...finalList, ...orderList];
    };
    return finalList;
  });
  return allProductPromListCache;
};

const getAllProducts = async (): Promise<{rep: string, list: ItemProductProm[], listContentResponse: GetProductPromotionsContentDTO[]}[]> => {
  try {
    const activePromList: PromotionItemDynamoDBResp[] =
      await mainTable.getActivePromotions();
    if (activePromList.length === 0) return [];

    const supplierIdList: Set<string> = new Set();
    const brandIdList: Set<string> = new Set();
    const productsList: Set<string> = new Set();
    const productPromListTemp: ItemProductProm[] = [];

    for (const prom of activePromList) {
      if (prom.data.type != PromotionType.BYUNIT) continue;
      supplierIdList.add(prom.data.supplierID);
      brandIdList.add(prom.data.brandID);
      for (const elem of prom.data.listOfProducts) {
        productsList.add(elem);
        productPromListTemp.push({
          promotionId: prom.SK,
          productId: elem,
          promotionName: prom.data.name,
          promotionEndDate: prom.data.endDate,
          promotionAmount: prom.data.amount,
          promotionTerms: prom.data.description,
          supplierId: prom.data.supplierID,
          brandId: prom.data.brandID,
        });
      }
    }

    const [supplierListDB, productListDB, brandListDB] = await Promise.all([
      mainTable.getSupplierByIds([...supplierIdList]),
      mainTable.getProductsByIds([...productsList]),
      mainTable.getBrandsByIds([...brandIdList]),
    ]);

    if (supplierListDB.length === 0 || productListDB.length === 0 || brandListDB.length === 0) return [];

    let productPromByRepList: {rep: Reputation, list: ItemProductProm[], listContentResponse: GetProductPromotionsContentDTO[]}[] =  REPUTATION_LIST.map((rep) => ({
          rep: rep,
          list: [],
          listContentResponse: []
      }));

    for (const productProm of productPromListTemp) {
      const supplier = supplierListDB.find(
        (elem) => productProm.supplierId === elem.SK
      );
      const brand = brandListDB.find(
        (elem) => productProm.brandId === elem.SK
      );
      const product = productListDB.find(
        (elem) => productProm.productId === elem.PK.split("#")[1]
      );
      if (product == undefined || supplier == undefined || brand == undefined) continue;
      const index = productPromByRepList.findIndex((value) => value.rep == supplier.data.reputation);
      productPromByRepList[index].list.push({
        productId: productProm.productId,
        promotionId: productProm.promotionId,
        promotionName: productProm.promotionName,
        promotionEndDate: productProm.promotionEndDate,
        promotionAmount: productProm.promotionAmount,
        promotionTerms: productProm.promotionTerms,
        supplierId: productProm.supplierId,
        supplierReputation: supplier.data.reputation,
        supplierReputationIndex: REPUTATION_MAP[supplier.data.reputation],
        productName: product.data.name,
        productDetail: product.data.description,
        productWeight: product.data.weight,
        productWeightUnit: product.data.measure,
        productImageUrl: product.data.imageUrl,
        productCategory: product.data.category,
        brandId: productProm.brandId,
        brandName: brand.data.name,
      });
    };
    function compareObj(a: ItemProductProm, b: ItemProductProm) {
      // Compara la reputacion
      if (a.supplierReputation < b.supplierReputation) {
        return -1;
      };
      if (a.supplierReputation > b.supplierReputation) {
        return 1;
      };
      // Si la reputacion es igual, compara los montos de promocion
      if (a.promotionAmount > b.promotionAmount) {
        return -1;
      };
      if (a.promotionAmount < b.promotionAmount) {
        return 1;
      };
      // Si la reputacion y los montos son iguales, los ordena alfabeticamente
      const compare = a.productName.localeCompare(b.productName);
      if (compare !== 0) {
        return compare;
      };
    
      return 0; // Si todos los criterios son iguales, no se cambia el orden
    }

    for await (const item of productPromByRepList) {
      item.listContentResponse = item.list.sort(compareObj) .map((item) => ({
        productName: item.productName,
        brand: item.brandName,
        cashbackAmount: item.promotionAmount,
        dueDate: item.promotionEndDate.toISOString().substring(0, 10),
        imageUrl: item.productImageUrl,
        content: `Cont. neto: ${item.productWeight}${item.productWeightUnit}`,
        productDetail: item.productDetail,
        promotionTerms: item.promotionTerms,
        category: item.productCategory,
      }));
    };

    return productPromByRepList;
  } catch (error) {
    logger.error({
      msg:
        "Error in getProductsWithPromotionsService on getAllProducts method with message: " +
        error.msg,
      error: error,
    });
    return [];
  }
};

const getAllProductsWithPromotion = async (
  sortingSeed: string
) => {
  try {
    const allProductPromListCache = await getProductsWithPromotionCache('all', sortingSeed);
    if (allProductPromListCache.length > 0) return allProductPromListCache;
    logger.info("getProductsWithPromotionByCategory - getAllProductsWithPromotion");
    const allPromListByReputation = await getAllProducts();
    if (allPromListByReputation.length < 1 ) return [];

    let finalList = [];
    for await (const listProm of allPromListByReputation ) {
      await saveCache(listProm.listContentResponse, `all#${listProm.rep}`);
      finalList = [...finalList, ...await orderListWithSeed(listProm.listContentResponse, sortingSeed)];
    };
    return finalList;
  } catch (error) {
    logger.error({
      msg:
        "Error in getProductsWithPromotionsService on getAllProductsWithPromotion method with message: " +
        error.msg,
      paramsToPost: { sortingSeed: sortingSeed},
      error: error,
    });
    throw error;
  };
};

const getProductsWithPromotionByCategory = async (
  category: string,
  sortingSeed: string
) => {
  try {
    const allProductPromListCache = await getProductsWithPromotionCache(category, sortingSeed);
    if (allProductPromListCache.length > 0) return allProductPromListCache;
    logger.info("getProductsWithPromotionByCategory - getProductsWithPromotionByCategory");
    const allPromListByReputation = await getAllProducts();
    if (allPromListByReputation.length < 1 ) return [];

    let finalList = [];
    for await (const listProm of allPromListByReputation ) {
      const tmpList = listProm.listContentResponse.filter((value) => value.category == category);
      await saveCache(tmpList, `${category}#${listProm.rep}`);
      finalList = [...finalList, ...await orderListWithSeed(tmpList, sortingSeed)];
    };
    return finalList;
  } catch (error) {
    logger.error({
      msg:
        "Error in getProductsWithPromotionsService on getProductsWithPromotionByCategory method with message: " +
        error.msg,
      paramsToPost: { sortingSeed: sortingSeed},
      error: error,
    });
    throw error;
  };
};

export const getProductsWithPromotionsService = async (params: GetProductPromotionsReqDTO): Promise<GetProductPromotionsResDTO|{statusCode: any, body: any}> => {
  try {
    const sortingSeed: string = params.sortingSeed == undefined || params.sortingSeed == ''? uuidv4(): params.sortingSeed;
    const keyword: string = params.keyword == undefined ? 'none': params.keyword.toLowerCase();
    if (params.category === "all") {
      logger.info("getProductsWithPromotionsService - category = all");
      const promsListAll = await getAllProductsWithPromotion(sortingSeed);
      return await paginateProducts(
        keyword == 'none' ? promsListAll : promsListAll.filter(
          prom => prom.productName.toLowerCase().includes(keyword) || 
          prom.productDetail.toLowerCase().includes(keyword) || 
          prom.brand.toLowerCase().includes(keyword)),
        sortingSeed,
        params.pageNumber,
        params.pageSize
      );
    };
    logger.info(`getProductsWithPromotionsService - category = ${params.category}`);
    const promsListByCategory = await getProductsWithPromotionByCategory(params.category, sortingSeed);
    return paginateProducts(
      keyword == 'none' ? promsListByCategory : promsListByCategory.filter(
        prom => prom.productName.toLowerCase().includes(keyword) || 
        prom.productDetail.toLowerCase().includes(keyword) || 
        prom.brand.toLowerCase().includes(keyword)),
      sortingSeed,
      params.pageNumber,
      params.pageSize
    );
  } catch (err) {
    logger.error({
      msg: "Error in getProductsWithPromotionsService catch with message: " + err.msg,
      error: err,
    });
    throw err;
  }
};