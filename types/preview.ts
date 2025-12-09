// Base types
export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

// Landing Page Types
export interface LandingPage {
  accent_color_override: string | null;
  created_at: string | null;
  custom_path: string;
  font_override: string | null;
  header_image_styles: HeaderImageStyles | null;
  header_image_url: string | null;
  id: number;
  intro_copy: string | null;
  link_global_styles: LinkGlobalStyles | null;
  links: PageLink[] | null;
  page_background_color: string | null;
  page_headline: string | null;
  page_name: string | null;
  player_id: number | null;
  show_branding: boolean | null;
  social_link_styles: SocialLinkStyles | null;
  social_links: SocialLink[] | null;
  text_color: string | null;
  user_branding_name: string | null;
  user_id: string;
  page_metadata: PageMetadata | null;
  headline_and_paragraph_styles: HeadlineAndParagraphStyles | null;
  background_image: string | null;
  muso_stats_config: MusoStatsConfig | null;
  previous_path: string | null;
}

// Player Types
export interface Player {
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
  show_artwork_mobile: boolean;
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
  player_type: string | null;
  header_layout: HeaderLayout;
  playlist_order: PlaylistElement[];
}

// Song Types
export interface Song {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  before_audio_url: string;
  after_audio_url: string;
  classic_audio_url: string;
  song_description: string;
}

export interface PlayerSong {
  songs: Song | null;
  order: number;
}

// Layout Types
export interface PlaylistElement {
  type: 'song' | 'artist' | 'description';
  visible: boolean;
}

export interface HeaderLayout {
  line1: { type: string; visible: boolean }[];
  line2: { type: string; visible: boolean }[];
}

// Style Types
export interface HeaderImageStyles {
  shape: 'circle' | 'square';
  size: number; // percentage of container width
  border: {
    enabled: boolean;
    color: string | null;
    width: number;
  };
}

export interface LinkGlobalStyles {
  backgroundColor: string | null;
  textColor: string | null;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  buttonStyle: 'standard' | 'squared' | 'pill';
  shadow: {
    enabled: boolean;
    color: string | null;
    x: number;
    y: number;
    blur: number;
    spread: number;
  };
}

export interface SocialLinkStyles {
  backgroundColor: string | null;
  textColor: string | null;
  borderColor: string | null;
  borderWidth: number;
  borderRadius: number;
  padding: {
    x: number;
    y: number;
  };
}

export interface HeadlineAndParagraphStyles {
  headline: {
    alignment: 'left' | 'center' | 'right';
    color: string | null;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    fontSize: number;
  };
  paragraph: {
    alignment: 'left' | 'center' | 'right';
    color: string | null;
    fontSize: number;
    lineHeight: number;
  };
}

// Link Types
export type SocialPlatform =
  | 'Spotify'
  | 'Apple Music'
  | 'YouTube'
  | 'Twitch'
  | 'Instagram'
  | 'Facebook'
  | 'Twitter'
  | 'TikTok'
  | 'Linkedin'
  | 'Bluesky';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
  order: number;
}

export interface PageLink {
  id: string;
  text: string;
  url: string;
  order: number;
  button_color?: string;
  text_color?: string;
  background_color?: string;
  border_color?: string;
  custom_styles?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    shadow?: LinkGlobalStyles['shadow'];
  };
}

// Muso Types
export type BadgeStatType = 
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

export interface BadgeConfig {
  id: string;
  statType: BadgeStatType;
  enabled: boolean;
  customColors?: {
    backgroundColor: string | null;
    textColor: string | null;
    borderColor: string | null;
  };
}

