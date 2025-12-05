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
      textColor?: string;
      showGrid?: boolean;
      strokeWidth?: number;
      fillOpacity?: number;
  }
}

export const TradingChart: React.FC<TradingChartProps> = ({ 
  data, 
  color, 
  symbol,
  activeTimeFrame,
  onTimeFrameChange,
  isWidget = false,
  widgetOptions = { 
    showHeader: true, 
    showTimeframes: false,
    textColor: '#94a3b8',
    showGrid: true,
    strokeWidth: 2,
    fillOpacity: 0.15
  }
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textColor = widgetOptions.textColor || '#94a3b8'; // Default slate-400
  
  // Viewport State
  const [xDomain, setXDomain] = useState<[number, number] | null>(null);
  const [yDomain, setYDomain] = useState<[number, number] | null>(null);
  const [isAutoScroll, setIsAutoScroll] = useState(true);
  const [isAutoY, setIsAutoY] = useState(true);

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [isResizingY, setIsResizingY] = useState(false);
  const [isPinching, setIsPinching] = useState(false);
  
  // Refs for smooth tracking
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);
  const lastTouchDist = useRef<number | null>(null);

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

  const setTimeFrame = (tf: TimeFrame) => {
    onTimeFrameChange(tf);
    if (data.length === 0) return;
    
    const lastTime = data[data.length - 1].time;
    const duration = getDurationFromTimeFrame(tf);

    setXDomain([lastTime - duration, lastTime]);
    setIsAutoScroll(true);
  };

  // --- Mobile Pinch Helpers ---

  const getTouchDistance = (touches: React.TouchList) => {
    if (touches.length < 2) return null;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // --- Event Handlers (Mouse) ---

  const handleMouseDown = (e: React.MouseEvent) => {
    const containerWidth = containerRef.current?.clientWidth || 0;
    const isOverYAxis = e.nativeEvent.offsetX > containerWidth - 60;

    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    if (isOverYAxis) {
        setIsResizingY(true);
        setIsAutoY(false);
    } else {
        setIsDragging(true);
        setIsAutoScroll(false);
        document.body.style.cursor = 'grabbing';
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if ((!isDragging && !isResizingY) || !lastPointerPos.current || !xDomain) return;

    const dx = e.clientX - lastPointerPos.current.x;
    const dy = e.clientY - lastPointerPos.current.y;
    lastPointerPos.current = { x: e.clientX, y: e.clientY };

    if (isDragging) {
        const containerWidth = containerRef.current?.clientWidth || 1;
        const duration = xDomain[1] - xDomain[0];
        const msPerPx = duration / containerWidth;
        const timeShift = dx * msPerPx; 
        setXDomain([xDomain[0] - timeShift, xDomain[1] - timeShift]);
    }

    if (isResizingY && yDomain) {
        const scaleFactor = 1 + (dy * 0.005); 
        const currentMin = yDomain[0];
        const currentMax = yDomain[1];
        const range = currentMax - currentMin;
        const center = currentMin + range / 2;
        const newRange = range * scaleFactor;
        setYDomain([center - newRange / 2, center + newRange / 2]);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizingY(false);
    lastPointerPos.current = null;
    document.body.style.cursor = 'default';
  };

  // --- Event Handlers (Touch - Multi-touch support) ---

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!xDomain) return;
    
    // Stop auto scroll on interaction
    setIsAutoScroll(false);

    if (e.touches.length === 2) {
        // Start Pinch
        const dist = getTouchDistance(e.touches);
        if (dist) {
            lastTouchDist.current = dist;
            setIsPinching(true);
            setIsDragging(false); // Disable drag while pinching
        }
    } else if (e.touches.length === 1) {
        // Start Drag
        const touch = e.touches[0];
        const containerWidth = containerRef.current?.clientWidth || 0;
        const rect = containerRef.current?.getBoundingClientRect();
        
        if (rect) {
            const relativeX = touch.clientX - rect.left;
            const isOverYAxis = relativeX > containerWidth - 60;

            lastPointerPos.current = { x: touch.clientX, y: touch.clientY };

            if (isOverYAxis) {
                setIsResizingY(true);
                setIsAutoY(false);
            } else {
                setIsDragging(true);
            }
        }
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!xDomain) return;
    
    // 1. PINCH ZOOM (2 fingers)
    if (e.touches.length === 2 && lastTouchDist.current) {
        const newDist = getTouchDistance(e.touches);
        if (newDist) {
            const zoomFactor = lastTouchDist.current / newDist;
            lastTouchDist.current = newDist;

            // Apply Zoom
            const currentDuration = xDomain[1] - xDomain[0];
            const newDuration = Math.max(1000 * 60, currentDuration * zoomFactor); // Min 1 min zoom
            
            const center = xDomain[0] + currentDuration / 2;
            setXDomain([center - newDuration / 2, center + newDuration / 2]);
        }
        return;
    }

    // 2. DRAG PAN (1 finger)
    if (e.touches.length === 1 && isDragging && lastPointerPos.current && !isPinching) {
        const touch = e.touches[0];
        const dx = touch.clientX - lastPointerPos.current.x;
        lastPointerPos.current = { x: touch.clientX, y: touch.clientY };

        const containerWidth = containerRef.current?.clientWidth || 1;
        const duration = xDomain[1] - xDomain[0];
        const msPerPx = duration / containerWidth;
        const timeShift = dx * msPerPx; 
        
        setXDomain([xDomain[0] - timeShift, xDomain[1] - timeShift]);
    }
    
    // 3. Y-AXIS RESIZE (1 finger on right edge)
    if (e.touches.length === 1 && isResizingY && lastPointerPos.current && yDomain) {
        const touch = e.touches[0];
        const dy = touch.clientY - lastPointerPos.current.y;
        lastPointerPos.current = { x: touch.clientX, y: touch.clientY };

        const scaleFactor = 1 + (dy * 0.005); 
        const currentMin = yDomain[0];
        const currentMax = yDomain[1];
        const range = currentMax - currentMin;
        const center = currentMin + range / 2;
        const newRange = range * scaleFactor;
        
        setYDomain([center - newRange / 2, center + newRange / 2]);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setIsPinching(false);
    setIsResizingY(false);
    lastPointerPos.current = null;
    lastTouchDist.current = null;
  };

  // --- Wheel Zoom (Desktop) ---

  const handleWheel = (e: React.WheelEvent) => {
    if (!xDomain) return;
    // Removed preventDefault here to allow page scroll if not over active area, 
    // but typically we want to capture zoom.
    
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
        const newDuration = Math.max(60000, duration * zoomFactor); // Min 1 min
        
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
            <div className={`flex gap-0.5 shrink-0 rounded-lg p-0.5 ${isWidget ? 'bg-black/10' : 'bg-slate-900 border border-slate-800'}`}>
                {Object.values(TimeFrame).map((tf) => (
                <button
                    key={tf}
                    onClick={() => setTimeFrame(tf)}
                    className={`px-3 py-1 text-[11px] font-medium rounded-md transition-all ${
                    activeTimeFrame === tf 
                        ? 'bg-slate-700/80 text-emerald-400 shadow-sm' 
                        : 'hover:bg-slate-800/50'
                    }`}
                    style={{ color: activeTimeFrame === tf ? color : textColor, opacity: activeTimeFrame === tf ? 1 : 0.6 }}
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
                className={`flex items-center gap-1.5 text-[10px] md:text-xs font-mono px-2 py-1 rounded-md transition-all cursor-pointer ${isAutoScroll ? '' : 'opacity-60 hover:opacity-100'}`} 
                style={{ color: isAutoScroll ? color : textColor }}
                onClick={() => setIsAutoScroll(true)}
            >
                <div className={`w-1.5 h-1.5 rounded-full ${isAutoScroll ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-700'}`} style={{ backgroundColor: isAutoScroll ? color : undefined }}></div>
                {isAutoScroll ? 'LIVE' : 'PAUSED'}
            </div>
            {(!isAutoScroll || !isAutoY) && (
                <button 
                    onClick={() => { setIsAutoScroll(true); setIsAutoY(true); setYDomain(null); }}
                    className="p-1.5 hover:bg-slate-800 rounded transition-colors"
                    style={{ color: textColor }}
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
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800/10" style={{ borderColor: `${textColor}20` }}>
            <span className="text-xs font-bold opacity-80" style={{ color: textColor }}>{symbol} / USD</span>
            <span className={`text-xs font-mono font-bold`} style={{ color: data.length > 1 && data[data.length-1].price >= data[data.length-2].price ? color : '#f43f5e' }}>
                ${currentPrice.toFixed(2)}
            </span>
        </div>
      )}

      {/* Main Chart Container */}
      <div 
        ref={containerRef}
        className={`flex-1 w-full min-h-0 relative touch-none select-none ${isDragging || isPinching ? 'cursor-grabbing' : 'cursor-crosshair'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={visibleData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={widgetOptions.fillOpacity ?? 0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            {widgetOptions.showGrid !== false && (
                <CartesianGrid strokeDasharray="3 3" stroke={textColor} vertical={false} opacity={0.1} />
            )}
            <XAxis 
              dataKey="time" 
              type="number"
              domain={xDomain || ['auto', 'auto']}
              tickFormatter={formatTime} 
              stroke={textColor}
              tick={{ fill: textColor, fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}
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
              stroke={textColor}
              orientation="right"
              tick={{ fill: textColor, fontSize: 10, fontFamily: 'monospace', opacity: 0.7 }}
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
              cursor={{ stroke: textColor, strokeWidth: 1, strokeDasharray: '4 4', opacity: 0.5 }}
            />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={widgetOptions.strokeWidth ?? 1.5}
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
                <div className="h-[1px] w-full border-t border-dashed opacity-40" style={{ borderColor: color }}></div>
            </div>
        )}

        {/* Custom Y-Axis Interaction Zone (Visual Only) */}
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
                <div className={`text-[11px] font-mono font-bold px-1.5 py-1 rounded-[2px] text-white shadow-lg flex items-center justify-center min-w-[50px]`} style={{ backgroundColor: color }}>
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
                    className="text-[10px] font-mono font-bold px-1 py-0.5 rounded text-white shadow-sm"
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
                <ChevronsRight className="text-emerald-500" size={20} style={{ color }} />
            </div>
        )}

      </div>
    </div>
  );
};