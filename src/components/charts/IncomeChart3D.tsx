import React, { useMemo, useState, useCallback } from 'react';
import { IncomeChartData } from '../../types/database';
import { 
  CHART_COLORS, 
  SEMANTIC_COLORS, 
  formatChartCurrency, 
  formatChartPercentage,
  getOptimalTextColor,
  getColorWithOpacity,
  validateColorContrast,
  debounce
} from '../../utils/chartColors';

interface IncomeChart3DProps {
  data: IncomeChartData;
  width?: number;
  height?: number;
  className?: string;
}

interface ChartSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  pathData: string;
  shadowPath: string;
  labelX: number;
  labelY: number;
}

export function IncomeChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: IncomeChart3DProps) {
  // State for dynamic interactions
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);

  // Debounced hover handler for performance
  const debouncedHover = useCallback(
    debounce((segmentLabel: string | null) => {
      setHoveredSegment(segmentLabel);
    }, 100),
    []
  );

  const chartData = useMemo(() => {
    const total = data.pending.total + data.paid.total;
    if (total === 0) return [];

    return [
      {
        label: 'Pendiente',
        value: data.pending.total,
        percentage: (data.pending.total / total) * 100,
        color: SEMANTIC_COLORS.PENDING
      },
      {
        label: 'Pagado',
        value: data.paid.total,
        percentage: (data.paid.total / total) * 100,
        color: SEMANTIC_COLORS.PAID
      }
    ].filter(item => item.value > 0);
  }, [data]);

  // Calculate chart segments with paths and label positions
  const chartSegments = useMemo((): ChartSegment[] => {
    if (chartData.length === 0) return [];

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    let currentAngle = -90; // Start from top
    
    return chartData.map((item) => {
      const angleSpan = (item.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      
      // Calculate path coordinates
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angleSpan > 180 ? 1 : 0;
      
      const pathData = [
        `M ${centerX} ${centerY}`,
        `L ${x1} ${y1}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
        'Z'
      ].join(' ');

      // 3D shadow path with new color scheme
      const shadowOffset = 8;
      const shadowPath = [
        `M ${centerX + shadowOffset} ${centerY + shadowOffset}`,
        `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
        'Z'
      ].join(' ');

      // Calculate label position
      const midAngle = startAngle + angleSpan / 2;
      const labelRadius = radius * 0.75;
      const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
      const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

      currentAngle = endAngle;
      
      return {
        ...item,
        pathData,
        shadowPath,
        labelX,
        labelY
      };
    });
  }, [chartData, width, height]);

  // Handle segment selection
  const handleSegmentClick = useCallback((segmentLabel: string) => {
    setSelectedSegment(prev => prev === segmentLabel ? null : segmentLabel);
  }, []);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 bg-gray-50 rounded-lg ${className}`}>
        <div className="text-center" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de ingresos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`} style={{ backgroundColor: CHART_COLORS.WHITE }}>
      <div className="flex">
        {/* Enhanced 3D Pie Chart with Dynamic Labels */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-medium mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Distribución de Ingresos
          </h3>
          <div className="relative flex justify-center">
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="drop-shadow-lg"
            role="img"
            aria-label={`Gráfico de distribución de ingresos: ${formatChartCurrency(data.pending.total + data.paid.total)} total`}
          >
            <defs>
              {/* Enhanced gradients with new color scheme */}
              {chartSegments.map((segment, index) => (
                <React.Fragment key={`defs-${index}`}>
                  <radialGradient id={`incomeGradient-${index}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
                    <stop offset="70%" stopColor={segment.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
                  </radialGradient>
                  <filter id={`incomeShadow-${index}`}>
                    <feDropShadow dx="3" dy="5" stdDeviation="4" floodOpacity="0.3"/>
                  </filter>
                </React.Fragment>
              ))}
            </defs>
            
            {/* Shadow layer for 3D effect */}
            {chartSegments.map((segment, index) => (
              <path
                key={`shadow-${index}`}
                d={segment.shadowPath}
                fill="rgba(0, 0, 0, 0.2)"
                className="opacity-50"
              />
            ))}
            
            {/* Main pie slices with enhanced interactivity */}
            {chartSegments.map((segment, index) => {
              const isHovered = hoveredSegment === segment.label;
              const isSelected = selectedSegment === segment.label;
              const scale = isHovered ? 1.05 : isSelected ? 1.03 : 1;
              
              return (
                <g key={index}>
                  <path
                    d={segment.pathData}
                    fill={`url(#incomeGradient-${index})`}
                    stroke={CHART_COLORS.WHITE}
                    strokeWidth="3"
                    filter={`url(#incomeShadow-${index})`}
                    className="transition-all duration-200 cursor-pointer"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${width/2}px ${height/2}px`
                    }}
                    onMouseEnter={() => debouncedHover(segment.label)}
                    onMouseLeave={() => debouncedHover(null)}
                    onClick={() => handleSegmentClick(segment.label)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${segment.label}: ${formatChartCurrency(segment.value)} (${formatChartPercentage(segment.percentage)})`}
                  />
                  
                  {/* Dynamic percentage labels on segments */}
                  {segment.percentage > 10 && (
                    <text
                      x={segment.labelX}
                      y={segment.labelY}
                      textAnchor="middle"
                      className="text-sm font-bold pointer-events-none"
                      style={{ 
                        fill: getOptimalTextColor(segment.color),
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {formatChartPercentage(segment.percentage)}
                    </text>
                  )}
                  
                  {/* Enhanced hover tooltip */}
                  {isHovered && (
                    <g className="pointer-events-none">
                      <rect
                        x={segment.labelX - 80}
                        y={segment.labelY - 50}
                        width="160"
                        height="60"
                        fill="rgba(0, 0, 0, 0.9)"
                        rx="8"
                        stroke={CHART_COLORS.SOFT_GRAY}
                        strokeWidth="1"
                      />
                      <text
                        x={segment.labelX}
                        y={segment.labelY - 25}
                        textAnchor="middle"
                        className="text-sm font-bold"
                        fill={CHART_COLORS.WHITE}
                      >
                        {segment.label}
                      </text>
                      <text
                        x={segment.labelX}
                        y={segment.labelY - 8}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.WHITE}
                      >
                        {formatChartCurrency(segment.value)}
                      </text>
                      <text
                        x={segment.labelX}
                        y={segment.labelY + 8}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.MINT_GREEN}
                      >
                        {formatChartPercentage(segment.percentage)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          </div>
        </div>
        
        {/* Enhanced Legend with Interactive Elements */}
        <div className="w-80 p-6" style={{ borderLeft: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
          <h4 className="text-md font-semibold mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Detalles por Categoría
          </h4>
          
          {chartSegments.map((segment, index) => {
            const isActive = hoveredSegment === segment.label || selectedSegment === segment.label;
            
            return (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  isActive ? 'shadow-md' : 'shadow-sm'
                }`}
                style={{
                  backgroundColor: isActive ? getColorWithOpacity(segment.color, 0.15) : CHART_COLORS.WHITE,
                  borderColor: isActive ? segment.color : CHART_COLORS.SOFT_GRAY
                }}
                onMouseEnter={() => setHoveredSegment(segment.label)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => handleSegmentClick(segment.label)}
              >
                <div className="flex items-center mb-2">
                  <div
                    className="w-4 h-4 rounded-full mr-3 border-2"
                    style={{
                      backgroundColor: segment.color,
                      borderColor: CHART_COLORS.WHITE
                    }}
                  />
                  <span className="font-semibold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                    {segment.label}
                  </span>
                  <span 
                    className="ml-auto text-sm font-medium"
                    style={{ color: segment.color }}
                  >
                    {formatChartPercentage(segment.percentage)}
                  </span>
                </div>
                
                {/* Simplified amount display */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                    Monto:
                  </span>
                  <span className="font-bold text-lg" style={{ color: segment.color }}>
                    {formatChartCurrency(segment.value)}
                  </span>
                </div>
                
                {/* Show additional insights when active */}
                {isActive && (
                  <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                        Proporción:
                      </span>
                      <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                        {segment.value > 0 ? `${Math.round(segment.percentage)}% del total` : '0%'}
                      </span>
                    </div>
                    {segment.label === 'Pendiente' && (
                      <div className="flex justify-between text-xs mt-1">
                        <span style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                          Estado:
                        </span>
                        <span className="font-medium" style={{ color: CHART_COLORS.DARK_GRAY }}>
                          Por cobrar
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          
          {/* Enhanced Summary with Dynamic Calculations */}
          <div 
            className="rounded-lg p-4 border-2"
            style={{ 
              backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.INCOME, 0.15),
              borderColor: SEMANTIC_COLORS.INCOME
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                Total General:
              </span>
              <span className="font-bold text-xl" style={{ color: CHART_COLORS.MINT_GREEN }}>
                {formatChartCurrency(data.pending.total + data.paid.total)}
              </span>
            </div>
            
            {/* Simplified Summary */}
            <div className="space-y-1 text-xs" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
              <div className="flex justify-between">
                <span>Efectividad de cobro:</span>
                <span className="font-medium">
                  {data.pending.total + data.paid.total > 0 
                    ? formatChartPercentage((data.paid.total / (data.pending.total + data.paid.total)) * 100)
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Pendiente por cobrar:</span>
                <span className="font-medium">
                  {formatChartCurrency(data.pending.total)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
          💡 Haga clic en los segmentos para seleccionar • Pase el cursor para ver detalles
        </p>
      </div>
    </div>
  );
}

export default IncomeChart3D;