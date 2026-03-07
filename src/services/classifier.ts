import type { OrderItem } from '../types';

export type ClothingProduct = {
    fit?: string;        // Slim, Relaxed, Oversized, Regular
    style?: string;      // Vintage, Casual, Minimal, Street
    item: string;        // Jeans, T-Shirt, Jacket, Shirt, Shorts
};

// ─── Prompt builders ──────────────────────────────────────────────────────────

export function buildClothingPrompt(product: ClothingProduct): string {
    return `
Generate a clothing product name.

Rules:
- Use ONLY 3–4 words.
- Structure: Fit + Style + Item.
- Keep it clean and brandable.
- No extra keywords.
- No gender, no price, no SEO stuffing.
- No emojis.

Product Info:
- Fit: ${product.fit ?? ""}
- Style: ${product.style ?? ""}
- Item: ${product.item}

Return ONLY the product name.
`;
}


/**
 * Internal batch-classification prompt used by classifyItems().
 */
function buildClothingClassifyPrompt(
    chunk: Array<{ id: string; productName: string; model: string }>
): string {
    return `
You are an expert e-commerce product classifier specialising in fashion and clothing.

## Task
Classify each product and return a JSON array under a "results" key. One object per product, same order as input.

## Output contract (strict JSON — no markdown fences)
{
  "results": [
    {
      "id": "<same id as input>",
      "category": "<see categories below>",
      "subcategory": "<see subcategories below>",
      "productNameShortened": "<concise English name, max 6 words>"
    }
  ]
}

## Field rules

### category (required)
Choose exactly one:
- "Tops"          — shirts, blouses, tees, sweatshirts, hoodies, jackets, coats
- "Bottoms"       — trousers, jeans, shorts, skirts, leggings
- "Dresses"       — dresses, jumpsuits, rompers
- "Footwear"      — shoes, boots, sandals, sneakers, slippers
- "Accessories"   — bags, belts, hats, scarves, socks, jewellery, wallets
- "Sportswear"    — athletic wear, gym wear, yoga wear
- "Underwear"     — underwear, lingerie, bras, boxers
- "Outerwear"     — heavy coats, parkas, puffer jackets, raincoats
- "Other"         — anything that doesn't fit above

### subcategory (required)
A specific type within the category (e.g. "Hoodie", "Slim-fit Jeans", "Ankle Boots").
Be concise and specific. Max 3 words.

### productNameShortened (required)
- Translate to English if needed
- Remove noise: colour, size, brand, shop name, punctuation clutter
- Keep: garment type + key style word(s)
- Max 6 words
- Title Case

## Input
${JSON.stringify(chunk, null, 2)}
`.trim();
}

/**
 * Build the attribute-extraction prompt used by extractAttributes().
 */
function buildAttributePrompt(
    chunk: Array<{ id: string; productName: string; model: string; category: string }>
): string {
    return `
You are an expert fashion product analyst.

## Task
Extract product attributes from each item and return a JSON array under an "attributes" key.
One object per product, same order as input.

## Output contract (strict JSON — no markdown fences)
{
  "attributes": [
    {
      "id": "<same id as input>",
      "attrSize": "<normalised size or null>",
      "attrColor": "<English colour name or null>",
      "attrMaterial": "<material or null>",
      "attrGender": "<Men | Women | Unisex | Boys | Girls | null>",
      "attrAgeGroup": "<Adult | Kids | Baby | null>",
      "attrBrand": "<brand name or null>",
      "attrOther": "<any other relevant attribute or null>"
    }
  ]
}

## Field rules

### attrSize
- Normalise: S, M, L, XL, XXL, 3XL, 4XL, 5XL
- Asian free sizes: "F", "Free", "Freesize", "One Size" → "Free"
- Numeric sizes (shoe/waist): keep as-is (e.g. "42", "32W")
- If absent: null

### attrColor
- Translate to English (e.g. "黑色" → "Black", "ネイビー" → "Navy")
- Use common colour names: Black, White, Navy, Red, Blue, Green, Gray, Pink, Purple, Brown, Beige, Orange, Yellow, Khaki, Teal, Maroon, Burgundy, Cream, Ivory, Olive, etc.
- For patterns: Striped, Floral, Plaid, Camouflage, Leopard, Polka Dot, Tie Dye, etc.
- If multiple colours: "Multi-color"
- If absent: null

### attrMaterial
- Common values: Cotton, Polyester, Linen, Wool, Silk, Denim, Leather, Fleece, Nylon, Spandex, Cashmere, Velvet, Chiffon, Rayon
- Blends: "Cotton/Polyester" etc.
- If absent: null

### attrGender
- "Men" | "Women" | "Unisex" | "Boys" | "Girls" | null

### attrAgeGroup
- "Adult" | "Kids" | "Baby" | null
- Default to "Adult" unless product explicitly targets children

### attrBrand
- Only fill if a real brand name is clearly stated
- null if no brand or unclear

### attrOther
- Any other relevant attribute (e.g. "Waterproof", "Reversible", "Vintage", "Oversized")
- null if nothing notable

## Rules
- Prefer null over empty string ""
- Do NOT invent information not present in the product name or model
- All text output in English

## Input
${JSON.stringify(chunk, null, 2)}
`.trim();
}

