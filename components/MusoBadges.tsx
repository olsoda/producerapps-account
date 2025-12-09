import React from 'react';
import { ExternalLink } from 'lucide-react';

type BadgeStatType =
  | 'verified_credits'
  | 'verified_collaborators'
  | 'songwriter_rank'
  | 'producer_rank'
  | 'engineer_rank'
  | 'mixing_engineer_rank'
  | 'mastering_engineer_rank'
  | 'assistant_engineer_rank'
  | 'artist_rank'
  | 'none';

interface BadgeConfig {
  id: string;
  statType: BadgeStatType;
  enabled: boolean;
  customColors?: {
    backgroundColor: string | null;
    textColor: string | null;
    borderColor: string | null;
  };
}

interface MusoStatsConfig {
  enabled: boolean;
  badges: [BadgeConfig, BadgeConfig, BadgeConfig];
  styling: {
    colorMode: 'muso' | 'global' | 'custom';
    backgroundColor: string | null;
    textColor: string | null;
    borderColor: string | null;
    showBorders: boolean;
    compactMode: boolean;
    fullWidth: boolean;
    stacked: boolean;
  };
  position: 'above_copy' | 'below_copy' | 'above_links' | 'below_links';
}

interface MusoBadgesProps {
  config: MusoStatsConfig;
  musoData?: {
    profile?: any;
    charts?: any;
  } | null;
  className?: string;
  fallbackColors?: {
    background: string;
    text: string;
    border: string;
  };
}

// Helper functions
const getBadgeLabel = (statType: BadgeStatType): string => {
  switch (statType) {
    case 'verified_credits':
      return 'Verified Credits';
    case 'verified_collaborators':
      return 'Verified Collaborators';
    case 'songwriter_rank':
      return 'Songwriters';
    case 'producer_rank':
      return 'Producers';
    case 'engineer_rank':
      return 'Engineers';
    case 'mixing_engineer_rank':
      return 'Mixing Engineers';
    case 'mastering_engineer_rank':
      return 'Mastering Engineers';
    case 'assistant_engineer_rank':
      return 'Assistant Engineers';
    case 'artist_rank':
      return 'Artists';
    default:
      return '';
  }
};

// Toned down Muso-inspired color palette for each rank type
const getMusoBadgeColors = (statType: BadgeStatType) => {
  switch (statType) {
    case 'songwriter_rank':
      return { background: '#4a1e47', text: '#ffa8d6', border: '#ffa8d6' };
    case 'producer_rank':
      return { background: '#1a2e20', text: '#8df0c0', border: '#8df0c0' };
    case 'mixing_engineer_rank':
      return { background: '#3a2c1a', text: '#ffcc8a', border: '#ffcc8a' };
    case 'mastering_engineer_rank':
      return { background: '#3d3620', text: '#ffe680', border: '#ffe680' };
    case 'engineer_rank':
      return { background: '#1f2937', text: '#93c5fd', border: '#93c5fd' };
    case 'assistant_engineer_rank':
      return { background: '#2d1b2e', text: '#e4a5e7', border: '#e4a5e7' };
    case 'artist_rank':
      return { background: '#2e1f1b', text: '#fbbf7f', border: '#fbbf7f' };
    case 'verified_credits':
      return { background: '#1E2C3A', text: '#A3CAE0', border: '#3A434C' };
    case 'verified_collaborators':
      return { background: '#2e1e3a', text: '#E2C8F2', border: '#b584d9' };
    default:
      return { background: null, text: null, border: null };
  }
};

const formatBadgeValue = (
  statType: BadgeStatType,
  profileData: any,
  chartsData: any
): string => {
  if (!profileData) return '';
  switch (statType) {
    case 'verified_credits':
      return profileData.creditCount?.toString() || '0';
    case 'verified_collaborators':
      return profileData.collaboratorsCount?.toString() || '0';
    case 'songwriter_rank':
    case 'producer_rank':
    case 'engineer_rank':
    case 'mixing_engineer_rank':
    case 'mastering_engineer_rank':
    case 'assistant_engineer_rank':
    case 'artist_rank': {
      if (!chartsData || !Array.isArray(chartsData)) return '';
      const chartNameMap: Record<string, string> = {
        songwriter_rank: 'Songwriters',
        producer_rank: 'Producers',
        engineer_rank: 'Engineers',
        mixing_engineer_rank: 'Mixing Engineers',
        mastering_engineer_rank: 'Mastering Engineers',
        assistant_engineer_rank: 'Assistant Engineers',
        artist_rank: 'Artists'
      };
      const chartName = chartNameMap[statType];
      const chart = chartsData.find((c: any) => c.chartName === chartName);
      return chart && chart.percentage ? `Top ${chart.percentage}%` : '';
    }
    default:
      return '';
  }
};

