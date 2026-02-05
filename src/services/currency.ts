export const getExchangeRate = async (): Promise<number> => {
    try {
        // Option B: exchangerate.host
        // Note: Some versions of this API may require an API key now.
        // If this fails, we fallback to a standard rate.
        const response = await fetch('https://api.exchangerate.host/latest?base=CNY&symbols=USD');
        const data = await response.json();

        if (data && data.rates && data.rates.USD) {
            return data.rates.USD;
        }

        // Alternative free API fallback (Frankfurter)
        const altResponse = await fetch('https://api.frankfurter.app/latest?from=CNY&to=USD');
        const altData = await altResponse.json();
        if (altData && altData.rates && altData.rates.USD) {
            return altData.rates.USD;
        }

        return 0.14; // Final fallback
    } catch (error) {
        console.error('Failed to fetch exchange rate:', error);
        return 0.14; // Default fallback rate (~7.14 CNY/USD)
    }
};

export const formatUSD = (cnyAmount: number, rate: number): string => {
    return (cnyAmount * rate).toLocaleString('en-US', {
        style: 'currency',
        currency: 'USD',
    });
};
