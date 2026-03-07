import type { OrderItem } from '../types';

// Google Translate API limit is often characters or items per request. Safe batch.

export const translateText = async (text: string, apiKey: string, targetLang: string = 'en'): Promise<string> => {
    if (!text) return '';
    if (!apiKey) return text + ' [No Key]';

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: 'gpt-5.4',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate the given text into ${targetLang}. Return ONLY the translated text.`
                    },
                    { role: 'user', content: text }
                ],
                temperature: 0,
            }),
        });

        const result = await response.json();
        if (result.error) {
            console.error('Translation Error', result.error);
            return text;
        }

        return result.choices[0].message.content.trim();
    } catch (err) {
        console.error(err);
        return text;
    }
};

export const translateBatch = async (
    items: OrderItem[],
    apiKey: string,
    onProgress: (progress: number) => void
): Promise<OrderItem[]> => {
    const newItems = [...items];
    const uniqueStrings = new Set<string>();
    items.forEach(item => {
        if (item.productName) uniqueStrings.add(item.productName);
        if (item.model) uniqueStrings.add(item.model);
        if (item.logisticsCompany) uniqueStrings.add(item.logisticsCompany);
        if (item.status) uniqueStrings.add(item.status);
    });

    const stringMap: Record<string, string> = {};
    const uniqueArray = Array.from(uniqueStrings);
    const CHUNK_SIZE = 20;
    const chunks = [];
    for (let i = 0; i < uniqueArray.length; i += CHUNK_SIZE) {
        chunks.push(uniqueArray.slice(i, i + CHUNK_SIZE));
    }

    let processedCount = 0;

    for (const chunk of chunks) {
        if (!apiKey) {
            chunk.forEach(str => { stringMap[str] = `[MOCK] ${str}`; });
        } else {
            try {
                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        model: 'gpt-5.4',
                        messages: [
                            {
                                role: 'system',
                                content: 'Translate the following list of strings to English. Provide the results as a JSON array of strings in the exact same order.'
                            },
                            { role: 'user', content: JSON.stringify(chunk) }
                        ],
                        response_format: { type: 'json_object' },
                        temperature: 0,
                    })
                });
                const res = await response.json();
                if (res.choices && res.choices[0]) {
                    const content = res.choices[0].message.content;
                    // Try to parse as JSON, handle both array and object wrapper
                    try {
                        let translated = JSON.parse(content);
                        if (translated.translations) translated = translated.translations;
                        if (Array.isArray(translated)) {
                            translated.forEach((t: string, index: number) => {
                                stringMap[chunk[index]] = t;
                            });
                        } else if (typeof translated === 'object' && !Array.isArray(translated)) {
                            // Sometimes LLMs return { "1": "str1", ... } or similar if we aren't careful
                            const vals = Object.values(translated) as string[];
                            vals.forEach((t, index) => {
                                if (chunk[index]) stringMap[chunk[index]] = t;
                            });
                        }
                    } catch (e) {
                        console.error('Failed to parse translation JSON', e);
                    }
                }
            } catch (e) {
                console.error('Batch translate error', e);
            }
        }
        processedCount += chunk.length;
        onProgress(Math.min(100, Math.round((processedCount / uniqueArray.length) * 100)));
    }

    return newItems.map(item => ({
        ...item,
        shopNameTranslated: item.shopName,
        productNameTranslated: stringMap[item.productName] || item.productName,
        modelTranslated: stringMap[item.model] || item.model,
        logisticsCompanyTranslated: stringMap[item.logisticsCompany] || item.logisticsCompany,
        statusTranslated: stringMap[item.status] || item.status,
    }));
};
