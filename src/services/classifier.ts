import type { OrderItem } from '../types';

const buildClothingPrompt = (chunk: string[]): string => {
    return `
You are a specialized CLOTHING & FASHION classifier for a retail POS system.
ALL items in this dataset are clothing/fashion products.

TASK: For each "Product Name [Style: Model]" string, extract:

1. **category** - Choose ONE:
   - "Tops" (T-shirts, shirts, blouses, sweaters, hoodies, tank tops, crop tops, tunics)
   - "Bottoms" (pants, jeans, shorts, skirts, leggings, trousers)
   - "Dresses" (all dress types including jumpsuits, rompers)
   - "Outerwear" (jackets, coats, blazers, vests, cardigans, windbreakers)
   - "Activewear" (sportswear, gym wear, yoga wear, athletic clothing, tracksuits)
   - "Underwear & Sleepwear" (bras, panties, boxers, pajamas, robes, nightgowns, lingerie)
   - "Swimwear" (bikinis, one-pieces, swim trunks, beach cover-ups, rash guards)
   - "Accessories" (scarves, belts, hats, gloves, socks, ties, bags, jewelry)
   - "Footwear" (shoes, boots, sandals, sneakers, slippers, heels)

2. **subcategory** - Be SPECIFIC (examples by category):
   
   Tops:
   - T-Shirt, Polo Shirt, Button-Up Shirt, Flannel Shirt, Blouse, Tunic
   - Sweater, Pullover, Hoodie, Sweatshirt, Cardigan (lightweight)
   - Tank Top, Crop Top, Camisole, Halter Top, Off-Shoulder Top
   - Henley, Long Sleeve Tee, Graphic Tee, Basic Tee
   
   Bottoms:
   - Jeans (Skinny, Straight, Bootcut, Wide Leg, Mom, Boyfriend)
   - Pants (Cargo, Dress, Chinos, Joggers, Track Pants)
   - Shorts (Denim, Athletic, Cargo, Bermuda)
   - Skirts (Mini, Midi, Maxi, A-Line, Pencil, Pleated)
   - Leggings, Tights, Jeggings
   
   Dresses:
   - Maxi Dress, Midi Dress, Mini Dress
   - Shirt Dress, Wrap Dress, A-Line Dress, Bodycon Dress
   - Slip Dress, T-Shirt Dress, Sweater Dress
   - Jumpsuit, Romper
   
   Outerwear:
   - Jacket (Bomber, Denim, Leather, Windbreaker, Varsity, Trucker)
   - Coat (Puffer, Down, Trench, Peacoat, Overcoat, Parka)
   - Blazer, Sport Coat
   - Vest (Puffer, Denim, Suit)
   - Cardigan (heavy-weight)
   
   Activewear:
   - Sports Bra, Athletic Top, Performance Tee
   - Athletic Shorts, Running Shorts, Gym Shorts
   - Yoga Pants, Athletic Leggings, Track Pants
   - Tracksuit, Jogging Set, Sweat Set
   
   Footwear:
   - Sneakers, Running Shoes, Athletic Shoes
   - Boots (Ankle, Knee-High, Combat, Chelsea)
   - Sandals, Slides, Flip Flops
   - Heels (Pumps, Stilettos, Wedges, Block Heels)
   - Flats, Loafers, Oxfords, Slip-Ons
   
   Accessories:
   - Bags (Backpack, Crossbody, Tote, Shoulder Bag, Clutch, Handbag)
   - Hats (Baseball Cap, Beanie, Bucket Hat, Fedora, Sun Hat)
   - Scarves, Bandana, Shawl
   - Belt, Suspenders
   - Socks, Stockings

3. **shortenedName** - 2-5 words including:
   - Gender (if clear from context)
   - Key visual descriptor (color, pattern, or distinctive feature)
   - Product type
   
   Good examples:
   - "Women's Black Hoodie" not "Black Hoodie Women's Large Cotton"
   - "Men's Blue Denim Jeans" not "Jeans Blue"
   - "Floral Maxi Dress" not "Women's Long Floral Summer Beach Dress"
   - "White Sneakers" not "Sneakers"

4. **color** - Extract the PRIMARY color or pattern:
   
   Solid colors: Black, White, Gray, Navy, Blue, Red, Pink, Green, Yellow, Brown, Beige, Tan, Cream, Purple, Orange, Maroon, Burgundy, Khaki, Olive, Mint, Lavender
   
   Patterns: Striped, Floral, Plaid, Checkered, Leopard, Animal Print, Camouflage, Polka Dot, Tie Dye, Abstract, Graphic
   
   Special cases:
   - "Multi-color" if 3+ colors with no dominant one
   - "Color Block" if distinct color sections
   - null if genuinely unclear

5. **size** - Standardize to ONE format:
   
   Letter sizes: XS, S, M, L, XL, XXL, XXXL, 4XL, 5XL
   
   Numeric (US Women's): 0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24
   
   Numeric (EU): 34, 36, 38, 40, 42, 44, 46, 48, 50, 52
   
   Kids: 2T, 3T, 4T, 5, 6, 7, 8, 10, 12, 14, 16
   
   Shoe sizes: "US 8", "EU 42", "UK 6" (keep region prefix)
   
   Special: "One Size", "Free Size", "Plus Size"
   
   IMPORTANT: Convert variations:
   - "large" → "L"
   - "extra large" → "XL"  
   - "medium" → "M"
   - "2xl" → "XXL"

6. **material** - Primary fabric (if mentioned in name OR style):
   
   Natural: Cotton, Wool, Cashmere, Silk, Linen, Leather, Suede
   
   Synthetic: Polyester, Nylon, Spandex, Acrylic, Rayon, Lycra
   
   Blends: "Cotton Blend", "Poly-Cotton", "Cotton-Spandex"
   
   Other: Denim, Fleece, Velvet, Corduroy, Knit, Jersey, Canvas, Satin, Chiffon
   
   null if not mentioned

7. **gender** - Target demographic:
   - "Men's" - men's/male items
   - "Women's" - women's/female items  
   - "Boys" - boys items
   - "Girls" - girls items
   - "Unisex" - explicitly unisex or gender-neutral
   - null - if genuinely unclear

CLASSIFICATION RULES:

1. **PARSE STYLE FIELD CAREFULLY**:
   The [Style: ...] contains critical info. Extract ALL available attributes.
   
   Examples:
   - "Hoodie [Style: Men Black XL]" → gender: "Men's", color: "Black", size: "XL"
   - "Dress [Style: Women Floral Red Medium Summer]" → gender: "Women's", color: "Floral", size: "M"
   - "Jeans [Style: Blue Denim 32 Slim Fit]" → color: "Blue", material: "Denim", size: "32"

2. **INFER GENDER FROM CONTEXT**:
   - Item type implies gender: "Bra", "Blouse" → Women's
   - Item type implies gender: "Tie", "Boxer Briefs" → Men's
   - Keywords: "Lady", "Ladies" → Women's
   - Keywords: "Men", "Man", "Male" → Men's
   - If both name and style lack gender clues → null

3. **CATEGORY PRIORITY** (when item could fit multiple):
   - If has hood/zip and casual → "Tops" (Hoodie/Sweatshirt)
   - If heavy/structured → "Outerwear" (Coat/Jacket)
   - If athletic/performance fabric → "Activewear"
   - Cardigan: lightweight = "Tops", heavy = "Outerwear"

4. **HANDLE AMBIGUOUS ITEMS**:
   - "Mystery Bag" / "Random Style" → Classify as best guess based on any clues
   - "Special Offer" / "Clearance" → Classify by actual product mentioned
   - Generic names → Use style field to determine specifics

5. **EXTRACT PATTERNS AS COLORS**:
   - "Striped Shirt" → color: "Striped" (not null)
   - "Leopard Print Dress" → color: "Leopard"
   - "Tie Dye Tee" → color: "Tie Dye"

6. **SUBCATEGORY SPECIFICITY**:
   ALWAYS choose the most specific subcategory:
   - ❌ "Shirt" → ✅ "Button-Up Shirt" or "T-Shirt" or "Polo Shirt"
   - ❌ "Jacket" → ✅ "Bomber Jacket" or "Denim Jacket"
   - ❌ "Pants" → ✅ "Jeans" or "Cargo Pants" or "Dress Pants"
   - ❌ "Dress" → ✅ "Maxi Dress" or "Midi Dress" or "Wrap Dress"

7. **SHORTENED NAME QUALITY**:
   - Include gender if known: "Women's" or "Men's"
   - Include ONE key descriptor: color OR pattern OR material
   - Keep it SHORT but DESCRIPTIVE
   - ❌ "Black Cotton Long Sleeve Casual Men's T-Shirt XL" 
   - ✅ "Men's Black T-Shirt"

OUTPUT FORMAT:
Return ONLY valid JSON. Keys must EXACTLY match input strings.

{
  "Product Name [Style: Info]": {
    "category": "Tops",
    "subcategory": "Hoodie",
    "shortenedName": "Men's Black Hoodie",
    "color": "Black",
    "size": "XL",
    "material": "Fleece",
    "gender": "Men's"
  }
}

DO NOT include markdown code blocks (no \`\`\`json). Return raw JSON only.

Items to classify:
${JSON.stringify(chunk)}
`;
};

