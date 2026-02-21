// ============================================================
// Shared color utilities — used by dataProcessor (parse-time
// extraction from column 6) and DataTable (swatch rendering).
// ============================================================

export interface ColorSwatch {
    bg: string;
    border?: string;
    isLight: boolean;
}

// All colors the classifier can produce, keyed in lowercase.
// Longer / more specific keys must be checked before shorter ones.
export const COLOR_MAP: Record<string, { bg: string; border?: string }> = {
    // Neutrals
    'black': { bg: '#0a0a0a' },
    'white': { bg: '#f8f8f8', border: '1px solid #d1d5db' },
    'gray': { bg: '#6b7280' },
    'grey': { bg: '#6b7280' },
    'silver': { bg: '#c0c0c0', border: '1px solid #9ca3af' },
    'off-white': { bg: '#f5f0e8', border: '1px solid #d1d5db' },
    'cream': { bg: '#fffdc1', border: '1px solid #e5e7ac' },
    'ivory': { bg: '#fffff0', border: '1px solid #d1d5c8' },
    // Blues — specific first so "navy blue" beats "blue"
    'navy blue': { bg: '#172554' },
    'navy': { bg: '#172554' },
    'royal blue': { bg: '#1d4ed8' },
    'sky blue': { bg: '#38bdf8' },
    'light blue': { bg: '#7dd3fc' },
    'baby blue': { bg: '#bfdbfe' },
    'cobalt': { bg: '#0047ab' },
    'denim': { bg: '#1560bd' },
    'blue': { bg: '#2563eb' },
    'teal': { bg: '#0d9488' },
    'turquoise': { bg: '#40e0d0' },
    'cyan': { bg: '#06b6d4' },
    // Greens — specific first
    'forest green': { bg: '#15803d' },
    'olive': { bg: '#4d7c0f' },
    'khaki': { bg: '#c3b091', border: '1px solid #a89070' },
    'sage': { bg: '#7c9a7e' },
    'mint': { bg: '#a7f3d0' },
    'emerald': { bg: '#059669' },
    'green': { bg: '#16a34a' },
    // Reds & Pinks — specific first
    'hot pink': { bg: '#f43f5e' },
    'crimson': { bg: '#be123c' },
    'maroon': { bg: '#7f1d1d' },
    'burgundy': { bg: '#6b2737' },
    'wine': { bg: '#722f37' },
    'rose': { bg: '#fb7185' },
    'blush': { bg: '#fda4af', border: '1px solid #fb6f7f' },
    'salmon': { bg: '#fa8072' },
    'coral': { bg: '#ff6b6b' },
    'pink': { bg: '#ec4899' },
    'red': { bg: '#dc2626' },
    // Purples
    'lavender': { bg: '#c4b5fd', border: '1px solid #a78bfa' },
    'lilac': { bg: '#c084fc' },
    'mauve': { bg: '#c8a4c8' },
    'violet': { bg: '#8b5cf6' },
    'plum': { bg: '#6b21a8' },
    'purple': { bg: '#7c3aed' },
    // Oranges & Yellows
    'mustard': { bg: '#b45309' },
    'peach': { bg: '#ffb347', border: '1px solid #e0943a' },
    'orange': { bg: '#ea580c' },
    'gold': { bg: '#d97706' },
    'yellow': { bg: '#ca8a04' },
    // Browns & Tans
    'chocolate': { bg: '#5c2e00' },
    'camel': { bg: '#c19a6b' },
    'taupe': { bg: '#8b7d6b' },
    'rust': { bg: '#b7410e' },
    'brown': { bg: '#92400e' },
    'tan': { bg: '#d2b48c', border: '1px solid #b8976c' },
    'beige': { bg: '#f5f0dc', border: '1px solid #c8b88a' },
    // Patterns & special
    'striped': { bg: 'repeating-linear-gradient(45deg, #374151, #374151 4px, #6b7280 4px, #6b7280 8px)' },
    'floral': { bg: 'linear-gradient(135deg, #f9a8d4 0%, #86efac 50%, #93c5fd 100%)' },
    'plaid': { bg: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 0 0/8px 8px' },
    'checkered': { bg: 'repeating-conic-gradient(#374151 0% 25%, #6b7280 0% 50%) 0 0/8px 8px' },
    'leopard': { bg: 'radial-gradient(ellipse 6px 5px at 4px 4px, #78350f 70%, transparent 70%), radial-gradient(ellipse 6px 5px at 12px 12px, #78350f 70%, transparent 70%), #ca8a04' },
    'animal print': { bg: 'radial-gradient(circle 3px at 4px 4px, #78350f 100%, transparent 100%), #ca8a04' },
    'camouflage': { bg: 'linear-gradient(135deg, #365314 0%, #4d7c0f 33%, #713f12 66%, #365314 100%)' },
    'camo': { bg: 'linear-gradient(135deg, #365314 0%, #4d7c0f 33%, #713f12 66%, #365314 100%)' },
    'polka dot': { bg: 'radial-gradient(circle 3px at 6px 6px, #1f2937 100%, transparent 100%), #f3f4f6' },
    'tie dye': { bg: 'conic-gradient(#f43f5e, #f97316, #eab308, #22c55e, #3b82f6, #a855f7, #f43f5e)' },
    'graphic': { bg: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' },
    'abstract': { bg: 'linear-gradient(135deg, #7c3aed 0%, #db2777 50%, #ea580c 100%)' },
    'multi-color': { bg: 'linear-gradient(135deg, #ef4444 0%, #eab308 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)' },
    'multicolor': { bg: 'linear-gradient(135deg, #ef4444 0%, #eab308 25%, #22c55e 50%, #3b82f6 75%, #a855f7 100%)' },
    'color block': { bg: 'linear-gradient(90deg, #1e40af 50%, #dc2626 50%)' },
};

// Light colors that need a dark border to be visible on dark backgrounds
export const LIGHT_COLORS = new Set([
    'white', 'cream', 'ivory', 'off-white', 'beige', 'tan', 'khaki',
    'lavender', 'blush', 'peach', 'mint', 'baby blue', 'light blue', 'silver',
]);

// Keys pre-sorted by length (longest first) for correct partial matching.
// Built once at module load — not inside a render loop.
export const ORDERED_COLOR_KEYS = Object.keys(COLOR_MAP).sort((a, b) => b.length - a.length);

/**
 * Resolve a free-text color string to a CSS swatch definition.
 * Tries exact match first, then longest-key partial match.
 */
export function resolveColorSwatch(colorStr: string): ColorSwatch {
    const key = colorStr.toLowerCase().trim();

    // Exact match
    if (COLOR_MAP[key]) {
        return { ...COLOR_MAP[key], isLight: LIGHT_COLORS.has(key) };
    }

    // Partial match — longest key wins
    for (const mapKey of ORDERED_COLOR_KEYS) {
        if (key.includes(mapKey)) {
            return { ...COLOR_MAP[mapKey], isLight: LIGHT_COLORS.has(mapKey) };
        }
    }

    // Unknown
    return { bg: 'linear-gradient(135deg, #475569 0%, #64748b 100%)', isLight: false };
}

/**
 * Extract a color name from a raw model/SKU string (column 6).
 * The model typically looks like:  "Navy/XL",  "Men Black XL",  "灰色/M"
 *
 * Strategy:
 *   1. Split on common separators (/ , - space)
 *   2. For each token, try longest-key match in COLOR_MAP
 *   3. Return the first match found, properly capitalised
 *   4. Return null if nothing matches
 */
export function extractColorFromModel(model: string): string | null {
    if (!model?.trim()) return null;

    const lower = model.toLowerCase();

    // Try a direct substring scan across the full string first
    // (handles "Navy Blue" as a two-word token)
    for (const mapKey of ORDERED_COLOR_KEYS) {
        // Require word boundaries so "red" doesn't match inside "spread"
        const regex = new RegExp(`(?<![a-z])${escapeRegex(mapKey)}(?![a-z])`, 'i');
        if (regex.test(lower)) {
            // Return in Title Case
            return mapKey
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
        }
    }

    return null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
