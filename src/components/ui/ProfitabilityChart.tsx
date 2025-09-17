import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { calculateProfit } from '../../utils/financial';
import { formatChartCurrency } from '../../utils/chartColors';

interface ProfitabilityChartProps {
  incomeTotal: number;
  expensesTotal: number;
  className?: string;
  showExportOptions?: boolean;
  onExport?: (format: 'png' | 'pdf') => void;
  height?: number;
  width?: number;
  chartType?: 'pie' | 'donut' | 'bar' | 'line';
}

interface ChartSegment {
  label: string;
  value: number;
  percentage: number;
  color: string;
  startAngle: number;
  endAngle: number;
}

export function ProfitabilityChart({ 
  incomeTotal, 
  expensesTotal, 
  className = '',
  showExportOptions = true,
  onExport,
  height = 300,
  width = 300,
  chartType = 'donut'
}: ProfitabilityChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [currentChartType, setCurrentChartType] = useState(chartType);
  const chartRef = useRef<SVGSVGElement>(null);

  // Calculate profit data with performance optimization
  const profitData = useMemo(() => 
    calculateProfit(incomeTotal, expensesTotal), 
    [incomeTotal, expensesTotal]
  );

  // Generate chart segments with memoization
  const chartSegments = useMemo((): ChartSegment[] => {
    const total = incomeTotal + expensesTotal;
    if (total === 0) return [];

    const segments: ChartSegment[] = [];
    let currentAngle = -90; // Start from top

    // Income segment
    if (incomeTotal > 0) {
      const percentage = (incomeTotal / total) * 100;
      const angleSpan = (percentage / 100) * 360;
      segments.push({
        label: 'Ingresos',
        value: incomeTotal,
        percentage,
        color: '#74F1C8', // Mint Green
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan
      });
      currentAngle += angleSpan;
    }

    // Expenses segment
    if (expensesTotal > 0) {
      const percentage = (expensesTotal / total) * 100;
      const angleSpan = (percentage / 100) * 360;
      segments.push({
        label: 'Gastos',
        value: expensesTotal,
        percentage,
        color: '#6E7C89', // Dark Gray
        startAngle: currentAngle,
        endAngle: currentAngle + angleSpan
      });
    }

    return segments;
  }, [incomeTotal, expensesTotal]);

  // Animation effect
  useEffect(() => {
    setIsAnimating(true);
    const timer = setTimeout(() => setIsAnimating(false), 1000);
    return () => clearTimeout(timer);
  }, [chartSegments, currentChartType]);

  // Create SVG path for donut segment
  const createArcPath = useCallback((
    centerX: number,
    centerY: number,
    radius: number,
    innerRadius: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const innerStart = polarToCartesian(centerX, centerY, innerRadius, endAngle);
    const innerEnd = polarToCartesian(centerX, centerY, innerRadius, startAngle);

    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "L", innerEnd.x, innerEnd.y,
      "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
      "Z"
    ].join(" ");
  }, []);

  // Convert polar coordinates to cartesian
  const polarToCartesian = useCallback((
    centerX: number,
    centerY: number,
    radius: number,
    angleInDegrees: number
  ) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  }, []);

  // Handle export functionality
  const handleExport = useCallback(async (format: 'png' | 'pdf') => {
    if (!chartRef.current) return;

    try {
      if (format === 'png') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;

        const svgData = new XMLSerializer().serializeToString(chartRef.current);
        const img = new Image();
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);

        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          
          const link = document.createElement('a');
          link.download = `profitability-chart-${new Date().toISOString().split('T')[0]}.png`;
          link.href = pngUrl;
          link.click();
          
          URL.revokeObjectURL(url);
        };
        
        img.src = url;
      }

      onExport?.(format);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [width, height, onExport]);

  // Render 3D Bar Chart
  const render3DBarChart = () => {
    const barWidth = 60;
    const barSpacing = 80;
    const maxHeight = 200;
    const maxValue = Math.max(incomeTotal, expensesTotal);
    
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm">
        {/* Income Bar */}
        <g transform={`translate(${width/2 - barSpacing}, ${height - 50})`}>
          <defs>
            <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#74F1C8" />
              <stop offset="100%" stopColor="#74F1C8" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y={-((incomeTotal / maxValue) * maxHeight)}
            width={barWidth}
            height={(incomeTotal / maxValue) * maxHeight}
            fill="url(#incomeGradient)"
            className="transition-all duration-500"
            style={{
              transform: isAnimating ? 'scaleY(0)' : 'scaleY(1)',
              transformOrigin: 'bottom'
            }}
          />
          <text x={barWidth/2} y="20" textAnchor="middle" className="text-sm font-medium">
            Ingresos
          </text>
          <text x={barWidth/2} y="35" textAnchor="middle" className="text-xs text-gray-600">
            {formatChartCurrency(incomeTotal)}
          </text>
        </g>

        {/* Expenses Bar */}
        <g transform={`translate(${width/2 + 20}, ${height - 50})`}>
          <defs>
            <linearGradient id="expensesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6E7C89" />
              <stop offset="100%" stopColor="#6E7C89" stopOpacity="0.8" />
            </linearGradient>
          </defs>
          <rect
            x="0"
            y={-((expensesTotal / maxValue) * maxHeight)}
            width={barWidth}
            height={(expensesTotal / maxValue) * maxHeight}
            fill="url(#expensesGradient)"
            className="transition-all duration-500"
            style={{
              transform: isAnimating ? 'scaleY(0)' : 'scaleY(1)',
              transformOrigin: 'bottom'
            }}
          />
          <text x={barWidth/2} y="20" textAnchor="middle" className="text-sm font-medium">
            Gastos
          </text>
          <text x={barWidth/2} y="35" textAnchor="middle" className="text-xs text-gray-600">
            {formatChartCurrency(expensesTotal)}
          </text>
        </g>
      </svg>
    );
  };

  // Render Line Chart
  const renderLineChart = () => {
    const points = [
      { x: 50, y: height - 100, label: 'Inicio', value: 0 },
      { x: width/2 - 50, y: height - 100 - (incomeTotal / (incomeTotal + expensesTotal)) * 150, label: 'Ingresos', value: incomeTotal },
      { x: width - 50, y: height - 100 + (expensesTotal / (incomeTotal + expensesTotal)) * 150, label: 'Gastos', value: expensesTotal }
    ];

    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="drop-shadow-sm">
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />

        {/* Line path */}
        <path
          d={`M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y}`}
          stroke="#74F1C8"
          strokeWidth="3"
          fill="none"
          className="transition-all duration-1000"
          style={{
            strokeDasharray: isAnimating ? '1000' : '0',
            strokeDashoffset: isAnimating ? '1000' : '0'
          }}
        />

        {/* Data points */}
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="6"
              fill={index === 1 ? '#74F1C8' : index === 2 ? '#6E7C89' : '#74F1C8'}
              className="transition-all duration-500"
              style={{
                transform: isAnimating ? 'scale(0)' : 'scale(1)',
                transformOrigin: `${point.x}px ${point.y}px`
              }}
            />
            <text x={point.x} y={point.y - 15} textAnchor="middle" className="text-xs font-medium">
              {point.label}
            </text>
            <text x={point.x} y={point.y + 25} textAnchor="middle" className="text-xs text-gray-600">
              {formatChartCurrency(point.value)}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  // Empty state
  if (chartSegments.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md ${className}`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Análisis de Rentabilidad</h3>
          </div>
          <div className="text-center py-12 text-gray-500">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Aún no hay datos suficientes</h4>
            <p className="text-sm">Agregue datos para ver el análisis de rentabilidad</p>
          </div>
        </div>
      </div>
    );
  }

  const centerX = width / 2;
  const centerY = height / 2;
  const outerRadius = Math.min(width, height) / 2 - 20;
  const innerRadius = currentChartType === 'donut' ? outerRadius * 0.6 : 0;

  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Análisis de Rentabilidad</h3>
          <div className="flex items-center space-x-2">
            {/* Chart Type Selector */}
            <select
              value={currentChartType}
              onChange={(e) => setCurrentChartType(e.target.value as any)}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="donut">Donut 3D</option>
              <option value="pie">Pie 3D</option>
              <option value="bar">Barras 3D</option>
              <option value="line">Línea 3D</option>
            </select>
            
            {showExportOptions && (
              <>
                <button
                  onClick={() => handleExport('png')}
                  className="text-sm px-2 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                  title="Exportar como PNG"
                >
                  PNG
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="text-sm px-2 py-1 text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
                  title="Exportar como PDF"
                >
                  PDF
                </button>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-col lg:flex-row items-center space-y-6 lg:space-y-0 lg:space-x-8">
          {/* Chart */}
          <div className="relative flex-shrink-0">
            {currentChartType === 'bar' ? render3DBarChart() : 
             currentChartType === 'line' ? renderLineChart() : (
              <svg
                ref={chartRef}
                width={width}
                height={height}
                viewBox={`0 0 ${width} ${height}`}
                className="drop-shadow-sm"
                role="img"
                aria-label={`Gráfico de rentabilidad: ${formatChartCurrency(Math.abs(profitData.profit))} ${profitData.isLoss ? 'pérdida' : 'ganancia'}`}
              >
                {/* Chart segments */}
                {chartSegments.map((segment, index) => {
                  const path = createArcPath(
                    centerX,
                    centerY,
                    outerRadius,
                    innerRadius,
                    segment.startAngle,
                    segment.endAngle
                  );

                  const isHovered = hoveredSegment === segment.label;
                  const scale = isHovered ? 1.05 : 1;
                  const opacity = isAnimating ? 0 : 1;

                  return (
                    <g key={segment.label}>
                      <defs>
                        <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={segment.color} />
                          <stop offset="100%" stopColor={segment.color} stopOpacity="0.8" />
                        </linearGradient>
                        <filter id={`shadow-${index}`}>
                          <feDropShadow dx="2" dy="4" stdDeviation="3" floodOpacity="0.3"/>
                        </filter>
                      </defs>
                      <path
                        d={path}
                        fill={`url(#gradient-${index})`}
                        stroke="white"
                        strokeWidth="2"
                        filter={`url(#shadow-${index})`}
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: `${centerX}px ${centerY}px`,
                          transition: 'all 0.2s ease-in-out',
                          opacity,
                          animation: isAnimating ? `fadeIn 0.5s ease-out ${index * 0.1}s forwards` : 'none'
                        }}
                        onMouseEnter={() => setHoveredSegment(segment.label)}
                        onMouseLeave={() => setHoveredSegment(null)}
                        className="cursor-pointer"
                        role="button"
                        tabIndex={0}
                        aria-label={`${segment.label}: ${formatChartCurrency(segment.value)} (${segment.percentage.toFixed(1)}%)`}
                      />
                      
                      {/* Hover tooltip */}
                      {isHovered && (
                        <g>
                          <rect
                            x={centerX - 60}
                            y={centerY - 40}
                            width="120"
                            height="30"
                            fill="rgba(0, 0, 0, 0.8)"
                            rx="4"
                            className="pointer-events-none"
                          />
                          <text
                            x={centerX}
                            y={centerY - 20}
                            textAnchor="middle"
                            fill="white"
                            fontSize="12"
                            className="pointer-events-none"
                          >
                            {formatChartCurrency(segment.value)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            )}
            
            {/* Center Content for Donut/Pie */}
            {(currentChartType === 'donut' || currentChartType === 'pie') && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ 
                    color: profitData.isLoss ? '#9B9B9B' : '#74F1C8' 
                  }}>
                    {formatChartCurrency(Math.abs(profitData.profit))}
                  </div>
                  <div className="text-sm text-gray-500 font-medium">
                    {profitData.isLoss ? 'Pérdida' : 'Utilidad'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {profitData.percentage.toFixed(1)}% margen
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Legend and Details */}
          <div className="flex-1 space-y-4 min-w-0">
            {chartSegments.map((segment) => (
              <div 
                key={segment.label} 
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-200 cursor-pointer ${
                  hoveredSegment === segment.label ? 'bg-gray-100 shadow-sm' : 'bg-gray-50'
                }`}
                onMouseEnter={() => setHoveredSegment(segment.label)}
                onMouseLeave={() => setHoveredSegment(null)}
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium text-gray-900 truncate">{segment.label}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="font-semibold text-gray-900">{formatChartCurrency(segment.value)}</div>
                  <div className="text-sm text-gray-500">{segment.percentage.toFixed(1)}%</div>
                </div>
              </div>
            ))}
            
            {/* Profit Summary */}
            <div className={`p-4 rounded-lg border-2 ${
              profitData.isLoss ? 'border-gray-300 bg-gray-50' : 'border-green-200 bg-green-50'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" style={{ 
                    color: profitData.isLoss ? '#9B9B9B' : '#74F1C8' 
                  }}>
                    {profitData.isLoss ? (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    ) : (
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    )}
                  </svg>
                  <span className="font-semibold text-gray-900">
                    {profitData.isLoss ? 'Pérdida Total' : 'Utilidad Total'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-xl" style={{ 
                    color: profitData.isLoss ? '#9B9B9B' : '#74F1C8' 
                  }}>
                    {formatChartCurrency(Math.abs(profitData.profit))}
                  </div>
                  <div className="text-sm text-gray-600">
                    Margen: {profitData.percentage.toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// CSS for animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default ProfitabilityChart;