'use client';

import { useCallback, useMemo } from 'react';
import { usePreview, type PreviewLandingPage, type PreviewPlayer } from '@/context/PreviewContext';
import { useDebounce } from '@/hooks/use-debounce';

// Additional types for editor functionality
interface SocialLink {
  id: string;
  platform: string;
  url: string;
  order: number;
}

interface PageLink {
  id: string;
  text: string;
  url: string;
  order: number;
  button_color?: string;
}

// Hook for handling color-related updates
export function usePreviewColors() {
  const { state, actions } = usePreview();

  const resolvedColors = useMemo(() => {
    const { landingPage, player } = state;
    
    if (!player) return null;

    return {
      accentColor: landingPage?.accent_color_override || player.accent_color,
      textColor: landingPage?.text_color || player.text_color,
      backgroundColor: landingPage?.page_background_color || player.background_color,
      
      // Player-specific colors with fallbacks
      playButtonBackgroundColor: player.play_button_background_color ?? player.accent_color,
      playPauseIconColor: player.play_pause_icon_color ?? '#ffffff',
      songNameColor: player.song_name_color ?? player.text_color,
      artistNameColor: player.artist_name_color ?? player.text_color,
      descriptionColor: player.text_color,
      playheadBackgroundColor: player.playhead_background_color ?? player.foreground_neutral,
      playheadProgressColor: player.playhead_progress_color ?? player.accent_color,
      beforeButtonActiveColor: player.before_button_active_color ?? '#B91C1C',
      beforeButtonInactiveColor: player.before_button_inactive_color ?? player.foreground_neutral,
      beforeTextColorActive: player.before_text_color_active ?? player.text_color,
      beforeTextColorInactive: player.before_text_color_inactive ?? player.text_color,
      afterButtonActiveColor: player.after_button_active_color ?? player.accent_color,
      afterButtonInactiveColor: player.after_button_inactive_color ?? player.foreground_neutral,
      afterTextColorActive: player.after_text_color_active ?? player.text_color,
      afterTextColorInactive: player.after_text_color_inactive ?? player.text_color,
      playlistBackgroundColor: player.playlist_background_color ?? player.foreground_neutral,
      playlistSelectedTrackTextColor: player.playlist_selected_track_text_color ?? player.text_color,
      playlistTextColor: player.playlist_text_color ?? player.text_color,
      selectedTrackColor: player.selected_track_color ?? player.accent_color,
      playlistDividerColor: player.playlist_divider_color ?? '#525252',
      playerBorderColor: player.player_border_color,
      playButtonBorderColor: player.play_button_border_color,
      toggleBorderColor: player.toggle_border_color,
      playlistBorderColor: player.playlist_border_color
    };
  }, [state.landingPage, state.player]);

  const updateAccentColor = useCallback((color: string) => {
    actions.updateLandingPage({ accent_color_override: color });
  }, [actions]);

  const updateTextColor = useCallback((color: string) => {
    actions.updateLandingPage({ text_color: color });
  }, [actions]);

  const updateBackgroundColor = useCallback((color: string) => {
    actions.updateLandingPage({ page_background_color: color });
  }, [actions]);

  const resetAccentColor = useCallback(() => {
    actions.updateLandingPage({ accent_color_override: null });
  }, [actions]);

  const resetTextColor = useCallback(() => {
    actions.updateLandingPage({ text_color: null });
  }, [actions]);

  const resetBackgroundColor = useCallback(() => {
    actions.updateLandingPage({ page_background_color: null });
  }, [actions]);

  return {
    resolvedColors,
    updateAccentColor,
    updateTextColor,
    updateBackgroundColor,
    resetAccentColor,
    resetTextColor,
    resetBackgroundColor
  };
}

