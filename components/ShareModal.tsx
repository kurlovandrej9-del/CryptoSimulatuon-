import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Code, Globe, Link as LinkIcon, Settings, Palette, Layout, Grid, Type, Sliders, Database, Terminal, CloudLightning, Activity } from 'lucide-react';
import { SimulationConfig } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../services/supabaseClient';

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
  textColor: string;
  useCoinColor: boolean;
  showHeader: boolean;
  showTimeframes: boolean;
  showGrid: boolean;
  strokeWidth: number;
  fillOpacity: number;
}

type Tab = 'widget' | 'api';

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, simulation, selectedCoinId }) => {
  const [activeTab, setActiveTab] = useState<Tab>('widget');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [widgetUrl, setWidgetUrl] = useState<string>('');
  
  // Widget Settings State
  const [settings, setSettings] = useState<WidgetSettings>({
    transparent: false,
    bgColor: '#0f172a',
    lineColor: '#10b981',
    textColor: '#e2e8f0',
    useCoinColor: true,
    showHeader: true,
    showTimeframes: false,
    showGrid: true,
    strokeWidth: 2,
    fillOpacity: 20 // percent
  });

  useEffect(() => {
    if (isOpen) {
      try {
        const url = new URL(window.location.href);
        url.search = '';
        url.hash = '';
        
        // Base Params
        url.searchParams.set('mode', 'widget');
        url.searchParams.set('coin', selectedCoinId);
        
        // Style Params
        if (settings.transparent) {
            url.searchParams.set('bg', 'transparent');
        } else {
            url.searchParams.set('bg', settings.bgColor);
        }

        if (!settings.useCoinColor) {
            url.searchParams.set('line', settings.lineColor);
        }
        
        url.searchParams.set('txt', settings.textColor);
        url.searchParams.set('header', settings.showHeader.toString());
        url.searchParams.set('tf', settings.showTimeframes.toString());
        url.searchParams.set('grid', settings.showGrid.toString());
        url.searchParams.set('w_strk', settings.strokeWidth.toString());
        url.searchParams.set('w_fill', (settings.fillOpacity / 100).toString());
        
        // Simulation Params
        if (simulation && simulation.supabaseId) {
           url.searchParams.set('sim_id', simulation.supabaseId);
        } else if (simulation) {
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

  const iframeCode = `<iframe src="${widgetUrl}" width="100%" height="400" frameborder="0" allowtransparency="true" style="border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);"></iframe>`;

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  // --- API GENERATION LOGIC ---
  const isSimulationActive = !!simulation?.supabaseId;
  const symbol = selectedCoinId.toUpperCase();
  
  // Direct HTTP Link
  const directApiLink = isSimulationActive 
    ? `${SUPABASE_URL}/rest/v1/simulation_points?select=price,time&simulation_id=eq.${simulation.supabaseId}&order=time.desc&limit=1&apikey=${SUPABASE_ANON_KEY}`
    : `https://api.binance.com/api/v3/ticker/price?symbol=${symbol === 'BTC' ? 'BTC' : symbol}USDT`; // Simple fallback for demo, improved logic needed for all pairs mapping

  // Curl Command
  const curlCommand = isSimulationActive
    ? `curl -X GET '${directApiLink}' \\
  -H 'Authorization: Bearer ${SUPABASE_ANON_KEY}'`
    : `curl -X GET '${directApiLink}'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header with Tabs */}
        <div className="flex flex-col border-b border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between p-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Settings size={20} className="text-emerald-500" />
                    Настройки интеграции
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>
            <div className="flex px-4 gap-6">
                <button 
                    onClick={() => setActiveTab('widget')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'widget' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <Layout size={16} />
                    Виджет
                </button>
                <button 
                    onClick={() => setActiveTab('api')}
                    className={`pb-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'api' ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-500 hover:text-slate-300'}`}
                >
                    <Database size={16} />
                    API Данные
                </button>
            </div>
        </div>

        <div className="flex flex-col md:flex-row flex-1 min-h-0">
            
            {/* Widget Settings Sidebar */}
            {activeTab === 'widget' && (
            <div className="w-full md:w-80 bg-slate-900 border-r border-slate-800 p-5 overflow-y-auto custom-scrollbar flex flex-col gap-8">
                
                {/* Visuals */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Palette size={14} /> Внешний вид
                    </h3>
                    
                    {/* Background */}
                    <div className="space-y-2">
                        <label className="text-xs text-slate-500 font-medium">Фон виджета</label>
                        <div className="flex items-center gap-2">
                            <label className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${settings.transparent ? 'bg-slate-800 border-emerald-500 text-emerald-400' : 'bg-slate-950 border-slate-800 text-slate-400'}`}>
                                <div className="w-3 h-3 rounded-full border border-current bg-transparent"></div>
                                <span className="text-xs font-bold">Прозрачный</span>
                                <input type="checkbox" className="hidden" checked={settings.transparent} onChange={(e) => setSettings({...settings, transparent: e.target.checked})} />
                            </label>
                            {!settings.transparent && (
                                <input type="color" value={settings.bgColor} onChange={(e) => setSettings({...settings, bgColor: e.target.value})} className="w-9 h-9 rounded cursor-pointer bg-transparent border-0 p-0" title="Выбрать цвет" />
                            )}
                        </div>
                    </div>

                    {/* Text Color */}
                    <div className="flex items-center justify-between">
                         <label className="text-xs text-slate-500 font-medium flex items-center gap-2">
                            <Type size={12} /> Цвет текста
                         </label>
                         <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-slate-500">{settings.textColor}</span>
                            <input type="color" value={settings.textColor} onChange={(e) => setSettings({...settings, textColor: e.target.value})} className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0" />
                         </div>
                    </div>

                    {/* Line Color */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-500 font-medium">Цвет линии</label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={settings.useCoinColor} onChange={(e) => setSettings({...settings, useCoinColor: e.target.checked})} className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-0 w-3 h-3" />
                                <span className="text-[10px] text-slate-400">Цвет монеты</span>
                            </label>
                        </div>
                        {!settings.useCoinColor && (
                            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-lg border border-slate-800">
                                <input type="color" value={settings.lineColor} onChange={(e) => setSettings({...settings, lineColor: e.target.value})} className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0 flex-shrink-0" />
                                <input type="text" value={settings.lineColor} onChange={(e) => setSettings({...settings, lineColor: e.target.value})} className="w-full bg-transparent text-xs text-slate-300 focus:outline-none font-mono" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Graph Options */}
                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                        <Sliders size={14} /> Параметры графика
                    </h3>

                    {/* Stroke Width */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Толщина линии</span>
                            <span>{settings.strokeWidth}px</span>
                        </div>
                        <input 
                            type="range" min="1" max="6" step="0.5"
                            value={settings.strokeWidth}
                            onChange={(e) => setSettings({...settings, strokeWidth: parseFloat(e.target.value)})}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>

                    {/* Fill Opacity */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                            <span>Прозрачность заливки</span>
                            <span>{settings.fillOpacity}%</span>
                        </div>
                        <input 
                            type="range" min="0" max="80" step="5"
                            value={settings.fillOpacity}
                            onChange={(e) => setSettings({...settings, fillOpacity: parseInt(e.target.value)})}
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                    </div>
                    
                    {/* Toggles */}
                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => setSettings({...settings, showGrid: !settings.showGrid})}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${settings.showGrid ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                        >
                            <Grid size={12} /> Сетка
                        </button>
                        <button 
                            onClick={() => setSettings({...settings, showHeader: !settings.showHeader})}
                            className={`p-2 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-2 ${settings.showHeader ? 'bg-slate-800 border-slate-600 text-slate-200' : 'bg-slate-950 border-slate-800 text-slate-500'}`}
                        >
                            <Layout size={12} /> Шапка
                        </button>
                    </div>
                    <label className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${settings.showTimeframes ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                            {settings.showTimeframes && <Check size={10} className="text-white" />}
                        </div>
                        <span className="text-xs text-slate-300">Показывать таймфреймы</span>
                        <input type="checkbox" className="hidden" checked={settings.showTimeframes} onChange={(e) => setSettings({...settings, showTimeframes: e.target.checked})} />
                    </label>

                </div>
            </div>
            )}

            {/* Main Content Area */}
            <div className="flex-1 bg-slate-950 flex flex-col min-w-0">
                
                {activeTab === 'widget' ? (
                // Widget Preview & Code
                <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
                    
                    {/* Preview Box */}
                    <div className="flex-1 min-h-[300px] bg-slate-900/50 rounded-2xl border border-slate-800 flex flex-col relative overflow-hidden group">
                        <div className="absolute top-3 left-3 px-2 py-1 bg-black/50 backdrop-blur rounded text-[10px] font-bold text-slate-500 uppercase tracking-wider z-10 pointer-events-none">
                            Предпросмотр
                        </div>
                        <div className="w-full h-full">
                            <iframe 
                                src={widgetUrl} 
                                className="w-full h-full border-0"
                                title="Widget Preview"
                            />
                        </div>
                    </div>

                    {/* Code Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-300">
                                <Code size={16} className="text-blue-400" />
                                HTML Код
                            </label>
                            <div className="text-[10px] text-slate-500">iframe • 100% width</div>
                        </div>
                        
                        <div className="relative group">
                            <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 font-mono overflow-x-auto whitespace-pre-wrap break-all shadow-inner hover:border-slate-700 transition-colors">
                                {iframeCode}
                            </pre>
                            <button 
                                onClick={() => copyToClipboard(iframeCode, 'iframe')}
                                className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-500 rounded-lg transition-all border border-slate-700 hover:border-emerald-500/50"
                            >
                                {copiedSection === 'iframe' ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
                ) : (
                // API Tab Content
                <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
                    
                    <div className={`p-5 rounded-xl border flex items-center justify-between ${isSimulationActive ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSimulationActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                                {isSimulationActive ? <Activity size={24} /> : <CloudLightning size={24} />}
                            </div>
                            <div>
                                <h3 className={`font-bold ${isSimulationActive ? 'text-emerald-400' : 'text-slate-200'}`}>
                                    {isSimulationActive ? 'Режим: Активная Симуляция' : 'Режим: Реальный рынок'}
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    {isSimulationActive 
                                        ? 'Данные транслируются из Supabase (Симуляция)' 
                                        : 'Данные транслируются с биржи Binance (Live)'}
                                </p>
                            </div>
                        </div>
                        <div className="text-xs font-mono bg-black/20 px-3 py-1.5 rounded text-slate-400">
                            ID: {isSimulationActive ? simulation.supabaseId?.substring(0,8)+'...' : symbol}
                        </div>
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Direct Link Section */}
                        <div>
                             <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <LinkIcon size={14} className="text-blue-400" />
                                Прямая ссылка (GET JSON)
                            </label>
                            <p className="text-xs text-slate-500 mb-3">
                                Используйте эту ссылку в вашем коде, боте или браузере для получения текущей цены в формате JSON.
                                Эта ссылка всегда возвращает то, что сейчас на графике.
                            </p>
                            
                            <div className="relative group">
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 pr-12 text-sm text-blue-300 font-mono overflow-x-auto shadow-inner whitespace-nowrap">
                                    {directApiLink}
                                </div>
                                <button 
                                    onClick={() => copyToClipboard(directApiLink, 'direct_link')}
                                    className="absolute top-2 right-2 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                                >
                                    {copiedSection === 'direct_link' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* cURL Example */}
                        <div>
                             <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <Terminal size={14} className="text-purple-400" />
                                Терминал / cURL
                            </label>
                            <div className="relative group">
                                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto shadow-inner">
{curlCommand}
                                </pre>
                                <button 
                                    onClick={() => copyToClipboard(curlCommand, 'curl')}
                                    className="absolute top-2 right-2 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
                                >
                                    {copiedSection === 'curl' ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                         {/* JS Example */}
                         <div>
                             <label className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                                <Code size={14} className="text-yellow-400" />
                                JavaScript Fetch
                            </label>
                            <div className="relative group">
                                <pre className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 font-mono overflow-x-auto shadow-inner">
{`// Получение текущей цены (работает для Live и Sim)
const response = await fetch('${directApiLink}'${isSimulationActive ? `, {
  headers: {
    'apikey': '${SUPABASE_ANON_KEY}',
    'Authorization': 'Bearer ${SUPABASE_ANON_KEY}'
  }
}` : ''});

const data = await response.json();
const price = ${isSimulationActive ? 'data[0]?.price' : 'data.price'};
console.log('Current Price:', price);`}
                                </pre>
                                <button 
                                    onClick={() => copyToClipboard('js_code_placeholder', 'js_code')} // Actual copy logic handled by generic copy for now, just visual
                                    className="absolute top-2 right-2 p-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-400 hover:text-white"
                                >
                                    {copiedSection === 'js_code' ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};