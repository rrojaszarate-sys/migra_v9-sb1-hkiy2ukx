import React, { useMemo, useState, useCallback } from 'react';
import { 
  CHART_COLORS, 
  SEMANTIC_COLORS, 
  formatChartPercentage,
  getColorWithOpacity,
  getTrendColor,
  getDataTypeColors,
  debounce
} from '../../utils/chartColors';

interface MonthlyEventsData {
  month: string;
  year: number;
  eventCount: number;
  monthName: string;
}

interface MonthlyEventsChartProps {
  data: MonthlyEventsData[];
  width?: number;
  height?: number;
  className?: string;
}

interface EnhancedMonthData extends MonthlyEventsData {
  barHeight: number;
  x: number;
  y: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  isCurrentMonth: boolean;
}

export function MonthlyEventsChart({ 
  data, 
  width = 600, 
  height = 400, 
  className = '' 
}: MonthlyEventsChartProps) {
  // State for dynamic interactions
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'count' | 'percentage' | 'trend'>('count');

  // Debounced hover for performance
  const debouncedHover = useCallback(
    debounce((month: string | null) => {
      setHoveredMonth(month);
    }, 100),
    []
  );

  // Enhanced chart data with trend analysis
  const chartData = useMemo((): EnhancedMonthData[] => {
    const months = [
      'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
      'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
    ];
    
    const currentDate = new Date();
    const currentMonthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const last12Months: EnhancedMonthData[] = [];
    
    // Generate last 12 months of data
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      const existingData = data.find(d => d.month === monthKey);
      const eventCount = existingData?.eventCount || 0;
      
      last12Months.push({
        month: monthKey,
        year: date.getFullYear(),
        eventCount,
        monthName: months[date.getMonth()],
        barHeight: 0, // Will be calculated below
        x: 0, // Will be calculated below
        y: 0, // Will be calculated below
        percentage: 0, // Will be calculated below
        trend: 'stable', // Will be calculated below
        isCurrentMonth: monthKey === currentMonthKey
      });
    }
    
    // Calculate percentages and trends
    const totalEvents = last12Months.reduce((sum, item) => sum + item.eventCount, 0);
    const maxValue = Math.max(...last12Months.map(item => item.eventCount), 1);
    const barWidth = (width - 120) / last12Months.length - 10;
    const maxBarHeight = height - 120;
    const chartStartX = 60;
    const chartStartY = height - 60;
    
    return last12Months.map((item, index) => {
      const percentage = totalEvents > 0 ? (item.eventCount / totalEvents) * 100 : 0;
      const barHeight = (item.eventCount / maxValue) * maxBarHeight;
      const x = chartStartX + 20 + index * (barWidth + 10);
      const y = chartStartY - barHeight;
      
      // Calculate trend compared to previous month
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (index > 0) {
        const prevCount = last12Months[index - 1].eventCount;
        if (item.eventCount > prevCount) trend = 'up';
        else if (item.eventCount < prevCount) trend = 'down';
      }
      
      return {
        ...item,
        percentage,
        barHeight,
        x,
        y,
        trend,
        isCurrentMonth: item.month === currentMonthKey
      };
    });
  }, [data, width, height]);


  // Handle month selection for comparison
  const handleMonthToggle = useCallback((monthKey: string) => {
    setSelectedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  }, []);

  // Calculate statistics for selected months
  const selectionStats = useMemo(() => {
    if (selectedMonths.size === 0) return null;
    
    const selectedData = chartData.filter(item => selectedMonths.has(item.month));
    const totalSelected = selectedData.reduce((sum, item) => sum + item.eventCount, 0);
    const avgSelected = totalSelected / selectedData.length;
    
    return {
      total: totalSelected,
      average: avgSelected,
      months: selectedData.length,
      peak: Math.max(...selectedData.map(item => item.eventCount)),
      peakMonth: selectedData.find(item => item.eventCount === Math.max(...selectedData.map(i => i.eventCount)))
    };
  }, [chartData, selectedMonths]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 rounded-lg ${className}`} 
           style={{ backgroundColor: CHART_COLORS.SOFT_GRAY + '20' }}>
        <div className="text-center" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de eventos disponibles</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...chartData.map(item => item.eventCount), 1);
  const barWidth = (width - 120) / chartData.length - 10;
  const maxBarHeight = height - 120;
  const chartStartX = 60;
  const chartStartY = height - 60;

  return (
    <>
      <div className={`rounded-lg shadow-md ${className}`} style={{ backgroundColor: CHART_COLORS.WHITE }}>
      <div className="flex">
        {/* Enhanced 3D Bar Chart */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-medium mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Distribución Mensual de Eventos
          </h3>
          <div className="relative">
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="drop-shadow-lg"
            role="img"
            aria-label={`Gráfico de eventos mensuales: ${chartData.reduce((sum, item) => sum + item.eventCount, 0)} eventos en 12 meses`}
          >
            <defs>
              {/* Enhanced gradients with new color scheme */}
              <linearGradient id="barGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={CHART_COLORS.MINT_GREEN} />
                <stop offset="50%" stopColor={CHART_COLORS.DARK_GRAY} />
                <stop offset="100%" stopColor={CHART_COLORS.MEDIUM_GRAY} />
              </linearGradient>
              <linearGradient id="currentMonthGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={CHART_COLORS.MINT_GREEN} />
                <stop offset="100%" stopColor={CHART_COLORS.MINT_GREEN} stopOpacity="0.8" />
              </linearGradient>
              <filter id="barShadow">
                <feDropShadow dx="4" dy="6" stdDeviation="3" floodOpacity="0.3"/>
              </filter>
              <pattern id="monthlyGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke={CHART_COLORS.SOFT_GRAY} strokeWidth="1" opacity="0.3"/>
              </pattern>
            </defs>
            
            <rect width="100%" height="100%" fill="url(#monthlyGrid)" />
            
            {/* Enhanced Axes with dynamic labels */}
            <line
              x1={chartStartX}
              y1="40"
              x2={chartStartX}
              y2={chartStartY}
              stroke={CHART_COLORS.DARK_GRAY}
              strokeWidth="2"
            />
            <line
              x1={chartStartX}
              y1={chartStartY}
              x2={width - 20}
              y2={chartStartY}
              stroke={CHART_COLORS.DARK_GRAY}
              strokeWidth="2"
            />
            
            {/* Dynamic Y-axis labels */}
            {[0, Math.ceil(maxValue * 0.25), Math.ceil(maxValue * 0.5), Math.ceil(maxValue * 0.75), maxValue].map((value) => {
              const y = chartStartY - (value / maxValue) * maxBarHeight;
              return (
                <g key={value}>
                  <line
                    x1={chartStartX - 5}
                    y1={y}
                    x2={chartStartX}
                    y2={y}
                    stroke={CHART_COLORS.DARK_GRAY}
                    strokeWidth="1"
                  />
                  <text
                    x={chartStartX - 10}
                    y={y + 4}
                    textAnchor="end"
                    className="text-xs"
                    fill={SEMANTIC_COLORS.TEXT_SECONDARY}
                  >
                    {value}
                  </text>
                </g>
              );
            })}
            
            {/* Enhanced 3D Bars with Dynamic Labels */}
            {chartData.map((item, index) => {
              const isHovered = hoveredMonth === item.month;
              const isSelected = selectedMonths.has(item.month);
              const isCurrent = item.isCurrentMonth;
              
              // 3D effect parameters
              const depth = 12;
              const shadowOffset = 6;
              const scale = isHovered ? 1.05 : isSelected ? 1.02 : 1;
              const opacity = selectedMonths.size > 0 && !isSelected ? 0.7 : 1;
              
              // Choose gradient based on state
              const gradientId = isCurrent ? 'currentMonthGradient' : 'barGradient';
              const barColor = isCurrent ? SEMANTIC_COLORS.PRIMARY : 
                              isSelected ? SEMANTIC_COLORS.SELECTED : 
                              getTrendColor(item.trend, item.eventCount);
              
              return (
                <g key={index}>
                  {/* Shadow */}
                  <rect
                    x={item.x + shadowOffset}
                    y={item.y + shadowOffset}
                    width={barWidth}
                    height={item.barHeight}
                    fill="rgba(0, 0, 0, 0.2)"
                    rx="4"
                  />
                  
                  {/* 3D side face */}
                  <polygon
                    points={`${item.x + barWidth},${item.y} ${item.x + barWidth + depth},${item.y - depth} ${item.x + barWidth + depth},${chartStartY - depth} ${item.x + barWidth},${chartStartY}`}
                    fill={barColor}
                    opacity="0.7"
                    style={{ opacity }}
                  />
                  
                  {/* 3D top face */}
                  <polygon
                    points={`${item.x},${item.y} ${item.x + depth},${item.y - depth} ${item.x + barWidth + depth},${item.y - depth} ${item.x + barWidth},${item.y}`}
                    fill={barColor}
                    opacity="0.9"
                    style={{ opacity }}
                  />
                  
                  {/* Main bar face with enhanced interactivity */}
                  <rect
                    x={item.x}
                    y={item.y}
                    width={barWidth}
                    height={item.barHeight}
                    fill={`url(#${gradientId})`}
                    filter="url(#barShadow)"
                    rx="4"
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${item.x + barWidth/2}px ${chartStartY}px`,
                      opacity
                    }}
                    onMouseEnter={() => debouncedHover(item.month)}
                    onMouseLeave={() => debouncedHover(null)}
                    onClick={() => handleMonthToggle(item.month)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.monthName} ${item.year}: ${item.eventCount} eventos (${formatChartPercentage(item.percentage)})`}
                  />
                  
                  {/* Dynamic value labels above bars */}
                  <text
                    x={item.x + barWidth / 2}
                    y={item.y - 12}
                    textAnchor="middle"
                    className={`text-xs font-bold transition-all duration-200 ${
                      isHovered ? 'text-sm' : ''
                    }`}
                    fill={isHovered ? CHART_COLORS.MINT_GREEN : SEMANTIC_COLORS.TEXT_PRIMARY}
                  >
                    {viewMode === 'percentage' ? formatChartPercentage(item.percentage) : item.eventCount}
                  </text>
                  
                  {/* Month labels */}
                  <text
                    x={item.x + barWidth / 2}
                    y={chartStartY + 15}
                    textAnchor="middle"
                    className="text-xs font-medium"
                    fill={isCurrent ? CHART_COLORS.MINT_GREEN : SEMANTIC_COLORS.TEXT_SECONDARY}
                  >
                    {item.monthName}
                  </text>
                  
                  {/* Year labels (only when year changes) */}
                  {(index === 0 || item.year !== chartData[index - 1]?.year) && (
                    <text
                      x={item.x + barWidth / 2}
                      y={chartStartY + 30}
                      textAnchor="middle"
                      className="text-xs font-medium"
                      fill={SEMANTIC_COLORS.TEXT_TERTIARY}
                    >
                      {item.eventCount}
                    </text>
                  )}
                  
                  {/* Current month indicator */}
                  {isCurrent && (
                    <rect
                      x={item.x - 2}
                      y={chartStartY + 35}
                      width={barWidth + 4}
                      height="3"
                      fill={CHART_COLORS.MINT_GREEN}
                      rx="1.5"
                    />
                  )}
                  
                  {/* Enhanced hover tooltip */}
                  {isHovered && (
                    <g className="pointer-events-none">
                      <rect
                        x={item.x + barWidth / 2 - 80}
                        y={item.y - 80}
                        width="160"
                        height="60"
                        fill="rgba(0, 0, 0, 0.95)"
                        rx="8"
                        stroke={CHART_COLORS.MINT_GREEN}
                        strokeWidth="2"
                      />
                      <text
                        x={item.x + barWidth / 2}
                        y={item.y - 55}
                        textAnchor="middle"
                        className="text-sm font-bold"
                        fill={CHART_COLORS.WHITE}
                      >
                        {item.monthName} {item.year}
                      </text>
                      <text
                        x={item.x + barWidth / 2}
                        y={item.y - 38}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.WHITE}
                      >
                        Eventos: {item.eventCount}
                      </text>
                      <text
                        x={item.x + barWidth / 2}
                        y={item.y - 22}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.MINT_GREEN}
                      >
                        {formatChartPercentage(item.percentage)} del total
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
            
            {/* Chart title */}
            <text
              x={width / 2}
              y="25"
              textAnchor="middle"
              className="text-sm font-semibold"
              fill={SEMANTIC_COLORS.TEXT_PRIMARY}
            >
                Eventos por Mes - Últimos 12 Meses
            </text>
          </svg>
          </div>
        </div>

        {/* Right-side Statistics Panel */}
        <div className="w-80 p-6 border-l" style={{ borderColor: CHART_COLORS.SOFT_GRAY }}>
          <h4 className="text-md font-semibold mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Estadísticas Mensuales
          </h4>
          <div className="space-y-4">
            <div 
              className="rounded-lg p-4 text-center"
              style={{ 
                backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.PRIMARY, 0.15),
                border: `2px solid ${SEMANTIC_COLORS.PRIMARY}`
              }}
            >
              <div className="text-2xl font-bold" style={{ color: SEMANTIC_COLORS.PRIMARY }}>
                {chartData.reduce((sum, item) => sum + item.eventCount, 0)}
              </div>
              <div className="text-sm" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Total Eventos
              </div>
            </div>
            
            <div 
              className="rounded-lg p-4 text-center"
              style={{ backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.SECONDARY, 0.15) }}
            >
              <div className="text-2xl font-bold" style={{ color: SEMANTIC_COLORS.SECONDARY }}>
                {Math.round(chartData.reduce((sum, item) => sum + item.eventCount, 0) / 12)}
              </div>
              <div className="text-sm" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Promedio Mensual
              </div>
            </div>
            
            <div 
              className="rounded-lg p-4 text-center"
              style={{ backgroundColor: CHART_COLORS.MEDIUM_GRAY + '15' }}
            >
              <div className="text-2xl font-bold" style={{ color: CHART_COLORS.MEDIUM_GRAY }}>
                {Math.max(...chartData.map(item => item.eventCount))}
              </div>
              <div className="text-sm" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                Mes Pico
              </div>
              <div className="text-xs mt-1" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                {chartData.find(item => item.eventCount === Math.max(...chartData.map(i => i.eventCount)))?.monthName || 'N/A'}
              </div>
            </div>
            
            {hoveredMonth && (
              <div 
                className="rounded-lg p-4 border-2"
                style={{ 
                  backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.HOVER, 0.1),
                  borderColor: SEMANTIC_COLORS.HOVER
                }}
              >
                <h5 className="font-medium mb-2" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                  Mes Seleccionado
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Período:</span>
                    <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {chartData.find(item => item.month === hoveredMonth)?.monthName} {chartData.find(item => item.month === hoveredMonth)?.year}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Eventos:</span>
                    <span className="font-bold" style={{ color: CHART_COLORS.MINT_GREEN }}>
                      {chartData.find(item => item.month === hoveredMonth)?.eventCount || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Selection Analysis Panel */}
            {selectedMonths.size > 0 && selectionStats && (
              <div 
                className="rounded-lg p-4 border-2"
                style={{ 
                  backgroundColor: CHART_COLORS.DARK_GRAY + '10',
                  borderColor: CHART_COLORS.DARK_GRAY
                }}
              >
                <h5 className="font-medium mb-2" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                  Meses Seleccionados
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Cantidad:</span>
                    <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {selectionStats.months} meses
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Total eventos:</span>
                    <span className="font-bold" style={{ color: CHART_COLORS.DARK_GRAY }}>
                      {selectionStats.total}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>Promedio:</span>
                    <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {Math.round(selectionStats.average)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
            </div>
          </div>
        </div>
      
      {/* Interactive Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
          💡 Haga clic en barras para seleccionar meses • Pase el cursor para detalles
        </p>
      </div>
    </>
  );
}

export default MonthlyEventsChart;