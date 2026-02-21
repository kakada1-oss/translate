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
        const exportData = data.map(item => {
            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
            const amountCNY = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
            const totalCNY = qty * amountCNY;

            return {
                'order_id': item.orderNumber,
                'order_date': item.orderTime,
                'status': 'ordered',
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
                'source_link': item.productLink,
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);

        worksheet['!cols'] = [
            { wch: 20 }, { wch: 18 }, { wch: 15 }, { wch: 20 },
            { wch: 15 }, { wch: 15 }, { wch: 35 }, { wch: 25 },
            { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 10 },
            { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 8 },
            { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
            { wch: 15 }, { wch: 40 },
        ];

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
        XLSX.writeFile(workbook, 'translated_orders.xlsx');
    };

    return (
        <button
            id="btn-export"
            onClick={handleDownload}
            disabled={data.length === 0}
            className="btn-success"
        >
            <Download size={15} />
            Export
        </button>
    );
};

export default DownloadButton;
