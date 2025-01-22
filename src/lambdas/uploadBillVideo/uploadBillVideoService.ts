// import { v4 as uuidv4 } from 'uuid';
// import ffmpeg = require('fluent-ffmpeg');
// import { APIGatewayEvent } from 'aws-lambda';
// import { S3RepositoryInstance } from '../../common/s3Repository';
// import { base64Decoded } from '../../common/base64DecodedImageVideo';
// import { billTableDynamoDBRepository } from "../../common/dynamoDB/billTableDynamoDBRepository";
// import { BillTableInterface, BillStatus } from '../../common/dynamoDB/billTableDynamoDBInterface';
// import { logger } from '../../common/logger'
// import { StatusCodes } from 'http-status-codes';

// const billTable = new billTableDynamoDBRepository();
// export const uploadBillVideoService = async (event:APIGatewayEvent, userId: string): Promise<any> => {
//     try {
//         const billId = uuidv4();
//         const fileData = await base64Decoded(event);
//         const s3FileNameVideo = `${userId}/${billId}_${Date.now()}.${fileData.base64File.contentType.split('/')[1]}`;
//         logger.debug('Nombre del archivo a guardar en S3: ' + s3FileNameVideo);
//         const urlVideo = await S3RepositoryInstance.uploadFileToS3(fileData.base64File.content, s3FileNameVideo, process.env.BUCKET_BILLS, false);
//         console.log("llego a guardar video", JSON.stringify(urlVideo));
//         const videoBuffer = Buffer.from(event.body, 'base64');
//         const imageBuffer = await convertVideoToImage(videoBuffer, fileData.base64File.contentType.split('/')[1]);
//         console.log("llego a crear imagen", JSON.stringify(imageBuffer));
//         const s3FileNameImage = `${userId}/${billId}_${Date.now()}.jpg`;
//         logger.debug('Nombre del archivo a guardar en S3: ' + s3FileNameImage);
//         const urlImage = await S3RepositoryInstance.uploadFileToS3(imageBuffer, s3FileNameImage, process.env.BUCKET_BILLS, false);
//         // tranformar a imagen
//         const billData:BillTableInterface = {
//             id: billId,
//             status: BillStatus.CREATED,
//             S3url: urlImage.url,
//             bill: {
//                 S3urlVideo: urlVideo.url,
//                 s3keyVideo: urlVideo.key,
//                 S3url: urlImage.url,
//                 s3key: urlImage.key,
//                 status: BillStatus.CREATED,
//                 userId: userId,
//             }
//         }
//         await billTable.newBill(billData, billId, "uploadBillVideoService");
//         return {
//             statusCode: StatusCodes.OK,
//             body: {message: "OK", id: billId},
//         };
//     } catch (err) {
//         logger.error({
//             msg: "Error in uploadBillVideoService with message: " + err.msg,
//             error: err,
//         });
//         return {
//             statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
//             body: {
//                 error: "Error trying to upload bill.",
//             },
//         }
//     };
// };

// async function convertVideoToImage(videoBuffer, format) {
//     console.log(videoBuffer);
//     console.log(format);
//     return new Promise((resolve, reject) => {
//       const imageBuffer = [];
  
//       ffmpeg()
//         .input(videoBuffer)
//         .inputFormat(format)
//         .screenshots({
//           count: 1,
//           filename: 'thumbnail.jpg',
//           folder: '/tmp',
//         })
//         .on('data', (chunk) => {
//           imageBuffer.push(chunk);
//         })
//         .on('end', () => {
//           resolve(Buffer.concat(imageBuffer));
//         })
//         .on('error', (error) => {
//           console.log("error", error);
//           reject(error);
//         });
//     });
//   }
// faltaria sumar controles de casos de error con topes:
//Caso 4 : supero la cantidad de ticket escaneados y procesados por dia
//Caso 7 : supero la cantidad de ticket escaneados y procesados por semana
//Caso 8 : supero la cantidad de ticket escaneados y procesados en el mes