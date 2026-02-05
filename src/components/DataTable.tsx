import React, { useState } from 'react';
import type { OrderItem } from '../types';
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

    // Filter data based on search
    const filteredData = data.filter(item => {
        const query = searchQuery.toLowerCase();
        return (
            item.orderNumber.toLowerCase().includes(query) ||
            item.shopName.toLowerCase().includes(query) ||
            (item.productNameTranslated || '').toLowerCase().includes(query) ||
            (item.productNameShortened || '').toLowerCase().includes(query) ||
            (item.modelTranslated || '').toLowerCase().includes(query) ||
            (item.attrColor || '').toLowerCase().includes(query) ||
            (item.attrSize || '').toLowerCase().includes(query) ||
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

    // Category color mapping
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
            'Footwear': '#ef4444'
        };
        return colors[category] || '#6b7280';
    };

    return (
        <div className="animate-slide-up">
            {/* Search toolbar */}
            <div className="toolbar" style={{ marginBottom: 20 }}>
                <div className="search-input-wrapper" style={{ width: 400 }}>
                    <Search size={16} />
                    <input
                        type="text"
                        placeholder="Search by order, product, color, size, category..."
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
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Found <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{filteredData.length}</span> of {data.length} items
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th style={{ width: '140px' }}>Order</th>
                            <th style={{ width: '150px' }}>Merchant</th>
                            <th style={{ width: '120px' }}>Category</th>
                            <th style={{ minWidth: '200px' }}>Product</th>
                            <th style={{ width: '80px' }}>Size</th>
                            <th style={{ width: '100px' }}>Color</th>
                            <th style={{ width: '100px' }}>Material</th>
                            <th style={{ width: '60px', textAlign: 'center' }}>Qty</th>
                            <th style={{ width: '100px', textAlign: 'right' }}>Price</th>
                            <th style={{ width: '110px', textAlign: 'right' }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredData.map((item, index) => {
                            const isFirstOfOrder = !!rowSpans[index];
                            const span = rowSpans[index];
                            const qty = parseFloat(item.quantity.replace(/[^0-9.]/g, '') || '0');
                            const price = parseFloat(item.amount.replace(/[^0-9.]/g, '') || '0');
                            const total = qty * price;

                            return (
                                <tr
                                    key={item.id}
                                    style={{
                                        transition: 'background 0.2s ease',
                                    }}
                                >
                                    {isFirstOfOrder && (
                                        <td rowSpan={span} style={{
                                            verticalAlign: 'top',
                                            borderRight: '2px solid var(--border-subtle)',
                                            background: 'rgba(var(--accent-rgb), 0.02)'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono" style={{
                                                        fontSize: '0.75rem',
                                                        fontWeight: 600,
                                                        color: 'var(--accent)',
                                                        letterSpacing: '-0.02em'
                                                    }}>
                                                        {item.orderNumber}
                                                    </span>
                                                    <button
                                                        className="btn-ghost copy-btn"
                                                        onClick={() => handleCopy(item.orderNumber, `order-${item.orderNumber}`)}
                                                        style={{ padding: 3 }}
                                                    >
                                                        {copiedId === `order-${item.orderNumber}`
                                                            ? <Check size={10} style={{ color: 'var(--success)' }} />
                                                            : <Copy size={10} />
                                                        }
                                                    </button>
                                                </div>
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-muted)',
                                                    lineHeight: 1.3
                                                }}>
                                                    {item.orderTime}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.65rem',
                                                    padding: '2px 6px',
                                                    borderRadius: 3,
                                                    background: item.status.includes('已发货') || item.statusTranslated?.includes('Shipped')
                                                        ? 'rgba(16, 185, 129, 0.1)'
                                                        : 'rgba(251, 191, 36, 0.1)',
                                                    color: item.status.includes('已发货') || item.statusTranslated?.includes('Shipped')
                                                        ? '#10b981'
                                                        : '#f59e0b',
                                                    fontWeight: 500,
                                                    textAlign: 'center'
                                                }}>
                                                    {item.statusTranslated || item.status}
                                                </div>
                                            </div>
                                        </td>
                                    )}

                                    <td style={{ fontSize: '0.8rem' }}>
                                        <div style={{
                                            fontWeight: 500,
                                            color: 'var(--text-primary)',
                                            marginBottom: 2
                                        }}>
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
                                                borderRadius: 4,
                                                background: `${getCategoryColor(item.category || '')}15`,
                                                color: getCategoryColor(item.category || ''),
                                                fontSize: '0.7rem',
                                                fontWeight: 600,
                                                width: 'fit-content'
                                            }}>
                                                <Tag size={10} />
                                                {item.category || 'N/A'}
                                            </span>
                                            {item.subcategory && (
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--text-muted)',
                                                    fontStyle: 'italic'
                                                }}>
                                                    {item.subcategory}
                                                </span>
                                            )}
                                        </div>
                                    </td>

                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            <div style={{
                                                fontWeight: 600,
                                                fontSize: '0.85rem',
                                                color: 'var(--text-primary)',
                                                lineHeight: 1.3
                                            }}>
                                                {item.productNameShortened || item.productNameTranslated || item.productName}
                                            </div>
                                            {item.modelTranslated && (
                                                <div style={{
                                                    fontSize: '0.7rem',
                                                    color: 'var(--text-muted)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 4
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
                                                    style={{
                                                        fontSize: '0.65rem',
                                                        color: 'var(--accent)',
                                                        textDecoration: 'none',
                                                        opacity: 0.7,
                                                        transition: 'opacity 0.2s'
                                                    }}
                                                    onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                                    onMouseLeave={(e) => e.currentTarget.style.opacity = '0.7'}
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
                                                padding: '4px 10px',
                                                borderRadius: 4,
                                                background: 'rgba(var(--accent-rgb), 0.08)',
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                color: 'var(--accent)',
                                                border: '1px solid rgba(var(--accent-rgb), 0.2)'
                                            }}>
                                                <Ruler size={11} />
                                                {item.attrSize}
                                            </span>
                                        ) : (
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>

                                    <td>
                                        {item.attrColor ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <div style={{
                                                    width: 16,
                                                    height: 16,
                                                    borderRadius: 3,
                                                    background: item.attrColor.toLowerCase().includes('black') ? '#000' :
                                                        item.attrColor.toLowerCase().includes('white') ? '#fff' :
                                                            item.attrColor.toLowerCase().includes('red') ? '#ef4444' :
                                                                item.attrColor.toLowerCase().includes('blue') ? '#3b82f6' :
                                                                    item.attrColor.toLowerCase().includes('green') ? '#10b981' :
                                                                        item.attrColor.toLowerCase().includes('yellow') ? '#fbbf24' :
                                                                            item.attrColor.toLowerCase().includes('pink') ? '#ec4899' :
                                                                                item.attrColor.toLowerCase().includes('purple') ? '#a855f7' :
                                                                                    item.attrColor.toLowerCase().includes('gray') || item.attrColor.toLowerCase().includes('grey') ? '#6b7280' :
                                                                                        item.attrColor.toLowerCase().includes('brown') ? '#92400e' :
                                                                                            item.attrColor.toLowerCase().includes('beige') ? '#d4a574' :
                                                                                                item.attrColor.toLowerCase().includes('navy') ? '#1e3a8a' :
                                                                                                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                                    border: item.attrColor.toLowerCase().includes('white') ? '1px solid #e5e7eb' : 'none',
                                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                                }} />
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 500,
                                                    color: 'var(--text-secondary)'
                                                }}>
                                                    {item.attrColor}
                                                </span>
                                            </div>
                                        ) : (
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
                                            borderRadius: 3,
                                            background: 'rgba(var(--accent-rgb), 0.05)',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}>
                                            {item.quantity}
                                        </span>
                                    </td>

                                    <td style={{ textAlign: 'right' }} className="font-mono">
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>¥{price.toFixed(2)}</div>
                                        <div style={{ color: 'var(--accent)', fontSize: '0.7rem', fontWeight: 500 }}>
                                            ${(price * exchangeRate).toFixed(2)}
                                        </div>
                                    </td>

                                    <td style={{ textAlign: 'right' }} className="font-mono">
                                        <div style={{ fontWeight: 600, color: 'var(--accent-light)', fontSize: '0.85rem' }}>
                                            ¥{total.toFixed(2)}
                                        </div>
                                        <div style={{ color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 600 }}>
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
