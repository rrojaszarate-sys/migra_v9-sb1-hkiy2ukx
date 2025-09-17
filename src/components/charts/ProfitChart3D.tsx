import React, { useMemo, useState, useCallback } from 'react';
import { ProfitChartData } from '../../types/database';
import { 
  CHART_COLORS, 
  SEMANTIC_COLORS, 
  formatChartCurrency, 
  formatChartPercentage,
  getOptimalTextColor,
  getColorWithOpacity,
  getTrendColor,
  debounce
} from '../../utils/chartColors';

interface ProfitChart3DProps {
  data: ProfitChartData;
  width?: number;
  height?: number;
  className?: string;
}

interface ProfitSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  pathData: string;
  shadowPath: string;
  labelX: number;
  labelY: number;
  type: 'income' | 'expense' | 'profit';
}

export function ProfitChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: ProfitChart3DProps) {
  // State for dynamic interactions and analysis
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'basic' | 'detailed'>('basic');

  // Debounced hover handler for smooth interactions
  const debouncedHover = useCallback(
    debounce((segmentLabel: string | null) => {
      setHoveredSegment(segmentLabel);
    }, 100),
    []
  );

  // Enhanced chart data with profit analysis
  const chartSegments = useMemo((): ProfitSegment[] => {
    const total = data.income.amount + data.expenses.amount;
    if (total === 0) return [];

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    const segments = [
      {
        label: 'Ingresos',
        value: data.income.amount,
        percentage: data.income.percentage,
        color: SEMANTIC_COLORS.INCOME,
        type: 'income' as const
      },
      {
        label: 'Gastos',
        value: data.expenses.amount,
        percentage: data.expenses.percentage,
        color: SEMANTIC_COLORS.EXPENSES,
        type: 'expense' as const
      }
    ];

    // Add profit/loss segment if significant
    if (Math.abs(data.profit.amount) > total * 0.01) {
      segments.push({
        label: data.profit.isLoss ? 'Pérdida' : 'Utilidad',
        value: Math.abs(data.profit.amount),
        percentage: Math.abs(data.profit.percentage),
        color: data.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT,
        type: 'profit' as const
      });
    }

    // Calculate paths for each segment
    let currentAngle = -90;
    
    return segments.map((segment) => {
      const angleSpan = (segment.percentage / 100) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSpan;
      
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

      const shadowOffset = 10;
      const shadowPath = [
        `M ${centerX + shadowOffset} ${centerY + shadowOffset}`,
        `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
        'Z'
      ].join(' ');

      const midAngle = startAngle + angleSpan / 2;
      const labelRadius = radius * 0.75;
      const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
      const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

      currentAngle = endAngle;
      
      return {
        ...segment,
        pathData,
        shadowPath,
        labelX,
        labelY
      };
    });
  }, [data, width, height]);

  // Calculate financial insights
  const financialInsights = useMemo(() => {
    const profitMargin = data.income.amount > 0 ? (data.profit.amount / data.income.amount) * 100 : 0;
    const efficiency = data.expenses.amount > 0 ? (data.income.amount / data.expenses.amount) : 0;
    
    return {
      profitMargin,
      efficiency,
      recommendation: efficiency > 1.3 ? 'Excelente' : efficiency > 1.1 ? 'Bueno' : efficiency > 1 ? 'Aceptable' : 'Crítico'
    };
  }, [data]);

  if (chartSegments.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 rounded-lg ${className}`} 
           style={{ backgroundColor: CHART_COLORS.SOFT_GRAY + '20' }}>
        <div className="text-center" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de rentabilidad disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md ${className}`} style={{ backgroundColor: CHART_COLORS.WHITE }}>
      <div className="flex">
        {/* Enhanced 3D Pie Chart */}
        <div className="flex-1 p-6">
          <h3 className="text-lg font-medium mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Análisis de Rentabilidad
          </h3>
          <div className="relative flex justify-center">
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="drop-shadow-xl"
            role="img"
            aria-label={`Análisis de rentabilidad: ${data.profit.isLoss ? 'Pérdida' : 'Utilidad'} de ${formatChartCurrency(Math.abs(data.profit.amount))}`}
          >
            <defs>
              {/* Enhanced gradients with new color scheme */}
              {chartSegments.map((segment, index) => (
                <React.Fragment key={`defs-${index}`}>
                  <radialGradient id={`profitGradient-${index}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={segment.color} stopOpacity="1" />
                    <stop offset="70%" stopColor={segment.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={segment.color} stopOpacity="0.7" />
                  </radialGradient>
                  <filter id={`profitShadow-${index}`}>
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
                fill="rgba(0, 0, 0, 0.3)"
                className="opacity-60"
              />
            ))}
            
            {/* Main slices with enhanced interactivity */}
            {chartSegments.map((segment, index) => {
              const isHovered = hoveredSegment === segment.label;
              const scale = isHovered ? 1.06 : 1;
              
              return (
                <g key={index}>
                  <path
                    d={segment.pathData}
                    fill={`url(#profitGradient-${index})`}
                    stroke={CHART_COLORS.WHITE}
                    strokeWidth="3"
                    filter={`url(#profitShadow-${index})`}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${width/2}px ${height/2}px`
                    }}
                    onMouseEnter={() => debouncedHover(segment.label)}
                    onMouseLeave={() => debouncedHover(null)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${segment.label}: ${formatChartCurrency(segment.value)} (${formatChartPercentage(segment.percentage)})`}
                  />
                  
                  {/* Dynamic labels based on segment size and analysis mode */}
                  {segment.percentage > 10 && (
                    <text
                      x={segment.labelX}
                      y={segment.labelY - (analysisMode === 'detailed' ? 8 : 0)}
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
                  
                  {/* Additional label for detailed mode */}
                  {analysisMode === 'detailed' && segment.percentage > 15 && (
                    <text
                      x={segment.labelX}
                      y={segment.labelY + 8}
                      textAnchor="middle"
                      className="text-xs font-medium pointer-events-none"
                      style={{ 
                        fill: getOptimalTextColor(segment.color),
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {formatChartCurrency(segment.value)}
                    </text>
                  )}
                  
                  {/* Enhanced hover tooltip with financial insights */}
                  {isHovered && (
                    <g className="pointer-events-none">
                      <rect
                        x={segment.labelX - 100}
                        y={segment.labelY - 70}
                        width="200"
                        height="90"
                        fill="rgba(0, 0, 0, 0.95)"
                        rx="8"
                        stroke={CHART_COLORS.MINT_GREEN}
                        strokeWidth="2"
                      />
                      <text
                        x={segment.labelX}
                        y={segment.labelY - 50}
                        textAnchor="middle"
                        className="text-sm font-bold"
                        fill={CHART_COLORS.WHITE}
                      >
                        {segment.label}
                      </text>
                      <text
                        x={segment.labelX}
                        y={segment.labelY - 30}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.SOFT_GRAY}
                      >
                        {formatChartCurrency(segment.value)}
                      </text>
                      <text
                        x={segment.labelX}
                        y={segment.labelY - 12}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.SOFT_GRAY}
                      >
                        Proporción: {formatChartPercentage(segment.percentage)}
                      </text>
                      {segment.type === 'income' && (
                        <text
                          x={segment.labelX}
                          y={segment.labelY - 25}
                          textAnchor="middle"
                          className="text-xs"
                          fill={CHART_COLORS.SOFT_GRAY}
                        >
                          Eficiencia: {financialInsights.efficiency.toFixed(2)}x
                        </text>
                      )}
                      {segment.type === 'profit' && (
                        <text
                          x={segment.labelX}
                          y={segment.labelY + 4}
                          textAnchor="middle"
                          className="text-xs"
                          fill={CHART_COLORS.SOFT_GRAY}
                        >
                          Margen: {formatChartPercentage(financialInsights.profitMargin)}
                        </text>
                      )}
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          </div>
        </div>

        {/* Enhanced Analysis Panel */}
        <div className="flex-1 p-6">
          <div className="space-y-4 min-w-0">
            {/* Dynamic segment breakdown */}
            {chartSegments.map((segment, index) => {
              const isActive = hoveredSegment === segment.label;
              
              return (
                <div 
                  key={index} 
                  className={`rounded-lg p-4 transition-all duration-200 cursor-pointer ${
                    isActive ? 'shadow-md transform scale-102' : 'shadow-sm'
                  }`}
                  style={{ 
                    backgroundColor: isActive ? getColorWithOpacity(segment.color, 0.15) : getColorWithOpacity(CHART_COLORS.SOFT_GRAY, 0.1),
                    borderLeft: `4px solid ${segment.color}`
                  }}
                  onMouseEnter={() => debouncedHover(segment.label)}
                  onMouseLeave={() => debouncedHover(null)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded shadow-sm"
                        style={{ backgroundColor: segment.color }}
                      />
                      <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                        {segment.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                      {formatChartPercentage(segment.percentage)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                      Monto:
                    </span>
                    <span className="font-bold text-lg" style={{ color: segment.color }}>
                      {formatChartCurrency(segment.value)}
                    </span>
                  </div>
                  
                  {/* Show additional insights when active or in detailed mode */}
                  {(isActive || analysisMode === 'detailed') && (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
                      {segment.type === 'income' && (
                        <div className="space-y-1 text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                          <div className="flex justify-between">
                            <span>ROI potencial:</span>
                            <span>{formatChartPercentage(financialInsights.profitMargin)}</span>
                          </div>
                        </div>
                      )}
                      {/* Show additional insights when active */}
                      {isActive && (
                        <div className="flex justify-between text-xs">
                          <span style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                            Tipo:
                          </span>
                          <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                            {segment.type === 'income' ? 'Ingreso' : 
                             segment.type === 'expense' ? 'Gasto' : 'Resultado'}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Simplified Financial Summary */}
            <div 
              className="rounded-lg p-4 mt-4"
              style={{ 
                backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.INCOME, 0.15),
                borderColor: SEMANTIC_COLORS.INCOME
              }}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                    Total Ingresos:
                  </span>
                  <span className="font-bold" style={{ color: SEMANTIC_COLORS.INCOME }}>
                    {formatChartCurrency(data.income.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                    Total Gastos:
                  </span>
                  <span className="font-bold" style={{ color: SEMANTIC_COLORS.EXPENSES }}>
                    {formatChartCurrency(data.expenses.amount)}
                  </span>
                </div>
                <div 
                  className="border-t pt-2" 
                  style={{ borderColor: CHART_COLORS.SOFT_GRAY }}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold text-lg ${
                      data.profit.isLoss ? '' : ''
                    }`} style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      {data.profit.isLoss ? 'Pérdida Neta:' : 'Utilidad Neta:'}
                    </span>
                    <span className={`font-bold text-xl ${
                      data.profit.isLoss ? '' : ''
                    }`} style={{ color: data.profit.isLoss ? SEMANTIC_COLORS.LOSS : SEMANTIC_COLORS.PROFIT }}>
                      {formatChartCurrency(Math.abs(data.profit.amount))}
                    </span>
                  </div>
                  <div className="text-center mt-2">
                    <span className="font-bold text-lg" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                      Margen: {formatChartPercentage(Math.abs(data.profit.percentage))} • 
                      ROI: {formatChartPercentage(financialInsights.profitMargin)}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Dynamic insights based on analysis mode */}
              {analysisMode !== 'basic' && (
                <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
                  <div className="text-center">
                    <span className="text-sm font-medium" style={{ 
                      color: data.profit.isLoss ? CHART_COLORS.MEDIUM_GRAY : CHART_COLORS.MINT_GREEN 
                    }}>
                      Margen: {formatChartPercentage(Math.abs(data.profit.percentage))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Evaluación:</span>
                    <span className="font-medium" style={{ 
                      color: financialInsights.recommendation === 'Excelente' ? CHART_COLORS.MINT_GREEN :
                             financialInsights.recommendation === 'Bueno' ? CHART_COLORS.MINT_GREEN :
                             financialInsights.recommendation === 'Aceptable' ? CHART_COLORS.DARK_GRAY :
                             CHART_COLORS.MEDIUM_GRAY
                    }}>
                      {financialInsights.recommendation}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-6 pb-4">
        <p className="text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
          💡 Pase el cursor sobre segmentos para análisis detallado
        </p>
      </div>
    </div>
  );
}

export default ProfitChart3D;