export interface MusoStatsConfig {
  enabled: boolean;
  badges: [BadgeConfig, BadgeConfig, BadgeConfig]; // Exactly 3 badge slots
  styling: {
    colorMode: 'muso' | 'custom';
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

export interface MusoProfileData {
  id: string;
  username: string;
  profile_picture_url: string | null;
  verified_credits: number;
  verified_collaborators: number;
  // Add other Muso profile fields as needed
}

export interface MusoChartsData {
  songwriter_rank: number | null;
  producer_rank: number | null;
  engineer_rank: number | null;
  mixing_engineer_rank: number | null;
  mastering_engineer_rank: number | null;
  assistant_engineer_rank: number | null;
  artist_rank: number | null;
}

export interface MusoData {
  profile: MusoProfileData | null;
  charts: MusoChartsData | null;
}

// Page Metadata Types
export interface PageMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  keywords: string[] | null;
  author: string | null;
  og_type: string | null;
  twitter_card: string | null;
}

// Resolved Colors Type (computed from player and landing page)
export interface ResolvedColors {
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  playButtonBackgroundColor: string;
  playPauseIconColor: string;
  songNameColor: string;
  artistNameColor: string;
  descriptionColor: string;
  playheadBackgroundColor: string;
  playheadProgressColor: string;
  beforeButtonActiveColor: string;
  beforeButtonInactiveColor: string;
  beforeTextColorActive: string;
  beforeTextColorInactive: string;
  afterButtonActiveColor: string;
  afterButtonInactiveColor: string;
  afterTextColorActive: string;
  afterTextColorInactive: string;
  playlistBackgroundColor: string;
  playlistSelectedTrackTextColor: string;
  playlistTextColor: string;
  selectedTrackColor: string;
  playlistDividerColor: string;
  playerBorderColor: string | null;
  playButtonBorderColor: string | null;
  toggleBorderColor: string | null;
  playlistBorderColor: string | null;
}

// Preview State Types
export interface PreviewState {
  landingPage: LandingPage | null;
  player: Player | null;
  playlistSongs: Song[];
  musoData: MusoData | null;
  hasUnsavedChanges: boolean;
  isPreviewMode: boolean;
  lastSavedState: LandingPage | null;
  previewErrors: string[];
}

// Preview Action Types
export type PreviewAction =
  | { type: 'INITIALIZE'; payload: { landingPage: LandingPage; player?: Player; playlistSongs?: Song[]; musoData?: MusoData } }
  | { type: 'UPDATE_LANDING_PAGE'; payload: Partial<LandingPage> }
  | { type: 'UPDATE_PLAYER'; payload: Partial<Player> }
  | { type: 'UPDATE_PLAYLIST_SONGS'; payload: Song[] }
  | { type: 'UPDATE_MUSO_DATA'; payload: MusoData | null }
  | { type: 'MARK_SAVED'; payload: LandingPage }
  | { type: 'TOGGLE_PREVIEW_MODE' }
  | { type: 'RESET_TO_SAVED' }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'BATCH_UPDATE'; payload: { landingPage?: Partial<LandingPage>; player?: Partial<Player>; musoData?: MusoData } };

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface FieldValidation {
  field: string;
  value: unknown;
  rules: ValidationRule[];
}

export interface ValidationRule {
  type: 'required' | 'pattern' | 'length' | 'custom';
  message: string;
  params?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    validator?: (value: unknown) => boolean;
  };
}

// File Upload Types
export interface FileToUpload {
  file: File;
  type: 'header_image' | 'background_image';
  preview?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface SaveLandingPageResponse extends ApiResponse<LandingPage> {
  landingPage?: LandingPage;
}

// Editor Configuration Types
export interface EditorConfig {
  debounceMs: number;
  autoSave: boolean;
  autoSaveInterval: number;
  showPerformanceMetrics: boolean;
  enableVirtualPreview: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Editor Props Types
export interface LandingPageEditorProps {
  initialPlayer?: Player;
  initialLandingPage: LandingPage;
  initialPlaylistSongs?: Song[];
  initialMusoData?: MusoData;
  onLandingPageChange?: (updatedLandingPage: Partial<LandingPage>) => void;
  onSave?: () => void;
  onMusoDataChange?: (musoData: MusoData | null) => void;
  config?: Partial<EditorConfig>;
}

export interface PreviewProps {
  className?: string;
  showControls?: boolean;
  hasActivePlan?: boolean;
  enablePerformanceMonitoring?: boolean;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Event Types
export interface PreviewChangeEvent<T = unknown> {
  type: string;
  payload: T;
  timestamp: number;
  source: 'user' | 'system';
}

export interface PreviewErrorEvent {
  type: 'error';
  error: Error;
  context: string;
  timestamp: number;
}

// Performance Types
export interface PerformanceMetrics {
  renderTime: number;
  updateTime: number;
  memoryUsage?: number;
  componentCount?: number;
}

export interface PerformanceMonitor {
  startRender(): void;
  endRender(): PerformanceMetrics;
  track(eventName: string, data?: Record<string, unknown>): void;
} 