export const classifyItems = async (
    items: OrderItem[],
    apiKey: string,
    onProgress: (progress: number) => void
): Promise<OrderItem[]> => {
    if (!apiKey || items.length === 0) return items;

    const infoToItemsMap = new Map<string, number[]>();

    items.forEach((item, index) => {
        const name = item.productNameTranslated || item.productName;
        const style = item.modelTranslated || item.model || 'No Style';
        if (!name) return;

        const key = `${name} [Style: ${style}]`;
        if (!infoToItemsMap.has(key)) {
            infoToItemsMap.set(key, []);
        }
        infoToItemsMap.get(key)?.push(index);
    });

    const uniqueKeys = Array.from(infoToItemsMap.keys());
    console.log(`🤖 Classifying ${uniqueKeys.length} unique clothing items`);

    const newItems = [...items];
    const chunkSize = 40;
    const chunks = [];

    for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
        chunks.push(uniqueKeys.slice(i, i + chunkSize));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
        try {
            const prompt = buildClothingPrompt(chunk);

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }]
                    })
                }
            );

            const result = await response.json();

            if (result.candidates?.[0]?.content?.parts?.[0]?.text) {
                let text = result.candidates[0].content.parts[0].text.trim();
                text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

                try {
                    const classifications = JSON.parse(text);

                    Object.entries(classifications).forEach(([descriptionKey, classification]: [string, any]) => {
                        const indices = infoToItemsMap.get(descriptionKey);
                        if (indices) {
                            indices.forEach(idx => {
                                newItems[idx].category = classification.category || 'Uncategorized';
                                newItems[idx].subcategory = classification.subcategory || '';
                                newItems[idx].productNameShortened = classification.shortenedName || '';
                                newItems[idx].attrColor = classification.color || '';
                                newItems[idx].attrSize = classification.size || '';
                                newItems[idx].attrMaterial = classification.material || '';
                                newItems[idx].attrGender = classification.gender || '';
                            });
                        }
                    });
                } catch (parseError) {
                    console.error("Failed to parse Gemini JSON", parseError, text);
                }
            }

        } catch (err) {
            console.error("Gemini API Error", err);
        }

        processedCount += chunk.length;
        onProgress(Math.min(100, Math.round((processedCount / uniqueKeys.length) * 100)));
    }

    return newItems;
};

