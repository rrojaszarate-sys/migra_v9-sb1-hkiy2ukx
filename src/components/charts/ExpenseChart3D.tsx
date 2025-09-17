import React, { useMemo, useState, useCallback } from 'react';
import { ExpenseChartData } from '../../types/database';
import { 
  CHART_COLORS, 
  SEMANTIC_COLORS, 
  getExpenseCategoryColor,
  formatChartCurrency, 
  formatChartPercentage,
  getOptimalTextColor,
  getColorWithOpacity,
  getDataTypeColors,
  debounce
} from '../../utils/chartColors';

interface ExpenseChart3DProps {
  data: ExpenseChartData[];
  width?: number;
  height?: number;
  className?: string;
}

interface EnhancedExpenseData extends ExpenseChartData {
  color: string;
  pathData: string;
  shadowPath: string;
  labelX: number;
  labelY: number;
  midAngle: number;
}

export function ExpenseChart3D({ 
  data, 
  width = 400, 
  height = 400, 
  className = '' 
}: ExpenseChart3DProps) {
  // State for dynamic interactions
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'amount' | 'percentage' | 'category'>('amount');

  // Debounced hover handler for performance optimization
  const debouncedHover = useCallback(
    debounce((category: string | null) => {
      setHoveredCategory(category);
    }, 100),
    []
  );

  // Enhanced chart data with dynamic sorting and color assignment
  const chartData = useMemo((): EnhancedExpenseData[] => {
    if (data.length === 0) return [];

    const total = data.reduce((sum, item) => sum + item.total, 0);
    
    // Sort data based on user selection
    const sortedData = [...data].sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.total - a.total;
        case 'percentage':
          return b.percentage - a.percentage;
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 40;
    
    let currentAngle = -90; // Start from top
    
    return sortedData.map((item, index) => {
      const percentage = total > 0 ? (item.total / total) * 100 : 0;
      const angleSpan = (percentage / 100) * 360;
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

      // 3D shadow path
      const shadowOffset = 10;
      const shadowPath = [
        `M ${centerX + shadowOffset} ${centerY + shadowOffset}`,
        `L ${x1 + shadowOffset} ${y1 + shadowOffset}`,
        `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2 + shadowOffset} ${y2 + shadowOffset}`,
        'Z'
      ].join(' ');

      // Calculate label position
      const midAngle = startAngle + angleSpan / 2;
      const labelRadius = radius * 0.7;
      const labelX = centerX + labelRadius * Math.cos((midAngle * Math.PI) / 180);
      const labelY = centerY + labelRadius * Math.sin((midAngle * Math.PI) / 180);

      currentAngle = endAngle;
      
      return {
        ...item,
        percentage,
        color: getExpenseCategoryColor(item.category, index),
        pathData,
        shadowPath,
        labelX,
        labelY,
        midAngle
      };
    });
  }, [data, width, height, sortBy]);

  // Handle category selection for comparison
  const handleCategoryToggle = useCallback((category: string) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (selectedCategories.size < 2) return null;
    
    const selectedData = chartData.filter(item => selectedCategories.has(item.category));
    const totalSelected = selectedData.reduce((sum, item) => sum + item.total, 0);
    const avgAmount = totalSelected / selectedData.length;
    
    return {
      totalAmount: totalSelected,
      averageAmount: avgAmount,
      categories: Array.from(selectedCategories),
      highestCategory: selectedData.reduce((max, item) => 
        item.total > max.total ? item : max, selectedData[0]
      )
    };
  }, [chartData, selectedCategories]);

  if (chartData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-64 rounded-lg ${className}`} 
           style={{ backgroundColor: CHART_COLORS.SOFT_GRAY + '20' }}>
        <div className="text-center" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
          <svg className="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">No hay datos de gastos disponibles</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md ${className}`} style={{ backgroundColor: CHART_COLORS.WHITE }}>
      <div className="flex">
        {/* Enhanced 3D Pie Chart */}
        <div className="flex-1 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
              Gastos por Categoría
            </h3>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border rounded px-2 py-1"
              style={{ 
                borderColor: CHART_COLORS.SOFT_GRAY,
                color: SEMANTIC_COLORS.TEXT_SECONDARY
              }}
            >
              <option value="amount">Por Monto</option>
              <option value="percentage">Por %</option>
              <option value="category">Por Categoría</option>
            </select>
          </div>
          <div className="relative flex justify-center">
          <svg 
            width={width} 
            height={height} 
            viewBox={`0 0 ${width} ${height}`} 
            className="drop-shadow-xl"
            role="img"
            aria-label={`Gráfico de gastos por categoría: ${chartData.length} categorías, total ${formatChartCurrency(chartData.reduce((sum, item) => sum + item.total, 0))}`}
          >
            <defs>
              {/* Enhanced gradients and filters */}
              {chartData.map((item, index) => (
                <React.Fragment key={`defs-${index}`}>
                  <radialGradient id={`expenseGradient-${index}`} cx="30%" cy="30%">
                    <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                    <stop offset="70%" stopColor={item.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={item.color} stopOpacity="0.7" />
                  </radialGradient>
                  <filter id={`expenseShadow-${index}`}>
                    <feDropShadow dx="4" dy="6" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                </React.Fragment>
              ))}
            </defs>
            
            {/* Shadow layer for 3D depth */}
            {chartData.map((item, index) => (
              <path
                key={`shadow-${index}`}
                d={item.shadowPath}
                fill="rgba(0, 0, 0, 0.2)"
                className="opacity-60"
              />
            ))}
            
            {/* Main pie slices with enhanced interactivity */}
            {chartData.map((item, index) => {
              const isHovered = hoveredCategory === item.category;
              const isSelected = selectedCategories.has(item.category);
              const scale = isHovered ? 1.08 : isSelected ? 1.04 : 1;
              const opacity = selectedCategories.size > 0 && !isSelected ? 0.6 : 1;
              
              return (
                <g key={index}>
                  <path
                    d={item.pathData}
                    fill={`url(#expenseGradient-${index})`}
                    stroke={CHART_COLORS.WHITE}
                    strokeWidth="3"
                    filter={`url(#expenseShadow-${index})`}
                    className="transition-all duration-300 cursor-pointer"
                    style={{
                      transform: `scale(${scale})`,
                      transformOrigin: `${width/2}px ${height/2}px`,
                      opacity
                    }}
                    onMouseEnter={() => debouncedHover(item.category)}
                    onMouseLeave={() => debouncedHover(null)}
                    onClick={() => handleCategoryToggle(item.category)}
                    role="button"
                    tabIndex={0}
                    aria-label={`${item.category}: ${formatChartCurrency(item.total)} (${formatChartPercentage(item.percentage)})`}
                  />
                  
                  {/* Dynamic percentage labels on segments */}
                  {item.percentage > 8 && (
                    <text
                      x={item.labelX}
                      y={item.labelY - 5}
                      textAnchor="middle"
                      className="text-sm font-bold pointer-events-none"
                      style={{ 
                        fill: getOptimalTextColor(item.color),
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {formatChartPercentage(item.percentage)}
                    </text>
                  )}
                  
                  {/* Category abbreviation for small segments */}
                  {item.percentage > 5 && item.percentage <= 8 && (
                    <text
                      x={item.labelX}
                      y={item.labelY}
                      textAnchor="middle"
                      className="text-xs font-medium pointer-events-none"
                      style={{ 
                        fill: getOptimalTextColor(item.color),
                        textShadow: '1px 1px 2px rgba(0,0,0,0.7)'
                      }}
                    >
                      {item.category.substring(0, 3)}
                    </text>
                  )}
                  
                  {/* Enhanced hover tooltip with detailed information */}
                  {isHovered && (
                    <g className="pointer-events-none">
                      <rect
                        x={item.labelX - 90}
                        y={item.labelY - 60}
                        width="180"
                        height="80"
                        fill="rgba(0, 0, 0, 0.95)"
                        rx="8"
                        stroke={CHART_COLORS.MINT_GREEN}
                        strokeWidth="2"
                      />
                      <text
                        x={item.labelX}
                        y={item.labelY - 35}
                        textAnchor="middle"
                        className="text-sm font-bold"
                        fill={CHART_COLORS.WHITE}
                      >
                        {item.category}
                      </text>
                      <text
                        x={item.labelX}
                        y={item.labelY - 18}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.WHITE}
                      >
                        Total: {formatChartCurrency(item.total)}
                      </text>
                      <text
                        x={item.labelX}
                        y={item.labelY - 2}
                        textAnchor="middle"
                        className="text-xs"
                        fill={CHART_COLORS.MINT_GREEN}
                      >
                        {formatChartPercentage(item.percentage)}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>
          </div>
        </div>
        
        {/* Enhanced Legend with Interactive Features */}
        <div className="w-80 p-6" style={{ borderLeft: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
          <h4 className="font-semibold mb-4" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
            Desglose por Categoría
          </h4>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {chartData.map((segment, index) => {
              const isActive = hoveredCategory === segment.category || selectedCategories.has(segment.category);
              
              return (
                <div
                  key={index}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    isActive ? 'shadow-md' : 'hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: isActive ? getColorWithOpacity(segment.color, 0.15) : CHART_COLORS.WHITE,
                    borderColor: isActive ? segment.color : CHART_COLORS.SOFT_GRAY
                  }}
                  onMouseEnter={() => setHoveredCategory(segment.category)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  onClick={() => handleCategoryToggle(segment.category)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full border-2"
                        style={{
                          backgroundColor: segment.color,
                          borderColor: CHART_COLORS.WHITE
                        }}
                      />
                      <span className="font-medium text-sm" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                        {segment.category}
                      </span>
                    </div>
                    {selectedCategories.has(segment.category) && (
                      <span className="text-xs px-2 py-1 rounded" style={{ 
                        backgroundColor: CHART_COLORS.MINT_GREEN,
                        color: CHART_COLORS.WHITE
                      }}>
                        ✓
                      </span>
                    )}
                  </div>
                  
                  {/* Simplified amount display */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                      Monto:
                    </span>
                    <span className="font-bold text-lg" style={{ color: segment.color }}>
                      {formatChartCurrency(segment.total)}
                    </span>
                  </div>
                  
                  {/* Show ranking when active */}
                  {isActive && (
                    <div className="mt-2 pt-2" style={{ borderTop: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
                      <div className="flex justify-between text-xs">
                        <span style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
                          Ranking:
                        </span>
                        <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                          #{index + 1} de {chartData.length}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="text-right">
                    <span className="text-sm font-medium" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                      {formatChartPercentage(segment.percentage)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Dynamic Comparison Panel */}
          {comparisonMetrics && (
            <div 
              className="rounded-lg p-4 border-2"
              style={{ 
                backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.PRIMARY, 0.1),
                borderColor: SEMANTIC_COLORS.PRIMARY
              }}
            >
              <h4 className="font-semibold mb-3" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                Comparación de Categorías Seleccionadas
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                    Categorías comparadas:
                  </span>
                  <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                    {comparisonMetrics.categories.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                    Total combinado:
                  </span>
                  <span className="font-bold" style={{ color: CHART_COLORS.MINT_GREEN }}>
                    {formatChartCurrency(comparisonMetrics.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
                    Promedio:
                  </span>
                  <span className="font-medium" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                    {formatChartCurrency(comparisonMetrics.averageAmount)}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Enhanced Summary with Real-time Calculations */}
          <div 
            className="rounded-lg p-4 border-2"
            style={{ 
              backgroundColor: getColorWithOpacity(SEMANTIC_COLORS.EXPENSES, 0.1),
              borderColor: SEMANTIC_COLORS.EXPENSES
            }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold" style={{ color: SEMANTIC_COLORS.TEXT_PRIMARY }}>
                Total de Gastos:
              </span>
              <span className="font-bold text-xl" style={{ color: CHART_COLORS.DARK_GRAY }}>
                {formatChartCurrency(chartData.reduce((sum, item) => sum + item.total, 0))}
              </span>
            </div>
            
            {/* Dynamic insights based on data */}
            <div className="space-y-1 text-xs" style={{ color: SEMANTIC_COLORS.TEXT_SECONDARY }}>
              <div className="flex justify-between">
                <span>Categoría principal:</span>
                <span className="font-medium">
                  {chartData[0]?.category} ({formatChartPercentage(chartData[0]?.percentage || 0)})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Distribución:</span>
                <span className="font-medium">
                  {chartData.length > 3 ? 'Diversificada' : chartData.length > 1 ? 'Concentrada' : 'Única'}
                </span>
              </div>
              {selectedCategories.size > 0 && (
                <div className="flex justify-between pt-1" style={{ borderTop: `1px solid ${CHART_COLORS.SOFT_GRAY}` }}>
                  <span>Seleccionadas:</span>
                  <span className="font-medium" style={{ color: CHART_COLORS.MINT_GREEN }}>
                    {selectedCategories.size} categorías
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Interactive Instructions */}
      <div className="mt-4 text-center">
        <p className="text-xs" style={{ color: SEMANTIC_COLORS.TEXT_TERTIARY }}>
          💡 Haga clic para seleccionar categorías • Pase el cursor para detalles
        </p>
      </div>
    </div>
  );
}

export default ExpenseChart3D;