import React, { useState } from 'react';
import type { OrderItem } from '../types';
import { resolveColorSwatch } from '../utils/colorUtils';
import { ExternalLink, Search, Copy, Check, X, Tag, Ruler, Shirt } from 'lucide-react';

interface DataTableProps {
    data: OrderItem[];
    exchangeRate: number;
}

const DataTable: React.FC<DataTableProps> = ({ data, exchangeRate }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [copiedId, setCopiedId] = useState<string | null>(null);

    if (data.length === 0) return null;

    const handleCopy = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const filteredData = data.filter(item => {
        const q = searchQuery.toLowerCase();
        return (
            item.orderNumber.toLowerCase().includes(q) ||
            item.shopName.toLowerCase().includes(q) ||
            (item.productNameTranslated || '').toLowerCase().includes(q) ||
            (item.productNameShortened || '').toLowerCase().includes(q) ||
            (item.modelTranslated || '').toLowerCase().includes(q) ||
            (item.attrColor || '').toLowerCase().includes(q) ||
            (item.attrSize || '').toLowerCase().includes(q) ||
            item.category?.toLowerCase().includes(q) ||
            item.subcategory?.toLowerCase().includes(q)
        );
    });

    const getRowSpans = (items: OrderItem[]) => {
        const spans: Record<number, number> = {};
        let currentOrderNo = '';
        let startIndex = 0;
        items.forEach((item, index) => {
            if (item.orderNumber !== currentOrderNo) {
                if (currentOrderNo !== '') spans[startIndex] = index - startIndex;
                currentOrderNo = item.orderNumber;
                startIndex = index;
            }
            if (index === items.length - 1) spans[startIndex] = index - startIndex + 1;
        });
        return spans;
    };

    const rowSpans = getRowSpans(filteredData);

    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Tops': '#3b82f6',
            'Bottoms': '#8b5cf6',
            'Dresses': '#ec4899',
            'Outerwear': '#f59e0b',
            'Activewear': '#10b981',
            'Underwear & Sleepwear': '#f97316',
            'Swimwear': '#06b6d4',
            'Accessories': '#6366f1',
            'Footwear': '#ef4444',
        };
        return colors[category] || '#9A9A97';
    };

    return (
        <div className="animate-fade-up">
            {/* Search toolbar */}
            <div className="toolbar" style={{ marginBottom: '1.25rem' }}>
                <div className="search-input-wrapper" style={{ maxWidth: 420, flex: 1 }}>
                    <Search size={15} />
                    <input
                        id="table-search"
                        type="text"
                        placeholder="Search orders, products, colors, categories… (press / to focus)"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="btn-ghost"
                            onClick={() => setSearchQuery('')}
                            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', padding: 3 }}
                            aria-label="Clear search"
                        >
                            <X size={13} />
                        </button>
                    )}
                </div>
                {searchQuery && (
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        Found{' '}
                        <span style={{ color: 'var(--accent-color)', fontWeight: 700, fontStyle: 'normal' }}>
                            {filteredData.length}
                        </span>{' '}
                        of {data.length} items
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: 140 }}>Order</th>
                            <th style={{ width: 120 }}>Est. Arrival</th>
                            <th style={{ width: 150 }}>Merchant</th>
                            <th style={{ width: 130 }}>Category</th>
                            <th style={{ minWidth: 200 }}>Product</th>
                            <th style={{ width: 80 }}>Size</th>
                            <th style={{ width: 110 }}>Color</th>
                            <th style={{ width: 110 }}>Material</th>
                            <th style={{ width: 60, textAlign: 'center' }}>Qty</th>
                            <th style={{ width: 100, textAlign: 'right' }}>Price</th>
                            <th style={{ width: 110, textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => {
                            const isFirstOfOrder = !!rowSpans[index];
                            const span = rowSpans[index];
                            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
                            const price = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
                            const total = qty * price;

                            const isShipped = item.status.includes('已发货') || item.statusTranslated?.includes('Shipped');
                            const statusBg = isShipped ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)';
                            const statusColor = isShipped ? 'var(--success)' : 'var(--warning)';

                            return (
                                <tr key={item.id}>
                                    {isFirstOfOrder && (
                                        <td rowSpan={span} style={{
                                            verticalAlign: 'top',
                                            borderRight: '1px solid var(--border-color)',
                                            background: 'rgba(163,161,153,0.02)',
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono" style={{
                                                        fontSize: '0.72rem',
                                                        fontWeight: 700,
                                                        color: 'var(--accent-color)',
                                                        letterSpacing: '-0.01em',
                                                    }}>
                                                        {item.orderNumber}
                                                    </span>
                                                    <button
                                                        className="btn-ghost"
                                                        onClick={() => handleCopy(item.orderNumber, `order-${item.orderNumber}`)}
                                                        style={{ padding: 3 }}
                                                        aria-label="Copy order number"
                                                    >
                                                        {copiedId === `order-${item.orderNumber}`
                                                            ? <Check size={10} style={{ color: 'var(--success)' }} />
                                                            : <Copy size={10} />
                                                        }
                                                    </button>
                                                </div>
                                                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                                                    {item.orderTime}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.62rem',
                                                    padding: '2px 6px',
                                                    borderRadius: 'var(--radius-xs)',
                                                    background: statusBg,
                                                    color: statusColor,
                                                    fontWeight: 700,
                                                    textAlign: 'center',
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.04em',
                                                }}>
                                                    {item.statusTranslated || item.status}
                                                </div>
                                            </div>
                                        </td>
                                    )}

                                    {isFirstOfOrder && (
                                        <td rowSpan={span} style={{
                                            verticalAlign: 'top',
                                            borderRight: '1px solid var(--border-color)',
                                            textAlign: 'center',
                                        }}>
                                            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: 4 }}>
                                                {item.estArrivalDate}
                                            </div>
                                            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                (15d projection)
                                            </div>
                                        </td>
                                    )}

                                    <td style={{ fontSize: '0.82rem' }}>
                                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                                            {item.shopName}
                                        </div>
                                    </td>

                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '3px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: `${getCategoryColor(item.category || '')}14`,
                                                color: getCategoryColor(item.category || ''),
                                                fontSize: '0.68rem',
                                                fontWeight: 700,
                                                width: 'fit-content',
                                                letterSpacing: '0.04em',
                                            }}>
                                                <Tag size={10} />
                                                {item.category || 'N/A'}
                                            </span>
                                            {item.subcategory && (
                                                <span style={{ fontSize: '0.63rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                                    {item.subcategory}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                                                {item.productNameShortened || item.productNameTranslated || item.productName}
                                            </div>
                                            {item.modelTranslated && (
                                                <div style={{
                                                    fontSize: '0.68rem',
                                                    color: 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4,
                                                }}>
                                                    <Shirt size={10} />
                                                    {item.modelTranslated}
                                                </div>
                                            )}
                                            {item.productLink && (
                                                <a
                                                    href={item.productLink}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-1"
                                                    style={{ fontSize: '0.63rem', color: 'var(--accent-color)', opacity: 0.7 }}
                                                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                                    onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                                                >
                                                    <ExternalLink size={9} />
                                                    Source
                                                </a>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        {item.attrSize ? (
                                            <span style={{
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 4,
                                                padding: '3px 8px',
                                                borderRadius: 'var(--radius-sm)',
                                                background: 'rgba(163,161,153,0.08)',
                                                fontSize: '0.72rem',
                                                fontWeight: 700,
                                                color: 'var(--accent-color)',
                                                border: '1px solid rgba(163,161,153,0.2)',
                                                letterSpacing: '0.04em',
                                            }}>
                                                <Ruler size={11} />
                                                {item.attrSize}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>

                                    <td>
                                        {item.attrColor ? (() => {
                                            const swatch = resolveColorSwatch(item.attrColor);
                                            return (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <div style={{
                                                        width: 16,
                                                        height: 16,
                                                        borderRadius: 'var(--radius-xs)',
                                                        background: swatch.bg,
                                                        border: swatch.border ?? (swatch.isLight
                                                            ? '1px solid rgba(0,0,0,0.12)'
                                                            : '1px solid rgba(255,255,255,0.08)'),
                                                        boxShadow: 'var(--shadow-sm)',
                                                        flexShrink: 0,
                                                    }} />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                                        {item.attrColor}
                                                    </span>
                                                </div>
                                            );
                                        })() : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>

                                    <td style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {item.attrMaterial || '—'}
                                    </td>

                                    <td style={{ textAlign: 'center' }} className="font-mono">
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 8px',
                                            borderRadius: 'var(--radius-xs)',
                                            background: 'rgba(163,161,153,0.08)',
                                            fontSize: '0.82rem',
                                            fontWeight: 700,
                                        }}>
                                            {item.quantity}
                                        </span>
                                    </td>

                                    <td style={{ textAlign: 'right' }} className="font-mono">
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>¥{price.toFixed(2)}</div>
                                        <div style={{ color: 'var(--accent-color)', fontSize: '0.7rem', fontWeight: 600 }}>
                                            ${(price * exchangeRate).toFixed(2)}
                                        </div>
                                    </td>

                                    <td style={{ textAlign: 'right' }} className="font-mono">
                                        <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.875rem' }}>
                                            ¥{total.toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--accent-color)', fontSize: '0.75rem', fontWeight: 700 }}>
                                            ${(total * exchangeRate).toFixed(2)}
                                        </div>
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
