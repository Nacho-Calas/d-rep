import { dynamoDBRepository } from "../../common/dynamoDB/dynamoDBRepository";
import { billTableDynamoDBRepository } from '../../common/dynamoDB/billTableDynamoDBRepository';
import { PromotionItemDynamoDBResp, CashbackHistoryInterface } from "../../common/dynamoDB/dynamoDBInterface.response";
import { PromotionType } from '../../common/dynamoDB/dynamoDBInterface.request';
import {
    BillStatus,
} from '../../common/dynamoDB/billTableDynamoDBInterface';
import { logger } from '../../common/logger';
import { StatusCodes } from 'http-status-codes';
import { mergeObjects } from "../../common/mergeObjects";
const mainTable = new dynamoDBRepository();
const billTable = new billTableDynamoDBRepository();

export const promotionsIdentifyService = async (body: any, userId: string, billId: string): Promise<any> => {
    try {
        const user = await mainTable.getUser(userId);
        const billData = await billTable.getBill(billId);
        const activePromList: PromotionItemDynamoDBResp[] =
            await mainTable.getActivePromotions();
        // constrolar si es vacio
        let cashbackAmount = 0;
        let promotionList = [];
        let promotionCashbackHistory: CashbackHistoryInterface[] = [];
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
        for (const prom of activePromList) {
            let hasPromotion = false;
            if (prom.data.type == PromotionType.BYUNIT) {
                hasPromotion = billData.bill.productFieldsIdentified.some(item => prom.data.listOfProducts.includes(item.productId));
            };
            if (prom.data.type == PromotionType.BYBRAND) {
                hasPromotion = billData.bill.productFieldsIdentified.some(item => prom.data.brandID == item.brandId && item.productId == 'none');
            }
            if (hasPromotion) {
                cashbackAmount = cashbackAmount + prom.data.amount;
                promotionList.push(prom.SK)
                const changeCashback = {
                    timestamp: currentDate,
                    amount: prom.data.amount,
                    billId: billId,
                    promotionId: prom.SK
                };
                promotionCashbackHistory.push(changeCashback);
            }
        }
        if (promotionList.length == 0) {
            mergeObjects(billData, {
                id: billId,
                status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS,
                bill: {
                    status: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS
                }
            })
            await billTable.putBill(billData, billId, "promotionsIdentifyService");
            return {
                statusCode: StatusCodes.OK,
                body: { billStatus: BillStatus.BILL_WITHOUT_IDENTIFIED_PRODUCTS }
            };
        }
        const cashback = user.data.cashbackAmount ? user.data.cashbackAmount + cashbackAmount : cashbackAmount;
        mergeObjects(user, {
            data: { cashbackAmount: cashback }
        });
        logger.debug({
            user: JSON.stringify(user)
        });
        await mainTable.postUser(userId, user.data);

        mergeObjects(billData, {
            id: billId,
            status: BillStatus.PROMOTION_AMOUNT_APPLIED,
            bill: {
                status: BillStatus.PROMOTION_AMOUNT_APPLIED,
                promotionList: promotionList
            }
        })
        await billTable.putBill(billData, billId, "promotionsIdentifyService");

        if (!user.data.hasOwnProperty('cashbackHistory')) mergeObjects(user, ({ data: { cashbackHistory: [] } }));
        const newCashbackHistory = user.data.cashbackHistory.concat(promotionCashbackHistory);
        console.log('cashbackHistory: ', newCashbackHistory);

        const sumCashbackHistory = newCashbackHistory
            .filter(cashback => cashback.billId === billId)
            .reduce((acc: number, cashback: any) => acc + cashback.amount, 0);
        console.log('sumCashbackHistory: ', sumCashbackHistory);

        mergeObjects(user, {
            data: {
                cashbackHistory: newCashbackHistory,
                sumCashbackHistory: sumCashbackHistory
            }
        });

        logger.debug({
            user: JSON.stringify(user)
        });
        await mainTable.postUser(userId, user.data);

        return {
            statusCode: StatusCodes.OK,
            body: user.data
        };
    } catch (err) {
        logger.error({
            msg: 'Error in promotionsIdentifyService with message: ' + err.msg,
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
        await billTable.putBill(billNewData, billId, "promotionsIdentifyService");
        return {
            statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
            body: {
                message: "Error trying to process products identified.",
                status: BillStatus.BILL_SCAN_UNSUCCESSFUL
            },
        };
    }
};