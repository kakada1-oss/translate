import React from 'react';
import * as XLSX from 'xlsx';
import type { OrderItem } from '../types';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
    data: OrderItem[];
    exchangeRate: number;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ data, exchangeRate }) => {
    const handleDownload = () => {
        // Prepare data for export - cleaner structure directly for Excel
        const exportData = data.map(item => {
            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
            const amountCNY = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
            const totalCNY = qty * amountCNY;

            return {
                'order_id': item.orderNumber,
                'order_date': item.orderTime,
                'status': 'Ordered',
                'merchant': item.shopName,
                'category': item.category || '-',
                'subcategory': item.subcategory || '-',
                'product': item.productNameShortened || '-',
                'style_model': item.modelTranslated || item.model || '-',
                'size': item.attrSize || '-',
                'color': item.attrColor || '-',
                'material': item.attrMaterial || '-',
                'gender': item.attrGender || '-',
                'age_group': item.attrAgeGroup || '-',
                'brand': item.attrBrand || '-',
                'notes': item.attrOther || '-',
                'qty': qty,
                'price_cny': amountCNY,
                'total_cny': totalCNY,
                'price_usd': (amountCNY * exchangeRate).toFixed(2),
                'total_usd': (totalCNY * exchangeRate).toFixed(2),
                'est_arrival_date': item.estArrivalDate || '-',
                'source link': item.productLink
            };
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-width for columns (heuristic)
        const wscols = [
            { wch: 20 }, // order_id
            { wch: 18 }, // order_date
            { wch: 15 }, // status
            { wch: 20 }, // merchant
            { wch: 15 }, // category
            { wch: 15 }, // subcategory
            { wch: 35 }, // product
            { wch: 25 }, // style_model
            { wch: 10 }, // size
            { wch: 15 }, // color
            { wch: 15 }, // material
            { wch: 10 }, // gender
            { wch: 12 }, // age_group
            { wch: 15 }, // brand
            { wch: 20 }, // notes
            { wch: 8 },  // qty
            { wch: 12 }, // price_cny
            { wch: 12 }, // total_cny
            { wch: 12 }, // price_usd
            { wch: 12 }, // total_usd
            { wch: 15 }, // est_arrival_date
            { wch: 40 }, // source link
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

        // Write file
        XLSX.writeFile(workbook, "translated_orders.xlsx");
    };

    return (
        <button
            onClick={handleDownload}
            disabled={data.length === 0}
            className="btn-success"
        >
            <Download size={16} />
            Export
        </button>
    );
};

export default DownloadButton;
