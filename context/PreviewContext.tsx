'use client';

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import { useDebounce } from '@/hooks/use-debounce';

// Types for the preview system
export interface PreviewLandingPage {
  accent_color_override: string | null;
  created_at: string | null;
  custom_path: string;
  font_override: string | null;
  header_image_styles: Json | null;
  header_image_url: string | null;
  id: number;
  intro_copy: string | null;
  link_global_styles: Json | null;
  links: Json | null;
  page_background_color: string | null;
  page_headline: string | null;
  page_name: string | null;
  player_id: number | null;
  show_branding: boolean | null;
  social_link_styles: Json | null;
  social_links: Json | null;
  text_color: string | null;
  user_branding_name: string | null;
  user_id: string;
  page_metadata: Json | null;
  headline_and_paragraph_styles: Json | null;
  background_image: string | null;
  muso_stats_config: Json | null;
  previous_path: string | null;
}

export interface PreviewPlayer {
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

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export interface PreviewSong {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  before_audio_url: string;
  after_audio_url: string;
  classic_audio_url: string;
  song_description: string;
}

export interface PreviewState {
  landingPage: PreviewLandingPage | null;
  player: PreviewPlayer | null;
  playlistSongs: PreviewSong[];
  musoData: any;
  hasUnsavedChanges: boolean;
  isPreviewMode: boolean;
  lastSavedState: PreviewLandingPage | null;
  previewErrors: string[];
}

export type PreviewAction =
  | { type: 'INITIALIZE'; payload: { landingPage: PreviewLandingPage; player?: PreviewPlayer; playlistSongs?: PreviewSong[]; musoData?: any } }
  | { type: 'UPDATE_LANDING_PAGE'; payload: Partial<PreviewLandingPage> }
  | { type: 'UPDATE_PLAYER'; payload: Partial<PreviewPlayer> }
  | { type: 'UPDATE_PLAYLIST_SONGS'; payload: PreviewSong[] }
  | { type: 'UPDATE_MUSO_DATA'; payload: any }
  | { type: 'MARK_SAVED'; payload: PreviewLandingPage }
  | { type: 'TOGGLE_PREVIEW_MODE' }
  | { type: 'RESET_TO_SAVED' }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'BATCH_UPDATE'; payload: { landingPage?: Partial<PreviewLandingPage>; player?: Partial<PreviewPlayer>; musoData?: any } };

const initialState: PreviewState = {
  landingPage: null,
  player: null,
  playlistSongs: [],
  musoData: null,
  hasUnsavedChanges: false,
  isPreviewMode: true,
  lastSavedState: null,
  previewErrors: []
};

function previewReducer(state: PreviewState, action: PreviewAction): PreviewState {
  switch (action.type) {
    case 'INITIALIZE':
      return {
        ...state,
        landingPage: action.payload.landingPage,
        player: action.payload.player || null,
        playlistSongs: action.payload.playlistSongs || [],
        musoData: action.payload.musoData || null,
        lastSavedState: action.payload.landingPage,
        hasUnsavedChanges: false,
        previewErrors: []
      };

    case 'UPDATE_LANDING_PAGE':
      if (!state.landingPage) return state;
      
      const updatedLandingPage = { ...state.landingPage, ...action.payload };
      const hasChanges = JSON.stringify(updatedLandingPage) !== JSON.stringify(state.lastSavedState);
      
      return {
        ...state,
        landingPage: updatedLandingPage,
        hasUnsavedChanges: hasChanges
      };

    case 'UPDATE_PLAYER':
      if (!state.player) return state;
      
      return {
        ...state,
        player: { ...state.player, ...action.payload },
        hasUnsavedChanges: true
      };

    case 'UPDATE_PLAYLIST_SONGS':
      return {
        ...state,
        playlistSongs: action.payload
      };

    case 'UPDATE_MUSO_DATA':
      return {
        ...state,
        musoData: action.payload
      };

    case 'MARK_SAVED':
      return {
        ...state,
        lastSavedState: action.payload,
        hasUnsavedChanges: false
      };

    case 'TOGGLE_PREVIEW_MODE':
      return {
        ...state,
        isPreviewMode: !state.isPreviewMode
      };

    case 'RESET_TO_SAVED':
      return {
        ...state,
        landingPage: state.lastSavedState,
        hasUnsavedChanges: false
      };

    case 'ADD_ERROR':
      return {
        ...state,
        previewErrors: [...state.previewErrors, action.payload]
      };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        previewErrors: []
      };

    case 'BATCH_UPDATE':
      const batchState = { ...state };
      let batchHasChanges = state.hasUnsavedChanges;

      if (action.payload.landingPage && batchState.landingPage) {
        batchState.landingPage = { ...batchState.landingPage, ...action.payload.landingPage };
        batchHasChanges = JSON.stringify(batchState.landingPage) !== JSON.stringify(state.lastSavedState);
      }

      if (action.payload.player && batchState.player) {
        batchState.player = { ...batchState.player, ...action.payload.player };
        batchHasChanges = true;
      }

      if (action.payload.musoData !== undefined) {
        batchState.musoData = action.payload.musoData;
      }

      return {
        ...batchState,
        hasUnsavedChanges: batchHasChanges
      };

    default:
      return state;
  }
}

