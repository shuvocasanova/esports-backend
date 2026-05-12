const axios = require('axios');

/**
 * Fetches the current price of a coin in USD from CoinLore
 */
const fetchCoinPrice = async (coinId) => {
    try {
        const response = await axios.get(`https://api.coinlore.net/api/ticker/?id=${coinId}`);
        if (response.data && response.data.length > 0) {
            return parseFloat(response.data[0].price_usd);
        }
    } catch (error) {
        console.error(`Error fetching price for coin ${coinId}:`, error.message);
    }
    return 1.0; // Default fallback
};

/**
 * Fetches the current price of USDT in USD
 */
const getUSDTPrice = async () => {
    return await fetchCoinPrice(518);
};

/**
 * Converts a specific coin amount to its USDT equivalent
 * Logic: (balance * coin_price) / usdt_price
 */
const convertCoinToUSDT = async (amount, coinId) => {
    const coinPrice = await fetchCoinPrice(coinId);
    const usdtPrice = await getUSDTPrice();
    
    if (coinId == 518) return parseFloat(amount); // Already USDT
    
    const usdtEquivalent = (parseFloat(amount) * coinPrice) / usdtPrice;
    return usdtEquivalent;
};

/**
 * Converts a USDT amount back to a specific coin amount
 * Logic: (usdt_amount * usdt_price) / coin_price
 */
const convertUSDTToCoin = async (usdtAmount, coinId) => {
    const coinPrice = await fetchCoinPrice(coinId);
    const usdtPrice = await getUSDTPrice();
    
    if (coinId == 518) return parseFloat(usdtAmount); // Already USDT
    
    const coinAmount = (parseFloat(usdtAmount) * usdtPrice) / coinPrice;
    return coinAmount;
};

module.exports = {
    fetchCoinPrice,
    convertCoinToUSDT,
    convertUSDTToCoin
};