// Hook for handling style-related updates
export function usePreviewStyles() {
  const { state, actions } = usePreview();

  const updateFont = useCallback((fontFamily: string) => {
    actions.updateLandingPage({ font_override: fontFamily });
  }, [actions]);

  const resetFont = useCallback(() => {
    actions.updateLandingPage({ font_override: null });
  }, [actions]);

  const updateHeadlineStyles = useCallback((styles: any) => {
    const currentStyles = state.landingPage?.headline_and_paragraph_styles || {};
    const parsedStyles = typeof currentStyles === 'string' ? JSON.parse(currentStyles) : currentStyles;
    
    actions.updateLandingPage({
      headline_and_paragraph_styles: {
        ...parsedStyles,
        headline: {
          ...parsedStyles.headline,
          ...styles
        }
      }
    });
  }, [state.landingPage?.headline_and_paragraph_styles, actions]);

  const updateParagraphStyles = useCallback((styles: any) => {
    const currentStyles = state.landingPage?.headline_and_paragraph_styles || {};
    const parsedStyles = typeof currentStyles === 'string' ? JSON.parse(currentStyles) : currentStyles;
    
    actions.updateLandingPage({
      headline_and_paragraph_styles: {
        ...parsedStyles,
        paragraph: {
          ...parsedStyles.paragraph,
          ...styles
        }
      }
    });
  }, [state.landingPage?.headline_and_paragraph_styles, actions]);

  const updateLinkGlobalStyles = useCallback((styles: any) => {
    const currentStyles = state.landingPage?.link_global_styles || {};
    const parsedStyles = typeof currentStyles === 'string' ? JSON.parse(currentStyles) : currentStyles;
    
    actions.updateLandingPage({
      link_global_styles: {
        ...parsedStyles,
        ...styles
      }
    });
  }, [state.landingPage?.link_global_styles, actions]);

  const updateHeaderImageStyles = useCallback((styles: any) => {
    const currentStyles = state.landingPage?.header_image_styles || {};
    const parsedStyles = typeof currentStyles === 'string' ? JSON.parse(currentStyles) : currentStyles;
    
    actions.updateLandingPage({
      header_image_styles: {
        ...parsedStyles,
        ...styles
      }
    });
  }, [state.landingPage?.header_image_styles, actions]);

  return {
    updateFont,
    resetFont,
    updateHeadlineStyles,
    updateParagraphStyles,
    updateLinkGlobalStyles,
    updateHeaderImageStyles
  };
}

// Hook for handling content updates
export function usePreviewContent() {
  const { state, actions } = usePreview();

  const updateHeadline = useCallback((headline: string) => {
    actions.updateLandingPage({ page_headline: headline });
  }, [actions]);

  const updateIntro = useCallback((intro: string) => {
    actions.updateLandingPage({ intro_copy: intro });
  }, [actions]);

  const updateCustomPath = useCallback((path: string) => {
    actions.updateLandingPage({ custom_path: path });
  }, [actions]);

  const updatePageName = useCallback((name: string) => {
    actions.updateLandingPage({ page_name: name });
  }, [actions]);

  const updateBranding = useCallback((showBranding: boolean, brandingName?: string) => {
    const updates: Partial<PreviewLandingPage> = { show_branding: showBranding };
    if (brandingName !== undefined) {
      updates.user_branding_name = brandingName;
    }
    actions.updateLandingPage(updates);
  }, [actions]);

  return {
    headline: state.landingPage?.page_headline || '',
    intro: state.landingPage?.intro_copy || '',
    customPath: state.landingPage?.custom_path || '',
    pageName: state.landingPage?.page_name || '',
    updateHeadline,
    updateIntro,
    updateCustomPath,
    updatePageName,
    updateBranding
  };
}

// Hook for handling media uploads
export function usePreviewMedia() {
  const { actions } = usePreview();

  const updateHeaderImage = useCallback((imageUrl: string | null) => {
    actions.updateLandingPage({ header_image_url: imageUrl });
  }, [actions]);

  const updateBackgroundImage = useCallback((imageUrl: string | null) => {
    actions.updateLandingPage({ background_image: imageUrl });
  }, [actions]);

  const removeHeaderImage = useCallback(() => {
    updateHeaderImage(null);
  }, [updateHeaderImage]);

  const removeBackgroundImage = useCallback(() => {
    updateBackgroundImage(null);
  }, [updateBackgroundImage]);

  return {
    updateHeaderImage,
    updateBackgroundImage,
    removeHeaderImage,
    removeBackgroundImage
  };
}

// Hook for handling social links
export function usePreviewSocialLinks() {
  const { state, actions } = usePreview();

  const socialLinks = useMemo(() => {
    const links = state.landingPage?.social_links;
    if (!links) return [];
    return typeof links === 'string' ? JSON.parse(links) : links;
  }, [state.landingPage?.social_links]);

  const updateSocialLinks = useCallback((links: any[]) => {
    actions.updateLandingPage({ social_links: links });
  }, [actions]);

  const addSocialLink = useCallback((platform: string, url: string) => {
    const newLink = {
      id: `social-${Date.now()}`,
      platform,
      url,
      order: socialLinks.length
    };
    updateSocialLinks([...socialLinks, newLink]);
  }, [socialLinks, updateSocialLinks]);

  const updateSocialLink = useCallback((id: string, updates: any) => {
    const updatedLinks = socialLinks.map((link: SocialLink) => 
      link.id === id ? { ...link, ...updates } : link
    );
    updateSocialLinks(updatedLinks);
  }, [socialLinks, updateSocialLinks]);

  const removeSocialLink = useCallback((id: string) => {
    const filteredLinks = socialLinks.filter((link: SocialLink) => link.id !== id);
    updateSocialLinks(filteredLinks);
  }, [socialLinks, updateSocialLinks]);

  return {
    socialLinks,
    addSocialLink,
    updateSocialLink,
    removeSocialLink,
    updateSocialLinks
  };
}

