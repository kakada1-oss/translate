import React, { useState } from 'react';
import type { OrderItem } from '../types';
import { ExternalLink, Search, Copy, Check, X } from 'lucide-react';

interface DataTableProps {
    data: OrderItem[];
}

const DataTable: React.FC<DataTableProps> = ({ data }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (data.length === 0) return null;

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    // Filter data based on search
    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.orderNumber.toLowerCase().includes(query) ||
            item.shopName.toLowerCase().includes(query) ||
            (item.shopNameTranslated || '').toLowerCase().includes(query) ||
            item.productName.toLowerCase().includes(query) ||
            (item.productNameTranslated || '').toLowerCase().includes(query) ||
            item.category?.toLowerCase().includes(query) ||
            item.subcategory?.toLowerCase().includes(query)
        );
    });

    // Calculate row spans for each order
    const getRowSpans = (items: OrderItem[]) => {
        const spans: Record<number, number> = {};
        let currentOrderNo = '';
        let startIndex = 0;

        items.forEach((item, index) => {
            if (item.orderNumber !== currentOrderNo) {
                if (currentOrderNo !== '') {
                    spans[startIndex] = index - startIndex;
                }
                currentOrderNo = item.orderNumber;
                startIndex = index;
            }
            if (index === items.length - 1) {
                spans[startIndex] = index - startIndex + 1;
            }
        });
        return spans;
    };

    const rowSpans = getRowSpans(filteredData);

    return (
        <div className="animate-slide-up">
            {/* Search toolbar */}
            <div className="toolbar" style={{ marginBottom: 16 }}>
                <div className="search-input-wrapper" style={{ width: 320 }}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search orders, products, categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="btn-ghost"
                            onClick={() => setSearchQuery('')}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 4 }}
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Showing <span style={{ color: 'var(--accent-light)', fontWeight: 600 }}>{filteredData.length}</span> of {data.length} items
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Order / Time</th>
                            <th>Merchant</th>
                            <th>Category</th>
                            <th>Product</th>
                            <th>Style</th>
                            <th style={{ textAlign: 'center' }}>Qty</th>
                            <th style={{ textAlign: 'right' }}>Unit</th>
                            <th style={{ textAlign: 'right' }}>Total</th>
                            <th style={{ textAlign: 'right' }}>Logistics</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => {
                            const isFirstOfOrder = !!rowSpans[index];
                            const span = rowSpans[index];
                            const isNoise = item.category === 'Noise';
                            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
                            const price = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
                            const total = qty * price;

                            return (
                                <tr
                                    key={item.id}
                                    style={{
                                        opacity: isNoise ? 0.4 : 1,
                                        filter: isNoise ? 'grayscale(1)' : undefined
                                    }}
                                >
                                    {isFirstOfOrder && (
                                        <td rowSpan={span} style={{ verticalAlign: 'top', borderRight: '1px solid var(--border-subtle)' }}>
                                            <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                                                <span className="font-mono" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-light)' }}>
                                                    {item.orderNumber}
                                                </span>
                                                <button
                                                    className="btn-ghost copy-btn"
                                                    onClick={() => handleCopy(item.orderNumber, `order-${item.orderNumber}`)}
                                                    style={{ padding: 4 }}
                                                >
                                                    {copiedId === `order-${item.orderNumber}`
                                                        ? <Check size={12} style={{ color: 'var(--success)' }} />
                                                        : <Copy size={12} />
                                                    }
                                                </button>
                                            </div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                                                {item.orderTime}
                                            </div>
                                            <span className={`badge ${item.status.includes('发货') || item.status.toLowerCase().includes('ship') ? 'badge-success' : 'badge-muted'}`}>
                                                {item.status}
                                            </span>
                                        </td>
                                    )}

                                    {isFirstOfOrder && (
                                        <td rowSpan={span} style={{ verticalAlign: 'top', borderRight: '1px solid var(--border-subtle)' }}>
                                            <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>
                                                {item.shopNameTranslated || item.shopName}
                                            </div>
                                            {item.shopNameTranslated && item.shopNameTranslated !== item.shopName && (
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {item.shopName}
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    <td>
                                        {item.category ? (
                                            <span className={`badge ${isNoise ? 'badge-error' : 'badge-accent'}`}>
                                                {item.category}
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                        {item.subcategory && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                                {item.subcategory}
                                            </div>
                                        )}
                                    </td>

                                    <td style={{ maxWidth: 280 }}>
                                        <div style={{ fontWeight: 500, fontSize: '0.875rem' }} className="truncate">
                                            {item.productNameTranslated || item.productName}
                                        </div>
                                        {item.productNameTranslated && item.productNameTranslated !== item.productName && (
                                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }} className="truncate">
                                                {item.productName}
                                            </div>
                                        )}
                                        {item.productLink && (
                                            <a
                                                href={item.productLink}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-1"
                                                style={{ fontSize: '0.7rem', color: 'var(--accent-light)', marginTop: 4 }}
                                            >
                                                <ExternalLink size={10} />
                                                View Source
                                            </a>
                                        )}
                                    </td>

                                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                        {item.modelTranslated || item.model || '—'}
                                    </td>

                                    <td style={{ textAlign: 'center' }} className="font-mono">
                                        {item.quantity}
                                    </td>

                                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }} className="font-mono">
                                        {item.amount}
                                    </td>

                                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-light)' }} className="font-mono">
                                        {total.toFixed(2)}
                                    </td>

                                    <td style={{ textAlign: 'right' }}>
                                        {item.logisticsNumber ? (
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    {item.logisticsCompanyTranslated || item.logisticsCompany}
                                                </div>
                                                <div className="flex items-center justify-end gap-1" style={{ marginTop: 2 }}>
                                                    <span className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--accent-light)' }}>
                                                        {item.logisticsNumber}
                                                    </span>
                                                    <button
                                                        className="btn-ghost copy-btn"
                                                        onClick={() => handleCopy(item.logisticsNumber, `log-${item.logisticsNumber}`)}
                                                        style={{ padding: 2 }}
                                                    >
                                                        {copiedId === `log-${item.logisticsNumber}`
                                                            ? <Check size={10} style={{ color: 'var(--success)' }} />
                                                            : <Copy size={10} />
                                                        }
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Pending</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DataTable;
