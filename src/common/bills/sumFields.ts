/**
 * Calculates the sum of line item prices and checks if it matches the subtotal value.
 * @param billData - The bill data object.
 * @returns A promise that resolves to a boolean indicating whether the sum of line item prices matches the subtotal value.
 */
export const sumFields = (billData): Promise<boolean> => {
    let totalLineItemsPrice = 0;
    const lineItems = billData.LineItems;
    let subTotal = billData.SummaryFields.find((item) => item.Type.Text === 'SUBTOTAL');
    const total = billData.SummaryFields.find((item) => item.Type.Text === 'TOTAL');

    if (!subTotal && total) {
        subTotal = total;
    }
    const subtotalValueNumber = parseFloat(subTotal.Value.Text);

    for (const item of lineItems) {
        const price = item.find((field) => field.Type.Text === 'PRICE');

        if (price) {
            const priceValue = parseFloat(price.Value.Text);
            totalLineItemsPrice += priceValue;
        }

        const name = item.find((field) => field.Type.Text === 'ITEM');
        if (!name) {
            return Promise.resolve(false);
        }
    }

    if (Math.abs(totalLineItemsPrice - subtotalValueNumber) < 9) {
        return Promise.resolve(true);
    } else {
        return Promise.resolve(false);
    }
};