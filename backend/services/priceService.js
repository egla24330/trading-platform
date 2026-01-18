// services/priceService.js
import MarketPrice from '../models/MarketPrice.js';
import axios from 'axios';

export const fetchMarketPrices = async () => {
  try {
    // Fetch from Binance API
    const [btcResponse, ethResponse] = await Promise.all([
      axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
      axios.get('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT')
    ]);

    const btcData = btcResponse.data;
    const ethData = ethResponse.data;

    // Save BTC price
    await MarketPrice.create({
      symbol: 'BTCUSDT',
      price: parseFloat(btcData.lastPrice),
      change24h: parseFloat(btcData.priceChangePercent),
      high24h: parseFloat(btcData.highPrice),
      low24h: parseFloat(btcData.lowPrice),
      volume24h: parseFloat(btcData.volume),
      source: 'binance'
    });

    // Save ETH price
    await MarketPrice.create({
      symbol: 'ETHUSDT',
      price: parseFloat(ethData.lastPrice),
      change24h: parseFloat(ethData.priceChangePercent),
      high24h: parseFloat(ethData.highPrice),
      low24h: parseFloat(ethData.lowPrice),
      volume24h: parseFloat(ethData.volume),
      source: 'binance'
    });

    console.log('Market prices updated');
  } catch (error) {
    console.error('Error fetching market prices:', error.message);
  }
};

export const startPricePolling = () => {
  // Update prices every 30 seconds
  setInterval(fetchMarketPrices, 30000);
  
  // Initial fetch
  fetchMarketPrices();
};