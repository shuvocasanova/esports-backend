const axios = require('axios');

const priceCache = {};
const CACHE_TTL = 30000; // 30 seconds

/**
 * Fetches the current price of a coin in USD from CoinLore
 */
const fetchCoinPrice = async (coinId) => {
    if (!coinId || coinId == 518) return 1.0;

    const cached = priceCache[coinId];
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        return cached.price;
    }

    try {
        const response = await axios.get(`https://api.coinlore.net/api/ticker/?id=${coinId}`, { timeout: 3000 });
        if (response.data && response.data.length > 0) {
            const price = parseFloat(response.data[0].price_usd) || 1.0;
            priceCache[coinId] = { price, timestamp: Date.now() };
            return price;
        }
    } catch (error) {
        console.error(`Error fetching price for coin ${coinId}:`, error.message);
    }
    return cached ? cached.price : 1.0; // Default fallback
};

/**
 * Fetches the current price of USDT in USD
 */
const getUSDTPrice = async () => {
    return 1.0;
};

/**
 * Converts a specific coin amount to its USDT equivalent
 * Logic: (balance * coin_price) / usdt_price
 */
const convertCoinToUSDT = async (amount, coinId) => {
    if (!coinId || coinId == 518) return parseFloat(amount); // Already USDT
    
    const coinPrice = await fetchCoinPrice(coinId);
    const usdtPrice = await getUSDTPrice();
    const usdtEquivalent = (parseFloat(amount) * coinPrice) / usdtPrice;
    return usdtEquivalent;
};

/**
 * Converts a USDT amount back to a specific coin amount
 * Logic: (usdt_amount * usdt_price) / coin_price
 */
const convertUSDTToCoin = async (usdtAmount, coinId) => {
    if (!coinId || coinId == 518) return parseFloat(usdtAmount); // Already USDT
    
    const coinPrice = await fetchCoinPrice(coinId);
    const usdtPrice = await getUSDTPrice();
    const coinAmount = (parseFloat(usdtAmount) * usdtPrice) / (coinPrice || 1.0);
    return coinAmount;
};

module.exports = {
    fetchCoinPrice,
    convertCoinToUSDT,
    convertUSDTToCoin
};
