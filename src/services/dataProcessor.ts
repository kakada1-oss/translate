import type { OrderItem, ParseResult } from '../types';

export const parseRawData = (rawData: string): ParseResult => {
    const lines = rawData.trim().split('\n');
    const data: OrderItem[] = [];
    const errors: string[] = [];

    let lastOrderNumber = '';
    let lastOrderTime = '';
    let lastStatus = '';
    let lastShopName = '';

    // Skip header if it exists
    const startIndex = lines[0]?.includes('订单号') ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const columns = line.split('\t').map(c => c.trim());

        if (columns.length < 5) {
            errors.push(`Line ${i + 1}: Insufficient columns`);
            continue;
        }

        const colOrderNumber = columns[0];
        const colOrderTime = columns[1];
        const colStatus = columns[2];
        const colShopName = columns[3];
        const colProductName = columns[4];
        const colLink = columns[5] || '';
        const colModel = columns[6] || '';
        const colQty = columns[7] || '0';
        const colAmount = columns[8] || '0';
        const colActualPayment = columns[9] || '';
        const colFreight = columns[10] || '';
        const colLogisticsCompany = columns[11] || '';
        const colLogisticsNumber = columns[12] || '';

        // Update "last known" values ONLY if the current row has a non-empty order number
        if (colOrderNumber) {
            lastOrderNumber = colOrderNumber;
            lastOrderTime = colOrderTime;
            lastStatus = colStatus;
            lastShopName = colShopName;
        }

        // Calculate estimated arrival (order date + 15 days)
        let estArrival = '-';
        if (lastOrderTime) {
            try {
                const date = new Date(lastOrderTime);
                if (!isNaN(date.getTime())) {
                    date.setDate(date.getDate() + 15);
                    estArrival = date.toISOString().split('T')[0];
                }
            } catch (e) {
                console.error('Date parsing failed', lastOrderTime);
            }
        }

        // Create item - use last known values for order-level fields
        const item: OrderItem = {
            id: `${lastOrderNumber}-${i}`,
            orderNumber: lastOrderNumber,
            orderTime: lastOrderTime,  // Always use lastOrderTime (filled down)
            status: lastStatus,         // Always use lastStatus (filled down)
            shopName: lastShopName,     // Always use lastShopName (filled down)
            productName: colProductName,
            productLink: colLink,
            model: colModel,
            quantity: colQty,
            amount: colAmount,
            actualPayment: colActualPayment,
            freight: colFreight,
            // Use current row's logistics info (do NOT fill down)
            logisticsCompany: colLogisticsCompany.includes('物流单号') ? '' : colLogisticsCompany,
            logisticsNumber: colLogisticsNumber.includes('物流单号') ? '' : colLogisticsNumber,
            estArrivalDate: estArrival
        };

        // Check if item has 0 QTY and 0 Amount - skip if so
        const cleanQty = parseFloat(colQty.replace(/[^0-9.]/g, '') || '0');
        const cleanAmount = parseFloat(colAmount.replace(/[^0-9.]/g, '') || '0');

        if (cleanQty === 0 && cleanAmount === 0) {
            continue;
        }

        data.push(item);
    }

    return { data, errors };
};
