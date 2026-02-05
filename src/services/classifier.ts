import type { OrderItem } from '../types';

export const classifyItems = async (
    items: OrderItem[],
    apiKey: string,
    onProgress: (progress: number) => void
): Promise<OrderItem[]> => {
    if (!apiKey || items.length === 0) return items;

    // 1. Identify unique product names to classify (use translated name if available, else original)
    // We Map 'name' -> List of Item IDs to update later
    const nameToItemsMap = new Map<string, number[]>();

    items.forEach((item, index) => {
        const name = item.productNameTranslated || item.productName;
        if (!name) return;

        if (!nameToItemsMap.has(name)) {
            nameToItemsMap.set(name, []);
        }
        nameToItemsMap.get(name)?.push(index);
    });

    const uniqueNames = Array.from(nameToItemsMap.keys());
    console.log("🤖 AI Classifying these names (showing first 5):", uniqueNames.slice(0, 5));
    const newItems = [...items];

    // Chunking to avoid hitting token limits (approx 50 items per chunk)
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < uniqueNames.length; i += chunkSize) {
        chunks.push(uniqueNames.slice(i, i + chunkSize));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
        try {
            const prompt = `
                You are an e-commerce data classifier. 
                Classify the following product items into high-level categories (e.g., Clothing, Footwear, Electronics, Home & Garden, Beauty, Kids, Automotive, Accessories, Pet Supplies, etc.) AND specific subcategories (e.g., T-Shirts, Dresses, Phone Cases, Kitchen Tools, etc.).
                
                IMPORTANT RULES:
                1. If an item appears to be a *pure* shipping fee, difference link (price adjustment), postage link, gift wrapping, or meaningless placeholder (e.g. "test"), classify it as "Noise".
                2. VALID PRODUCTS: "Special Offers", "Clearance", "Mystery Bags", "19.9 RMB each", or "Random Style" items ARE VALID products. Classify them by their actual content (e.g., "Clothing", "Tops"). Do NOT mark them as Noise.
                3. If an item is for pets (cats, dogs, etc.), classify it as "Pet Supplies", even if it is clothing! Do not classify it as "Kids" or "Clothing".
                4. Return ONLY a valid JSON object where keys are the product names provided and values are objects with "category" and "subcategory" fields.
                   Example: { "Product Name": { "category": "Clothing", "subcategory": "T-Shirt" } }
                5. Do not include markdown naming like \`\`\`json. Just the raw JSON.
                
                Items to classify:
                ${JSON.stringify(chunk)}
            `;

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
                    const classifications = JSON.parse(text);

                    // Apply classifications to items
                    Object.entries(classifications).forEach(([name, classification]: [string, any]) => {
                        const indices = nameToItemsMap.get(name);
                        if (indices) {
                            indices.forEach(idx => {
                                if (typeof classification === 'string') {
                                    // Fallback if AI returns string
                                    newItems[idx].category = classification;
                                } else {
                                    newItems[idx].category = classification.category;
                                    newItems[idx].subcategory = classification.subcategory;
                                }
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
        onProgress(Math.min(100, Math.round((processedCount / uniqueNames.length) * 100)));
    }

    return newItems;
};
