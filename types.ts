export interface Coin {
  id: string;
  symbol: string; // Binance symbol format (e.g., BTCUSDT)
  name: string;
  color: string;
  basePrice: number; // Fallback price
}

export interface DataPoint {
  time: number; // timestamp
  price: number;
  isSimulation?: boolean;
}

export enum Volatility {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

export interface SimulationConfig {
  id: string; // Internal ID
  supabaseId?: string; // ID of the record in Supabase
  active: boolean;
  coinId: string;
  startPrice: number;
  targetPrice: number;
  startTime: number;
  durationMs: number;
  endTime: number;
  volatility: Volatility;
  createdAt: number;
}

export enum TimeFrame {
  M1 = '1м',
  M5 = '5м',
  M15 = '15м',
  H1 = '1ч',
  H4 = '4ч',
  D1 = '1д',
  D7 = '7д'
}

// API Response types
export type BinanceKline = [
  number, // Open time
  string, // Open
  string, // High
  string, // Low
  string, // Close
  string, // Volume
  number, // Close time
  string, // Quote asset volume
  number, // Number of trades
  string, // Taker buy base asset volume
  string, // Taker buy quote asset volume
  string  // Ignore
];