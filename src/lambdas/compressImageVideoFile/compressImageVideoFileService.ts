import { logger } from "../../common/logger";
import { billTableVertexDynamoDBRepository } from "../../common/dynamoDB/billTableVertexDynamoDBRepository";
import { MediaConvertClient, CreateJobCommand, MediaConvertClientConfig,CreateJobCommandInput } from "@aws-sdk/client-mediaconvert";
import { BillStatus } from "../../common/dynamoDB/billTableDynamoDBInterface";
import { BillTableVertexInterface } from "../../common/dynamoDB/billTableVertexDynamoDBInterface";
import { mergeObjects } from "../../common/mergeObjects";

const billTableVertex = new billTableVertexDynamoDBRepository();
const mediaConvertConfig: MediaConvertClientConfig = { region: process.env.REGION };
const mediaConvertClient = new MediaConvertClient(mediaConvertConfig);
const MAX_FILE_SIZE_MB = 10;

export const compressImageVideoFileService = async (billId: string): Promise<any> => {
  try {
    const billData = await billTableVertex.getBill(billId);
    const fileSize = bytesToMegabytes(parseInt(billData.bill.s3EventData.objectSize));
    if (fileSize > MAX_FILE_SIZE_MB) {
      const billDataVertex: BillTableVertexInterface = {
        id: billId,
        status: BillStatus.COMPRESS_IN_PROGRESS,
        bill: {
            status: BillStatus.COMPRESS_IN_PROGRESS
        }
      };
      mergeObjects(billData, billDataVertex);
      await Promise.all([
        await billTableVertex.putBill(billData, billId, "compressImageVideoFile"),
        await transcodeVideo(billData.bill.s3key, billData.bill.s3EventData.bucketName, process.env.TEMPORARY_BUCKET_S3)
      ]);
      return;
    };
    const billDataVertex: BillTableVertexInterface = {
      id: billId,
      status: BillStatus.CREATED,
      bill: {
          s3ProcessData: {
            url: billData.bill.s3url,
            key: billData.bill.s3key,
          },
          status: BillStatus.CREATED
      }
    };
    mergeObjects(billData, billDataVertex);
    await billTableVertex.putBill(billData, billId, "compressImageVideoFile")
    return;
  } catch (error) {
    logger.error({
      msg:
        "Error in compressImageVideoFileService method with message: " +
        error.msg,
      error: error,
    });
    throw error;
  }
};

function bytesToMegabytes(bytes) {
  const bytesInMB = 1024 * 1024; // 1 MB = 1024 * 1024 bytes
  return bytes / bytesInMB;
};

async function transcodeVideo(fileName: string, inputBucket: string, outputBucket: string) {
  try {
    const jobParams: CreateJobCommandInput = {
      Role: process.env.MEDIA_CONVERT_ROLE_ARN,
      Settings: {
        OutputGroups: [
          {
            OutputGroupSettings: {
              Type: "FILE_GROUP_SETTINGS",
              FileGroupSettings: {
                Destination: `s3://${outputBucket}/`
              }
            },
            Outputs: [
              {
                NameModifier: "_vertex_compatible",
                ContainerSettings: {  
                  Container: "MP4",
                  Mp4Settings: {
                    CslgAtom: "INCLUDE",
                    FreeSpaceBox: "EXCLUDE",
                    MoovPlacement: "PROGRESSIVE_DOWNLOAD"
                  }
                },
                VideoDescription: {
                  CodecSettings: {
                    Codec: "H_264",
                    H264Settings: {
                      MaxBitrate: 5000000, // Ajusta según tus necesidades
                      CodecLevel: "AUTO",
                      CodecProfile: "MAIN",
                      RateControlMode: "QVBR",
                      QualityTuningLevel: "SINGLE_PASS",
                      FramerateConversionAlgorithm: "DUPLICATE_DROP"
                    }
                  },
                  Height: 1280, // Altura ajustada para orientación vertical
                  Width: 720, // Ancho ajustado para orientación vertical
                  ScalingBehavior: "DEFAULT",
                  TimecodeInsertion: "DISABLED",
                  AntiAlias: "ENABLED",
                  Sharpness: 20,
                  ColorMetadata: "INSERT"
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: "AAC",
                      AacSettings: {
                        Bitrate: 128000, // Ajusta según la calidad deseada
                        CodingMode: "CODING_MODE_2_0",
                        SampleRate: 48000
                      }
                    }
                  }
                ]
              }
            ]
          }
        ],
        Inputs: [
          {
            FileInput: `s3://${inputBucket}/${fileName}`,
            TimecodeSource: "EMBEDDED",
            VideoSelector: {
              ColorSpace: "FOLLOW",
              Rotate: "AUTO"
            },
            AudioSelectors: {
              "Audio Selector 1": {
                DefaultSelection: "DEFAULT"
              }
            }
          }
        ]
      }
    };

    const createJobCommand = new CreateJobCommand(jobParams);
    const createJobResult = await mediaConvertClient.send(createJobCommand);

    return createJobResult;
  } catch (err) {
    logger.error("Error creating MediaConvert job:", err);
    throw err;
  }
};