// ============================================================================
// PASS 2: Attribute Extraction (Category-Specific)
// ============================================================================

const buildAttributePrompt = (category: string, items: { key: string; name: string; style: string }[]): string => {
    // Category-specific attribute guidance
    const categoryGuidance: Record<string, string> = {
        'Clothing': `Focus on: size (XS/S/M/L/XL/XXL or numeric), color, material (cotton, polyester, wool, etc.), gender (Men/Women/Unisex), age group (Adult/Kids/Baby).`,
        'Footwear': `Focus on: size (shoe size numbers), color, material (leather, canvas, synthetic), gender, age group.`,
        'Kids': `Focus on: size (age-based like 2-3Y, 4-5Y or S/M/L), color, material, age group (Baby 0-2, Toddler 2-4, Kids 4-12, Teen 12+).`,
        'Electronics': `Focus on: color, model/version, storage capacity, key specs. Size/gender/age usually N/A.`,
        'Beauty': `Focus on: color/shade, size/volume (ml, oz), skin type if mentioned. Gender if specified.`,
        'Home & Garden': `Focus on: size/dimensions, color, material (wood, metal, plastic, fabric).`,
        'Pet Supplies': `Focus on: size (XS/S/M/L/XL for pet sizing), color, material, pet type (Dog/Cat/Bird/Fish).`,
        'Jewelry': `Focus on: size (ring size, length), color/metal (gold, silver, rose gold), material.`,
        'Bags': `Focus on: size (S/M/L or dimensions), color, material (leather, canvas, nylon).`,
        'Sports': `Focus on: size, color, material, gender if applicable.`,
        'Accessories': `Focus on: size if applicable, color, material.`,
    };

    const guidance = categoryGuidance[category] || `Extract: size, color, material, gender, age group where applicable.`;

    const itemList = items.map(i => `"${i.key}"`).join(', ');

    return `
You are a product attribute extractor for a POS/inventory system.
Category context: ${category}

TASK: Extract structured attributes from each product description.

${guidance}

ATTRIBUTE RULES:
1. "size" - Clothing: XS/S/M/L/XL/XXL/2XL/3XL or numeric. Kids: age-based (2-3Y, 4-5Y). Shoes: numeric. If multiple sizes, pick the one mentioned. If none, use "".
2. "color" - Primary color only. If pattern (floral, striped), include it (e.g., "Blue Striped"). If none mentioned, use "".
3. "material" - Primary material. If none mentioned, use "".
4. "gender" - Men/Women/Unisex/Boys/Girls. If unclear, use "".
5. "ageGroup" - Baby (0-2), Toddler (2-4), Kids (4-12), Teen (12-18), Adult. If unclear, use "".
6. "brand" - If a brand name is clearly visible. Otherwise "".
7. "other" - Any other notable attribute not covered above (e.g., "Waterproof", "USB-C", "Rechargeable").

OUTPUT: Return ONLY valid JSON. Keys must EXACTLY match the input strings.

Example Input for Clothing: ["Cotton T-Shirt [Style: Men's Navy Blue XL]"]
Example Output:
{
  "Cotton T-Shirt [Style: Men's Navy Blue XL]": {
    "size": "XL",
    "color": "Navy Blue",
    "material": "Cotton",
    "gender": "Men",
    "ageGroup": "Adult",
    "brand": "",
    "other": ""
  }
}

DO NOT include markdown code blocks. Return only the JSON object.

Items to extract attributes from:
[${itemList}]
`;
};

