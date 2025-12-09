'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

interface Player {
  id: number;
  accent_color: string;
  background_color: string;
  foreground_neutral: string;
  text_color: string;
  before_audio_label: string;
  after_audio_label: string;
  user_id: string;
  public_path: string;
  show_branding: boolean;
  show_artwork: boolean;
  auto_advance: boolean;
  player_name: string;
  theme: string;
  play_button_background_color: string | null;
  play_pause_icon_color: string | null;
  song_name_color: string | null;
  artist_name_color: string | null;
  playhead_background_color: string | null;
  playhead_progress_color: string | null;
  before_button_active_color: string | null;
  before_button_inactive_color: string | null;
  before_text_color_active: string | null;
  before_text_color_inactive: string | null;
  after_button_active_color: string | null;
  after_button_inactive_color: string | null;
  after_text_color_active: string | null;
  after_text_color_inactive: string | null;
  playlist_background_color: string | null;
  playlist_selected_track_text_color: string | null;
  playlist_text_color: string | null;
  selected_track_color: string | null;
  playlist_divider_color: string | null;
  font_family: string | null;
  player_border_color: string | null;
  play_button_border_color: string | null;
  toggle_border_color: string | null;
  playlist_border_color: string | null;
}

export function usePlayers(userId: string) {
  return useQuery<Player[]>({
    queryKey: ['players', userId],
    queryFn: async () => {
      const supabase = createClient();
      
      const { data: players, error } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', userId)
        .order('player_name', { ascending: true });

      if (error) {
        throw error;
      }

      return players || [];
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
} 