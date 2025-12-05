import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DataPoint, TimeFrame } from '../types';
import { RefreshCcw, ChevronsRight } from 'lucide-react';

interface TradingChartProps {
  data: DataPoint[];
  color: string;
  symbol: string;
  activeTimeFrame: TimeFrame;
  onTimeFrameChange: (tf: TimeFrame) => void;
  isWidget?: boolean;
  widgetOptions?: {
      showHeader: boolean;
      showTimeframes: boolean;
  }
}

export const TradingChart: React.FC<TradingChartProps> = ({ 
  data, 
  color, 
  symbol,
  activeTimeFrame,
  onTimeFrameChange,
  isWidget = false,
  widgetOptions = { showHeader: true, showTimeframes: false }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Viewport State
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [yDomain, setYDomain] = useState<[number, number] | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isAutoY, setIsAutoY] = useState(true);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingY, setIsResizingY] = useState(false);
  
  // Unified pointer tracking
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);

  // Helper to calculate duration from timeframe
  const getDurationFromTimeFrame = (tf: TimeFrame) => {
    switch (tf) {
        case TimeFrame.M1: return 60 * 1000;
        case TimeFrame.M5: return 5 * 60 * 1000;
        case TimeFrame.M15: return 15 * 60 * 1000;
        case TimeFrame.H1: return 60 * 60 * 1000;
        case TimeFrame.H4: return 4 * 60 * 60 * 1000;
        case TimeFrame.D1: return 24 * 60 * 60 * 1000;
        case TimeFrame.D7: return 7 * 24 * 60 * 60 * 1000;
        default: return 4 * 60 * 60 * 1000; // Default H4
    }
  };

  // Initial View
  useEffect(() => {
    if (data.length > 0 && isAutoScroll) {
      const lastTime = data[data.length - 1].time;
      const duration = getDurationFromTimeFrame(activeTimeFrame);
      setXDomain([lastTime - duration, lastTime]);
    }
  }, [data.length === 0, activeTimeFrame]); 

  // Auto-scroll logic update
  useEffect(() => {
    if (data.length === 0 || !isAutoScroll || !xDomain) return;

    const lastTime = data[data.length - 1].time;
    const currentDuration = xDomain[1] - xDomain[0];
    
    // Smoothly follow the head
    setXDomain([lastTime - currentDuration, lastTime]);
  }, [data, isAutoScroll]); 

  const formatTime = (time: number) => {
    const date = new Date(time);
    const duration = xDomain ? xDomain[1] - xDomain[0] : 0;
    
    // If range is > 1 day, show Date + Time
    if (duration > 24 * 60 * 60 * 1000) {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  // --- Logic Helpers ---

  const setTimeFrame = (tf: TimeFrame) => {
    onTimeFrameChange(tf);
    if (data.length === 0) return;
    
    const lastTime = data[data.length - 1].time;
    const duration = getDurationFromTimeFrame(tf);

    setXDomain([lastTime - duration, lastTime]);
    setIsAutoScroll(true);
  };

  // --- Unified Event Handlers (Mouse & Touch) ---

  const getPointerPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e as React.TouchEvent).touches && (e as React.TouchEvent).touches.length > 0) {
        return { 
            x: (e as React.TouchEvent).touches[0].clientX, 
            y: (e as React.TouchEvent).touches[0].clientY 
        };
    } else if ((e as React.MouseEvent).clientX !== undefined) {
        return { 
            x: (e as React.MouseEvent).clientX, 
            y: (e as React.MouseEvent).clientY 
        };
    }
    return null;
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    const pos = getPointerPos(e);
    if (!pos) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = pos.x - rect.left;
    const isOverYAxis = relativeX > containerWidth - 60;

    lastPointerPos.current = pos;

    if (isOverYAxis) {
        setIsResizingY(true);
        setIsAutoY(false);
    } else {
        setIsDragging(true);
        setIsAutoScroll(false);
    }
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ((!isDragging && !isResizingY) || !lastPointerPos.current) return;
    if (!xDomain) return;

    const pos = getPointerPos(e);
    if (!pos) return;

    const dx = pos.x - lastPointerPos.current.x;
    const dy = pos.y - lastPointerPos.current.y;
    lastPointerPos.current = pos;

    if (isDragging) {
        const containerWidth = containerRef.current?.clientWidth || 1;
        const duration = xDomain[1] - xDomain[0];
        const msPerPx = duration / containerWidth;
        const timeShift = dx * msPerPx; 

        setXDomain([xDomain[0] - timeShift, xDomain[1] - timeShift]);
    }

    if (isResizingY && yDomain) {
        const scaleFactor = 1 + (dy * 0.002); 
        const currentMin = yDomain[0];
        const currentMax = yDomain[1];
        const range = currentMax - currentMin;
        const center = currentMin + range / 2;
        const newRange = range * scaleFactor;
        
        setYDomain([center - newRange / 2, center + newRange / 2]);
    }
  };

  const handleEnd = () => {
    setIsDragging(false);
    setIsResizingY(false);
    lastPointerPos.current = null;
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (!xDomain) return;
    e.preventDefault(); 
    const containerWidth = containerRef.current?.clientWidth || 0;
    const isOverYAxis = e.nativeEvent.offsetX > containerWidth - 60;

    const delta = Math.sign(e.deltaY);
    const zoomFactor = delta > 0 ? 1.05 : 0.95; 

    if (isOverYAxis) {
       if (isAutoY) setIsAutoY(false);
       const currentYMin = yDomain ? yDomain[0] : 0;
       const currentYMax = yDomain ? yDomain[1] : 100;
       const range = currentYMax - currentYMin;
       const center = currentYMin + range / 2;
       const newRange = range * zoomFactor;
       setYDomain([center - newRange / 2, center + newRange / 2]);
    } else {
        if (isAutoScroll) setIsAutoScroll(true);
        
        const duration = xDomain[1] - xDomain[0];
        const newDuration = Math.max(10000, duration * zoomFactor);
        
        if (isAutoScroll) {
             const lastTime = data[data.length - 1].time;
             setXDomain([lastTime - newDuration, lastTime]);
        } else {
            const center = xDomain[0] + duration / 2;
            setXDomain([center - newDuration / 2, center + newDuration / 2]);
        }
    }
  };

  // --- Data Preparation ---
  
  const visibleData = useMemo(() => {
    if (!xDomain || data.length === 0) return data.slice(-100);
    const duration = xDomain[1] - xDomain[0];
    const minTime = xDomain[0] - duration * 0.5;
    const maxTime = xDomain[1] + duration * 0.5;
    
    const startIndex = data.findIndex(d => d.time >= minTime);
    if (startIndex === -1) return [];
    
    return data.slice(startIndex).filter(d => d.time <= maxTime);
  }, [data, xDomain]);

  const chartYDomain = useMemo(() => {
    if (!isAutoY && yDomain) return yDomain;
    if (visibleData.length === 0) return [0, 100];
    
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < visibleData.length; i++) {
        const p = visibleData[i].price;
        if (p < min) min = p;
        if (p > max) max = p;
    }
    
    const padding = (max - min) * 0.15;
    
    if (min === Infinity) return [0, 100];
    if (min === max) return [min * 0.9, max * 1.1];
    
    return [min - padding, max + padding];
  }, [visibleData, isAutoY, yDomain]);

  const currentPrice = data.length > 0 ? data[data.length - 1].price : 0;
  
  // Decide what UI to show
  const showTopBar = !isWidget || (isWidget && widgetOptions.showTimeframes);
  const showHeaderWidget = isWidget && widgetOptions.showHeader;

  return (
    <div className={`flex flex-col h-full select-none ${isWidget ? '' : 'bg-slate-950'}`}>
      
      {/* Top Bar: Timeframes & Controls */}
      {showTopBar && (
      <div className={`flex items-center justify-between px-3 py-2 ${isWidget ? 'bg-transparent' : 'border-b border-slate-800 bg-slate-900/50'}`}>
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {(!isWidget) && (
             <h1 className="text-sm md:text-base font-bold text-slate-200 tracking-wider whitespace-nowrap flex items-center gap-2">
                {symbol} <span className="text-slate-600 font-normal">/ USD</span>
             </h1>
          )}
          
          {(!isWidget || widgetOptions.showTimeframes) && (
          <>
            {!isWidget && <div className="h-4 w-px bg-slate-800 shrink-0"></div>}
            <div className={`flex gap-0.5 shrink-0 rounded-lg p-0.5 ${isWidget ? 'bg-black/20' : 'bg-slate-900 border border-slate-800'}`}>
                {Object.values(TimeFrame).map((tf) => (
                <button
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                    activeTimeFrame === tf 
                        ? 'bg-slate-700/80 text-emerald-400 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                    }`}
                >
                    {tf}
                </button>
                ))}
            </div>
          </>
          )}
        </div>
        
        <div className="flex items-center gap-2 pl-2">
            <div 
                className={`flex items-center gap-1.5 text-[10px] md:text-xs font-mono px-2 py-1 rounded-md transition-all cursor-pointer ${isAutoScroll ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-300'}`} 
                onClick={() => setIsAutoScroll(true)}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${isAutoScroll ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`}></div>
                {isAutoScroll ? 'LIVE' : 'PAUSED'}
            </div>
            {(!isAutoScroll || !isAutoY) && (
                <button 
                    onClick={() => { setIsAutoScroll(true); setIsAutoY(true); setYDomain(null); }}
                    className="p-1.5 hover:bg-slate-800 rounded text-slate-500 hover:text-white transition-colors"
                    title="Сбросить вид"
                >
                    <RefreshCcw size={14} />
                </button>
            )}
        </div>
      </div>
      )}

      {/* Widget Only Header (Simplified) */}
      {showHeaderWidget && !showTopBar && (
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/10">
            <span className="text-xs font-bold opacity-80">{symbol} / USD</span>
            <span className={`text-xs font-mono ${data.length > 1 && data[data.length-1].price >= data[data.length-2].price ? 'text-emerald-400' : 'text-rose-400'}`}>
                ${currentPrice.toFixed(2)}
            </span>
        </div>
      )}

      {/* Main Chart Container */}
      <div 
        ref={containerRef}
        className={`flex-1 w-full min-h-0 relative touch-none select-none ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onWheel={handleWheel}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#64748b" vertical={false} opacity={0.1} />
            <XAxis 
              dataKey="time" 
              type="number"
              domain={xDomain || ['auto', 'auto']}
              tickFormatter={formatTime} 
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}
              minTickGap={60}
              allowDataOverflow={true}
              height={30}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              hide={isWidget && visibleData.length < 50}
            />
            <YAxis 
              type="number"
              domain={chartYDomain} 
              tickFormatter={(val) => val.toFixed(2)}
              stroke="#64748b"
              orientation="right"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}
              width={60}
              allowDataOverflow={true}
              mirror={false}
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                borderColor: '#334155', 
                color: '#f1f5f9',
                borderRadius: '4px',
                fontSize: '12px',
                padding: '8px 12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }}
              labelFormatter={formatTime}
              formatter={(value: number) => [value.toFixed(2), 'Price']}
              isAnimationActive={false}
              cursor={{ stroke: '#64748b', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={1.5}
              fillOpacity={1} 
              fill="url(#colorPrice)" 
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
        
        {/* Current Price Line Indicator */}
        {chartYDomain && (
            <div 
                className="absolute right-0 w-full pointer-events-none flex items-center justify-end pr-[60px]"
                style={{ 
                    top: `${ 
                        containerRef.current
                        ? Math.max(0, Math.min(containerRef.current.clientHeight - 30, (1 - (currentPrice - chartYDomain[0]) / (chartYDomain[1] - chartYDomain[0])) * (containerRef.current.clientHeight - 30))) 
                        : 0
                    }px`
                }}
            >
                <div className={`h-[1px] w-full border-t border-dashed opacity-40 ${currentPrice > (visibleData[visibleData.length-50]?.price || 0) ? 'border-emerald-500' : 'border-rose-500'}`} style={{ borderColor: color }}></div>
            </div>
        )}

        {/* Custom Y-Axis Interaction Zone (Visual Hint) */}
        {!isWidget && (
        <div 
            className="absolute top-0 right-0 bottom-[30px] w-[60px] cursor-ns-resize hover:bg-white/5 transition-colors border-l border-slate-800/50"
            title="Тяните для масштабирования цены"
        >
            <div 
                className="absolute right-0 w-[60px] flex items-center justify-center pointer-events-none z-10"
                style={{ 
                    top: `${ 
                        chartYDomain && containerRef.current
                        ? Math.max(0, Math.min(containerRef.current.clientHeight - 30, (1 - (currentPrice - chartYDomain[0]) / (chartYDomain[1] - chartYDomain[0])) * (containerRef.current.clientHeight - 30))) 
                        : 0
                    }px`
                }}
            >
                <div className={`text-[11px] font-mono font-bold px-1.5 py-1 rounded-[2px] text-white shadow-lg flex items-center justify-center min-w-[50px] ${currentPrice > (visibleData[visibleData.length-50]?.price || 0) ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                    {currentPrice.toFixed(2)}
                </div>
            </div>
        </div>
        )}

        {/* Widget Mode Simple Label */}
        {isWidget && (
            <div 
                className="absolute right-0 w-[60px] flex items-center justify-center pointer-events-none z-10"
                style={{ 
                    top: `${ 
                        chartYDomain && containerRef.current
                        ? Math.max(0, Math.min(containerRef.current.clientHeight - 30, (1 - (currentPrice - chartYDomain[0]) / (chartYDomain[1] - chartYDomain[0])) * (containerRef.current.clientHeight - 30))) 
                        : 0
                    }px`
                }}
            >
                 <div 
                    className="text-[10px] font-mono font-bold px-1 py-0.5 rounded text-white"
                    style={{ backgroundColor: color }}
                 >
                    {currentPrice.toFixed(2)}
                </div>
            </div>
        )}

        {/* Scroll Reset Arrow */}
        {!isAutoScroll && (
             <div 
                className="absolute right-[80px] bottom-8 p-2 bg-slate-800/80 backdrop-blur border border-slate-700 rounded-full shadow-lg cursor-pointer hover:bg-slate-700 group transition-all"
                onClick={() => setIsAutoScroll(true)}
            >
                <ChevronsRight className="text-emerald-500" size={20} />
            </div>
        )}

      </div>
    </div>
  );
};