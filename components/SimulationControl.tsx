import React, { useState } from 'react';
import { Play, Square, Timer, Target, AlertTriangle, Activity } from 'lucide-react';
import { SimulationConfig, Volatility } from '../types';

interface SimulationControlProps {
  onStart: (price: number, hours: number, minutes: number, volatility: Volatility) => void;
  onStop: () => void;
  isSimulating: boolean;
  currentPrice: number;
  config: SimulationConfig | null;
}

export const SimulationControl: React.FC<SimulationControlProps> = ({ 
  onStart, 
  onStop, 
  isSimulating, 
  currentPrice,
  config
}) => {
  const [targetPrice, setTargetPrice] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('5');
  const [volatility, setVolatility] = useState<Volatility>(Volatility.MEDIUM);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setError(null);
    const price = parseFloat(targetPrice);
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;

    if (isNaN(price) || price <= 0) {
      setError('Укажите цену');
      return;
    }
    if (h === 0 && m === 0) {
      setError('Укажите время');
      return;
    }

    onStart(price, h, m, volatility);
  };

  const calculateProgress = () => {
    if (!config || !isSimulating) return 0;
    const now = Date.now();
    const elapsed = now - config.startTime;
    const percent = Math.min((elapsed / config.durationMs) * 100, 100);
    return percent.toFixed(1);
  };

  return (
    <div className="bg-slate-900 border-t border-slate-800 pb-safe-area shadow-[0_-5px_20px_rgba(0,0,0,0.3)]">
      
      {/* Error Toast */}
      {error && (
        <div className="bg-rose-500/10 border-t border-rose-500/20 px-4 py-2 flex items-center justify-center gap-2 text-rose-400 text-xs font-medium animate-pulse">
            <AlertTriangle size={12} />
            {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4">
        {!isSimulating ? (
          <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-end">
            
            {/* Target Price Input */}
            <div className="flex-1 min-w-[150px]">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                <Target size={14} className="text-emerald-500" />
                Цель
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-mono">$</span>
                <input
                  type="number"
                  inputMode="decimal"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder={currentPrice.toFixed(2)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 pl-8 pr-4 text-white font-mono text-lg focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-700"
                />
              </div>
            </div>

            {/* Time Inputs */}
            <div className="flex gap-2 flex-1 min-w-[180px]">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center lg:text-left">
                  Часы
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  placeholder="0"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3 text-center text-white font-mono text-lg focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider text-center lg:text-left">
                  Мин
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  placeholder="0"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-3 px-3 text-center text-white font-mono text-lg focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Volatility Selector */}
            <div className="flex-1 min-w-[200px]">
               <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
                  <Activity size={14} className="text-purple-500" />
                  Волатильность
               </label>
               <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
                  <button 
                    onClick={() => setVolatility(Volatility.LOW)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${volatility === Volatility.LOW ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Спокойно
                  </button>
                  <button 
                    onClick={() => setVolatility(Volatility.MEDIUM)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${volatility === Volatility.MEDIUM ? 'bg-slate-800 text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Норм
                  </button>
                  <button 
                    onClick={() => setVolatility(Volatility.HIGH)}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all ${volatility === Volatility.HIGH ? 'bg-slate-800 text-rose-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    Шторм
                  </button>
               </div>
            </div>

            {/* Action Button */}
            <button
              onClick={handleStart}
              className="lg:w-auto w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-emerald-900/40 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Play size={20} fill="currentColor" />
              <span>СТАРТ</span>
            </button>
          </div>
        ) : (
          /* Active Simulation View */
          <div className="flex items-center justify-between gap-4 bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 backdrop-blur-sm">
             <div className="flex-1 flex items-center gap-4 px-3 py-1">
                <div className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 animate-pulse">
                    <Timer size={20} />
                </div>
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-1">
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Цель</span>
                        <span className="text-sm sm:text-base font-mono text-white font-bold">${config?.targetPrice}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Осталось</span>
                        <span className="text-sm sm:text-base font-mono text-emerald-400">
                            {config ? Math.max(0, Math.ceil((config.endTime - Date.now()) / 60000)) : 0} мин
                        </span>
                    </div>
                     <div className="hidden sm:flex flex-col">
                        <span className="text-[10px] text-slate-500 uppercase font-bold">Рынок</span>
                        <span className={`text-sm sm:text-base font-bold capitalize ${config?.volatility === Volatility.HIGH ? 'text-rose-400' : config?.volatility === Volatility.LOW ? 'text-emerald-400' : 'text-blue-400'}`}>
                           {config?.volatility === Volatility.HIGH ? 'Шторм' : config?.volatility === Volatility.LOW ? 'Спокойно' : 'Норм'}
                        </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex flex-col justify-center mt-1 sm:mt-0">
                        <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
                                style={{ width: `${calculateProgress()}%` }}
                            />
                        </div>
                    </div>
                </div>
             </div>
             
             <button
              onClick={onStop}
              className="h-12 w-12 flex items-center justify-center bg-rose-600 hover:bg-rose-500 text-white rounded-lg transition-colors shadow-lg shadow-rose-900/20 active:scale-95 m-1"
            >
              <Square size={20} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};