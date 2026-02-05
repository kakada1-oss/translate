import React, { useState, useRef } from 'react';
import { Upload, Sparkles, Trash2, FileText, FileSpreadsheet, X } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DataInputProps {
    onProcess: (data: string) => void;
    isLoading: boolean;
}

interface UploadedFile {
    name: string;
    data: string;
    rowCount: number;
}

const DataInput: React.FC<DataInputProps> = ({ onProcess, isLoading }) => {
    const [inputMode, setInputMode] = useState<'paste' | 'upload'>('paste');
    const [text, setText] = useState('');
    const [files, setFiles] = useState<UploadedFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);

        if (inputMode === 'paste') {
            const droppedText = e.dataTransfer.getData('text');
            if (droppedText) {
                setText(droppedText);
            }
        } else {
            const droppedFiles = Array.from(e.dataTransfer.files);
            processFiles(droppedFiles);
        }
    };

    const processFiles = async (fileList: File[]) => {
        const excelFiles = fileList.filter(f =>
            f.name.endsWith('.xlsx') || f.name.endsWith('.xls') || f.name.endsWith('.csv')
        );

        for (const file of excelFiles) {
            try {
                const data = await readExcelFile(file);
                if (data) {
                    setFiles(prev => [...prev, data]);
                }
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

                    // Get the first sheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    // Convert to TSV format
                    const tsv = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
                    const rows = tsv.split('\n').filter(row => row.trim());

                    resolve({
                        name: file.name,
                        data: tsv,
                        rowCount: rows.length - 1 // Exclude header
                    });
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    };

    const injectSample = () => {
        setText(`20241024-001\t2024-10-24 10:00\tShipped\tGlobal Mall\tWinter Coat\thttp://example.com\tNavy/XL\t1\t599.00\t599.00\t0.00\tFedEx\tFX123456
20241024-002\t2024-10-24 11:30\tPending\tTech Haven\tPro Headphones\thttp://example.com\tSilver\t1\t1299.00\t1299.00\t10.00\tDHL\t-
20241024-003\t2024-10-24 14:15\tProcessing\t时尚精品店\t秋冬新款羊毛大衣\thttp://example.com\t灰色/M\t2\t899.00\t1798.00\t0.00\tSF Express\tSF789012`);
    };

    const handleProcess = () => {
        if (inputMode === 'paste') {
            onProcess(text);
        } else {
            // Combine all file data
            const combinedData = files.map(f => f.data).join('\n');
            onProcess(combinedData);
        }
    };

    const canProcess = inputMode === 'paste' ? text.trim() : files.length > 0;
    const totalRows = files.reduce((sum, f) => sum + f.rowCount, 0);

    return (
        <div className="card mb-6">
            <div className="card-header">
                <span className="card-title">
                    <FileText size={14} />
                    Data Input
                </span>
                <div className="flex gap-2">
                    <button
                        className={`btn-sm ${inputMode === 'paste' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setInputMode('paste')}
                        style={{ padding: '6px 12px' }}
                    >
                        <FileText size={14} />
                        Paste
                    </button>
                    <button
                        className={`btn-sm ${inputMode === 'upload' ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => setInputMode('upload')}
                        style={{ padding: '6px 12px' }}
                    >
                        <FileSpreadsheet size={14} />
                        Upload
                    </button>
                </div>
            </div>
            <div className="card-body">
                {inputMode === 'paste' ? (
                    <>
                        {/* Paste mode */}
                        <div className="flex justify-between items-center mb-3">
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Paste your order data (CSV, TSV format)
                            </span>
                            <button className="btn-ghost btn-sm" onClick={injectSample}>
                                <Sparkles size={14} />
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
                                rows={8}
                                placeholder="Paste your order data here (Order #, Date, Status, Shop, Product, URL, SKU, Qty, Price...)"
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                style={{
                                    borderColor: isDragOver ? 'var(--accent)' : undefined,
                                    background: isDragOver ? 'rgba(var(--accent-rgb), 0.02)' : undefined,
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
                                    opacity: 0.3,
                                }}>
                                    <FileText size={40} style={{ marginBottom: 12 }} />
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                        Paste or drop text here
                                    </span>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Upload mode */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            multiple
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            style={{
                                border: `2px dashed ${isDragOver ? 'var(--accent)' : 'var(--border-default)'}`,
                                borderRadius: 'var(--radius-lg)',
                                padding: '40px 20px',
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: isDragOver ? 'rgba(var(--accent-rgb), 0.02)' : 'var(--bg-secondary)',
                            }}
                        >
                            <Upload size={40} style={{ color: isDragOver ? 'var(--accent)' : 'var(--text-muted)', marginBottom: 12 }} />
                            <div style={{ fontWeight: 500, marginBottom: 4 }}>
                                {isDragOver ? 'Drop files here' : 'Click to upload or drag & drop'}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                Excel files (.xlsx, .xls) or CSV
                            </div>
                        </div>

                        {/* File list */}
                        {files.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {files.length} file{files.length > 1 ? 's' : ''} • {totalRows} rows
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    {files.map((file, index) => (
                                        <div
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '10px 14px',
                                                background: 'var(--bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                border: '1px solid var(--border-subtle)',
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <FileSpreadsheet size={18} style={{ color: 'var(--success)' }} />
                                                <div>
                                                    <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{file.name}</div>
                                                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                        {file.rowCount} rows
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn-ghost"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeFile(index);
                                                }}
                                                style={{ padding: 6 }}
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                <div className="flex gap-3" style={{ marginTop: 16 }}>
                    <button
                        className="btn-primary btn-lg"
                        onClick={handleProcess}
                        disabled={!canProcess || isLoading}
                        style={{ flex: 1 }}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={18} />
                                Process Data
                            </>
                        )}
                    </button>

                    <button
                        className="btn-danger"
                        onClick={() => {
                            setText('');
                            setFiles([]);
                        }}
                        disabled={isLoading || (!text && files.length === 0)}
                        title="Clear"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DataInput;