const getBadgeColors = (
  badge: BadgeConfig,
  config: MusoStatsConfig,
  fallbackColors: { background: string; text: string; border: string }
) => {
  const { colorMode } = config.styling;

  // First determine the base colors based on the mode
  let baseColors: { background: string; text: string; border: string };

  switch (colorMode) {
    case 'muso': {
      const musoColors = getMusoBadgeColors(badge.statType);
      baseColors = {
        background: musoColors.background || fallbackColors.background,
        text: musoColors.text || fallbackColors.text,
        border: musoColors.border || fallbackColors.border
      };
      break;
    }
    case 'custom': {
      baseColors = {
        background: config.styling.backgroundColor || fallbackColors.background,
        text: config.styling.textColor || fallbackColors.text,
        border: config.styling.borderColor || fallbackColors.border
      };
      break;
    }
    default: {
      baseColors = fallbackColors;
      break;
    }
  }

  // Then apply any badge-specific overrides
  return {
    background: badge.customColors?.backgroundColor || baseColors.background,
    text: badge.customColors?.textColor || baseColors.text,
    border: badge.customColors?.borderColor || baseColors.border
  };
};

export default function MusoBadges({
  config,
  musoData,
  className = '',
  fallbackColors
}: MusoBadgesProps) {
  if (!config.enabled) return null;
  if (!musoData) return null;

  const enabledBadges = config.badges.filter(
    (badge) => badge.enabled && badge.statType !== 'none'
  );
  if (enabledBadges.length === 0) return null;

  const { profile, charts } = musoData;

  // Extract the actual data from the API response structure
  const profileData = profile?.data || profile;
  const chartsData = charts?.data || charts;

  // Get container classes based on layout options
  const getContainerClasses = () => {
    const { fullWidth, stacked } = config.styling;
    let classes = 'flex gap-1 sm:gap-2';

    if (stacked) {
      classes += ' flex-col items-center';
      if (fullWidth) {
        classes += ' w-full';
      }
    } else {
      classes += ' flex-wrap justify-center';
      if (fullWidth) {
        classes += ' w-full';
      }
    }

    return classes;
  };

  // Get badge classes based on layout options
  const getBadgeClasses = () => {
    const { fullWidth, stacked } = config.styling;
    let classes = `relative px-3 py-3 rounded-xl text-center ${
      config.styling.showBorders ? 'border-2' : ''
    } shadow-sm`;

    if (fullWidth) {
      if (stacked) {
        classes += ' w-full';
      } else {
        classes += ' flex-1';
      }
    } else if (stacked) {
      classes += ' min-w-[140px]';
    } else {
      classes += ' min-w-[120px]';
    }

    return classes;
  };

  // Get profile ID for linking to Muso profile
  const profileId = profileData?.id || profileData?.profileId;

  return (
    <div className={`flex flex-col items-center gap-2 w-full ${className}`}>
      {/* Badges */}
      <div className={getContainerClasses()}>
        {enabledBadges.map((badge) => {
          const label = getBadgeLabel(badge.statType);
          const value = formatBadgeValue(
            badge.statType,
            profileData,
            chartsData
          );
          if (!value) return null;

          // Get colors based on the selected mode
          const defaultFallbacks = fallbackColors || {
            background: '#f3f4f6',
            text: '#374151',
            border: '#d1d5db'
          };

          const colors = getBadgeColors(badge, config, defaultFallbacks);

          return (
            <a
              key={badge.id}
              href={
                profileId
                  ? `https://credits.muso.ai/profile/${profileId}`
                  : undefined
              }
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-between rounded-2xl shadow-lg px-6 py-3 transition-all duration-200 no-underline group hover:opacity-95 hover:scale-105 ${getBadgeClasses()}`}
              style={{
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: config.styling.showBorders
                  ? colors.border
                  : undefined
              }}
              title={`View ${profileData?.name}'s Muso Profile`}
            >
              {/* Main content */}
              <div className="flex flex-col items-center justify-center gap-1.5 mb-3 mt-1">
                {/* Stat value - larger and more prominent */}
                <div className=" font-semibold leading-none">{value}</div>
                {/* Stat label - slightly larger and clearer */}
                <div className="text-xs font-medium opacity-80 leading-tight text-center">
                  {label}
                </div>
              </div>
              {/* Logo at bottom */}
              <div className="flex items-center justify-center">
                <img
                  src="/musologo.svg"
                  alt="Muso.AI"
                  className="h-2.5 w-auto opacity-90"
                />
              </div>
            </a>
          );
        })}
      </div>

      {/* Muso Attribution */}
      <div className="">
        {profileId && (
          <a
            href={`https://credits.muso.ai/profile/${profileId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center hover:opacity-80 transition-opacity text-xs opacity-60 gap-2"
            title="View Muso Profile"
          >
            <span>
              Verified stats for{' '}
              <span className="font-semibold">{profileData?.name}</span> powered
              by Muso.AI
            </span>
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}
