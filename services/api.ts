import { DataPoint, BinanceKline } from '../types';

const BASE_URL = 'https://api.binance.com/api/v3';

export const api = {
  /**
   * Fetch historical klines (candles) for a symbol
   */
  getHistory: async (symbol: string, limit: number = 1000): Promise<DataPoint[]> => {
    try {
      // Convert internal symbol to Binance format (e.g. BTC -> BTCUSDT)
      const pair = `${symbol.toUpperCase()}USDT`;
      // We use 1m interval for high granularity, but fetch more data if needed
      // For very long timeframes in a real app, we'd switch interval to 1h/1d, 
      // but here we want to see the "live" simulation smoothly, so we keep 1m/5m.
      const response = await fetch(`${BASE_URL}/klines?symbol=${pair}&interval=1m&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: BinanceKline[] = await response.json();

      return data.map((kline) => ({
        time: kline[0],
        price: parseFloat(kline[4]), // Close price
        isSimulation: false
      }));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      return [];
    }
  },

  /**
   * Fetch current price for a symbol
   */
  getPrice: async (symbol: string): Promise<number | null> => {
    try {
      const pair = `${symbol.toUpperCase()}USDT`;
      const response = await fetch(`${BASE_URL}/ticker/price?symbol=${pair}`);
      
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      return parseFloat(data.price);
    } catch (error) {
      console.error('Failed to fetch price:', error);
      return null;
    }
  }
};