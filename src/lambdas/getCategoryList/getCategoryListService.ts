import { GetCategoryResDTO } from "./getCategoryListDTO";
import { commonTableDynamoDBRepository } from "../../common/dynamoDB/commonTableDynamoDBRepository";
import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { PromotionType } from "../../common/dynamoDB/dynamoDBInterface.request";
import { logger } from "../../common/logger";

const commonTable = new commonTableDynamoDBRepository();
const mainTable = new dynamoDBRepository();

export const getCategoryListService = async (): Promise<any> => {
  try {
    let categoryList: GetCategoryResDTO[];
    categoryList = await getCategoriesCache();
    if (categoryList == null) {
      logger.info("getCategoryListService - getAllCategories");
      categoryList = await getAllCategories().catch((error) => {
        throw error;
      });
      if (categoryList.length == 0) return [];
      await saveAllCategoriesCache(categoryList);
    }
    return categoryList;
  } catch (error) {
    logger.error({
      msg:
        "Error in getCategoryListService on getCategoryListService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};

async function getCategoriesCache(): Promise<GetCategoryResDTO[]> {
  try {
    const responseAllCategories = await commonTable.getAllCategories();
    if (responseAllCategories == undefined || responseAllCategories == null) {
      return null;
    }
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

    if (new Date(currentDate).valueOf() !== responseAllCategories.data.date.valueOf()) {
      return null;
    }
    return responseAllCategories.data.result.map((category) => ({
      id: category.id,
      name: category.name,
      totalResults: category.totalResults,
      icon: category.icon,
    }));
  } catch (error) {
    logger.error({
      msg:
        "Error in getCategoryListService on getCategoriesCache method with message: " +
        error.msg,
      error: error,
    });
    return null;
  }
}

async function getAllCategories(): Promise<GetCategoryResDTO[]> {
  try {
    const [activePromList, categoryIcons] = await Promise.all([
      await mainTable.getActivePromotions(),
      await commonTable.getCategoryIcons(),
    ]);
    if (activePromList.length === 0) return [];
    if (categoryIcons.data.result.length === 0) return [];

    const productsList: Set<string> = new Set();
    for (const prom of activePromList) {
      if (prom.data.type != PromotionType.BYUNIT) continue;
      for (const elem of prom.data.listOfProducts) {
        productsList.add(elem);
      }
    }
    const responseGetProductsList = await mainTable.getProductsByIds([
      ...productsList,
    ]);
    const counts = {};
    responseGetProductsList.forEach((item) => {
      const key = item.data.category;
      counts[key] = (counts[key] || 0) + 1;
    });
    const response: GetCategoryResDTO[] = Object.entries(counts)
      .map(([key, count]) => {
        const elem = categoryIcons.data.result.find((e) => e.id == key);
        return {
          id: key,
          totalResults: count,
          name: elem.name,
          icon: elem.icon,
        };
      });
    response.push({
      id: "all",
      totalResults: responseGetProductsList.length,
      icon: "all",
      name: "ALL"
    })
    return response;
  } catch (error) {
    logger.error({
      msg:
        "Error in getCategoryListService on getAllCategories method with message: " +
        error.msg,
      error: error,
    });
    return [];
  }
}

async function saveAllCategoriesCache(categoryList: GetCategoryResDTO[]) {
  try {
    await commonTable.postCategoryListCache(categoryList);
  } catch (error) {
    logger.error({
      msg:
        "Error in getCategoryListService on saveAllCategoriesCache method with message: " +
        error.msg,
      paramsToPost: categoryList,
      error: error,
    });
  }
  return;
}