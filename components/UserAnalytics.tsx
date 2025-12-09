// UserAnalytics.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card } from './ui/card';
import { format, formatInTimeZone } from 'date-fns-tz';
import { DateTime } from 'luxon';

import { parseISO } from 'date-fns';
import { truncate } from '@/lib/utils';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  PieChart,
  Pie
} from 'recharts';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '@/components/ui/chart';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

import { useQuery } from '@tanstack/react-query';
import { usePlan } from '@/context/PlanContext';
import Link from 'next/link';

interface DetailedAnalytics {
  source: string;
  city: string;
  country: string;
  region: string;
  city_name: string;
  visitors: number;
  pageviews: number;
  bounce_rate: number;
  visit_duration: number;
}

interface PlausibleMetrics {
  pageviews: number;
  visitors: number;
  bounce_rate: number;
  visit_duration: number;
  detailed_data: DetailedAnalytics[];
  timeseries: any[];
  link_clicks: any[];
}

interface UserAnalyticsProps {
  pageData: any;
  pagePath: string;
  timeframe?: TimeframeOption;
}

interface CacheKey {
  pagePath: string;
  timeRange: string;
}

interface CacheEntry {
  data: PlausibleMetrics;
  timestamp: number;
}

interface LocationEntry {
  location: string;
  visitors: number;
  color: string;
}

interface UserPlan {
  plan: string | null;
}

type TimeframeOption = 'day' | '7d' | '30d' | '6mo' | '12mo';

const cache = new Map<string, CacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

const formatAxisDate = (dateStr: string, timeRange: string) => {
  const date = parseISO(dateStr);

  if (timeRange === 'day') {
    // Format hours like "11 AM", "12 PM", etc.
    return format(date, 'h a');
  } else if (timeRange === '6mo' || timeRange === '12mo') {
    // Format months like "Jan", "Feb", etc.
    return format(date, 'MMM');
  } else {
    // Format days like "Dec 26", "Dec 27", etc.
    return format(date, 'MMM d');
  }
};

const linkClicksConfig = {
  clicks: {
    label: 'Clicks',
    color: '#2563eb'
  },
  label: {
    color: 'hsl(var(--background))'
  }
} satisfies ChartConfig;

const LoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col justify-between gap-4 md:items-center md:flex-row">
        <div>
          <div className="w-64 h-6 bg-muted rounded animate-pulse" />
          <div className="w-48 h-4 mt-2 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex flex-row items-center w-full gap-4 md:w-auto">
          <div className="w-[160px] h-10 bg-muted rounded animate-pulse" />
          <div className="w-10 h-10 bg-muted rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            <div className="w-16 h-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="h-[250px] w-full bg-muted rounded animate-pulse" />

      {/* Pro features section */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="p-4 border rounded-lg">
            <div className="w-32 h-6 mb-4 bg-muted rounded animate-pulse" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between mb-6">
              <div className="w-32 h-6 bg-muted rounded animate-pulse" />
              <div className="w-[160px] h-10 bg-muted rounded animate-pulse" />
            </div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <div className="w-32 h-6 mb-4 bg-muted rounded animate-pulse" />
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

//these are for a dialog that shows the non-truncated locations list
const LocationsList = ({ data }: { data: LocationEntry[] }) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div
          key={index}
          className="flex items-center justify-between p-2 rounded hover:bg-gray-50"
        >
          <span className="text-sm">{item.location}</span>
          <span className="text-sm font-medium">{item.visitors}</span>
        </div>
      ))}
    </div>
  );
};

//this is for a dialog that shows the non-truncated link clicks list
const LinkClicksList = ({ data }: { data: any[] }) => {
  return (
    <div className="space-y-2">
      {data.map((item, index) => (
        <div key={index}>{item.text}</div>
      ))}
    </div>
  );
};

