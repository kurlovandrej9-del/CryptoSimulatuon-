import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code, Globe, Link as LinkIcon, Settings, Palette, Layout } from 'lucide-react';
import { SimulationConfig } from '../types';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  simulation: SimulationConfig | null;
  selectedCoinId: string;
}

interface WidgetSettings {
  transparent: boolean;
  bgColor: string;
  lineColor: string;
  useCoinColor: boolean;
  showHeader: boolean;
  showTimeframes: boolean;
  showControls: boolean;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, simulation, selectedCoinId }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string>('');
  
  // Widget Settings State
  const [settings, setSettings] = useState<WidgetSettings>({
    transparent: false,
    bgColor: '#0f172a', // Slate 900
    lineColor: '#10b981', // Emerald 500
    useCoinColor: true,
    showHeader: true,
    showTimeframes: false, // Default hidden for simple widget
    showControls: true
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const url = new URL(window.location.href);
        
        // Clear existing params
        url.search = '';
        url.hash = '';
        
        // Base Widget Params
        url.searchParams.set('mode', 'widget');
        url.searchParams.set('coin', selectedCoinId);
        
        // Visual Settings Params
        if (settings.transparent) {
            url.searchParams.set('bg', 'transparent');
        } else {
            url.searchParams.set('bg', settings.bgColor);
        }

        if (!settings.useCoinColor) {
            url.searchParams.set('line', settings.lineColor);
        }

        url.searchParams.set('header', settings.showHeader.toString());
        url.searchParams.set('tf', settings.showTimeframes.toString());
        
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
        setWidgetUrl(window.location.href);
      }
    }
  }, [isOpen, simulation, selectedCoinId, settings]);

  if (!isOpen) return null;

  const iframeCode = `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0" allowtransparency="true" style="border-radius: 12px;"></iframe>`;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings size={20} className="text-emerald-500" />
            Настройка Виджета
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
            
            {/* Settings Sidebar */}
            <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                
                {/* Section: Background */}
                <div>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        <Palette size={14} /> Фон
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                            <span className="text-sm font-medium text-slate-200">Прозрачный</span>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.transparent ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                {settings.transparent && <Check size={12} className="text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={settings.transparent} 
                                onChange={(e) => setSettings({...settings, transparent: e.target.checked})} 
                            />
                        </label>

                        {!settings.transparent && (
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color" 
                                    value={settings.bgColor}
                                    onChange={(e) => setSettings({...settings, bgColor: e.target.value})}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-xs font-mono text-slate-400">{settings.bgColor}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Section: Chart Style */}
                <div>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        <Layout size={14} /> График
                    </h3>
                    <div className="space-y-3">
                        <label className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700 transition-colors">
                            <span className="text-sm font-medium text-slate-200">Цвет монеты</span>
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${settings.useCoinColor ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                {settings.useCoinColor && <Check size={12} className="text-white" />}
                            </div>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={settings.useCoinColor} 
                                onChange={(e) => setSettings({...settings, useCoinColor: e.target.checked})} 
                            />
                        </label>

                        {!settings.useCoinColor && (
                             <div className="flex items-center gap-3">
                                <input 
                                    type="color" 
                                    value={settings.lineColor}
                                    onChange={(e) => setSettings({...settings, lineColor: e.target.value})}
                                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <span className="text-xs font-mono text-slate-400">Цвет линии</span>
                            </div>
                        )}
                    </div>
                </div>

                 {/* Section: Interface */}
                 <div>
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                        <Settings size={14} /> Интерфейс
                    </h3>
                    <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${settings.showHeader ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                {settings.showHeader && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-300">Заголовок (Цена)</span>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={settings.showHeader} 
                                onChange={(e) => setSettings({...settings, showHeader: e.target.checked})} 
                            />
                        </label>
                         <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${settings.showTimeframes ? 'bg-blue-500 border-blue-500' : 'border-slate-600 group-hover:border-slate-500'}`}>
                                {settings.showTimeframes && <Check size={10} className="text-white" />}
                            </div>
                            <span className="text-sm text-slate-300">Таймфреймы (1ч, 4ч...)</span>
                            <input 
                                type="checkbox" 
                                className="hidden" 
                                checked={settings.showTimeframes} 
                                onChange={(e) => setSettings({...settings, showTimeframes: e.target.checked})} 
                            />
                        </label>
                    </div>
                </div>

            </div>

            {/* Preview & Code Area */}
            <div className="flex-1 bg-slate-950 p-6 flex flex-col gap-6 overflow-y-auto">
                
                {/* Code Block */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                        <Code size={16} className="text-blue-400" />
                        Код для вставки
                    </label>
                    <div className="relative group">
                        <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap break-all shadow-inner">
                            {iframeCode}
                        </pre>
                        <button 
                            onClick={() => copyToClipboard(iframeCode, 'iframe')}
                            className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-all border border-slate-700 shadow-lg"
                        >
                            {copiedSection === 'iframe' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                {/* Direct Link */}
                 <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-300 mb-2">
                        <LinkIcon size={16} className="text-purple-400" />
                        Прямая ссылка
                    </label>
                    <div className="relative">
                        <input 
                            readOnly 
                            value={widgetUrl}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-sm text-slate-300 font-mono focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
                        />
                        <button 
                            onClick={() => copyToClipboard(widgetUrl, 'url')}
                            className="absolute top-1/2 -translate-y-1/2 right-2 p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                        >
                            {copiedSection === 'url' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                        </button>
                    </div>
                </div>

                <div className="mt-auto pt-4 text-center">
                    <p className="text-xs text-slate-500">
                        Изменения применяются к ссылке автоматически. Скопируйте новый код после настройки.
                    </p>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};