export interface ColorPreset {
  id: string;
  name: string;
  description: string;
  category: 'light' | 'dark' | 'vibrant';
  colors: {
    accent_color: string;
    background_color: string;
    foreground_neutral: string;
    text_color: string;
    // Optional overrides for specific elements
    before_button_active_color?: string;
    after_button_active_color?: string;
    playlist_divider_color?: string;
    // Extended fields from CSV
    play_button_background_color?: string;
    play_pause_icon_color?: string;
    song_name_color?: string;
    playhead_background_color?: string;
    playhead_progress_color?: string;
    before_button_inactive_color?: string;
    before_text_color?: string;
    after_button_inactive_color?: string;
    after_text_color?: string;
    playlist_background_color?: string;
    selected_track_color?: string;
    playlist_text_color?: string;
    playlist_selected_track_text_color?: string;
    artist_name_color?: string;
    font_family?: string;
    player_border_color?: string;
    play_button_border_color?: string;
    toggle_border_color?: string;
    playlist_border_color?: string;
    before_text_color_active?: string;
    before_text_color_inactive?: string;
    after_text_color_active?: string;
    after_text_color_inactive?: string;
    description_color?: string;
  };
}

export const colorPresets: ColorPreset[] = [
  // Light themes
  // {
  //   id: 'default-light',
  //   name: 'Default Light',
  //   description: 'A light version of the default theme',
  //   category: 'light',
  //   colors: {
  //     accent_color: '#2462EB',
  //     background_color: '#DDDDDD',
  //     foreground_neutral: '#FFFFFF',
  //     text_color: '#000000',
  //   }
  // },
  {
    id: 'minimal-light',
    name: 'Minimal Light',
    description: 'Clean and professional with subtle grays',
    category: 'light',
    colors: {
      accent_color: '#3B82F6',
      background_color: '#F8FAFC',
      foreground_neutral: '#E2E8F0',
      text_color: '#1E293B',
      player_border_color: '#DDDDDD',
      playlist_border_color: '#DDDDDD',
      playlist_divider_color: '#DDDDDD',
      font_family: 'DM Sans', // Clean, modern sans-serif
    }
  },
  {
    id: 'warm-light',
    name: 'Warm Light',
    description: 'Warm tones with orange accent',
    category: 'light',
    colors: {
      accent_color: '#EA580C',
      background_color: '#FDEED6',
      foreground_neutral: '#FED7AA',
      text_color: '#772E15',
      before_text_color_active: '#FDEED6',
      after_text_color_active: '#FDEED6',
      font_family: 'Ubuntu', // Warm, friendly serif
    }
  },
  {
    id: 'cool-light',
    name: 'Cool Light',
    description: 'Cool blues and grays',
    category: 'light',
    colors: {
      accent_color: '#0891B2',
      background_color: '#F0F9FF',
      foreground_neutral: '#BAE6FD',
      text_color: '#0C4A6E',
      before_button_active_color: '#0891B2',
      player_border_color: '#BAE6FD',
      before_text_color_active: '#F0F9FF',
      after_text_color_active: '#F0F9FF',
      font_family: 'Lexend', // Clean, readable sans-serif
    }
  },

  // Dark themes
  {
    id: 'default-dark',
    name: 'Default Dark',
    description: 'MixFlip default dark theme',
    category: 'dark',
    colors: {
      accent_color: '#2462EB',
      background_color: '#171717',
      foreground_neutral: '#404040',
      text_color: '#ffffff',
      // Uses Inter (default/null font)
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blues with cyan highlights',
    category: 'dark',
    colors: {
      accent_color: '#0C97AF',
      background_color: '#0F172A',
      foreground_neutral: '#334155',
      text_color: '#F1F5F9',
      playlist_divider_color: '#475569',
      font_family: 'Manrope', // Modern, technical feel
    }
  },
    {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Futuristic pink and cyan',
    category: 'dark',
    colors: {
      accent_color: '#EC4899', // Keep the pink
      background_color: '#0A0B1E', // Darker, more tech-noir feel
      foreground_neutral: '#2D1F3D', // Deep purple undertones
      text_color: '#E2F3F7', // Bright cyan-tinted white
      before_button_active_color: '#00FFD1', // Bright cyan
      after_button_active_color: '#EC4899', // Keep pink
      playlist_divider_color: '#4A2B66', // Neon purple
      font_family: 'Exo', // More cyberpunk-appropriate font from available fonts
    }
  },
  {
    id: 'neon-blue',
    name: 'Neon Blue',
    description: 'Electric blue with dark background',
    category: 'dark',
    colors: {
      accent_color: '#04B8D8',
      background_color: '#0A0A0A',
      foreground_neutral: '#3F3F3F',
      text_color: '#FFFFFF',
      before_button_active_color: '#FF0080',
      playlist_divider_color: '#333333',
      font_family: 'Exo', // Futuristic, tech-inspired
    }
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    description: 'Sophisticated grays',
    category: 'dark',
    colors: {
      accent_color: '#64748B', // Subtle slate blue accent
      background_color: '#1C1917', // Deep charcoal background
      foreground_neutral: '#292524', // Darker warm gray
      text_color: '#F5F5F4', // Off-white text
      playlist_divider_color: '#44403C', // Warm gray divider
      font_family: 'DM Sans',
    }
  },
  {
    id: 'purple-dark',
    name: 'Lilac Dark',
    description: 'Rich purples',
    category: 'dark',
    colors: {
      accent_color: '#8E35DD',
      background_color: '#1E1B4B',
      foreground_neutral: '#45247C',
      text_color: '#F3F4F6',
      playlist_divider_color: '#4C1D95',
      font_family: 'Outfit',
    }
  },
  {
    id: 'retro-wave',
    name: 'Retro Wave',
    description: '80s inspired purple and pink',
    category: 'dark',
    colors: {
      accent_color: '#D946EF',
      background_color: '#1A0B2E',
      foreground_neutral: '#2D1B69',
      text_color: '#F5F3FF',
      before_button_active_color: '#7C3AED',
      after_button_active_color: '#D946EF',
      playlist_divider_color: '#4C1D95',
      font_family: 'Space Grotesk', // Futuristic, tech-inspired
    }
  },
  
  {
    id: 'monochrome-dark',
    name: 'Monochrome Dark',
    description: 'High contrast black and white theme with subtle grays',
    category: 'dark',
    colors: {
      accent_color: '#797979ff',
      background_color: '#000000ff',
      foreground_neutral: '#000000ff',
      text_color: '#f0ece8ff',
      play_button_background_color: '#000000ff',
      play_pause_icon_color: '#f0ece8ff',
      song_name_color: '',
      playhead_background_color: '#444444ff',
      playhead_progress_color: '#f0ece8ff',
      before_button_active_color: '',
      before_button_inactive_color: '#000000ff',
      before_text_color: '#f0ece8ff',
      after_button_active_color: '#f0ece8ff',
      after_button_inactive_color: '',
      after_text_color: '',
      playlist_background_color: '',
      selected_track_color: '#f0ece8ff',
      playlist_text_color: '',
      playlist_selected_track_text_color: '#000000ff',
      artist_name_color: '',
      playlist_divider_color: '#525252b5',
      font_family: 'Thicccboi',
      player_border_color: '#ffffff26',
      play_button_border_color: '#ffffff',
      toggle_border_color: '#ffffff40',
      playlist_border_color: '#ffffff26',
      before_text_color_active: '',
      before_text_color_inactive: '',
      after_text_color_active: '#000000ff',
      after_text_color_inactive: '',
      description_color: '',
    }
  },

  // Stylized themes (formerly vibrant)
  
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm gradient-inspired colors',
    category: 'vibrant',
    colors: {
      accent_color: '#F59E0B',
      background_color: '#7C2D12',
      foreground_neutral: '#A16207',
      text_color: '#FEF3C7',
      before_button_active_color: '#DC2626',
      after_button_active_color: '#F59E0B',
      playlist_divider_color: '#92400E',
      font_family: 'Fraunces', // Warm, expressive serif
    }
  },

  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep sea blues and teals',
    category: 'vibrant',
    colors: {
      accent_color: '#0891B2',
      background_color: '#0C4A6E',
      foreground_neutral: '#0369A1',
      text_color: '#E0F2FE',
      before_button_active_color: '#0284C7',
      after_button_active_color: '#0891B2',
      playlist_divider_color: '#075985',
      font_family: 'Urbanist', // Flowing, modern sans-serif
    }
  },
  {
    id: 'forest-dark',
    name: 'Forest Dark',
    description: 'Deep greens with emerald accent',
    category: 'vibrant',
    colors: {
      accent_color: '#15803d', // Rich emerald green accent
      background_color: '#052e16', // Deep forest background
      foreground_neutral: '#134426', // Dark forest green for contrast
      text_color: '#f0fdf4', // Fresh leaf green text
      playlist_divider_color: '#14532d', // Deep mossy green divider
      font_family: 'Outfit', // Clean, modern font that works well
    }
  },
  {
    id: 'fire',
    name: 'Fire',
    description: 'Intense reds and oranges',
    category: 'vibrant',
    colors: {
      accent_color: '#EF4444',
      background_color: '#7F1D1D',
      foreground_neutral: '#991B1B',
      text_color: '#FEF2F2',
      before_button_active_color: '#DC2626',
      after_button_active_color: '#EF4444',
      playlist_divider_color: '#B91C1C',
      font_family: 'Trueno', // Bold, energetic custom font
    }
  },
];

export const getPresetsByCategory = (category: ColorPreset['category']) => {
  return colorPresets.filter(preset => preset.category === category);
};

export const getPresetById = (id: string) => {
  return colorPresets.find(preset => preset.id === id);
};