// ─── Helper ───────────────────────────────────────────────────────────────────

const CHUNK_SIZE = 20;

function chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}

async function callOpenAI(apiKey: string, prompt: string): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'gpt-5-mini',
            messages: [
                { role: 'system', content: 'You are a helpful assistant that returns only valid JSON.' },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0,
        }),
    });

    const result = await response.json();
    if (result.error) {
        throw new Error(result.error.message);
    }
    return result.choices[0].message.content;
}

function parseJsonResponse<T>(raw: string): T {
    // Strip markdown code fences if present
    const cleaned = raw
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
    return JSON.parse(cleaned) as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Pass 1 — Classify products into categories and shorten names.
 * Operates in chunks of 20, calling OpenAI in parallel per chunk.
 */
export async function classifyItems(
    items: OrderItem[],
    apiKey: string,
    onProgress: (percent: number) => void
): Promise<OrderItem[]> {
    if (!items.length) return items;

    const result = [...items];
    const chunks = chunkArray(items, CHUNK_SIZE);
    let processed = 0;

    for (const chunk of chunks) {
        const input = chunk.map(item => ({
            id: item.id,
            productName: item.productNameTranslated || item.productName,
            model: item.modelTranslated || item.model,
        }));

        try {
            const prompt = buildClothingClassifyPrompt(input);
            const raw = await callOpenAI(apiKey, prompt);
            const parsed = parseJsonResponse<{
                results: Array<{
                    id: string;
                    category: string;
                    subcategory: string;
                    productNameShortened: string;
                }>;
            }>(raw);

            for (const classified of parsed.results) {
                const idx = result.findIndex(r => r.id === classified.id);
                if (idx !== -1) {
                    result[idx] = {
                        ...result[idx],
                        category: classified.category,
                        subcategory: classified.subcategory,
                        productNameShortened: classified.productNameShortened,
                    };
                }
            }
        } catch (err) {
            console.error('[classifyItems] chunk failed:', err);
        }

        processed += chunk.length;
        onProgress(Math.round((processed / items.length) * 100));
    }

    return result;
}

/**
 * Pass 2 — Extract detailed attributes (size, colour, material, gender, etc.).
 * Runs after classifyItems so category context is available.
 */
export async function extractAttributes(
    items: OrderItem[],
    apiKey: string,
    onProgress: (percent: number) => void
): Promise<OrderItem[]> {
    if (!items.length) return items;

    const result = [...items];
    const chunks = chunkArray(items, CHUNK_SIZE);
    let processed = 0;

    for (const chunk of chunks) {
        const input = chunk.map(item => ({
            id: item.id,
            productName: item.productNameTranslated || item.productName,
            model: item.modelTranslated || item.model,
            category: item.category || 'Other',
        }));

        try {
            const prompt = buildAttributePrompt(input);
            const raw = await callOpenAI(apiKey, prompt);
            const parsed = parseJsonResponse<{
                attributes: Array<{
                    id: string;
                    attrSize: string | null;
                    attrColor: string | null;
                    attrMaterial: string | null;
                    attrGender: string | null;
                    attrAgeGroup: string | null;
                    attrBrand: string | null;
                    attrOther: string | null;
                }>;
            }>(raw);

            for (const attrs of parsed.attributes) {
                const idx = result.findIndex(r => r.id === attrs.id);
                if (idx !== -1) {
                    result[idx] = {
                        ...result[idx],
                        attrSize: attrs.attrSize ?? result[idx].attrSize,
                        attrColor: attrs.attrColor ?? result[idx].attrColor,
                        attrMaterial: attrs.attrMaterial ?? undefined,
                        attrGender: attrs.attrGender ?? undefined,
                        attrAgeGroup: attrs.attrAgeGroup ?? undefined,
                        attrBrand: attrs.attrBrand ?? undefined,
                        attrOther: attrs.attrOther ?? undefined,
                    };
                }
            }
        } catch (err) {
            console.error('[extractAttributes] chunk failed:', err);
        }

        processed += chunk.length;
        onProgress(Math.round((processed / items.length) * 100));
    }

    return result;
}
