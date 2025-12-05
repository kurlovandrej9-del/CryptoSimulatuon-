import React, { useState, useEffect, useRef } from 'react';
import { CoinList } from './components/CoinList';
import { TradingChart } from './components/TradingChart';
import { SimulationControl } from './components/SimulationControl';
import { ShareModal } from './components/ShareModal';
import { Coin, DataPoint, SimulationConfig, TimeFrame, Volatility } from './types';
import { Menu, X, CloudLightning, Database, Share2 } from 'lucide-react';
import { api } from './services/api';
import { storage } from './services/storage';

const COINS: Coin[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', color: '#f59e0b', basePrice: 65000 },
  { id: 'eth', symbol: 'ETH', name: 'Ethereum', color: '#6366f1', basePrice: 3400 },
  { id: 'sol', symbol: 'SOL', name: 'Solana', color: '#14b8a6', basePrice: 145 },
  { id: 'bnb', symbol: 'BNB', name: 'Binance Coin', color: '#eab308', basePrice: 590 },
  { id: 'doge', symbol: 'DOGE', name: 'Dogecoin', color: '#fbbf24', basePrice: 0.16 },
  { id: 'xrp', symbol: 'XRP', name: 'Ripple', color: '#3b82f6', basePrice: 0.60 },
  { id: 'ada', symbol: 'ADA', name: 'Cardano', color: '#2563eb', basePrice: 0.45 },
  { id: 'ton', symbol: 'TON', name: 'Toncoin', color: '#0098ea', basePrice: 7.2 },
  { id: 'avax', symbol: 'AVAX', name: 'Avalanche', color: '#e84142', basePrice: 28 },
  { id: 'shib', symbol: 'SHIB', name: 'Shiba Inu', color: '#fca5a5', basePrice: 0.000018 },
  { id: 'dot', symbol: 'DOT', name: 'Polkadot', color: '#e6007a', basePrice: 6.5 },
  { id: 'link', symbol: 'LINK', name: 'Chainlink', color: '#2a5ada', basePrice: 14 },
  { id: 'matic', symbol: 'MATIC', name: 'Polygon', color: '#8247e5', basePrice: 0.55 },
  { id: 'uni', symbol: 'UNI', name: 'Uniswap', color: '#ff007a', basePrice: 8 },
  { id: 'ltc', symbol: 'LTC', name: 'Litecoin', color: '#345d9d', basePrice: 70 },
  { id: 'near', symbol: 'NEAR', name: 'NEAR Protocol', color: '#000000', basePrice: 5.5 },
  { id: 'atom', symbol: 'ATOM', name: 'Cosmos', color: '#2e3148', basePrice: 6.8 },
  { id: 'pepe', symbol: 'PEPE', name: 'Pepe', color: '#4ade80', basePrice: 0.000008 },
];

interface WidgetConfig {
    enabled: boolean;
    bgColor: string;
    lineColor?: string;
    showHeader: boolean;
    showTimeframes: boolean;
}

