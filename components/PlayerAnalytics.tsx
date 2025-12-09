'use client';

import { useState, useMemo } from 'react';
import { Card } from './ui/card';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis
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
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { format, parseISO } from 'date-fns';
import { Skeleton } from './ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DateTime } from 'luxon';

interface PlayerAnalyticsProps {
  playerId: string;
}

type TimeframeOption = 'day' | 'yesterday' | '7d' | '30d' | '90d';

const playsConfig = {
  plays: {
    label: 'Plays',
    color: '#2563eb'
  },
  label: {
    color: 'hsl(var(--background))'
  }
} satisfies ChartConfig;

const timeseriesConfig = {
  plays: {
    label: 'Plays',
    color: '#10b981'
  }
} satisfies ChartConfig;

interface Song {
  id: number;
  song_name: string;
  artist: string | null;
}

interface SongPlay {
  song_id: number;
  plays: number;
  song_name?: string;
  artist?: string | null;
}

interface PlayerAnalytics {
  songPlays: SongPlay[];
  timeseries: any[];
  player_name?: string;
}

interface Player {
  player_name: string;
}

const fetchAnalytics = async ({
  playerId,
  timeRange
}: {
  playerId: number;
  timeRange: TimeframeOption;
}) => {
  const response = await fetch(
    `/api/player-analytics?playerId=${playerId}&period=${timeRange}`
  );
  if (!response.ok) throw new Error('Failed to fetch analytics');
  return response.json();
};

const fetchSongDetails = async (songIds: number[]) => {
  if (!songIds.length) return {};
  const supabase = createClient();
  const { data, error } = await supabase
    .from('songs')
    .select('id, song_name, artist')
    .in('id', songIds)
    .returns<Song[]>();

  if (error) throw error;

  return data.reduce((acc: Record<number, Song>, song) => {
    acc[song.id] = song;
    return acc;
  }, {});
};

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

const LoadingSkeleton = () => {
  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:items-center md:flex-row">
        <div>
          <div className="w-64 h-6 bg-muted rounded animate-pulse" />
          <div className="w-48 h-4 mt-2 bg-muted rounded animate-pulse" />
        </div>
        <div className="w-[160px] h-10 bg-muted rounded animate-pulse" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="space-y-1">
            <div className="w-24 h-4 bg-muted rounded animate-pulse" />
            <div className="w-16 h-8 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="h-[250px] w-full bg-muted rounded animate-pulse" />

      <Card className="p-4">
        <div className="w-32 h-6 mb-4 bg-muted rounded animate-pulse" />
        <div className="h-[280px] w-full bg-muted rounded animate-pulse" />
      </Card>
    </div>
  );
};

const now = DateTime.now().setZone('America/New_York');
const currentHour = now.hour;

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

export default function PlayerAnalytics({ playerId }: PlayerAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<TimeframeOption>('7d');

  const { data: playerData } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('players')
        .select('player_name')
        .eq('id', Number(playerId))
        .single();

      if (error) throw error;
      return data as Player;
    }
  });

  const {
    data: analytics,
    isLoading: isAnalyticsLoading,
    error: analyticsError
  } = useQuery({
    queryKey: ['playerAnalytics', playerId, timeRange],
    queryFn: () =>
      fetchAnalytics({
        playerId: Number(playerId),
        timeRange
      })
  });

  const songIds =
    analytics?.songPlays?.map((play: SongPlay) => play.song_id) || [];

  const { data: songDetails = {} } = useQuery({
    queryKey: ['songDetails', songIds],
    queryFn: () => fetchSongDetails(songIds),
    enabled: songIds.length > 0
  });

  const filteredData = useMemo(() => {
    let data = analytics?.timeseries || [];

    if (timeRange === 'day') {
      data = data.map((entry: any) => {
        const entryDate = parseISO(entry.date);
        const entryHour = entryDate.getHours();

        return {
          ...entry,
          plays: entryHour <= currentHour ? entry.plays : null
        };
      });
    }
    return data;
  }, [analytics?.timeseries, timeRange, currentHour]);

  if (isAnalyticsLoading) {
    return <LoadingSkeleton />;
  }

  if (analyticsError) {
    return (
      <Card className="p-4 text-destructive">
        Error loading analytics:{' '}
        {(analyticsError as Error).message || 'Failed to load analytics data'}
      </Card>
    );
  }

  if (!analytics || !analytics.songPlays?.length) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h3 className="text-lg font-semibold">
              Analytics for {playerData?.player_name || 'Player'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Viewing statistics for the last {timeRange}
            </p>
          </div>
          <div className="flex flex-row items-center w-full gap-4 md:w-auto">
          <p className="text-sm text-muted-foreground">Stats are updated every 15 minutes.</p>
            <Select
              value={timeRange}
              onValueChange={(value: TimeframeOption) => setTimeRange(value)}
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Card className="p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground" />
            <h3 className="mt-2 text-lg font-semibold">No Data Available</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              No play data is available for this player in the selected time
              period. Try selecting a different time range.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  const songPlaysWithDetails = analytics.songPlays.map((play: SongPlay) => ({
    ...play,
    song_name: songDetails[play.song_id]?.song_name || 'Unknown Song',
    artist: songDetails[play.song_id]?.artist || 'Unknown Artist'
  }));

  const totalPlays = analytics.songPlays.reduce(
    (sum: number, song: any) => sum + song.plays,
    0
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h3 className="text-lg font-semibold">
            Analytics for {playerData?.player_name || 'Player'}
          </h3>
            <p className="text-sm text-muted-foreground">
            Viewing statistics for the last {timeRange}
          </p>
        </div>
        <div className="flex flex-row items-center w-full gap-4 md:w-auto">
          <p className="text-sm text-muted-foreground">Stats are updated every 15 minutes.</p>
        <Select
          value={timeRange}
          onValueChange={(value: TimeframeOption) => setTimeRange(value)}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select timeframe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Today</SelectItem>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">Total Plays for this timeframe</p>
        <p className="text-2xl font-bold">{totalPlays}</p>
      </div>

      <div className="">
        <ChartContainer
          config={timeseriesConfig}
          className="h-[200px] md:h-[250px] w-full aspect-auto"
        >
          <AreaChart
            data={filteredData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="fillPlays" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-plays)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-plays)"
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
              dataKey="plays"
              name="Plays"
              type="monotone"
              fill="url(#fillPlays)"
              stroke="var(--color-plays)"
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

      <Card className="p-3 md:p-4">
        <h3 className="mb-3 font-semibold">Song Plays</h3>
        <div className="px-2">
          <ChartContainer
            config={playsConfig}
            className="h-[200px] md:h-[280px] w-full aspect-auto"
          >
            <BarChart
              data={songPlaysWithDetails}
              layout="vertical"
              margin={{ top: 0, right: 80, bottom: 0, left: 0 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="song_name" type="category" hide />
              <XAxis type="number" hide />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              <Bar dataKey="plays" fill="var(--color-plays)" radius={4}>
                <LabelList
                  dataKey="song_name"
                  content={<CustomBarLabel />}
                  fontSize={12}
                  formatter={(value: string) => `${value}`}
                />
                <LabelList
                  dataKey="plays"
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
    </div>
  );
}