const ProFeatureTeaser = () => {
  // Generate random but descending widths for the bars
  const generateDescendingWidths = (count: number) => {
    const maxWidth = 80;
    const minWidth = 20;
    const step = (maxWidth - minWidth) / (count - 1);
    return Array(count)
      .fill(0)
      .map((_, i) => maxWidth - step * i);
  };

  // Generate widths once for each chart
  const sourceWidths = generateDescendingWidths(5);
  const locationWidths = generateDescendingWidths(5);
  const linkWidths = generateDescendingWidths(5);

  return (
    <div className="space-y-6 opacity-50">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Traffic Sources</h3>
          <div className="space-y-2">
            <div className="h-[180px] w-full">
              <div className="mt-4 space-y-3">
                {sourceWidths.map((width, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="h-6 bg-blue-600 rounded"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex justify-between mb-6">
            <h3 className="font-semibold">Top Locations</h3>
            <div className="w-[160px] h-9 bg-muted rounded-lg" />
          </div>
          <div className="space-y-2">
            <div className="h-[180px] w-full">
              <div className="mt-4 space-y-3">
                {locationWidths.map((width, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="h-6 bg-blue-600 rounded"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card className="p-4">
        <h3 className="mb-3 font-semibold">Top Link Clicks</h3>
        <div className="h-[180px] w-full">
          <div className="mt-4 space-y-3">
            {linkWidths.map((width, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className="h-6 bg-blue-600 rounded"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Overlay to prevent interactions */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent to-background/90" />
    </div>
  );
};

const getTimeframeLabel = (value: TimeframeOption, plan: string | null) => {
  const labels: Record<TimeframeOption, string> = {
    day: 'Today',
    '7d': 'Past 7 days',
    '30d': 'Past 30 days',
    '6mo': 'Past 6 months',
    '12mo': 'Past 12 months'
  };

  // Add (Pro) label for 6mo and 12mo if not pro
  if (plan !== 'pro' && ['6mo', '12mo'].includes(value)) {
    return `${labels[value]} (Pro)`;
  }

  // Add (Standard) label for day and 30d if no plan or starter
  if ((!plan || plan === 'starter') && ['day', '30d'].includes(value)) {
    return `${labels[value]} (Standard)`;
  }

  return labels[value];
};

const getChartHeight = (
  itemCount: number,
  minHeight: number = 180,
  maxHeight: number = 400
) => {
  // Set a consistent bar height
  const barHeight = 32; // Height of each bar
  const barMargin = 16; // Margin between bars
  const chartPadding = 20; // Padding at top and bottom of chart

  // Calculate total height needed
  const totalHeight =
    itemCount * barHeight + (itemCount - 1) * barMargin + chartPadding * 2;

  // Constrain between min and max heights
  return Math.min(maxHeight, Math.max(minHeight, totalHeight));
};

const CustomBarLabel = (props: any) => {
  const { x, y, width, value, height, fontSize = 12, offset = 8 } = props;
  const minWidthForInternalLabel = 100;

  // Use a larger offset when label is outside
  const externalOffset = 24;
  const internalOffset = 8;

  const labelX =
    width < minWidthForInternalLabel
      ? x + width + externalOffset
      : x + internalOffset;
  const labelPosition =
    width < minWidthForInternalLabel ? 'right' : 'insideLeft';

  return (
    <text
      x={labelX}
      y={y + height / 2}
      textAnchor={labelPosition === 'right' ? 'start' : 'start'}
      dominantBaseline="central"
      fontSize={fontSize}
      className={
        labelPosition === 'right' ? 'fill-foreground' : 'fill-[--color-label]'
      }
    >
      {value}
    </text>
  );
};

export default function UserAnalytics({
  pageData,
  pagePath,
  timeframe = '7d' as TimeframeOption
}: UserAnalyticsProps) {
  const [metrics, setMetrics] = useState<PlausibleMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeframeOption>(timeframe);
  const [locationType, setLocationType] = useState<
    'country' | 'region' | 'city'
  >('city');
  const [userPlan, setUserPlan] = useState<string | null>(null);

  // Move DateTime calculations here, before they're used
  const now = DateTime.now().setZone('America/New_York');
  const today = now.toFormat('yyyy-MM-dd');
  const currentHour = now.hour;
  console.log('now', now);
  console.log('today', today);
  console.log('currentHour', currentHour);

  const getCacheKey = useCallback(({ pagePath, timeRange }: CacheKey) => {
    return `${pagePath}-${timeRange}`;
  }, []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);

      // Check cache first
      const cacheKey = getCacheKey({
        pagePath,
        timeRange
      });
      const cachedEntry = cache.get(cacheKey);

      if (cachedEntry && Date.now() - cachedEntry.timestamp < CACHE_DURATION) {
        setMetrics(cachedEntry.data);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `/api/analytics?path=${pagePath}&period=${timeRange}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const data = await response.json();

      // Store in cache
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });

      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [pagePath, timeRange, getCacheKey]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Add this function to manually refresh data
  const refreshData = useCallback(() => {
    // Clear the cache for this combination
    const cacheKey = getCacheKey({ pagePath, timeRange });
    cache.delete(cacheKey);
    // Fetch fresh data
    fetchAnalytics();
  }, [pagePath, timeRange, getCacheKey, fetchAnalytics]);

  const filteredData = useMemo(() => {
    let data = metrics?.timeseries || [];

    // If viewing today's data, set future hours to null
    if (timeRange === 'day') {
      data = data.map((entry) => {
        const entryDate = parseISO(entry.date);
        const entryHour = entryDate.getHours();

        // Keep actual data for past and current hours, set future hours to null
        return {
          ...entry,
          pageviews: entryHour <= currentHour ? entry.pageviews : null,
          visitors: entryHour <= currentHour ? entry.visitors : null
        };
      });
    }
    return data;
  }, [metrics?.timeseries, timeRange, currentHour]);

  const planInfo = usePlan();
  useEffect(() => {
    setUserPlan(planInfo?.plan ?? null);
  }, [planInfo?.plan]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card className="p-4 text-red-500">Error loading analytics: {error}</Card>
    );
  }

  if (!metrics) {
    return <Card className="p-4">No data available</Card>;
  }

  // Main time series chart config
  const timeseriesConfig = {
    pageviews: {
      label: 'Pageviews',
      color: '#2563eb'
    },
    visitors: {
      label: 'Visitors',
      color: '#57a9ee'
    }
  } satisfies ChartConfig;

  // Traffic sources chart config
  const sourcesConfig = {
    visitors: {
      label: 'Visitors',
      color: '#2563eb'
    },
    label: {
      color: 'hsl(var(--background))'
    }
  } satisfies ChartConfig;

  // Locations chart config
  const locationsConfig = {
    visitors: {
      label: 'Visitors',
      color: '#2563eb'
    },
    label: {
      color: 'hsl(var(--background))'
    }
  } satisfies ChartConfig;

  const sourceData = metrics.detailed_data
    ?.filter((item) => item.source)
    .reduce((acc: any[], curr) => {
      const existing = acc.find((item) => item.source === curr.source);
      if (existing) {
        existing.visitors += curr.visitors;
      } else {
        acc.push({
          source: curr.source || 'direct',
          visitors: curr.visitors,
          color: `hsl(var(--chart-${(acc.length % 5) + 1}))`
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, 5);

  const locationData = metrics.detailed_data
    ?.reduce((acc: any[], curr) => {
      if (!curr[`${locationType}`] || !curr.country) return acc;

      const locationValue =
        locationType === 'city'
          ? curr.country === 'United States'
            ? `${curr.city}, ${curr.region}`
            : `${curr.city}, ${curr.country}`
          : locationType === 'region'
            ? `${curr.region}, ${curr.country}`
            : curr.country;

      const existing = acc.find((item) => item.location === locationValue);
      if (existing) {
        existing.visitors += curr.visitors;
      } else {
        acc.push({
          location: locationValue,
          visitors: curr.visitors,
          color: `hsl(var(--chart-${(acc.length % 5) + 1}))`
        });
      }
      return acc;
    }, [])
    .sort((a, b) => b.visitors - a.visitors);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
        <div>
          <h3 className="text-lg font-semibold">
            Analytics for {pageData.page_name || pageData.custom_path}
          </h3>
          <p className="text-sm text-muted-foreground">
            Viewing statistics for the last {timeRange}. All times are based on
            US/Eastern.
          </p>
        </div>
        <div className="flex flex-row items-center w-full gap-4 md:w-auto">
          <p className="text-sm text-muted-foreground">
            Stats are updated every 15 minutes.
          </p>
          <Select
            value={timeRange}
            onValueChange={(value: TimeframeOption) => {
              if (
                userPlan === 'pro' || // Pro users can select any timeframe
                value === '7d' || // Everyone can select 7d
                (userPlan === 'standard' && ['day', '30d'].includes(value)) // Standard users can access these
              ) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="w-[160px] rounded-lg sm:ml-auto"
              aria-label="Select timeframe"
            >
              <SelectValue
                placeholder={getTimeframeLabel(timeRange, userPlan)}
              />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem
                value="day"
                className="rounded-lg"
                disabled={!userPlan || userPlan === 'starter'} // Require standard or above
              >
                {getTimeframeLabel('day', userPlan)}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {getTimeframeLabel('7d', userPlan)}
              </SelectItem>
              <SelectItem
                value="30d"
                className="rounded-lg"
                disabled={!userPlan || userPlan === 'starter'} // Require standard or above
              >
                {getTimeframeLabel('30d', userPlan)}
              </SelectItem>
              <SelectItem
                value="6mo"
                className="rounded-lg"
                disabled={userPlan !== 'pro'} // Only pro users can access
              >
                {getTimeframeLabel('6mo', userPlan)}
              </SelectItem>
              <SelectItem
                value="12mo"
                className="rounded-lg"
                disabled={userPlan !== 'pro'} // Only pro users can access
              >
                {getTimeframeLabel('12mo', userPlan)}
              </SelectItem>
            </SelectContent>
          </Select>

          {/* <button
            onClick={refreshData}
            className="p-2 rounded-lg hover:bg-gray-100"
            aria-label="Refresh data"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 2v6h-6" />
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
              <path d="M3 22v-6h6" />
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
            </svg>
          </button> */}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-4 ">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Pageviews</p>
          <p className="text-2xl font-bold">{metrics.pageviews}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Unique Visitors</p>
          <p className="text-2xl font-bold">{metrics.visitors}</p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Total Link Clicks</p>
          <p className="text-2xl font-bold">
            {metrics.link_clicks.reduce((sum, item) => sum + item.clicks, 0)}
          </p>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">Bounce Rate</p>
          <p className="text-2xl font-bold">{metrics.bounce_rate}%</p>
        </div>
      </div>
      <div>
        <ChartContainer
          config={timeseriesConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPageviews" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-pageviews)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-pageviews)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-visitors)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-visitors)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => formatAxisDate(value, timeRange)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(label) => formatAxisDate(label, timeRange)}
                />
              }
            />
            <Area
              dataKey="pageviews"
              name="Pageviews"
              type="monotone"
              fill="url(#fillPageviews)"
              stroke="var(--color-pageviews)"
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <Area
              dataKey="visitors"
              name="Visitors"
              type="monotone"
              fill="url(#fillVisitors)"
              stroke="var(--color-visitors)"
              strokeWidth={2}
              dot={true}
              activeDot={{ r: 4, strokeWidth: 0 }}
              connectNulls={false}
              isAnimationActive={false}
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </div>
      {/* everything below is a pro feature */}

      {metrics.detailed_data && metrics.detailed_data.length > 0 && (
        <>
          {userPlan === 'pro' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Card className="p-4">
                  <h3 className="mb-3 font-semibold">Traffic Sources</h3>
                  <div className="space-y-2">
                    <ChartContainer
                      config={sourcesConfig}
                      className={`h-[${getChartHeight(sourceData.length)}px] w-full`}
                    >
                      <BarChart
                        data={sourceData}
                        layout="vertical"
                        margin={{
                          top: 0,
                          right: 80,
                          bottom: 0,
                          left: 0
                        }}
                        height={getChartHeight(sourceData.length)}
                      >
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="source" type="category" hide />
                        <XAxis type="number" hide />
                        <ChartTooltip
                          cursor={false}
                          content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar
                          dataKey="visitors"
                          fill="var(--color-visitors)"
                          radius={4}
                        >
                          <LabelList
                            dataKey="source"
                            content={<CustomBarLabel />}
                            fontSize={12}
                            formatter={(value: string) => {
                              if (!value) return 'direct';
                              return value;
                            }}
                          />
                          <LabelList
                            dataKey="visitors"
                            position="right"
                            offset={8}
                            className="fill-foreground"
                            fontSize={12}
                          />
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex justify-between mb-6">
                    <h3 className="font-semibold">Top Locations</h3>
                    <div className="flex items-center gap-2">
                      <Select
                        value={locationType}
                        onValueChange={(value: 'country' | 'region' | 'city') =>
                          setLocationType(value)
                        }
                      >
                        <SelectTrigger className="w-[160px] rounded-lg">
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="city">City</SelectItem>
                          <SelectItem value="region">Region</SelectItem>
                          <SelectItem value="country">Country</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="overflow-y-auto"
                      style={{ maxHeight: '400px' }}
                    >
                      <ChartContainer
                        config={locationsConfig}
                        className={`h-[${getChartHeight(locationData.length)}px] w-full`}
                      >
                        <BarChart
                          data={locationData}
                          layout="vertical"
                          margin={{
                            top: 0,
                            right: 40,
                            bottom: 0,
                            left: 0
                          }}
                          height={getChartHeight(locationData.length)}
                        >
                          <CartesianGrid horizontal={false} />
                          <YAxis dataKey="location" type="category" hide />
                          <XAxis type="number" hide />
                          <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                          />
                          <Bar
                            dataKey="visitors"
                            fill="var(--color-visitors)"
                            radius={4}
                          >
                            <LabelList
                              dataKey="location"
                              content={<CustomBarLabel />}
                              fontSize={12}
                            />
                            <LabelList
                              dataKey="visitors"
                              position="right"
                              offset={8}
                              className="fill-foreground"
                              fontSize={12}
                            />
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>
                    {/* <Dialog>
                      <DialogTrigger asChild>
                        <button className="px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
                          View All
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl max-h-[80vh]">
                        <DialogHeader>
                          <DialogTitle>All Locations</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh]">
                          <LocationsList data={locationData} />
                        </div>
                      </DialogContent>
                    </Dialog> */}
                  </div>
                </Card>
              </div>
              <Card className="p-4">
                <h3 className="mb-3 font-semibold">Top Link Clicks</h3>
                {metrics.link_clicks && metrics.link_clicks.length > 0 ? (
                  <ChartContainer
                    config={linkClicksConfig}
                    className={`h-[${getChartHeight(metrics.link_clicks.length)}px] w-full`}
                  >
                    <BarChart
                      data={metrics.link_clicks}
                      layout="vertical"
                      margin={{
                        top: 0,
                        right: 40,
                        bottom: 0,
                        left: 0
                      }}
                      height={getChartHeight(metrics.link_clicks.length)}
                    >
                      <CartesianGrid horizontal={false} />
                      <YAxis dataKey="text" type="category" hide />
                      <XAxis type="number" hide />
                      <ChartTooltip
                        cursor={false}
                        content={
                          <ChartTooltipContent
                            indicator="line"
                            formatter={(value: any, name: any) => {
                              if (name === 'clicks') {
                                return [Number(value), ' Clicks'];
                              }
                              return [Number(value), String(name)];
                            }}
                          />
                        }
                      />
                      <Bar
                        dataKey="clicks"
                        fill="var(--color-clicks)"
                        radius={4}
                      >
                        <LabelList
                          dataKey="text"
                          content={<CustomBarLabel />}
                          fontSize={12}
                          formatter={(value: string) => truncate(value, 30)}
                        />
                        <LabelList
                          dataKey="clicks"
                          position="right"
                          offset={8}
                          className="fill-foreground"
                          fontSize={12}
                        />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No link clicks recorded yet.
                  </p>
                )}
              </Card>
            </div>
          ) : (
            <div className="relative">
              <ProFeatureTeaser />
              <div className="absolute inset-0 flex items-center justify-center">
                <Card className="w-full max-w-md p-6 text-center shadow-lg bg-white/95 backdrop-blur">
                  <h3 className="mb-2 text-lg font-semibold">Pro Analytics</h3>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Upgrade to Pro to view detailed analytics including traffic
                    sources, locations, and link click statistics.
                  </p>
                  <a
                    href="/dashboard/account/"
                    className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Upgrade to Pro
                  </a>
                </Card>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
