/**
 * Database Connection Monitor
 * Real-time monitoring of database health and performance
 */

import { supabase, checkDatabaseHealth } from '../lib/supabase';

interface ConnectionMetrics {
  isConnected: boolean;
  latency: number;
  lastCheck: Date;
  consecutiveFailures: number;
  totalChecks: number;
  uptime: number;
  errorRate: number;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  slowQueries: number;
  timeoutCount: number;
  retryCount: number;
}

export class DatabaseConnectionMonitor {
  private static instance: DatabaseConnectionMonitor;
  private metrics: ConnectionMetrics;
  private performance: PerformanceMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(metrics: ConnectionMetrics) => void> = [];
  private isMonitoring = false;
  private startTime = Date.now();

  private constructor() {
    this.metrics = {
      isConnected: false,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      totalChecks: 0,
      uptime: 0,
      errorRate: 0
    };

    this.performance = {
      avgResponseTime: 0,
      slowQueries: 0,
      timeoutCount: 0,
      retryCount: 0
    };
  }

  static getInstance(): DatabaseConnectionMonitor {
    if (!DatabaseConnectionMonitor.instance) {
      DatabaseConnectionMonitor.instance = new DatabaseConnectionMonitor();
    }
    return DatabaseConnectionMonitor.instance;
  }

