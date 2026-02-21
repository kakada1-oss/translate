import { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    description?: string;
    duration?: number; // ms, default 4000
}

interface ToastProps {
    toasts: ToastMessage[];
    onDismiss: (id: string) => void;
}

const ICONS = {
    success: CheckCircle2,
    error: AlertCircle,
    info: Info,
};

const COLORS: Record<ToastType, { border: string; icon: string; bg: string }> = {
    success: { border: 'var(--success)', icon: 'var(--success)', bg: 'rgba(16,185,129,0.07)' },
    error: { border: 'var(--error)', icon: 'var(--error)', bg: 'rgba(239,68,68,0.07)' },
    info: { border: 'var(--info)', icon: 'var(--info)', bg: 'rgba(59,130,246,0.07)' },
};

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
    const [visible, setVisible] = useState(false);
    const Icon = ICONS[toast.type];
    const colors = COLORS[toast.type];

    useEffect(() => {
        // mount → trigger slide-in
        const show = requestAnimationFrame(() => setVisible(true));
        // auto-dismiss
        const hide = setTimeout(() => {
            setVisible(false);
            setTimeout(onDismiss, 300);
        }, toast.duration ?? 4500);
        return () => { cancelAnimationFrame(show); clearTimeout(hide); };
    }, []);  // eslint-disable-line

    return (
        <div
            style={{
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                padding: '0.875rem 1rem',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-color)',
                border: `1px solid var(--border-color)`,
                borderLeft: `3px solid ${colors.border}`,
                boxShadow: 'var(--shadow-lg)',
                minWidth: 280,
                maxWidth: 380,
                transform: visible ? 'translateX(0)' : 'translateX(110%)',
                opacity: visible ? 1 : 0,
                transition: 'transform 0.32s cubic-bezier(0.16,1,0.3,1), opacity 0.32s ease',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* colour tint bg */}
            <div style={{ position: 'absolute', inset: 0, background: colors.bg, pointerEvents: 'none' }} />

            <Icon size={17} style={{ color: colors.icon, flexShrink: 0, marginTop: 1, position: 'relative' }} />

            <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
                <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {toast.title}
                </div>
                {toast.description && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>
                        {toast.description}
                    </div>
                )}
            </div>

            <button
                onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
                style={{
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    padding: '2px',
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                    position: 'relative',
                }}
                aria-label="Dismiss"
            >
                <X size={13} />
            </button>
        </div>
    );
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
    if (toasts.length === 0) return null;
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '1.5rem',
                right: '1.5rem',
                zIndex: 1000,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                alignItems: 'flex-end',
            }}
        >
            {toasts.map(t => (
                <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
            ))}
        </div>
    );
}
