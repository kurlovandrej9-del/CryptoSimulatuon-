import React from 'react';
import { Coin } from '../types';
import { Search } from 'lucide-react';

interface CoinListProps {
  coins: Coin[];
  selectedCoin: Coin;
  onSelect: (coin: Coin) => void;
  currentPrices: Record<string, number>;
}

export const CoinList: React.FC<CoinListProps> = ({ coins, selectedCoin, onSelect, currentPrices }) => {
  return (
    <div className="w-full h-full flex flex-col bg-slate-900 md:bg-slate-900/50 backdrop-blur-sm">
      <div className="p-4 border-b border-slate-800">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
            <input 
                type="text" 
                placeholder="Поиск..." 
                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-200 focus:outline-none focus:border-emerald-500 transition-colors"
            />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {coins.map((coin) => {
          const price = currentPrices[coin.id] || coin.basePrice;
          const isSelected = selectedCoin.id === coin.id;
          
          return (
            <button
              key={coin.id}
              onClick={() => onSelect(coin)}
              className={`w-full text-left px-4 py-3 border-b border-slate-800/50 transition-all hover:bg-slate-800 flex items-center justify-between group relative overflow-hidden ${
                isSelected ? 'bg-slate-800/80' : ''
              }`}
            >
              {isSelected && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
              
              <div className="flex items-center gap-3">
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md border border-white/10`}
                  style={{ backgroundColor: coin.color }}
                >
                  {coin.symbol[0]}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>{coin.symbol}</span>
                      <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">PERP</span>
                  </div>
                  <div className="text-xs text-slate-500">{coin.name}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`font-mono font-medium text-sm ${isSelected ? 'text-emerald-400' : 'text-slate-300'}`}>
                  ${price.toFixed(2)}
                </div>
                <div className="flex items-center justify-end gap-1 text-[10px] text-slate-500">
                    <span>Vol</span>
                    <span className="text-slate-400">24M</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
      
      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/30 text-[10px] text-slate-500 text-center">
        Рыночные данные в реальном времени
      </div>
    </div>
  );
};