// Hook for handling links
export function usePreviewLinks() {
  const { state, actions } = usePreview();

  const links = useMemo(() => {
    const pageLinks = state.landingPage?.links;
    if (!pageLinks) return [];
    return typeof pageLinks === 'string' ? JSON.parse(pageLinks) : pageLinks;
  }, [state.landingPage?.links]);

  const updateLinks = useCallback((links: any[]) => {
    actions.updateLandingPage({ links });
  }, [actions]);

  const addLink = useCallback((text: string, url: string) => {
    const newLink = {
      id: `link-${Date.now()}`,
      text,
      url,
      order: links.length
    };
    updateLinks([...links, newLink]);
  }, [links, updateLinks]);

  const updateLink = useCallback((id: string, updates: any) => {
    const updatedLinks = links.map((link: PageLink) => 
      link.id === id ? { ...link, ...updates } : link
    );
    updateLinks(updatedLinks);
  }, [links, updateLinks]);

  const removeLink = useCallback((id: string) => {
    const filteredLinks = links.filter((link: PageLink) => link.id !== id);
    updateLinks(filteredLinks);
  }, [links, updateLinks]);

  const reorderLinks = useCallback((startIndex: number, endIndex: number) => {
    const reorderedLinks = [...links];
    const [removed] = reorderedLinks.splice(startIndex, 1);
    reorderedLinks.splice(endIndex, 0, removed);
    
    // Update order property
    const linksWithOrder = reorderedLinks.map((link, index) => ({
      ...link,
      order: index
    }));
    
    updateLinks(linksWithOrder);
  }, [links, updateLinks]);

  return {
    links,
    addLink,
    updateLink,
    removeLink,
    reorderLinks,
    updateLinks
  };
}

// Hook for handling Muso stats configuration
export function usePreviewMusoStats() {
  const { state, actions } = usePreview();

  const musoConfig = useMemo(() => {
    const config = state.landingPage?.muso_stats_config;
    if (!config) return null;
    return typeof config === 'string' ? JSON.parse(config) : config;
  }, [state.landingPage?.muso_stats_config]);

  const updateMusoConfig = useCallback((config: any) => {
    actions.updateLandingPage({ muso_stats_config: config });
  }, [actions]);

  const toggleMusoStats = useCallback((enabled: boolean) => {
    const currentConfig = musoConfig || {
      enabled: false,
      badges: [],
      styling: {},
      position: 'below_copy'
    };
    
    updateMusoConfig({
      ...currentConfig,
      enabled
    });
  }, [musoConfig, updateMusoConfig]);

  const updateBadgeConfig = useCallback((badgeIndex: number, updates: any) => {
    if (!musoConfig) return;
    
    const updatedBadges = [...(musoConfig.badges || [])];
    updatedBadges[badgeIndex] = {
      ...updatedBadges[badgeIndex],
      ...updates
    };
    
    updateMusoConfig({
      ...musoConfig,
      badges: updatedBadges
    });
  }, [musoConfig, updateMusoConfig]);

  const updateStyling = useCallback((styling: any) => {
    if (!musoConfig) return;
    
    updateMusoConfig({
      ...musoConfig,
      styling: {
        ...musoConfig.styling,
        ...styling
      }
    });
  }, [musoConfig, updateMusoConfig]);

  return {
    musoConfig,
    updateMusoConfig,
    toggleMusoStats,
    updateBadgeConfig,
    updateStyling,
    musoData: state.musoData
  };
}

// Hook for handling save operations
export function usePreviewSave() {
  const { state, actions } = usePreview();

  const saveChanges = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.landingPage) {
      return { success: false, error: 'No landing page data to save' };
    }

    try {
      actions.clearErrors();
      
      // Perform validation
      if (state.previewErrors.length > 0) {
        return { success: false, error: 'Please fix validation errors before saving' };
      }

      // Here you would typically make the API call to save
      // For now, we'll simulate a successful save
      actions.markSaved(state.landingPage);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save changes';
      actions.addError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [state.landingPage, state.previewErrors, actions]);

  const discardChanges = useCallback(() => {
    actions.resetToSaved();
  }, [actions]);

  return {
    saveChanges,
    discardChanges,
    hasUnsavedChanges: state.hasUnsavedChanges,
    canSave: state.hasUnsavedChanges && state.previewErrors.length === 0
  };
}

// Master hook that combines all preview functionality
export function usePreviewEditor() {
  const colors = usePreviewColors();
  const styles = usePreviewStyles();
  const content = usePreviewContent();
  const media = usePreviewMedia();
  const socialLinks = usePreviewSocialLinks();
  const links = usePreviewLinks();
  const musoStats = usePreviewMusoStats();
  const save = usePreviewSave();
  const { state, actions } = usePreview();

  return {
    // State
    state,
    
    // Core actions
    actions,
    
    // Specialized functionality
    colors,
    styles,
    content,
    media,
    socialLinks,
    links,
    musoStats,
    save,
    
    // Convenience methods
    batchUpdate: actions.batchUpdate,
    initialize: actions.initialize
  };
} 