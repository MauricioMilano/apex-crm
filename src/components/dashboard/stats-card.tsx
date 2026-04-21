'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  description?: string;
  iconColor?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconColor = 'bg-blue-500/20 text-blue-400',
}: StatsCardProps) {
  const trendPositive = trend !== undefined && trend >= 0;

  return (
    <Card className="bg-gray-900 border-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-gray-400">
          {title}
        </CardTitle>
        <div className={cn('p-2 rounded-lg', iconColor)}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-white">{value}</div>
        <div className="flex items-center gap-1 mt-1">
          {trend !== undefined && (
            <span
              className={cn(
                'flex items-center text-xs font-medium',
                trendPositive ? 'text-emerald-400' : 'text-red-400',
              )}
            >
              {trendPositive ? (
                <TrendingUp className="h-3 w-3 mr-0.5" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-0.5" />
              )}
              {trendPositive ? '+' : ''}
              {trend.toFixed(1)}%
            </span>
          )}
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