  /**
   * Start monitoring database connection
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.isMonitoring) {
      console.warn('⚠️ Connection monitoring already active');
      return;
    }

    console.log('🔍 Starting database connection monitoring...');
    this.isMonitoring = true;
    this.startTime = Date.now();

    // Initial check
    this.performHealthCheck();

    // Set up periodic checks
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    this.isMonitoring = false;
    console.log('🛑 Database connection monitoring stopped');
  }

  /**
   * Perform health check
   */
  private async performHealthCheck(): Promise<void> {
    const checkStart = Date.now();
    this.metrics.totalChecks++;

    try {
      const healthResult = await checkDatabaseHealth();
      const checkDuration = Date.now() - checkStart;

      // Update metrics
      this.metrics.isConnected = healthResult.healthy;
      this.metrics.latency = healthResult.latency;
      this.metrics.lastCheck = new Date();

      if (healthResult.healthy) {
        this.metrics.consecutiveFailures = 0;
      } else {
        this.metrics.consecutiveFailures++;
      }

      // Update performance metrics
      this.updatePerformanceMetrics(checkDuration, !healthResult.healthy);

      // Calculate uptime and error rate
      const totalTime = Date.now() - this.startTime;
      this.metrics.uptime = totalTime;
      this.metrics.errorRate = (this.metrics.consecutiveFailures / this.metrics.totalChecks) * 100;

      // Notify listeners
      this.notifyListeners();

      // Log significant events
      if (this.metrics.consecutiveFailures === 1 && !healthResult.healthy) {
        console.warn('⚠️ Database connection lost');
      } else if (this.metrics.consecutiveFailures === 0 && healthResult.healthy && this.metrics.totalChecks > 1) {
        console.log('✅ Database connection restored');
      }

      // Alert on critical issues
      if (this.metrics.consecutiveFailures >= 3) {
        console.error('🚨 Database connection critical: 3+ consecutive failures');
        this.alertCriticalIssue();
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.metrics.consecutiveFailures++;
      this.updatePerformanceMetrics(Date.now() - checkStart, true);
    }
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(duration: number, isError: boolean): void {
    // Update average response time (rolling average)
    this.performance.avgResponseTime = (
      (this.performance.avgResponseTime * (this.metrics.totalChecks - 1)) + duration
    ) / this.metrics.totalChecks;

    // Count slow queries (>2 seconds)
    if (duration > 2000) {
      this.performance.slowQueries++;
    }

    // Count timeouts
    if (isError && duration > 10000) {
      this.performance.timeoutCount++;
    }
  }

  /**
   * Alert on critical issues
   */
  private alertCriticalIssue(): void {
    // In a production environment, this would send alerts to monitoring systems
    console.error('🚨 CRITICAL: Database connection issues detected');
    
    // Could integrate with services like:
    // - Sentry for error tracking
    // - PagerDuty for incident management
    // - Slack for team notifications
    // - Email alerts for administrators
  }

  /**
   * Add listener for metric updates
   */
  addListener(listener: (metrics: ConnectionMetrics) => void): void {
    this.listeners.push(listener);
  }

  /**
   * Remove listener
   */
  removeListener(listener: (metrics: ConnectionMetrics) => void): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      try {
        listener(this.metrics);
      } catch (error) {
        console.error('❌ Error notifying connection listener:', error);
      }
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): ConnectionMetrics & { performance: PerformanceMetrics } {
    return {
      ...this.metrics,
      performance: { ...this.performance }
    };
  }

  /**
   * Get connection status summary
   */
  getStatusSummary(): {
    status: 'healthy' | 'degraded' | 'critical';
    message: string;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical';
    let message: string;

    if (this.metrics.consecutiveFailures >= 3) {
      status = 'critical';
      message = 'Database connection critical - multiple failures detected';
      recommendations.push('Check database server status');
      recommendations.push('Verify network connectivity');
      recommendations.push('Review Supabase project status');
    } else if (this.metrics.consecutiveFailures > 0 || this.metrics.latency > 3000) {
      status = 'degraded';
      message = 'Database connection degraded - performance issues detected';
      recommendations.push('Monitor connection stability');
      recommendations.push('Consider optimizing queries');
    } else {
      status = 'healthy';
      message = 'Database connection healthy';
    }

    // Add performance recommendations
    if (this.performance.avgResponseTime > 2000) {
      recommendations.push('Average response time is high - consider query optimization');
    }

    if (this.performance.slowQueries > 5) {
      recommendations.push('Multiple slow queries detected - review database indexes');
    }

    if (this.metrics.errorRate > 10) {
      recommendations.push('High error rate detected - investigate connection issues');
    }

    return { status, message, recommendations };
  }

  /**
   * Force immediate health check
   */
  async forceHealthCheck(): Promise<ConnectionMetrics> {
    await this.performHealthCheck();
    return this.metrics;
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      isConnected: false,
      latency: 0,
      lastCheck: new Date(),
      consecutiveFailures: 0,
      totalChecks: 0,
      uptime: 0,
      errorRate: 0
    };

    this.performance = {
      avgResponseTime: 0,
      slowQueries: 0,
      timeoutCount: 0,
      retryCount: 0
    };

    this.startTime = Date.now();
  }
}

/**
 * React hook for connection monitoring
 */
export function useConnectionMonitor(autoStart: boolean = true) {
  const [metrics, setMetrics] = React.useState<ConnectionMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = React.useState(false);
  
  const monitor = React.useMemo(() => DatabaseConnectionMonitor.getInstance(), []);

  React.useEffect(() => {
    const updateMetrics = (newMetrics: ConnectionMetrics) => {
      setMetrics(newMetrics);
    };

    monitor.addListener(updateMetrics);

    if (autoStart && !isMonitoring) {
      monitor.startMonitoring();
      setIsMonitoring(true);
    }

    return () => {
      monitor.removeListener(updateMetrics);
      if (autoStart) {
        monitor.stopMonitoring();
        setIsMonitoring(false);
      }
    };
  }, [monitor, autoStart, isMonitoring]);

  return {
    metrics,
    isMonitoring,
    startMonitoring: () => {
      monitor.startMonitoring();
      setIsMonitoring(true);
    },
    stopMonitoring: () => {
      monitor.stopMonitoring();
      setIsMonitoring(false);
    },
    forceCheck: () => monitor.forceHealthCheck(),
    getStatus: () => monitor.getStatusSummary()
  };
}

export default DatabaseConnectionMonitor;