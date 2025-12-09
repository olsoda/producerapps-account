// filepath: /components/MixFlipPlayerLoader.tsx
import { cache } from 'react';
import { createClient } from '@/utils/supabase/server';
import MixFlipPlayer from './MixFlipPlayer';
import { getGoogleFontsURL } from '@/config/fonts';
import { getUserPlanInfo } from '@/utils/userplan';

interface MixFlipPlayerLoaderProps {
  initialPlayerData: Player;
}

interface Song {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  before_audio_url: string;
  after_audio_url: string;
  classic_audio_url: string;
  song_description: string;
}

interface HeaderElement {
  type: 'song_name' | 'artist' | 'description';
  visible: boolean;
}

interface HeaderLayout {
  [key: string]: HeaderElement[];
  line1: HeaderElement[];
  line2: HeaderElement[];
}

interface PlaylistElement {
  type: 'song' | 'artist' | 'description';
  visible: boolean;
}

interface Player {
  id: number;
  accent_color: string;
  background_color: string;

  before_audio_label: string;
  after_audio_label: string;
  user_id: string;
  show_branding: boolean;
  show_artwork: boolean;
  show_artwork_mobile: boolean;
  auto_advance: boolean;
  play_button_background_color: string;
  play_pause_icon_color: string;
  song_name_color: string;
  artist_name_color: string;
  description_color: string | null;
  playhead_background_color: string;
  playhead_progress_color: string;
  before_button_active_color: string;
  before_button_inactive_color: string;
  before_text_color_active: string;
  before_text_color_inactive: string;
  after_button_active_color: string;
  after_button_inactive_color: string;
  after_text_color_active: string;
  after_text_color_inactive: string;
  playlist_background_color: string;
  playlist_selected_track_text_color: string;
  playlist_text_color: string;
  selected_track_color: string;
  text_color: string;
  foreground_neutral: string;
  playlist_divider_color: string;
  font_family: string;
  player_border_color: string | null;
  play_button_border_color: string | null;
  toggle_border_color: string | null;
  playlist_border_color: string | null;
  default_to_after: boolean;
  player_type: string;
  header_layout: HeaderLayout;
  playlist_order: PlaylistElement[];
  global_artwork: string | null;
  mobile_artwork_position: string | null;
}

// Cache the Supabase client creation
const getSupabase = cache(() => createClient());

// Modify the getPlaylistSongs function to accept userId and handle conditional caching
const getPlaylistSongs = async (
  playerId: number,
  userId: string,
  shouldCache: boolean,
  playerType: string
): Promise<Song[]> => {
  // If caching is enabled, use the cached version
  if (shouldCache) {
    return cache(async () => {
      return fetchPlaylistData(playerId, playerType);
    })();
  }

  // Otherwise fetch directly without caching
  return fetchPlaylistData(playerId, playerType);
};

// Separate the fetch logic - now handles both songs and quick clips
const fetchPlaylistData = async (
  playerId: number,
  playerType: string
): Promise<Song[]> => {
  if (playerType === 'quickclip') {
    return fetchQuickClips(playerId);
  } else {
    return fetchPlaylistSongs(playerId);
  }
};

// New function to fetch quick clips
const fetchQuickClips = async (playerId: number): Promise<Song[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('quick_clips')
    .select('*')
    .eq('player_id', playerId)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching quick clips:', error);
    return [];
  }
  //map data for quick clips
  return data.map((clip, index) => ({
    id: clip.id ? clip.id : index + 1, // Ensure we always have a valid numeric ID
    song_name: clip.name,
    artist: '', // Default artist for quick clips from players table
    album_artwork_url: '', // null
    before_audio_url: '', // null
    after_audio_url: ``, // null
    classic_audio_url: `https://r2.mixflip.io/${clip.r2_key}`, // audio from r2
    song_description: `` //
  }));
};

// Separate the fetch logic for regular songs
const fetchPlaylistSongs = async (playerId: number): Promise<Song[]> => {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('player_songs')
    .select(
      'songs(id, song_name, artist, album_artwork_url, before_audio_url, after_audio_url, classic_audio_url, song_description), order'
    )
    .eq('player_id', playerId)
    .order('order', { ascending: true });

  if (error) {
    console.error('Error fetching playlist songs:', error);
    return [];
  }

  const cdnPrefix =
    process.env.NODE_ENV === 'development'
      ? 'https://r2.mixflip.io/'
      : 'https://cdn.mixflip.io/';

  return data
    .map((ps) => ps.songs)
    .filter((song): song is Song => song !== null)
    .map((song) => ({
      ...song,
      album_artwork_url: `https://r2.mixflip.io/${song.album_artwork_url}`,
      before_audio_url: `${cdnPrefix}${song.before_audio_url}`,
      after_audio_url: `${cdnPrefix}${song.after_audio_url}`,
      classic_audio_url: `${cdnPrefix}${song.classic_audio_url}`,
      song_description: song.song_description || ''
    }));
};

