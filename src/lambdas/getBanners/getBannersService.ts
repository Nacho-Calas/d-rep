import { GetBannersDTO } from "./getBannersDTO";
import { commonTableDynamoDBRepository } from "../../common/dynamoDB/commonTableDynamoDBRepository";
import { logger } from "../../common/logger";
import { GetBannersBlobDTO } from "./getBannersBlobDTO";

const commonTable = new commonTableDynamoDBRepository();

export const getBannersService = async (): Promise<any> => {
  try {
    const bannerList: GetBannersDTO[] = await commonTable.getBanners();

    // let bannerListnew: GetBannersBlobDTO[];
    // bannerList.forEach(async (banner) => {
    //   let imageConverted: any = await convertImageToBase64(banner.imageUrl);
    //   bannerListnew.push({ index: banner.index, imageBlob: imageConverted });
    // });

    return bannerList;
  } catch (error) {
    logger.error({
      msg:
        "Error in getBannersService on getBannersService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};

// async function convertImageToBase64(url) {
//   // Obtener la imagen desde la URL
//   const response = await fetch(url);
//   // Asegurarse de que la respuesta es exitosa
//   if (!response.ok) {
//     throw new Error(`Failed to fetch image: ${response.statusText}`);
//   }
//   // Convertir la respuesta a un Blob
//   const blob = await response.blob();
//   // Crear un FileReader para leer el Blob como Data URL (Base64)
//   const reader = new FileReader();
//   return new Promise((resolve, reject) => {
//     reader.onloadend = () => {
//       resolve(reader.result);
//     };
//     reader.onerror = reject;
//     reader.readAsDataURL(blob);
//   });
// }
