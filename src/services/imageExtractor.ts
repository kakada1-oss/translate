import type { OrderItem } from '../types';

// When empty, uses Vite proxy (routes to localhost:3000 via vite.config.ts)
const EXTRACTOR_BASE_URL = import.meta.env.VITE_TAOBAO_EXTRACTOR_URL || '';

/**
 * Clean Taobao image URL to get high-res version
 * Removes resizing suffixes like _q50.jpg_.webp
 */
function cleanTaobaoImageUrl(url: string): string {
    if (!url) return '';
    // Remove protocol-relative prefix
    let cleaned = url.startsWith('//') ? 'https:' + url : url;
    // Remove Taobao resizing suffixes
    cleaned = cleaned.replace(/(\.(?:jpg|jpeg|png|webp|gif|bmp))_.*$/i, '$1');
    return cleaned;
}

/**
 * Extract main product image from HTML
 * Tries multiple strategies to find the best image
 * Uses Chinese product name to help verify correct image
 */
function extractImageFromHtml(html: string, _baseUrl: string, chineseProductName?: string): string | null {
    console.log(`Extracting image from HTML (${html.length} chars)`);
    if (chineseProductName) {
        console.log(`Looking for product: ${chineseProductName.substring(0, 50)}...`);
    }
    
    // Extract page title to verify we're on the right product page
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '';
    console.log(`Page title: ${pageTitle.substring(0, 80)}`);
    
    // Strategy 1: Look for Hub.config data which contains structured product info
    // This is the most reliable source for Taobao/Tmall product images
    const hubConfigMatch = html.match(/window\._CONFIG\s*=\s*(\{[^;]+\});/s) || 
                           html.match(/var\s+_CONFIG\s*=\s*(\{[^;]+\});/s) ||
                           html.match(/Hub\.config\s*:\s*(\{[^}]+\})/s);
    
    if (hubConfigMatch) {
        try {
            const config = JSON.parse(hubConfigMatch[1]);
            console.log('Found _CONFIG data');
            // Look for image data in config
            if (config?.data?.item?.images) {
                const images = config.data.item.images;
                console.log(`Found ${images.length} images in _CONFIG`);
                if (images.length > 0) {
                    return images[0];
                }
            }
        } catch (e) {
            // JSON parse failed, continue
        }
    }
    
    // Strategy 2: Look for g_config which contains item info
    const gConfigMatch = html.match(/var\s+g_config\s*=\s*(\{[^;]+\});/s);
    if (gConfigMatch) {
        try {
            const config = JSON.parse(gConfigMatch[1]);
            console.log('Found g_config data');
            if (config?.id?.itemId) {
                console.log(`Item ID: ${config.id.itemId}`);
            }
        } catch (e) {
            // Continue
        }
    }
    
    // Strategy 3: Look for gallery data in JSON format
    // This is where Taobao stores the main product gallery images
    const galleryDataMatch = html.match(/var\s+galleryData\s*=\s*(\{[\s\S]*?\});/s) ||
                             html.match(/"galleryData":\s*(\{[\s\S]*?\})/s);
    
    if (galleryDataMatch) {
        try {
            const galleryData = JSON.parse(galleryDataMatch[1]);
            console.log('Found galleryData');
            if (galleryData?.gallery?.length > 0) {
                const firstImage = galleryData.gallery[0];
                const imageUrl = firstImage.url || firstImage.bigUrl || firstImage.smallUrl;
                if (imageUrl) {
                    console.log(`Found gallery image: ${imageUrl.substring(0, 60)}...`);
                    return imageUrl;
                }
            }
        } catch (e) {
            console.log('Failed to parse galleryData');
        }
    }
    
    // Strategy 4: Look for picGallery element - this is the main product image gallery
    const picGalleryMatch = html.match(/id=["']picGalleryEle["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
                        html.match(/class=["']picGallery["'][^>]*>[\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    
    if (picGalleryMatch) {
        console.log(`Found picGallery image: ${picGalleryMatch[1].substring(0, 60)}...`);
        return picGalleryMatch[1];
    }
    
    // Strategy 5: Look for J_UlThumb - the thumbnail list which contains main images
    const thumbMatch = html.match(/id=["']J_UlThumb["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i) ||
                       html.match(/class=["']tb-thumb["'][\s\S]*?<img[^>]+src=["']([^"']+)["']/i);
    
    if (thumbMatch) {
        console.log(`Found thumbnail gallery image: ${thumbMatch[1].substring(0, 60)}...`);
        return thumbMatch[1];
    }
    
    // Strategy 6: Look for main product image by data-spm or other identifiers
    const mainImgMatch = html.match(/data-spm=["']mainImage["'][^>]*src=["']([^"']+)["']/i) ||
                        html.match(/class=["']main-image["'][^>]*src=["']([^"']+)["']/i) ||
                        html.match(/id=["']main-image["'][^>]*src=["']([^"']+)["']/i);
    
    if (mainImgMatch) {
        console.log(`Found main image: ${mainImgMatch[1].substring(0, 60)}...`);
        return mainImgMatch[1];
    }
    
    // Strategy 7: Look for all product images with specific patterns
    // Taobao product images typically have patterns like:
    // - imgextra/i4/123456789/O1CN01... 
    // - upload/i4/123456789/O1CN01...
    const productImgRegex = /https?:\/\/[^"'\s]*alicdn\.com[^"'\s]*(?:imgextra|upload)\/i\d+\/\d+\/O1CN01[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi;
    const productImages = Array.from(html.matchAll(productImgRegex))
        .map(m => m[0])
        .filter((url, index, self) => self.indexOf(url) === index); // deduplicate
    
    if (productImages.length > 0) {
        console.log(`Found ${productImages.length} product images with O1CN pattern`);
        return productImages[0];
    }
    
    // Strategy 8: Look for any alicdn imgextra image (broader match)
    const imgextraMatch = html.match(/https?:\/\/[^"'\s]*alicdn\.com[^"'\s]*imgextra[^"'\s]*\.(?:jpg|jpeg|png|webp)/i);
    if (imgextraMatch) {
        console.log(`Found imgextra image: ${imgextraMatch[0].substring(0, 60)}...`);
        return imgextraMatch[0];
    }
    
    // Strategy 9: Last resort - any alicdn image that's not an icon/logo
    const allImgRegex = /<img[^>]+(?:data-src|src|data-original)=["'](https?:\/\/[^"']*alicdn\.com[^"']*\.(?:jpg|jpeg|png|webp))["'][^>]*>/gi;
    const allMatches = Array.from(html.matchAll(allImgRegex));
    
    const filteredImages = allMatches
        .map(m => m[1])
        .filter(url => {
            const lower = url.toLowerCase();
            return (
                !lower.includes('icon') &&
                !lower.includes('logo') &&
                !lower.includes('avatar') &&
                !lower.includes('loading') &&
                !lower.includes('banner') &&
                !lower.includes('sprite') &&
                url.length > 30 // Real product images have long URLs
            );
        });
    
    if (filteredImages.length > 0) {
        console.log(`Found ${filteredImages.length} potential product images`);
        return filteredImages[0];
    }
    
    console.warn('No images found in HTML');
    return null;
}

/**
 * Extract main product image from Taobao/Tmall URL
 * Uses the taobao-extractor backend with Playwright for better results
 * @param productUrl - The Taobao/Tmall product URL
 * @param chineseProductName - Optional Chinese product name to help verify correct image
 */
export async function extractImageUrl(productUrl: string, chineseProductName?: string): Promise<string | null> {
    if (!productUrl || (!productUrl.includes('taobao.com') && !productUrl.includes('tmall.com') && !productUrl.includes('1688.com'))) {
        console.log(`Skipping non-Taobao URL: ${productUrl}`);
        return null;
    }

    console.log(`Extracting image for: ${productUrl}`);
    if (chineseProductName) {
        console.log(`Product name: ${chineseProductName}`);
    }
    console.log(`Using extractor at: ${EXTRACTOR_BASE_URL}`);

    try {
        // Use brave-html method - gets raw HTML from Brave browser
        // then parse images from the HTML
        console.log('Trying brave-html method (requires Brave on port 9222)...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for browser
        
        const response = await fetch(`${EXTRACTOR_BASE_URL}/api/brave-html`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ url: productUrl }),
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit'
        });
        clearTimeout(timeoutId);

        console.log(`Response status: ${response.status}`);

        if (!response.ok) {
            console.warn(`Fetch method failed with status ${response.status}`);
            return null;
        }

        const data = await response.json();
        
        // Check if we got an error response
        if (data.error) {
            console.error('Extractor returned error:', data.error, data.message);
            return null;
        }
        
        // Extract images from the HTML
        const html = data.html || '';
        console.log(`Got HTML (${html.length} chars), extracting images...`);
        
        // Pass Chinese product name to help verify correct image
        const imageUrl = extractImageFromHtml(html, productUrl, chineseProductName);
        
        if (imageUrl) {
            const cleaned = cleanTaobaoImageUrl(imageUrl);
            console.log(`Found image: ${cleaned}`);
            return cleaned;
        }
        
        console.warn(`No images found for ${productUrl}`);
        return null;
    } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
            console.error('Image extraction timed out after 120 seconds');
        } else {
            console.error('Image extraction error:', err);
        }
        return null;
    }
}

/**
 * Extract images for multiple items one by one
 * Updates progress as it goes
 */
export async function extractImagesForItems(
    items: OrderItem[],
    onProgress: (percent: number) => void
): Promise<OrderItem[]> {
    if (!items.length) return items;

    const result = [...items];
    let processed = 0;
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;

    // Filter only items with valid Taobao/Tmall links and no existing image
    const itemsToProcess = result.filter((item) => {
        const hasValidLink = item.productLink && (
            item.productLink.includes('taobao.com') || 
            item.productLink.includes('tmall.com') ||
            item.productLink.includes('1688.com')
        );
        const needsImage = !item.imgUrl;
        if (!hasValidLink || !needsImage) skipCount++;
        return hasValidLink && needsImage;
    });

    console.log(`Starting image extraction: ${itemsToProcess.length} items to process, ${skipCount} skipped`);

    for (let i = 0; i < itemsToProcess.length; i++) {
        const item = itemsToProcess[i];
        const originalIndex = result.findIndex(r => r.id === item.id);
        
        console.log(`[${i + 1}/${itemsToProcess.length}] Processing: ${item.productLink}`);
        console.log(`Product (Chinese): ${item.productName?.substring(0, 50)}...`);
        
        try {
            // Pass the Chinese product name to help verify correct image extraction
            const imageUrl = await extractImageUrl(item.productLink!, item.productName);
            if (imageUrl && originalIndex !== -1) {
                result[originalIndex] = { ...item, imgUrl: imageUrl };
                successCount++;
                console.log(`✓ Success: ${imageUrl.substring(0, 60)}...`);
            } else {
                failCount++;
                console.warn(`✗ No image found for item ${item.id}`);
            }
        } catch (err) {
            failCount++;
            console.warn(`✗ Failed to extract image for item ${item.id}:`, err);
        }
        
        // Small delay between requests
        if (i < itemsToProcess.length - 1) {
            await new Promise(r => setTimeout(r, 1000));
        }
        
        processed++;
        onProgress(Math.round((processed / itemsToProcess.length) * 100));
    }

    console.log(`Image extraction complete: ${successCount} success, ${failCount} failed, ${skipCount} skipped`);

    return result;
}

/**
 * Test function to check if taobao-extractor is reachable
 * Call this from browser console to debug: testExtractorConnection()
 */
export async function testExtractorConnection(): Promise<boolean> {
    console.log('Testing connection to taobao-extractor...');
    console.log(`URL: ${EXTRACTOR_BASE_URL}`);
    
    try {
        const response = await fetch(`${EXTRACTOR_BASE_URL}/api/extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: 'https://item.taobao.com/item.htm?id=902283992128', method: 'fetch' })
        });
        
        console.log(`Connection test status: ${response.status}`);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Connection test response:', data);
            return true;
        } else {
            console.error(`Connection failed with status ${response.status}`);
            return false;
        }
    } catch (err) {
        console.error('Connection test error:', err);
        return false;
    }
}
