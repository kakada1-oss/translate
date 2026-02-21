/**
 * sizeUtils.ts
 *
 * Rule-based size extraction from raw SKU / model strings (column 6).
 * Handles:
 *   - Standard letter sizes:  S, M, L, XL, XXL, 3XL, 4XL, 5XL
 *   - Asian free sizes:        F, Free, Freesize, One Size
 *   - Catty weight ranges:     "85-95斤", "90斤" → converts to kg → maps to letter size
 *   - Chinese numeric sizes:   165/84A, 175/88B
 *   - Waist / numeric:         28, 29, 30, 32W, 42 (shoes)
 */

// ─── Size chart (by weight kg, midpoint used for ranges) ─────────────────────
// Based on standard Asian market women's / men's sizing.
// Conservative: favour smaller size when on boundary.

interface WeightBracket {
    maxKg: number;   // upper bound (exclusive top of bracket)
    size: string;
}

// General unisex chart (user-provided, women-leaning Asian market)
const WEIGHT_BRACKETS: WeightBracket[] = [
    { maxKg: 48, size: 'S' },
    { maxKg: 56, size: 'M' },
    { maxKg: 66, size: 'L' },
    { maxKg: 76, size: 'XL' },
    { maxKg: 86, size: 'XXL' },
    { maxKg: 96, size: '3XL' },
    { maxKg: 110, size: '4XL' },
    { maxKg: Infinity, size: '5XL' },
];

function cattiesToKg(catties: number): number {
    return catties * 0.5;
}

function kgToSize(kg: number): string {
    for (const bracket of WEIGHT_BRACKETS) {
        if (kg < bracket.maxKg) return bracket.size;
    }
    return '5XL';
}

// ─── Standard letter sizes (ordered longest-first for matching) ───────────────
const LETTER_SIZES = ['freesize', 'one size', 'free size', 'onesize',
    '5xl', '4xl', '3xl', 'xxxl', 'xxl', 'xl', 'xs', 'l', 'm', 's', 'f'];

const SIZE_NORMALISE: Record<string, string> = {
    'freesize': 'Free',
    'one size': 'Free',
    'free size': 'Free',
    'onesize': 'Free',
    'f': 'Free',
    'xxxl': '3XL',
    '3xl': '3XL',
    '4xl': '4XL',
    'xxl': 'XXL',
    'xl': 'XL',
    'xs': 'XS',
    'l': 'L',
    'm': 'M',
    's': 'S',
};

// Catty range pattern:  85-95斤  |  85斤  |  约85斤  |  85~95斤
const CATTY_RANGE_RE = /(?:约|~)?(\d{2,3})\s*[-~–]\s*(\d{2,3})\s*[斤jin]/i;
const CATTY_SINGLE_RE = /(?:约|~)?(\d{2,3})\s*[斤jin]/i;

// Chinese standard garment size: 165/84A, 160/68A, 175/96B
const CN_GARMENT_RE = /\b(1[456]\d)\s*\/\s*(\d{2,3})[A-C]?\b/;

// Plain waist or shoe number: 28, 29, 30, 31, 32W, 38, 39, 40, 41, 42, 43, 44
const WAIST_RE = /\b([2-4]\d)\s*[Ww]?\b/;

/**
 * Extract a normalised size string from a raw model/SKU string.
 * Returns null if nothing can be determined.
 *
 * Priority:
 *   1. Catty weight range (most specific)
 *   2. Chinese garment size (165/84A → L)
 *   3. Standard letter size
 *   4. Plain numeric waist/shoe size
 */
export function extractSizeFromModel(model: string): string | null {
    if (!model?.trim()) return null;

    // ── 1. Catty weight range ────────────────────────────────────────────────
    const rangeMatch = CATTY_RANGE_RE.exec(model);
    if (rangeMatch) {
        const lo = parseFloat(rangeMatch[1]);
        const hi = parseFloat(rangeMatch[2]);
        const midKg = cattiesToKg((lo + hi) / 2);
        return kgToSize(midKg);
    }

    const singleMatch = CATTY_SINGLE_RE.exec(model);
    if (singleMatch) {
        const catties = parseFloat(singleMatch[1]);
        // Single catty value is often the lower bound of a range — add 5 as buffer
        const kg = cattiesToKg(catties + 5);
        return kgToSize(kg);
    }

    // ── 2. Chinese garment size (height/bust) → approximate letter size ──────
    // Standard mapping: bust (second number) → size
    const cnMatch = CN_GARMENT_RE.exec(model);
    if (cnMatch) {
        const bust = parseInt(cnMatch[2], 10);
        if (bust < 76) return 'XS';
        if (bust < 84) return 'S';
        if (bust < 92) return 'M';
        if (bust < 100) return 'L';
        if (bust < 108) return 'XL';
        return 'XXL';
    }

    // ── 3. Standard letter sizes ─────────────────────────────────────────────
    const lower = model.toLowerCase();
    for (const key of LETTER_SIZES) {
        // Use word-boundary regex to avoid matching 'L' inside 'XL', etc.
        const re = new RegExp(`(?<![a-z])${escapeRegex(key)}(?![a-z])`, 'i');
        if (re.test(lower)) {
            return SIZE_NORMALISE[key] ?? key.toUpperCase();
        }
    }

    // ── 4. Numeric waist / shoe size (28–44) ─────────────────────────────────
    const waistMatch = WAIST_RE.exec(model);
    if (waistMatch) {
        return waistMatch[1] + (model.toLowerCase().includes('w') ? 'W' : '');
    }

    return null;
}

function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
