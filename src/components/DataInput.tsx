import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Trash2, FileText, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataInputProps {
    onProcess: (data: string) => void;
    isLoading: boolean;
    addToast: (type: any, title: string, description?: string) => void;
}

interface UploadedFile {
    name: string;
    data: string;
    rowCount: number;
}

const DataInput: React.FC<DataInputProps> = ({ onProcess, isLoading, addToast }) => {
    const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
    const [text, setText] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => setIsDragOver(false);

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (inputMode === 'paste') {
            const droppedText = e.dataTransfer.getData('text');
            if (droppedText) setText(droppedText);
        } else {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const processFiles = async (fileList: File[]) => {
        const excelFiles = fileList.filter(f =>
            f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
        );
        for (const file of excelFiles) {
            try {
                const data = await readExcelFile(file);
                if (data) setFiles(prev => [...prev, data]);
            } catch (err) {
                console.error(`Error reading ${file.name}:`, err);
            }
        }
    };

    const readExcelFile = (file: File): Promise<UploadedFile | null> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target?.result as ArrayBuffer);
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
                    const rows = tsv.split('\n').filter(row => row.trim());
                    resolve({ name: file.name, data: tsv, rowCount: rows.length - 1 });
                } catch (err) { reject(err); }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) processFiles(Array.from(e.target.files));
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const loadSample = () => {
        const sample = `Order No.\tTime\tShop\tProduct\tModel\tColor\tSize\tPrice\tQty\tStatus
B240221-001\t2024-02-21 10:30\tFashionHub\tVintage Oversized Tee\tStandard\tMidnight Black\tXL\t¥159.00\t2\tPending
B240221-002\t2024-02-21 11:15\tTrendSetter\tHigh-Waist Cargo Pants\tLoose Fit\tSage Green\tL\t¥299.00\t1\tPaid
B240221-003\t2024-02-21 12:00\tSilkRoad\tFloral Summer Dress\tMaxi\tSoft Petal\tM\t¥450.00\t5\tShipped`;
        setText(sample.trim());
        addToast('info', 'Sample data loaded', 'Click "Process Data" to see AI in action.');
    };

    const handleProcess = () => {
        if (inputMode === 'paste') {
            onProcess(text);
        } else {
            onProcess(files.map(f => f.data).join('\n'));
        }
    };

    const canProcess = inputMode === 'paste' ? text.trim() : files.length > 0;
    const totalRows = files.reduce((s, f) => s + f.rowCount, 0);

    return (
        <div className="card mb-6">
            <div className="card-header">
                <span className="card-title">
                    <FileText size={13} />
                    Data Input
                </span>
                <div className="flex gap-2">
                    <button
                        id="btn-mode-paste"
                        className={`btn-sm ${inputMode === 'paste' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setInputMode('paste')}
                    >
                        <FileText size={13} />
                        Paste
                    </button>
                    <button
                        id="btn-mode-upload"
                        className={`btn-sm ${inputMode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setInputMode('upload')}
                    >
                        <FileSpreadsheet size={13} />
                        Upload
                    </button>
                </div>
            </div>

            <div className="card-body">
                {inputMode === 'paste' ? (
                    <>
                        <div className="flex justify-between items-center" style={{ marginBottom: '0.625rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                Paste your order data (CSV, TSV format) or drop text here
                            </span>
                            <button id="btn-sample" className="btn-ghost btn-sm" onClick={loadSample}>
                                <Sparkles size={13} />
                                Load Sample
                            </button>
                        </div>
                        <div
                            style={{ position: 'relative' }}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <textarea
                                id="main-search"
                                rows={8}
                                placeholder="Paste your order data here (Order #, Date, Status, Shop, Product, URL, SKU, Qty, Price…)"
                                value={text}
                                onChange={e => setText(e.target.value)}
                                style={{
                                    borderColor: isDragOver ? 'var(--accent-color)' : undefined,
                                    background: isDragOver ? 'rgba(163, 161, 153, 0.04)' : undefined,
                                    transition: 'border-color 0.2s, background 0.2s',
                                }}
                            />
                            {!text && (
                                <div style={{
                                    position: 'absolute',
                                    inset: 0,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    pointerEvents: 'none',
                                    opacity: 0.2,
                                    gap: '0.5rem',
                                }}>
                                    <FileText size={44} />
                                    <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                        Paste or drop text here
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                        <div
                            id="drop-zone"
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${isDragOver ? 'var(--accent-color)' : 'var(--border-strong)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '2.5rem 1.5rem',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isDragOver
                                    ? 'rgba(163, 161, 153, 0.04)'
                                    : 'transparent',
                            }}
                        >
                            <Upload
                                size={40}
                                style={{
                                    color: isDragOver ? 'var(--accent-color)' : 'var(--text-muted)',
                                    marginBottom: 12,
                                    display: 'block',
                                    margin: '0 auto 12px',
                                    animation: isDragOver ? 'float 1.5s ease-in-out infinite' : undefined,
                                }}
                            />
                            <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                                {isDragOver ? 'Drop files here' : 'Click to upload or drag & drop'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                Excel files (.xlsx, .xls) or CSV
                            </div>
                        </div>

                        {files.length > 0 && (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{
                                    fontSize: '0.65rem', color: 'var(--text-muted)',
                                    marginBottom: '0.5rem', textTransform: 'uppercase',
                                    letterSpacing: '0.1em', fontWeight: 700,
                                }}>
                                    {files.length} file{files.length > 1 ? 's' : ''} · {totalRows} rows
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '0.625rem 0.875rem',
                                                background: 'var(--bg-color)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-color)',
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileSpreadsheet size={18} style={{ color: 'var(--success)' }} />
                                                <div>
                                                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                                                        {file.name}
                                                    </div>
                                                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                                        {file.rowCount} rows
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-ghost btn-sm"
                                                onClick={e => { e.stopPropagation(); removeFile(index); }}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex gap-3" style={{ marginTop: '1rem' }}>
                    <button
                        id="btn-process-data"
                        className="btn-primary btn-lg"
                        onClick={handleProcess}
                        disabled={!canProcess || isLoading}
                        style={{ flex: 1 }}
                    >
                        {isLoading ? (
                            <><span className="spinner" />Processing…</>
                        ) : (
                            <><Sparkles size={16} />Process Data</>
                        )}
                    </button>
                    <button
                        id="btn-clear-input"
                        className="btn-danger"
                        onClick={() => { setText(''); setFiles([]); }}
                        disabled={isLoading || (!text && files.length === 0)}
                        title="Clear input"
                        style={{ padding: '0.75rem 1rem' }}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataInput;
