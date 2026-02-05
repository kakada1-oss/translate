import React from 'react';
import * as XLSX from 'xlsx';
import type { OrderItem } from '../types';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
    data: OrderItem[];
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ data }) => {
    const handleDownload = () => {
        // Prepare data for export - cleaner structure directly for Excel
        const exportData = data.map(item => {
            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
            const amount = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');

            return {
                'Order Number': item.orderNumber,
                'Order Time': item.orderTime,
                'Status': item.status,
                'Shop Name': item.shopNameTranslated || item.shopName,
                'Category': item.category || '-',
                'Subcategory': item.subcategory || '-',
                'Product Name': item.productNameTranslated || item.productName,
                'Model / Style': item.modelTranslated || item.model,
                'Quantity': qty,
                'Amount': amount,
                'Total Amount': qty * amount,
                'Cost': item.actualPayment,
                'Freight': item.freight,
                'Logistics Company': item.logisticsCompanyTranslated || item.logisticsCompany,
                'Logistics Number': item.logisticsNumber,
                'Product Link': item.productLink
            };
        });

        // Create workbook and worksheet
        const worksheet = XLSX.utils.json_to_sheet(exportData);

        // Auto-width for columns (heuristic)
        const wscols = [
            { wch: 20 }, // Order No
            { wch: 18 }, // Time
            { wch: 12 }, // Status
            { wch: 20 }, // Shop
            { wch: 15 }, // Category
            { wch: 15 }, // Subcategory
            { wch: 50 }, // Product Name
            { wch: 20 }, // Model
            { wch: 8 },  // Qty
            { wch: 10 }, // Amount
            { wch: 12 }, // Total Amount
            { wch: 10 }, // Cost
            { wch: 8 },  // Freight
            { wch: 15 }, // Logistics
            { wch: 20 }, // Logistics No
            { wch: 50 }, // Link
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