export const extractAttributes = async (
    items: OrderItem[],
    apiKey: string,
    onProgress: (progress: number) => void
): Promise<OrderItem[]> => {
    if (!apiKey || items.length === 0) return items;

    // Group by category to use category-specific extraction
    const categoryGroups = new Map<string, number[]>();

    items.forEach((item, index) => {
        const category = item.category || 'Uncategorized';
        // Skip Noise items
        if (category === 'Noise') return;

        if (!categoryGroups.has(category)) {
            categoryGroups.set(category, []);
        }
        categoryGroups.get(category)?.push(index);
    });

    const newItems = [...items];
    const totalItems = Array.from(categoryGroups.values()).flat().length;
    let processedCount = 0;

    for (const [category, indices] of categoryGroups.entries()) {
        // Build unique keys for this category
        const keyToIndicesMap = new Map<string, number[]>();

        indices.forEach(idx => {
            const item = items[idx];
            const name = item.productNameTranslated || item.productName;
            const style = item.modelTranslated || item.model || 'No Style';
            const key = `${name} [Style: ${style}]`;

            if (!keyToIndicesMap.has(key)) {
                keyToIndicesMap.set(key, []);
            }
            keyToIndicesMap.get(key)?.push(idx);
        });

        const uniqueKeys = Array.from(keyToIndicesMap.keys());

        // Process in chunks
        const chunkSize = 50;
        for (let i = 0; i < uniqueKeys.length; i += chunkSize) {
            const chunkKeys = uniqueKeys.slice(i, i + chunkSize);
            const chunkItems = chunkKeys.map(key => {
                const idx = keyToIndicesMap.get(key)![0];
                return {
                    key,
                    name: items[idx].productNameTranslated || items[idx].productName,
                    style: items[idx].modelTranslated || items[idx].model || ''
                };
            });

            try {
                const prompt = buildAttributePrompt(category, chunkItems);

                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                });

                const result = await response.json();

                if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
                    let text = result.candidates[0].content.parts[0].text.trim();
                    // Strip markdown if present
                    if (text.startsWith('```json')) text = text.replace('```json', '').replace('```', '');
                    if (text.startsWith('```')) text = text.replace('```', '').replace('```', '');

                    try {
                        const extractions = JSON.parse(text);

                        // Apply extractions to items
                        Object.entries(extractions).forEach(([descKey, attrs]: [string, any]) => {
                            const itemIndices = keyToIndicesMap.get(descKey);
                            if (itemIndices) {
                                itemIndices.forEach(idx => {
                                    newItems[idx].attrSize = attrs.size || '';
                                    newItems[idx].attrColor = attrs.color || '';
                                    newItems[idx].attrMaterial = attrs.material || '';
                                    newItems[idx].attrGender = attrs.gender || '';
                                    newItems[idx].attrAgeGroup = attrs.ageGroup || '';
                                    newItems[idx].attrBrand = attrs.brand || '';
                                    newItems[idx].attrOther = attrs.other || '';
                                });
                            }
                        });

                    } catch (parseError) {
                        console.error("Failed to parse attribute extraction JSON", parseError, text);
                    }
                }

            } catch (err) {
                console.error("Gemini API Error (Attribute Extraction)", err);
            }

            processedCount += chunkKeys.length;
            onProgress(Math.min(100, Math.round((processedCount / totalItems) * 100)));
        }
    }

    return newItems;
};