interface PreviewContextValue {
  state: PreviewState;
  dispatch: React.Dispatch<PreviewAction>;
  actions: {
    initialize: (data: { landingPage: PreviewLandingPage; player?: PreviewPlayer; playlistSongs?: PreviewSong[]; musoData?: any }) => void;
    updateLandingPage: (updates: Partial<PreviewLandingPage>) => void;
    updatePlayer: (updates: Partial<PreviewPlayer>) => void;
    updatePlaylistSongs: (songs: PreviewSong[]) => void;
    updateMusoData: (data: any) => void;
    markSaved: (landingPage: PreviewLandingPage) => void;
    togglePreviewMode: () => void;
    resetToSaved: () => void;
    addError: (error: string) => void;
    clearErrors: () => void;
    batchUpdate: (updates: { landingPage?: Partial<PreviewLandingPage>; player?: Partial<PreviewPlayer>; musoData?: any }) => void;
  };
  computed: {
    previewData: {
      landingPage: PreviewLandingPage | null;
      player: PreviewPlayer | null;
      playlistSongs: PreviewSong[];
      musoData: any;
    };
    canSave: boolean;
    hasErrors: boolean;
  };
}

const PreviewContext = createContext<PreviewContextValue | null>(null);

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(previewReducer, initialState);

  // Debounced dispatch for performance
  const debouncedDispatch = useDebounce(dispatch, 100);

  // Action creators with performance optimizations
  const actions = useMemo(() => ({
    initialize: (data: { landingPage: PreviewLandingPage; player?: PreviewPlayer; playlistSongs?: PreviewSong[]; musoData?: any }) => {
      dispatch({ type: 'INITIALIZE', payload: data });
    },

    updateLandingPage: (updates: Partial<PreviewLandingPage>) => {
      debouncedDispatch({ type: 'UPDATE_LANDING_PAGE', payload: updates });
    },

    updatePlayer: (updates: Partial<PreviewPlayer>) => {
      debouncedDispatch({ type: 'UPDATE_PLAYER', payload: updates });
    },

    updatePlaylistSongs: (songs: PreviewSong[]) => {
      dispatch({ type: 'UPDATE_PLAYLIST_SONGS', payload: songs });
    },

    updateMusoData: (data: any) => {
      dispatch({ type: 'UPDATE_MUSO_DATA', payload: data });
    },

    markSaved: (landingPage: PreviewLandingPage) => {
      dispatch({ type: 'MARK_SAVED', payload: landingPage });
    },

    togglePreviewMode: () => {
      dispatch({ type: 'TOGGLE_PREVIEW_MODE' });
    },

    resetToSaved: () => {
      dispatch({ type: 'RESET_TO_SAVED' });
    },

    addError: (error: string) => {
      dispatch({ type: 'ADD_ERROR', payload: error });
    },

    clearErrors: () => {
      dispatch({ type: 'CLEAR_ERRORS' });
    },

    batchUpdate: (updates: { landingPage?: Partial<PreviewLandingPage>; player?: Partial<PreviewPlayer>; musoData?: any }) => {
      debouncedDispatch({ type: 'BATCH_UPDATE', payload: updates });
    }
  }), [debouncedDispatch]);

  // Computed values
  const computed = useMemo(() => ({
    previewData: {
      landingPage: state.landingPage,
      player: state.player,
      playlistSongs: state.playlistSongs,
      musoData: state.musoData
    },
    canSave: state.hasUnsavedChanges && state.previewErrors.length === 0,
    hasErrors: state.previewErrors.length > 0
  }), [state]);

  const value = useMemo(() => ({
    state,
    dispatch,
    actions,
    computed
  }), [state, actions, computed]);

  return (
    <PreviewContext.Provider value={value}>
      {children}
    </PreviewContext.Provider>
  );
}

export function usePreview() {
  const context = useContext(PreviewContext);
  if (!context) {
    throw new Error('usePreview must be used within a PreviewProvider');
  }
  return context;
}

// Specialized hooks for different aspects of the preview
export function usePreviewLandingPage() {
  const { state, actions } = usePreview();
  
  return {
    landingPage: state.landingPage,
    updateLandingPage: actions.updateLandingPage,
    hasUnsavedChanges: state.hasUnsavedChanges
  };
}

export function usePreviewPlayer() {
  const { state, actions } = usePreview();
  
  return {
    player: state.player,
    updatePlayer: actions.updatePlayer
  };
}

export function usePreviewMuso() {
  const { state, actions } = usePreview();
  
  return {
    musoData: state.musoData,
    updateMusoData: actions.updateMusoData
  };
}

export function usePreviewValidation() {
  const { state, actions } = usePreview();
  
  const validateField = useCallback((field: string, value: any): string | null => {
    // Add field-specific validation logic here
    if (field === 'custom_path' && (!value || value.trim() === '')) {
      return 'Custom path is required';
    }
    
    if (field === 'custom_path' && !/^[a-zA-Z0-9-_]+$/.test(value)) {
      return 'Custom path can only contain letters, numbers, hyphens, and underscores';
    }
    
    return null;
  }, []);

  const validateLandingPage = useCallback((landingPage: PreviewLandingPage): string[] => {
    const errors: string[] = [];
    
    const pathError = validateField('custom_path', landingPage.custom_path);
    if (pathError) errors.push(pathError);
    
    return errors;
  }, [validateField]);

  return {
    errors: state.previewErrors,
    validateField,
    validateLandingPage,
    addError: actions.addError,
    clearErrors: actions.clearErrors,
    hasErrors: state.previewErrors.length > 0
  };
} 