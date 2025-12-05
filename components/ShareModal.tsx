import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code, Globe, Link as LinkIcon } from 'lucide-react';
import { SimulationConfig } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationConfig | null;
  selectedCoinId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, simulation, selectedCoinId }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      try {
        // Use the URL API for robust handling of origin, path, and existing params
        const url = new URL(window.location.href);
        
        // Clear existing params to avoid duplication/conflicts, but keep the path
        url.search = '';
        url.hash = '';
        
        // Set widget params
        url.searchParams.set('mode', 'widget');
        url.searchParams.set('coin', selectedCoinId);
        
        // Simulation params (if active)
        if (simulation) {
          url.searchParams.set('sim_active', 'true');
          url.searchParams.set('sim_start', simulation.startPrice.toString());
          url.searchParams.set('sim_target', simulation.targetPrice.toString());
          url.searchParams.set('sim_startTime', simulation.startTime.toString());
          url.searchParams.set('sim_duration', simulation.durationMs.toString());
          url.searchParams.set('sim_volatility', simulation.volatility);
        }

        setWidgetUrl(url.toString());
      } catch (e) {
        // Fallback
        setWidgetUrl(window.location.href);
      }
    }
  }, [isOpen, simulation, selectedCoinId]);

  if (!isOpen) return null;

  const iframeCode = `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0" allowtransparency="true"></iframe>`;
  
  const apiJson = JSON.stringify({
    symbol: selectedCoinId.toUpperCase(),
    url: widgetUrl,
    simulation: simulation ? {
        active: true,
        target: simulation.targetPrice,
        ends_at: new Date(simulation.endTime).toISOString()
    } : { active: false }
  }, null, 2);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Globe size={20} className="text-emerald-500" />
            Интеграция / API
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
          
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 text-sm text-emerald-200">
            Этот сайт работает как генератор виджетов. Используйте код ниже, чтобы вставить живой график с вашей симуляцией на любой другой сайт.
          </div>

          {/* Iframe Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
              <Code size={16} className="text-blue-400" />
              Код Виджета (HTML)
            </label>
            <div className="relative group">
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                {iframeCode}
              </pre>
              <button 
                onClick={() => copyToClipboard(iframeCode, 'iframe')}
                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700"
              >
                {copiedSection === 'iframe' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* Direct Link Section */}
          <div>
            <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
              <LinkIcon size={16} className="text-purple-400" />
              Прямая ссылка
            </label>
            <div className="relative">
              <input 
                readOnly 
                value={widgetUrl}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-300 font-mono focus:outline-none focus:border-purple-500 transition-colors"
              />
              <button 
                onClick={() => copyToClipboard(widgetUrl, 'url')}
                className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                {copiedSection === 'url' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              </button>
            </div>
          </div>

          {/* JSON API Section */}
          <div>
             <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
              <span className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">JSON</span>
              API Response Example
            </label>
            <div className="relative">
               <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs text-green-400 font-mono overflow-x-auto">
                {apiJson}
               </pre>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};