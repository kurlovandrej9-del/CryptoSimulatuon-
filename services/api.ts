import { DataPoint, BinanceKline } from '../types';
import { supabase } from './supabaseClient';

const BASE_URLS = [
  'https://data-api.binance.vision/api/v3', // Try public vision API first (often better CORS)
  'https://api.binance.com/api/v3'
];

/**
 * Helper to fetch data with failover support (Primary -> Secondary -> Proxy)
 */
async function fetchWithFailover(endpoint: string, queryString: string): Promise<any> {
    const targets = [
        ...BASE_URLS.map(base => `${base}${endpoint}?${queryString}`),
        `https://corsproxy.io/?${encodeURIComponent(`https://api.binance.com/api/v3${endpoint}?${queryString}`)}`
    ];

    for (const url of targets) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout per request
            
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);

            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            // Silently continue to next endpoint
        }
    }
    throw new Error('All API endpoints failed');
}

export const api = {
  /**
   * Fetch historical klines (candles) for a symbol
   */
  getHistory: async (symbol: string, limit: number = 1000): Promise<DataPoint[]> => {
    try {
      const pair = `${symbol.toUpperCase()}USDT`;
      // Use 1m interval for high granularity
      const data: BinanceKline[] = await fetchWithFailover('/klines', `symbol=${pair}&interval=1m&limit=${limit}`);

      return data.map((kline: any) => ({
        time: kline[0],
        price: parseFloat(kline[4]), // Close price
        isSimulation: false
      }));
    } catch (error) {
      console.warn('Failed to fetch history (using mock data):', error);
      return [];
    }
  },

  /**
   * Fetch current price for a symbol
   */
  getPrice: async (symbol: string): Promise<number | null> => {
    try {
      const pair = `${symbol.toUpperCase()}USDT`;
      const data = await fetchWithFailover('/ticker/price', `symbol=${pair}`);
      return parseFloat(data.price);
    } catch (error) {
      // Suppress logging to avoid console spam during connection issues
      return null;
    }
  },

  /**
   * Fetch stored simulation points from Supabase
   */
  getSimulationPoints: async (simulationId: string): Promise<DataPoint[]> => {
    try {
      const { data, error } = await supabase
        .from('simulation_points')
        .select('time, price, is_simulation')
        .eq('simulation_id', simulationId)
        .order('time', { ascending: true });

      if (error) throw error;
      
      return data ? data.map(d => ({
        time: Number(d.time),
        price: Number(d.price),
        isSimulation: d.is_simulation
      })) : [];
    } catch (error) {
      console.error('Failed to fetch simulation points:', error);
      return [];
    }
  }
};