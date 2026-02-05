import type { OrderItem } from '../types';

// Google Translate API limit is often characters or items per request. Safe batch.

export const translateText = async (text: string, apiKey: string, targetLang: string = 'en'): Promise<string> => {
    if (!text) return '';
    if (!apiKey) return text + ' [No Key]';

    const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                q: text,
                target: targetLang,
                format: 'text'
            }),
        });

        const result = await response.json();
        if (result.error) {
            console.error('Translation Error', result.error);
            return text; // Fallback
        }

        return result.data.translations[0].translatedText;
    } catch (err) {
        console.error(err);
        return text;
    }
};

// Batch translation helper could be optimized to send multiple strings in one 'q' array
export const translateBatch = async (
    items: OrderItem[],
    apiKey: string,
    onProgress: (progress: number) => void
): Promise<OrderItem[]> => {
    const newItems = [...items];

    // Identify unique strings to translate to save quota
    // In a real app, we would cache these.
    const uniqueStrings = new Set<string>();
    items.forEach(item => {
        if (item.productName) uniqueStrings.add(item.productName);
        if (item.model) uniqueStrings.add(item.model);
        if (item.logisticsCompany) uniqueStrings.add(item.logisticsCompany);
        if (item.status) uniqueStrings.add(item.status);
    });

    const stringMap: Record<string, string> = {};

    // Chunk the unique strings for batch processing
    const uniqueArray = Array.from(uniqueStrings);
    const chunks = [];
    for (let i = 0; i < uniqueArray.length; i += 50) { // 50 items per batch request
        chunks.push(uniqueArray.slice(i, i + 50));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
        if (!apiKey) {
            // Mock translation if no key
            chunk.forEach(str => { stringMap[str] = `[MOCK] ${str}`; });
        } else {
            // Real API Call
            try {
                const url = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        q: chunk,
                        target: 'en',
                        format: 'text'
                    })
                });
                const res = await response.json();
                if (res.data && res.data.translations) {
                    res.data.translations.forEach((t: any, index: number) => {
                        stringMap[chunk[index]] = t.translatedText;
                    });
                }
            } catch (e) {
                console.error('Batch translate error', e);
            }
        }
        processedCount += chunk.length;
        onProgress(Math.min(100, Math.round((processedCount / uniqueArray.length) * 100)));
    }

    // Map back to items
    return newItems.map(item => ({
        ...item,
        shopNameTranslated: item.shopName,
        productNameTranslated: stringMap[item.productName] || item.productName,
        modelTranslated: stringMap[item.model] || item.model,
        logisticsCompanyTranslated: stringMap[item.logisticsCompany] || item.logisticsCompany,
        statusTranslated: stringMap[item.status] || item.status,
    }));
};