const App: React.FC = () => {
  const [selectedCoin, setSelectedCoin] = useState<Coin>(COINS[0]);
  const [chartData, setChartData] = useState<DataPoint[]>([]);
  const [currentPrices, setCurrentPrices] = useState<Record<string, number>>({});
  const [simulation, setSimulation] = useState<SimulationConfig | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>(TimeFrame.H4);
  const [isReverting, setIsReverting] = useState(false);
  
  // Widget / Share Logic
  const [widgetConfig, setWidgetConfig] = useState<WidgetConfig>({ 
      enabled: false, 
      bgColor: 'transparent',
      showHeader: true,
      showTimeframes: false 
  });
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Refs
  const chartDataRef = useRef<DataPoint[]>([]);
  const simulationRef = useRef<SimulationConfig | null>(null);
  const selectedCoinRef = useRef<Coin>(COINS[0]);
  const realPriceRef = useRef<number>(0);

  // --- Initialization & Data Fetching ---

  const loadMarketData = async (coin: Coin) => {
    setIsLoading(true);
    try {
      // 1. Fetch Real History
      const history = await api.getHistory(coin.symbol, 2000);
      
      if (history.length > 0) {
          realPriceRef.current = history[history.length - 1].price;
      }
      
      let finalData = history;
      
      // 2. Check for Active Simulation to reconstruct history gap
      const sim = simulationRef.current;
      
      if (sim && sim.active && history.length > 0) {
          const now = Date.now();
          const splitIndex = history.findIndex(p => p.time >= sim.startTime);
          const cleanHistory = splitIndex !== -1 ? history.slice(0, splitIndex) : history;
          
          const gapPoints: DataPoint[] = [];
          const step = 60 * 1000;
          let currentTime = sim.startTime;
          let currentSimPrice = sim.startPrice; 
          
          let volBase = 0.0005;
          if (sim.volatility === Volatility.LOW) volBase = 0.0001;
          if (sim.volatility === Volatility.HIGH) volBase = 0.002;

          while (currentTime < now) {
             const elapsed = currentTime - sim.startTime;
             if (elapsed >= sim.durationMs) break;
             
             const remaining = sim.durationMs - elapsed;
             const gap = sim.targetPrice - currentSimPrice;
             
             const stepSeconds = step / 1000;
             const stepsLeft = Math.max(1, remaining / step);
             const trend = gap / stepsLeft;
             
             const volatility = currentSimPrice * volBase * Math.sqrt(stepSeconds);
             const noise = (Math.random() - 0.5) * volatility * 2; 

             currentSimPrice += trend + noise;
             
             gapPoints.push({
                 time: currentTime,
                 price: currentSimPrice,
                 isSimulation: true
             });
             
             currentTime += step;
          }
          
          if (gapPoints.length === 0 && cleanHistory.length === 0) {
               gapPoints.push({ time: sim.startTime, price: sim.startPrice, isSimulation: true });
          }

          finalData = [...cleanHistory, ...gapPoints];
      } else if (history.length === 0) {
          generateMockHistory(coin);
          return;
      }

      setChartData(finalData);
      chartDataRef.current = finalData;
      
      if (finalData.length > 0) {
        const lastPrice = finalData[finalData.length - 1].price;
        setCurrentPrices(prev => ({
            ...prev,
            [coin.id]: lastPrice
        }));
      }

    } catch (e) {
      console.error("Error loading market data", e);
      generateMockHistory(coin);
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockHistory = (coin: Coin) => {
      const initialData: DataPoint[] = [];
      const now = Date.now();
      let price = coin.basePrice;
      realPriceRef.current = price;
      for (let i = 1000; i > 0; i--) {
        price = price + (Math.random() - 0.5) * (price * 0.002);
        initialData.push({ time: now - i * 60000, price });
      }
      setChartData(initialData);
      chartDataRef.current = initialData;
  };

  useEffect(() => {
    // 1. Check for URL Params (Widget Mode)
    const params = new URLSearchParams(window.location.search);
    const mode = params.get('mode');
    const coinId = params.get('coin');
    
    // Parse Widget Styles
    const isWidget = mode === 'widget';
    if (isWidget) {
        setWidgetConfig({
            enabled: true,
            bgColor: params.get('bg') || 'transparent',
            lineColor: params.get('line') || undefined,
            showHeader: params.get('header') !== 'false', // Default true
            showTimeframes: params.get('tf') === 'true' // Default false
        });
        
        // Default timeframe for widget if not specified
        setActiveTimeFrame(TimeFrame.H1);
    }

    // 2. Resolve Coin
    let initialCoin = COINS[0];
    if (coinId) {
      const found = COINS.find(c => c.id === coinId);
      if (found) initialCoin = found;
    }
    setSelectedCoin(initialCoin);
    selectedCoinRef.current = initialCoin;

    // 3. Resolve Simulation (From URL or Storage)
    if (params.get('sim_active') === 'true') {
        const startPrice = parseFloat(params.get('sim_start') || '0');
        const targetPrice = parseFloat(params.get('sim_target') || '0');
        const startTime = parseInt(params.get('sim_startTime') || Date.now().toString());
        const durationMs = parseInt(params.get('sim_duration') || '3600000');
        const volatility = (params.get('sim_volatility') as Volatility) || Volatility.MEDIUM;

        const urlSim: SimulationConfig = {
            id: 'widget-sim',
            active: true,
            coinId: initialCoin.id,
            startPrice,
            targetPrice,
            startTime,
            durationMs,
            endTime: startTime + durationMs,
            volatility,
            createdAt: startTime
        };

        if (Date.now() < urlSim.endTime + 60000) {
             setSimulation(urlSim);
             simulationRef.current = urlSim;
        }
    } else if (!isWidget) {
        const savedSim = storage.getSimulation();
        if (savedSim) {
            const now = Date.now();
            if (now < savedSim.endTime + 60000) { 
                setSimulation(savedSim);
                simulationRef.current = savedSim;
                const coin = COINS.find(c => c.id === savedSim.coinId) || initialCoin;
                setSelectedCoin(coin);
                selectedCoinRef.current = coin;
            } else {
                storage.clearSimulation();
                storage.archiveSimulation(savedSim);
            }
        }
    }

    loadMarketData(selectedCoinRef.current);

    if (!isWidget) {
        COINS.forEach(async (c) => {
        const price = await api.getPrice(c.symbol);
        if (price) {
            setCurrentPrices(prev => ({ ...prev, [c.id]: price }));
        }
        });
    }
  }, []);

  const handleCoinSelect = (coin: Coin) => {
    if (simulation) {
        const confirmSwitch = window.confirm("Смена монеты остановит текущую симуляцию. Продолжить?");
        if (!confirmSwitch) return;
        stopSimulation();
    }
    setSelectedCoin(coin);
    selectedCoinRef.current = coin;
    setIsMobileMenuOpen(false);
    loadMarketData(coin);
  };

  const handleTimeFrameChange = (tf: TimeFrame) => {
      setActiveTimeFrame(tf);
  };

  const startSimulation = (targetPrice: number, hours: number, minutes: number, volatility: Volatility) => {
    const durationMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
    const now = Date.now();
    const currentPrice = chartDataRef.current[chartDataRef.current.length - 1]?.price || selectedCoinRef.current.basePrice;

    const config: SimulationConfig = {
      id: crypto.randomUUID(),
      active: true,
      coinId: selectedCoinRef.current.id,
      startPrice: currentPrice,
      targetPrice: targetPrice,
      startTime: now,
      durationMs: durationMs,
      endTime: now + durationMs,
      volatility: volatility,
      createdAt: now
    };

    setIsReverting(false);
    setSimulation(config);
    simulationRef.current = config;
    if (!widgetConfig.enabled) storage.saveSimulation(config);
  };

  const stopSimulation = () => {
    if (simulationRef.current && !widgetConfig.enabled) {
        storage.archiveSimulation(simulationRef.current);
        storage.clearSimulation();
    }
    setSimulation(null);
    simulationRef.current = null;
    setIsReverting(true);
  };

  // --- Main Engine Loop ---
  useEffect(() => {
    const interval = setInterval(async () => {
      const now = Date.now();
      const lastData = chartDataRef.current;
      if (lastData.length === 0) return;

      const lastPoint = lastData[lastData.length - 1];
      const sim = simulationRef.current;
      
      let nextPrice = lastPoint.price;
      let isSimulatedPoint = false;

      if (now % 5000 < 1000 && !widgetConfig.enabled) {
         const p = await api.getPrice(selectedCoinRef.current.symbol);
         if (p) realPriceRef.current = p;
      }

      if (sim && sim.active) {
        setIsLive(false);
        const elapsed = now - sim.startTime;
        
        if (elapsed >= sim.durationMs) {
          stopSimulation();
        } else {
          const remainingTime = sim.durationMs - elapsed;
          const currentGap = sim.targetPrice - lastPoint.price;
          const ticksLeft = Math.max(1, remainingTime / 1000); 
          const trendStep = currentGap / ticksLeft;

          let volatilityMultiplier = 0.0005; 
          if (sim.volatility === Volatility.LOW) volatilityMultiplier = 0.0001;
          if (sim.volatility === Volatility.HIGH) volatilityMultiplier = 0.002;

          const volatility = lastPoint.price * volatilityMultiplier; 
          const randomShock = (Math.random() - 0.5) * volatility * 2; 
          
          let jerkMultiplier = 1;
          if (sim.volatility === Volatility.HIGH && Math.random() > 0.85) {
             jerkMultiplier = 4;
          } else if (Math.random() > 0.9) {
             jerkMultiplier = 2;
          }

          nextPrice = lastPoint.price + trendStep + (randomShock * jerkMultiplier);
          isSimulatedPoint = true;
        }
      } else if (isReverting) {
        setIsLive(false);
        const target = realPriceRef.current;
        const diff = target - lastPoint.price;
        const step = diff * 0.1;
        const noise = (Math.random() - 0.5) * (lastPoint.price * 0.0002);
        nextPrice = lastPoint.price + step + noise;
        if (Math.abs(diff) < (target * 0.0001)) {
            setIsReverting(false);
            nextPrice = target;
        }
      } else {
        setIsLive(true);
        nextPrice = realPriceRef.current;
      }

      if (now - lastPoint.time > 1000) {
          const newPoint: DataPoint = {
            time: now,
            price: Math.max(0.00000001, nextPrice),
            isSimulation: isSimulatedPoint
          };
          const updatedData = [...lastData, newPoint].slice(-3000); 
          chartDataRef.current = updatedData;
          setChartData(updatedData);
          setCurrentPrices(prev => ({ ...prev, [selectedCoinRef.current.id]: nextPrice }));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isReverting, widgetConfig.enabled]);

  return (
    <div 
        className={`flex flex-col h-[100dvh] overflow-hidden font-sans ${widgetConfig.enabled ? '' : 'bg-slate-950 text-slate-100'}`}
        style={widgetConfig.enabled ? { backgroundColor: widgetConfig.bgColor === 'transparent' ? 'transparent' : widgetConfig.bgColor, color: '#e2e8f0' } : {}}
    >
      
      {!widgetConfig.enabled && (
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 flex items-center px-4 justify-between shrink-0 z-30 shadow-sm">
        <div className="flex items-center gap-3">
           <button 
             onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
             className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white active:bg-slate-800 rounded-lg transition-colors"
           >
             {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
           </button>
           <div className="flex flex-col leading-none">
             <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-500">
                    CryptoSim
                </span>
                <span className={`flex items-center gap-1 text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded border ${isLive ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-purple-500/30 bg-purple-500/10 text-purple-400'}`}>
                    {isLive ? <CloudLightning size={10} /> : <Database size={10} />}
                    {isLive ? 'Live' : 'Sim'}
                </span>
             </div>
           </div>
        </div>

        <button 
            onClick={() => setIsShareModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold text-slate-200 transition-all hover:border-emerald-500/50"
        >
            <Share2 size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">API / Виджет</span>
        </button>
      </header>
      )}

      {/* Main Layout */}
      <div className="flex flex-1 min-h-0 relative">
        
        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && !widgetConfig.enabled && (
          <div 
            className="absolute inset-0 bg-black/60 z-20 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {!widgetConfig.enabled && (
        <div className={`
            absolute md:static top-0 bottom-0 left-0 z-20 w-72 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
          <CoinList 
            coins={COINS} 
            selectedCoin={selectedCoin} 
            onSelect={handleCoinSelect} 
            currentPrices={currentPrices}
          />
        </div>
        )}

        {/* Chart Area */}
        <main className={`flex-1 flex flex-col min-w-0 relative ${widgetConfig.enabled ? '' : 'bg-slate-950'}`}>
          <div className="flex-1 min-h-0 relative z-0">
             {isLoading && chartData.length === 0 ? (
                 <div className="absolute inset-0 flex items-center justify-center text-slate-500 gap-2">
                     <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                     Загрузка...
                 </div>
             ) : (
                <TradingChart 
                    data={chartData} 
                    color={widgetConfig.lineColor || selectedCoin.color} 
                    symbol={selectedCoin.symbol}
                    activeTimeFrame={activeTimeFrame}
                    onTimeFrameChange={handleTimeFrameChange}
                    isWidget={widgetConfig.enabled}
                    widgetOptions={{
                        showHeader: widgetConfig.showHeader,
                        showTimeframes: widgetConfig.showTimeframes
                    }}
                />
             )}
          </div>
          
          {!widgetConfig.enabled && (
          <div className="shrink-0 z-10 bg-slate-900 border-t border-slate-800">
            <SimulationControl 
              onStart={startSimulation} 
              onStop={stopSimulation}
              isSimulating={!!simulation}
              currentPrice={chartData[chartData.length - 1]?.price || selectedCoin.basePrice}
              config={simulation}
            />
          </div>
          )}
        </main>
      </div>

      <ShareModal 
        isOpen={isShareModalOpen} 
        onClose={() => setIsShareModalOpen(false)}
        simulation={simulation}
        selectedCoinId={selectedCoin.id}
      />
    </div>
  );
};

export default App;