// Similar modification for getPlayerData
const getPlayerData = async (
  playerId: number,
  shouldCache: boolean
): Promise<Player | null> => {
  // If caching is enabled, use the cached version
  if (shouldCache) {
    return cache(async () => {
      return fetchPlayerData(playerId);
    })();
  }

  // Otherwise fetch directly without caching
  return fetchPlayerData(playerId);
};

// Separate the player data fetch logic
const fetchPlayerData = async (playerId: number): Promise<Player | null> => {
  const supabase = getSupabase();
  const { data: rawData, error } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (error || !rawData) {
    console.error('Error fetching player data:', error);
    return null;
  }

  // Always provide a default header_layout if none exists
  const defaultHeaderLayout: HeaderLayout = {
    line1: [{ type: 'song_name', visible: true }],
    line2: [
      { type: 'artist', visible: true },
      { type: 'description', visible: false }
    ]
  };

  // Convert playlist_order to correct type
  const playlistOrder =
    typeof rawData.playlist_order === 'string'
      ? rawData.playlist_order.split('-').map((type) => ({
          type: type as 'song' | 'artist' | 'description',
          visible: true
        }))
      : Array.isArray(rawData.playlist_order)
        ? (rawData.playlist_order as unknown as PlaylistElement[])
        : [
            { type: 'song', visible: true },
            { type: 'artist', visible: true },
            { type: 'description', visible: false }
          ];

  const data = {
    ...rawData,
    header_layout: rawData.header_layout
      ? (rawData.header_layout as unknown as HeaderLayout)
      : defaultHeaderLayout,
    playlist_order: playlistOrder
  } as unknown as Player;

  return data;
};

const resolvePlayerColors = (player: Player) => {
  return {
    playButtonBackgroundColor:
      player.play_button_background_color ?? player.accent_color,
    playPauseIconColor: player.play_pause_icon_color ?? '#ffffff',
    songNameColor: player.song_name_color ?? player.text_color,
    artistNameColor: player.artist_name_color ?? player.text_color,
    descriptionColor: player.description_color ?? player.text_color,
    playheadBackgroundColor:
      player.playhead_background_color ?? player.foreground_neutral,
    playheadProgressColor:
      player.playhead_progress_color ?? player.accent_color,
    beforeButtonActiveColor: player.before_button_active_color ?? '#B91C1C',
    beforeButtonInactiveColor:
      player.before_button_inactive_color ?? player.foreground_neutral,
    beforeTextColorActive: player.before_text_color_active ?? player.text_color,
    beforeTextColorInactive:
      player.before_text_color_inactive ?? player.text_color,
    afterButtonActiveColor:
      player.after_button_active_color ?? player.accent_color,
    afterButtonInactiveColor:
      player.after_button_inactive_color ?? player.foreground_neutral,
    afterTextColorActive: player.after_text_color_active ?? player.text_color,
    afterTextColorInactive:
      player.after_text_color_inactive ?? player.text_color,
    playlistBackgroundColor:
      player.playlist_background_color ?? player.foreground_neutral,
    playlistSelectedTrackTextColor:
      player.playlist_selected_track_text_color ?? player.text_color,
    playlistTextColor: player.playlist_text_color ?? player.text_color,
    selectedTrackColor: player.selected_track_color ?? player.accent_color,
    playlistDividerColor: player.playlist_divider_color ?? '#525252',
    playerBorderColor: player.player_border_color,
    playButtonBorderColor: player.play_button_border_color,
    toggleBorderColor: player.toggle_border_color,
    playlistBorderColor: player.playlist_border_color
  };
};

const checkUserLimits = async (userId: string): Promise<boolean> => {
  const supabase = getSupabase();
  const { data: planInfo } = await supabase
    .from('users')
    .select('song_count')
    .eq('id', userId)
    .single();

  if (!planInfo) return false;

  // If user is over their song limit, disable the player
  const userPlanInfo = await getUserPlanInfo(userId);
  console.log('userPlanInfo', userPlanInfo);
  return !userPlanInfo.isOverLimit.songs;
};

const MixFlipPlayerLoader = async ({
  initialPlayerData
}: MixFlipPlayerLoaderProps) => {
  const fontUrl = getGoogleFontsURL([initialPlayerData.font_family || 'Inter']);

  // Check limits first
  const isWithinLimits = await checkUserLimits(initialPlayerData.user_id);

  // Use the limit check to determine if we should cache
  const [playlistSongs, playerData] = await Promise.all([
    getPlaylistSongs(
      initialPlayerData.id,
      initialPlayerData.user_id,
      isWithinLimits,
      initialPlayerData.player_type
    ),
    getPlayerData(initialPlayerData.id, isWithinLimits)
  ]);

  if (!playerData) {
    console.error('Player data not found');
    return null;
  }

  const resolvedColors = resolvePlayerColors(playerData);

  return (
    <>
      <link rel="stylesheet" href={fontUrl} crossOrigin="anonymous" />

      <MixFlipPlayer
        player={playerData}
        hasActivePlan={isWithinLimits}
        playlistSongs={playlistSongs}
        colors={resolvedColors}
        source="embed"
      />
    </>
  );
};

export default MixFlipPlayerLoader;
