'use client';

import { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy load chart components
const LazyLineChart = lazy(() => import('recharts').then(m => ({ default: m.LineChart })));
const LazyBarChart = lazy(() => import('recharts').then(m => ({ default: m.BarChart })));
const LazyPieChart = lazy(() => import('recharts').then(m => ({ default: m.PieChart })));
const LazyAreaChart = lazy(() => import('recharts').then(m => ({ default: m.AreaChart })));

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'pie' | 'area';
  children: React.ReactNode;
  height?: number;
}

const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full" style={{ height }}>
    <Skeleton className="w-full h-full" />
  </div>
);

export function LazyChartWrapper({ type, children, height = 300 }: ChartWrapperProps) {
  const ChartComponent = {
    line: LazyLineChart,
    bar: LazyBarChart,
    pie: LazyPieChart,
    area: LazyAreaChart,
  }[type];

  return (
    <Suspense fallback={<ChartSkeleton height={height} />}>
      <ChartComponent>
        {children}
      </ChartComponent>
    </Suspense>
  );
}

// Export lazy-loaded chart components
export const LazyLine = lazy(() => import('recharts').then(m => ({ default: m.Line })));
export const LazyBar = lazy(() => import('recharts').then(m => ({ default: m.Bar })));
export const LazyXAxis = lazy(() => import('recharts').then(m => ({ default: m.XAxis })));
export const LazyYAxis = lazy(() => import('recharts').then(m => ({ default: m.YAxis })));
export const LazyCartesianGrid = lazy(() => import('recharts').then(m => ({ default: m.CartesianGrid })));
export const LazyTooltip = lazy(() => import('recharts').then(m => ({ default: m.Tooltip })));
export const LazyLegend = lazy(() => import('recharts').then(m => ({ default: m.Legend })));
export const LazyResponsiveContainer = lazy(() => import('recharts').then(m => ({ default: m.ResponsiveContainer })));
