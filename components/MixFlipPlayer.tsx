// components/MixFlipPlayer.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { Play, Pause, Loader, HelpCircle } from 'lucide-react';
import Image from 'next/image';
import PlayingIndicator from './PlayingIndicator';
import { getGoogleFontsURL, getCustomFontCSS } from '@/config/fonts';

declare global {
  interface Window {
    plausibleMixFlip?: (
      event: string,
      options?: { props?: Record<string, any> }
    ) => void;
  }
}

interface Song {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  before_audio_url?: string;
  after_audio_url?: string;
  classic_audio_url?: string;
  song_description?: string;
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
  foreground_neutral: string;
  text_color: string;
  before_audio_label: string;
  after_audio_label: string;
  user_id: string;
  show_branding: boolean;
  show_artwork: boolean;
  show_artwork_mobile: boolean;
  auto_advance: boolean; // TODO: implement this
  font_family: string | null;
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

interface ResolvedColors {
  playButtonBackgroundColor: string;
  playPauseIconColor: string;
  songNameColor: string;
  artistNameColor: string;
  descriptionColor: string | null;
  playheadBackgroundColor: string;
  playheadProgressColor: string;
  beforeButtonActiveColor: string;
  beforeButtonInactiveColor: string;
  afterButtonActiveColor: string;
  afterButtonInactiveColor: string;
  playlistBackgroundColor: string;
  playlistSelectedTrackTextColor: string;
  playlistTextColor: string;
  selectedTrackColor: string;
  playlistDividerColor: string;
  playerBorderColor: string | null;
  playButtonBorderColor: string | null;
  toggleBorderColor: string | null;
  playlistBorderColor: string | null;
  beforeTextColorActive: string | null;
  beforeTextColorInactive: string | null;
  afterTextColorActive: string | null;
  afterTextColorInactive: string | null;
}

interface MixFlipPlayerProps {
  player: Player;
  hasActivePlan: boolean;
  playlistSongs: Song[];
  colors: ResolvedColors;
  source?: 'landingPage' | 'playerLoader' | string; // Add this prop
}

// if localhost use r2.mixflip.io
const cdnPrefix =
  process.env.NODE_ENV === 'development'
    ? 'https://r2.mixflip.io/'
    : 'https://cdn.mixflip.io/';

const isValidClassicSong = (song: Song): boolean => {
  return (
    typeof song.song_name === 'string' &&
    song.song_name.trim() !== '' &&
    typeof song.classic_audio_url === 'string' &&
    song.classic_audio_url.trim() !== '' &&
    song.classic_audio_url !== 'https://r2.mixflip.io/null'
  );
};

const isValidMixFlipSong = (song: Song): boolean => {
  return (
    typeof song.song_name === 'string' &&
    song.song_name.trim() !== '' &&
    typeof song.before_audio_url === 'string' &&
    typeof song.after_audio_url === 'string' &&
    song.before_audio_url.trim() !== '' &&
    song.after_audio_url.trim() !== '' &&
    song.before_audio_url !== 'https://cdn.mixflip.io/null' &&
    song.after_audio_url !== 'https://cdn.mixflip.io/null'
  );
};

function getHoverColor(
  color: string,
  activeColor: string,
  isActive: boolean
): string {
  const hexARegex = /^#([A-Fa-f0-9]{8})$/;
  const match = activeColor.match(hexARegex);

  if (match) {
    const baseColor = activeColor.slice(0, 7);
    const alpha = match[1].slice(6, 8);

    // If it's a hexA color but fully opaque (FF), treat it as regular hex
    if (alpha.toLowerCase() === 'ff') {
      if (isActive) {
        return `${baseColor}ee`;
      } else {
        return `${baseColor}33`;
      }
    }

    // Handle partially transparent colors
    const alphaNum = parseInt(alpha, 16);
    if (isActive) {
      // Active hover: reduce alpha a little
      const newAlpha = Math.max(0, alphaNum - 34);
      return `${baseColor}${newAlpha.toString(16).padStart(2, '0')}`;
    } else {
      // Inactive hover preview: reduce to 25% of original alpha
      const newAlpha = Math.max(0, Math.floor(alphaNum * 0.2));
      return `${baseColor}${newAlpha.toString(16).padStart(2, '0')}`;
    }
  } else {
    // Regular hex color
    if (isActive) {
      return `${activeColor}ee`;
    } else {
      return `${activeColor}33`;
    }
  }
}

const getPlaylistDisplayElements = (
  song: Song,
  playlistOrder: PlaylistElement[] | string
) => {
  // Handle string format from database
  if (typeof playlistOrder === 'string') {
    const elements = playlistOrder.split('-');
    return elements.map((type) => {
      const content =
        type === 'song'
          ? song.song_name
          : type === 'artist'
            ? song.artist
            : song.song_description;
      return { type, content };
    });
  }

  // Handle new PlaylistElement[] format
  return playlistOrder
    .filter((element) => element.visible)
    .map((element) => ({
      type: element.type,
      content:
        element.type === 'song'
          ? song.song_name
          : element.type === 'artist'
            ? song.artist
            : element.type === 'description'
              ? song.song_description
              : null
    }));
};

const MixFlipPlayer: React.FC<MixFlipPlayerProps> = ({
  player,
  hasActivePlan,
  playlistSongs,
  colors,
  source
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeforeActive, setIsBeforeActive] = useState(
    !player.default_to_after
  );
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [beforeSound, setBeforeSound] = useState<Howl | null>(null);
  const [afterSound, setAfterSound] = useState<Howl | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [accentColor, setAccentColor] = useState('#299fa7');
  const [classicSound, setClassicSound] = useState<Howl | null>(null);
  const isClassicPlayer =
    player.player_type === 'classic' || player.player_type === 'quickclip';
  const lastToggleTimeRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isPlayerFocused, setIsPlayerFocused] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [hasDraggedThreshold, setHasDraggedThreshold] = useState(false);
  const lastTouchTimeRef = useRef<number>(0);
  const [isTouchActive, setIsTouchActive] = useState(false);

  // Add refs to track currently loading audio instances
  const loadingBeforeSoundRef = useRef<Howl | null>(null);
  const loadingAfterSoundRef = useRef<Howl | null>(null);
  const loadingClassicSoundRef = useRef<Howl | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const getBrightness = (color: string): number => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return (r * 299 + g * 587 + b * 114) / 1000;
  };

  const brandingTextColor = (() => {
    const brightness = getBrightness(player.background_color);
    if (brightness < 128) {
      return '#AAAAAA'; // Light text for dark backgrounds
    } else if (brightness > 200) {
      return '#222222'; // Dark text for light backgrounds
    } else {
      return '#333333'; // Distinct color for middle-range brightness
    }
  })();

  const customStyles = `
    ${getCustomFontCSS()}
    @import url('${getGoogleFontsURL([player.font_family || ''])}');

    #mixflip-player-root, #loading-mixflip-player {
      ${player.font_family ? `font-family: '${player.font_family}', ${player.font_family.includes(' ') ? 'serif' : 'sans-serif'};` : ''}
    }

    .accent-bg {
      background-color: ${player.accent_color};
    }
    .accent-bg:hover {
      background-color: ${player.accent_color}ee;
    }
    .accent-text {
      color: ${player.accent_color};
    }
    .accent-text:hover {
      color: ${player.accent_color}ee;
    }
    
    .branding-text {
      color: ${brandingTextColor};
    }
    .branding-text:hover {
      color: ${player.accent_color}ee;
    }
    
    .accent-bg-hover:hover {
      background-color: ${player.accent_color}66;
    }
    .player-background {
      background-color: ${player.background_color};
    }
    .play-button-bg {
      background-color: ${colors.playButtonBackgroundColor};
    }
    .play-button-bg:hover {
      background-color: ${colors.playButtonBackgroundColor}ee;
    }
    
    .play-pause-icon {
      color: ${colors.playPauseIconColor};
    }
    
    .playhead-bg {
      background-color: ${colors.playheadBackgroundColor};
    }
    .playhead-progress {
      background-color: ${colors.playheadProgressColor};
    }
    .before-button-active {
      background-color: ${colors.beforeButtonActiveColor};
    }
    .before-button-active:hover {
      background-color: ${getHoverColor(colors.beforeButtonActiveColor, colors.beforeButtonActiveColor, true)};
    }
    .before-button-inactive {
      background-color: ${colors.beforeButtonInactiveColor};
    }
    .before-button-inactive:hover {
      background-color: ${getHoverColor(colors.beforeButtonInactiveColor, colors.beforeButtonActiveColor, false)};
    }
    .before-text-color-active {
      color: ${colors.beforeTextColorActive};
    }
    .before-text-color-inactive {
      color: ${colors.beforeTextColorInactive};
    }
    .after-text-color-active {
      color: ${colors.afterTextColorActive};
    }
    .after-text-color-inactive {
      color: ${colors.afterTextColorInactive};
    }
    .after-button-active {
      background-color: ${colors.afterButtonActiveColor};
    }
    .after-button-active:hover {
      background-color: ${getHoverColor(colors.afterButtonActiveColor, colors.afterButtonActiveColor, true)};
    }
    .after-button-inactive {
      background-color: ${colors.afterButtonInactiveColor};
    }
    .after-button-inactive:hover {
      background-color: ${getHoverColor(colors.afterButtonInactiveColor, colors.afterButtonActiveColor, false)};
    }
    .playlist-bg {
      background-color: ${colors.playlistBackgroundColor};
    }
    .playlist-bg:hover {
      background-color: ${colors.playlistBackgroundColor}ee;
    }
    .selected-track-bg {
      background-color: ${colors.selectedTrackColor};
    }
    .selected-track-bg:hover {
      background-color: ${colors.selectedTrackColor}ee;
    }
    .playlist-text {
      color: ${colors.playlistTextColor};
    }
    .selected-track-text {
      color: ${colors.playlistSelectedTrackTextColor};
    }
    .playlist-divider {
      border-color: ${colors.playlistDividerColor};
    }
    
    #mixflip-player-root > div {
      ${colors.playerBorderColor ? `border: 1px solid ${colors.playerBorderColor};` : ''}
    }
    
    .play-button-bg {
      ${colors.playButtonBorderColor ? `border: 1px solid ${colors.playButtonBorderColor};` : ''}
    }
    
    #mixflip-toggle {
      ${colors.toggleBorderColor ? `border: 1px solid ${colors.toggleBorderColor};` : ''}
    }
    
    #mixflip-bottom-section {
      ${colors.playlistBorderColor ? `border: 1px solid ${colors.playlistBorderColor};` : ''}
    }
    
    
  `;
  const [validPlaylistSongs, setValidPlaylistSongs] = useState<Song[]>([]);

  const trackPlay = () => {
    try {
      if (typeof window !== 'undefined' && window.plausibleMixFlip) {
        // console.log('logging', source, currentSong?.id, player.id);
        window.plausibleMixFlip('song_plays', {
          props: {
            player_id: player.id,
            player_location: source,
            song_id: currentSong?.id
          }
        });
      } else {
        console.error('Plausible analytics not loaded');
      }
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  };

  const cancelLoadingAudio = () => {
    // Check if there's actually anything loading
    const hasLoadingAudio =
      loadingBeforeSoundRef.current ||
      loadingAfterSoundRef.current ||
      loadingClassicSoundRef.current;

    if (!hasLoadingAudio) {
      return false; // Nothing to cancel
    }

    // console.log('cancelling loading audio');
    // Mark current loading operation as cancelled
    isCancelledRef.current = true;

    // Stop and unload any currently loading audio instances
    if (loadingBeforeSoundRef.current) {
      loadingBeforeSoundRef.current.stop();
      loadingBeforeSoundRef.current.unload();
      loadingBeforeSoundRef.current = null;
    }

    if (loadingAfterSoundRef.current) {
      loadingAfterSoundRef.current.stop();
      loadingAfterSoundRef.current.unload();
      loadingAfterSoundRef.current = null;
    }

    if (loadingClassicSoundRef.current) {
      loadingClassicSoundRef.current.stop();
      loadingClassicSoundRef.current.unload();
      loadingClassicSoundRef.current = null;
    }

    // Reset loading state
    setIsLoading(false);
    setAudioReady(false);

    return true; // Successfully cancelled something
  };

  useEffect(() => {
    const validationFunction = isClassicPlayer
      ? isValidClassicSong
      : isValidMixFlipSong;
    const filteredSongs = playlistSongs.filter(validationFunction);
    setValidPlaylistSongs(filteredSongs);
    setCurrentSong(filteredSongs[0] || null);
    setAccentColor(player.accent_color);

    if (accentColor) {
      setIsDataLoading(false);
    }

    return () => {
      // Cancel any loading audio
      if (isLoading) {
        cancelLoadingAudio();
      }

      if (beforeSound) {
        beforeSound.unload();
      }
      if (afterSound) {
        afterSound.unload();
      }
      if (classicSound) {
        classicSound.unload();
      }
    };
  }, [player, playlistSongs, isClassicPlayer]);

  useEffect(() => {
    if (isPlaying) {
      if (audioReady) {
        playAudio();
      }
    } else {
      pauseAudio();
    }
  }, [isPlaying, audioReady]);

  useEffect(() => {
    return () => {
      // Cancel any loading audio
      if (isLoading) {
        cancelLoadingAudio();
      }

      if (beforeSound) {
        beforeSound.stop();
        beforeSound.unload();
      }
      if (afterSound) {
        afterSound.stop();
        afterSound.unload();
      }
      Howler.stop();
    };
  }, []);

  const isAutoAdvance = false;

  const albumArtworkUrl =
    currentSong?.album_artwork_url &&
    currentSong.album_artwork_url !== 'https://r2.mixflip.io/null'
      ? currentSong.album_artwork_url
      : player.global_artwork
        ? `https://r2.mixflip.io/${player.global_artwork}`
        : '/placeholder_artwork.jpg';

  const initializeAudio = async (song: Song) => {
    return new Promise<void>((resolve) => {
      // Reset cancellation flag for new loading operation
      isCancelledRef.current = false;

      if (isClassicPlayer && song.classic_audio_url) {
        // console.log('classic audio url', song.classic_audio_url);
        const howlSound = new Howl({
          src: [song.classic_audio_url],
          preload: true,
          autoplay: false,
          html5: true,
          volume: 1,
          onload: () => {
            // Check if this loading operation was cancelled
            if (isCancelledRef.current) {
              howlSound.unload();
              resolve();
              return;
            }

            setClassicSound(howlSound);
            setAudioReady(true);
            loadingClassicSoundRef.current = null;
            resolve();
          },
          onend: () => {
            handleSongEnd();
          },
          onloaderror: (id, error) => {
            console.error('Error loading classic audio:', error);
            setIsLoading(false);
            setIsPlaying(false);
            loadingClassicSoundRef.current = null;
            resolve();
          }
        });

        // Store reference to currently loading sound
        loadingClassicSoundRef.current = howlSound;
      } else if (
        !isClassicPlayer &&
        song.before_audio_url &&
        song.after_audio_url
      ) {
        const howelBeforeSound = new Howl({
          src: [song.before_audio_url],
          preload: true,
          autoplay: false,
          volume: !player.default_to_after ? 1 : 0,

          onload: () => {
            checkBothLoaded();
          }
        });

        const howelAfterSound = new Howl({
          src: [song.after_audio_url],
          preload: true,
          autoplay: false,
          volume: !player.default_to_after ? 0 : 1,

          onload: () => {
            checkBothLoaded();
          },
          onend: () => {
            handleSongEnd();
          }
        });

        // Store references to currently loading sounds
        loadingBeforeSoundRef.current = howelBeforeSound;
        loadingAfterSoundRef.current = howelAfterSound;

        let beforeLoaded = false;
        let afterLoaded = false;

        const checkBothLoaded = () => {
          // Check if this loading operation was cancelled
          if (isCancelledRef.current) {
            howelBeforeSound.unload();
            howelAfterSound.unload();
            loadingBeforeSoundRef.current = null;
            loadingAfterSoundRef.current = null;
            resolve();
            return;
          }

          if (beforeLoaded && afterLoaded) {
            setBeforeSound(howelBeforeSound);
            setAfterSound(howelAfterSound);
            setAudioReady(true);
            // Clear loading refs since we've successfully loaded
            loadingBeforeSoundRef.current = null;
            loadingAfterSoundRef.current = null;
            // console.log('both sounds loaded');
            resolve();
          }
        };

        howelBeforeSound.on('load', () => {
          beforeLoaded = true;
          checkBothLoaded();
        });

        howelAfterSound.on('load', () => {
          afterLoaded = true;
          checkBothLoaded();
        });
        // log a plausible event that we're starting to play the song
        trackPlay();
      }
    });
  };

  const unlockAudio = () => {
    return new Promise<void>((resolve) => {
      const hackAudio = new Howl({
        src: [`${cdnPrefix}silent.mp3`],
        preload: true,
        html5: true,
        onend: () => {
          resolve();
        }
      });
      hackAudio.play();
    });
  };

  const handlePlayButtonClick = async () => {
    if (isUnlocked === false) {
      // console.log(isUnlocked);
      await unlockAudio();
      setIsUnlocked(true);
    }

    if (!isPlaying) {
      if (!audioReady) {
        //console.log(beforeSound, afterSound, currentSong);
        if (currentSong) {
          // Only cancel loading audio if we're currently loading something
          if (isLoading) {
            cancelLoadingAudio();
          }
          setIsLoading(true);
          await initializeAudio(currentSong);
          setIsLoading(false);
          setIsPlaying(true);
        }
      } else {
        setIsPlaying(true);
      }
    }
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const playAudio = async () => {
    if (isClassicPlayer && classicSound) {
      classicSound.play();
      setIsPlaying(true);
      updateProgress();
    } else if (!isClassicPlayer && beforeSound && afterSound) {
      beforeSound.volume(isBeforeActive ? 1 : 0);
      afterSound.volume(isBeforeActive ? 0 : 1);

      beforeSound.play();
      afterSound.play();
      setIsPlaying(true);
      updateProgress();
    }
  };

  const pauseAudio = () => {
    if (isClassicPlayer && classicSound) {
      classicSound.pause();
      setIsPlaying(false);
      setIsUnlocked(true);
    } else if (!isClassicPlayer && beforeSound && afterSound) {
      beforeSound.pause();
      afterSound.pause();
      setIsPlaying(false);

      // updateProgressWidth();
      setIsUnlocked(true);
    }
  };

  const crossfade = (
    fadeOutSound: Howl,
    fadeInSound: Howl,
    duration: number = 10
  ) => {
    const steps = 10; // Using fewer steps for a quicker transition
    const volumeStep = 1 / steps;
    const intervalTime = duration / steps;

    let currentStep = 0;

    const fadeInterval = setInterval(() => {
      currentStep++;
      fadeOutSound.volume(1 - volumeStep * currentStep);
      fadeInSound.volume(volumeStep * currentStep);

      if (currentStep >= steps) {
        clearInterval(fadeInterval);
        fadeOutSound.volume(0);
        fadeInSound.volume(1);
      }
    }, intervalTime);
  };

  const handleTrackClick = async (song: Song) => {
    // check if it's the same song and if so, do nothing
    if (currentSong?.id === song.id) {
      return;
    }

    // if it's a different song, stop and cleanup existing audio
    if (isClassicPlayer && classicSound) {
      classicSound.stop(); // Add stop() before unload
      classicSound.unload();
      setClassicSound(null); // Add this to clear the sound state
    } else if (!isClassicPlayer && beforeSound && afterSound) {
      pauseAudio();
      beforeSound.unload();
      afterSound.unload();
    }

    // Only cancel loading audio if we're currently loading something
    if (isLoading) {
      cancelLoadingAudio();
    }

    setCurrentSong(song);
    setAudioReady(false); // Reset audio ready state
    if (!isClassicPlayer) {
      setIsBeforeActive(!player.default_to_after);
    }
    setIsLoading(true);

    if (!isUnlocked) {
      await unlockAudio();
      setIsUnlocked(true);
    }

    await initializeAudio(song);
    setIsLoading(false);
    setIsPlaying(true);
    // Remove direct playAudio() call here since it will be triggered by the isPlaying useEffect
    updateProgressWidth();
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (progressBarRef.current) {
      const progressBarWidth = progressBarRef.current.clientWidth;
      const clickX = event.nativeEvent.offsetX;
      const percentage = clickX / progressBarWidth;

      if (isClassicPlayer && classicSound) {
        const newTime = classicSound.duration() * percentage;
        classicSound.seek(newTime);
      } else if (!isClassicPlayer && beforeSound && afterSound) {
        const newTime = beforeSound.duration() * percentage;
        beforeSound.seek(newTime);
        afterSound.seek(newTime);
      }
      updateProgressWidth();
    }
  };

  const updateProgressWidth = () => {
    if (progressRef.current) {
      let progressPercentage = 0;
      if (isClassicPlayer && classicSound) {
        progressPercentage =
          (classicSound.seek() / classicSound.duration()) * 100;
      } else if (!isClassicPlayer && beforeSound) {
        progressPercentage =
          (beforeSound.seek() / beforeSound.duration()) * 100;
      }
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  };

  const updateProgress = () => {
    updateProgressWidth();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleSongEnd = () => {
    // console.log('song ended');
    if (player.auto_advance) {
      // console.log('auto advancing');
      setIsPlaying(false);
    }
    if (!player.auto_advance) {
      // console.log('not auto advancing');
      setIsPlaying(false);
      // console.log('isplaying: ', isPlaying, currentSongIndex);
    }
  };

  const handleToggleClick = (targetState: boolean) => {
    // Don't handle click if we're actually dragging (not just touched)
    if (isDragging || hasDraggedThreshold) return;

    // Prevent click events that happen immediately after touch events
    const timeSinceTouch = Date.now() - lastTouchTimeRef.current;
    if (timeSinceTouch < 100) return;

    const now = Date.now();
    const timeSinceLastToggle = now - lastToggleTimeRef.current;

    // Prevent rapid double-clicks (300ms debounce)
    if (timeSinceLastToggle < 300) {
      return;
    }

    // Only toggle if clicking the inactive state
    if (targetState !== isBeforeActive) {
      lastToggleTimeRef.current = now;
      setIsBeforeActive(targetState);
      if (beforeSound && afterSound) {
        if (targetState) {
          crossfade(afterSound, beforeSound, 10);
        } else {
          crossfade(beforeSound, afterSound, 10);
        }
      }
    }
  };

  const handleSliderStart = (clientX: number, isTouch: boolean = false) => {
    setDragStartX(clientX);
    setHasDraggedThreshold(false);

    if (isTouch) {
      setIsTouchActive(true);
    }

    // For mouse events, immediately enter drag mode
    if (!isTouch) {
      setIsDragging(true);
      setHasDraggedThreshold(true);
      return;
    }

    // For touch events, check which button was touched
    if (isTouch && sliderRef.current) {
      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = ((clientX - rect.left) / rect.width) * 100;
      const touchedBefore = percentage < 50;

      // If user touched the inactive button, toggle immediately
      if (touchedBefore && !isBeforeActive) {
        // Touched "Before" while "After" is active - switch immediately
        setIsBeforeActive(true);
        if (beforeSound && afterSound) {
          crossfade(afterSound, beforeSound, 10);
        }
      } else if (!touchedBefore && isBeforeActive) {
        // Touched "After" while "Before" is active - switch immediately
        setIsBeforeActive(false);
        if (beforeSound && afterSound) {
          crossfade(beforeSound, afterSound, 10);
        }
      }

      // Always start drag detection for potential swiping
      // (but don't set isDragging yet - wait for movement)
    }
  };

  const handleSliderMove = (clientX: number) => {
    if (dragStartX === null || !sliderRef.current) return;

    // For touch events, check threshold before entering full drag mode
    if (!hasDraggedThreshold) {
      const dragDistance = Math.abs(clientX - dragStartX);
      const DRAG_THRESHOLD = 15; // Slightly higher threshold for cleaner detection

      if (dragDistance > DRAG_THRESHOLD) {
        setIsDragging(true);
        setHasDraggedThreshold(true);
      } else {
        return; // Don't process movement until threshold is met
      }
    }

    const rect = sliderRef.current.getBoundingClientRect();
    const percentage = Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100)
    );

    // Check for threshold crossing and toggle state
    const shouldBeAfter = percentage > 50;
    if (shouldBeAfter !== !isBeforeActive) {
      setIsBeforeActive(!shouldBeAfter);
      if (beforeSound && afterSound) {
        if (!shouldBeAfter) {
          crossfade(afterSound, beforeSound, 10);
        } else {
          crossfade(beforeSound, afterSound, 10);
        }
      }
    }
  };

  const handleSliderEnd = () => {
    setIsDragging(false);
    setDragStartX(null);
    setHasDraggedThreshold(false);
    setIsTouchActive(false);
  };

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleSliderStart(e.clientX, false); // false = not touch
  };

  const handleMouseMove = (e: MouseEvent) => {
    handleSliderMove(e.clientX);
  };

  const handleMouseUp = () => {
    handleSliderEnd();
  };

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    const touch = e.touches[0];
    handleSliderStart(touch.clientX, true); // true = is touch
  };

  const handleTouchMove = (e: TouchEvent) => {
    lastTouchTimeRef.current = Date.now();
    // Always prevent default to stop browser scrolling/interference
    e.preventDefault();

    const touch = e.touches[0];
    handleSliderMove(touch.clientX);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    lastTouchTimeRef.current = Date.now();

    // Always prevent default to avoid ghost clicks
    e.preventDefault();

    handleSliderEnd();
  };

  // Add global event listeners for drag
  useEffect(() => {
    if (isDragging || isTouchActive) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, {
        passive: false
      });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isTouchActive, isBeforeActive]);

  // Add keyboard event listeners for arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle keyboard events if player is focused and we're not in an input field
      if (
        !isPlayerFocused ||
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      // Handle spacebar for play/pause
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlayButtonClick();
        return;
      }

      // Handle "T", S, or / key for toggle between before/after (only for MixFlip players)
      if (
        !isClassicPlayer &&
        (e.key === 't' ||
          e.key === 'T' ||
          e.key === 's' ||
          e.key === 'S' ||
          e.key === '/' ||
          e.key === '?')
      ) {
        e.preventDefault();
        const targetState = !isBeforeActive; // Toggle to opposite state
        setIsBeforeActive(targetState);
        if (beforeSound && afterSound) {
          if (targetState) {
            crossfade(afterSound, beforeSound, 10);
          } else {
            crossfade(beforeSound, afterSound, 10);
          }
        }
        return;
      }

      // Handle left/right arrows for before/after (only for MixFlip players)
      if (!isClassicPlayer) {
        if (e.key === 'ArrowLeft' || (e.key === '1' && !isBeforeActive)) {
          e.preventDefault();
          handleToggleClick(true); // Switch to Before
        } else if (
          e.key === 'ArrowRight' ||
          (e.key === '2' && isBeforeActive)
        ) {
          e.preventDefault();
          handleToggleClick(false); // Switch to After
        }
      }

      // Handle up/down arrows for playlist navigation (if there are multiple songs)
      if (validPlaylistSongs.length > 1) {
        const currentIndex = validPlaylistSongs.findIndex(
          (song) => song.id === currentSong?.id
        );

        if (e.key === 'ArrowUp' && currentIndex > 0 && !isLoading) {
          e.preventDefault();
          const previousSong = validPlaylistSongs[currentIndex - 1];
          handleTrackClick(previousSong);
        } else if (
          e.key === 'ArrowDown' &&
          currentIndex < validPlaylistSongs.length - 1 &&
          !isLoading
        ) {
          e.preventDefault();
          const nextSong = validPlaylistSongs[currentIndex + 1];
          handleTrackClick(nextSong);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    isBeforeActive,
    isClassicPlayer,
    validPlaylistSongs,
    currentSong,
    isPlayerFocused,
    isLoading
  ]);

  // Handle player focus events
  const handlePlayerFocus = () => {
    setIsPlayerFocused(true);
  };

  const handlePlayerBlur = () => {
    setIsPlayerFocused(false);
  };

  const handlePlayerClick = () => {
    setIsPlayerFocused(true);
    if (playerRef.current) {
      playerRef.current.focus();
    }
  };

  // show a loading state
  if (isDataLoading) {
    return (
      <div
        className="w-full max-w-3xl p-4 text-white bg-neutral-900 rounded-xl"
        id="loading-mixflip-player"
      >
        <div className="flex items-center justify-center h-[150px]">
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  // show a plan limit error
  if (!hasActivePlan) {
    return (
      <div id="mixflip-player-root" className="w-full max-w-4xl @container">
        <a href="https://mixflip.io">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="flex flex-row items-center gap-2 aspect-square">
              <Image
                src="/favicon.png"
                width={64}
                height={64}
                alt="MixFlip Logo"
              />
              <h3 className="text-4xl font-bold">MixFlip</h3>
            </div>
            <p className="max-w-md text-center">
              This user is over their plan limits. If this is your player,
              please remove songs or upgrade your plan.
            </p>
          </div>
        </a>
      </div>
    );
  }
  // actually render the player
  return (
    <div id="mixflip-player-root" className="w-full max-w-4xl @container">
      <style>{customStyles}</style>
      <link rel="preconnect" href="https://cdn.mixflip.io" />
      <div
        ref={playerRef}
        className="w-full p-4 pb-2 text-white player-background player-border rounded-xl outline-none relative"
        tabIndex={0}
        onFocus={handlePlayerFocus}
        onBlur={handlePlayerBlur}
        onClick={handlePlayerClick}
        role="application"
        aria-label="MixFlip Audio Player"
      >
        {/* Mobile artwork positioned above all controls */}
        {player?.show_artwork_mobile &&
          (player?.mobile_artwork_position || 'inline') === 'above' && (
            <div
              id="mixflip-mobile-album-cover-above"
              className="@[450px]:hidden w-full flex justify-center mb-4"
            >
              <Image
                id="mixflip-album-cover-mobile-above"
                width={200}
                height={200}
                quality={75}
                src={albumArtworkUrl}
                alt="MixFlip Album Cover"
                className="rounded w-full aspect-square object-cover"
              />
            </div>
          )}

        <div
          id="mixflip-upper-section"
          className="flex flex-col items-center gap-4 mb-0 @[450px]:mb-6 @[450px]:flex-row"
        >
          {player?.show_artwork && (
            <div
              id="mixflip-album-cover-box"
              className="hidden @[450px]:block aspect-square flex-shrink-0"
            >
              {/* desktop */}
              <Image
                id="mixflip-album-cover"
                src={albumArtworkUrl}
                alt="MixFlip Album Cover"
                className={`rounded ${
                  player?.player_type === 'quickclip'
                    ? 'w-28 h-28'
                    : 'w-36 h-36'
                }`}
                width={player?.player_type === 'quickclip' ? 96 : 144}
                height={player?.player_type === 'quickclip' ? 96 : 144}
                quality={75}
                priority
              />
            </div>
          )}
          <div
            id="mixflip-track-info-controls"
            className="flex-grow w-full @[450px]:w-auto min-w-0"
          >
            <div className="flex flex-row items-center gap-3 mb-5">
              {/* this artwork always needs to be square. Don't flex it more narrow than it is tall */}
              {player?.show_artwork_mobile &&
                (player?.mobile_artwork_position || 'inline') !== 'above' && (
                  <div
                    id="mixflip-mobile-album-cover-box"
                    className="@[450px]:hidden flex-shrink-0 aspect-square"
                    style={{ minWidth: '72px' }}
                  >
                    <Image
                      id="mixflip-album-cover-mobile"
                      width={96}
                      height={96}
                      quality={75}
                      src={albumArtworkUrl}
                      alt="MixFlip Album Cover"
                      className={`rounded flex-shrink-0 ${
                        player?.player_type === 'quickclip'
                          ? 'size-20'
                          : 'size-20 @[450px]:size-24'
                      }`}
                      priority
                    />
                  </div>
                )}
              <div className="flex-grow min-w-0">
                <div
                  id="mixflip-info-row-1"
                  className="flex flex-row items-center gap-4 mb-4"
                >
                  {/* this button always needs to be a perfect circle. make sure the height is always the same as the width */}
                  <button
                    id="mixflip-playPauseBtn"
                    aria-label="Play/Pause"
                    className={`rounded-full play-button-bg play-button-border size-14 @[450px]:size-16 flex items-center justify-center transition-all duration-150 flex-shrink-0 mt-1`}
                    onClick={() => {
                      handlePlayButtonClick();
                    }}
                    disabled={isLoading}
                    title="Play/Pause - Press Space"
                  >
                    {isLoading ? (
                      <Loader
                        fill={colors.playPauseIconColor}
                        className="animate-spin size-6"
                      />
                    ) : isPlaying ? (
                      <Pause
                        fill={colors.playPauseIconColor}
                        className="size-6 play-pause-icon"
                      />
                    ) : (
                      <Play
                        fill={colors.playPauseIconColor}
                        className="size-6 play-pause-icon"
                      />
                    )}
                  </button>
                  <div
                    id="mixflip-song-artist-names"
                    className="space-y-0.5 min-w-0 flex-grow"
                  >
                    {/* Line 1 - Primary content */}
                    <div className="line-clamp-4 @[450px]:line-clamp-2 leading-tight @[450px]:leading-normal">
                      {player.header_layout.line1
                        .filter((element) => element.visible)
                        .map((element, index, arr) => {
                          const content =
                            element.type === 'song_name'
                              ? currentSong?.song_name
                              : element.type === 'artist'
                                ? currentSong?.artist
                                : currentSong?.song_description;

                          if (!content) return null;

                          const nextElement = arr[index + 1];
                          const nextContent =
                            nextElement &&
                            (nextElement.type === 'song_name'
                              ? currentSong?.song_name
                              : nextElement.type === 'artist'
                                ? currentSong?.artist
                                : currentSong?.song_description);

                          const isQuickClip =
                            player?.player_type === 'quickclip';
                          const isSongName = element.type === 'song_name';

                          return (
                            <span
                              key={element.type}
                              style={{
                                color:
                                  element.type === 'song_name'
                                    ? colors.songNameColor
                                    : element.type === 'artist'
                                      ? colors.artistNameColor
                                      : colors.descriptionColor ||
                                        colors.playlistTextColor
                              }}
                              className={`${
                                index === 0 || isSongName
                                  ? 'font-bold text-sm @[450px]:text-base'
                                  : 'font-medium text-sm @[450px]:text-base'
                              } block @[450px]:inline`}
                              title={content}
                            >
                              {content}
                              {index < arr.length - 1 && nextContent && (
                                <span
                                  className="hidden @[450px]:inline text-current opacity-75 mx-1"
                                  style={{
                                    color:
                                      nextElement.type === 'song_name'
                                        ? colors.songNameColor
                                        : nextElement.type === 'artist'
                                          ? colors.artistNameColor
                                          : colors.descriptionColor ||
                                            colors.playlistTextColor
                                  }}
                                >
                                  •
                                </span>
                              )}
                            </span>
                          );
                        })}
                    </div>

                    {/* Line 2 - Secondary content (hidden for QuickClip since they only have song name) */}
                    {player?.player_type !== 'quickclip' &&
                      player.header_layout.line2?.some(
                        (element) => element.visible
                      ) && (
                        <div className="text-xs @[450px]:text-sm line-clamp-3 @[450px]:line-clamp-1 @[450px]:leading-normal">
                          {player.header_layout.line2
                            .filter((element) => element.visible)
                            .map((element, index, arr) => {
                              const content =
                                element.type === 'song_name'
                                  ? currentSong?.song_name
                                  : element.type === 'artist'
                                    ? currentSong?.artist
                                    : element.type === 'description'
                                      ? currentSong?.song_description
                                      : null;

                              if (!content) return null;

                              const nextElement = arr[index + 1];
                              const nextContent =
                                nextElement &&
                                (nextElement.type === 'song_name'
                                  ? currentSong?.song_name
                                  : nextElement.type === 'artist'
                                    ? currentSong?.artist
                                    : nextElement.type === 'description'
                                      ? currentSong?.song_description
                                      : null);

                              return (
                                <span
                                  key={element.type}
                                  style={{
                                    color:
                                      element.type === 'song_name'
                                        ? colors.songNameColor
                                        : element.type === 'artist'
                                          ? colors.artistNameColor
                                          : colors.descriptionColor ||
                                            colors.playlistTextColor
                                  }}
                                  className="block @[450px]:inline opacity-90"
                                  title={content}
                                >
                                  {content}
                                  {index < arr.length - 1 && nextContent && (
                                    <span
                                      className="hidden @[450px]:inline text-current opacity-75 mx-1"
                                      style={{
                                        color:
                                          nextElement.type === 'song_name'
                                            ? colors.songNameColor
                                            : nextElement.type === 'artist'
                                              ? colors.artistNameColor
                                              : colors.descriptionColor ||
                                                colors.playlistTextColor
                                      }}
                                    >
                                      •
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                        </div>
                      )}

                    {!currentSong && validPlaylistSongs.length === 0 && (
                      <p className="text-sm text-white line-clamp-2">
                        If you own this player, you can add songs to it in your
                        MixFlip Dashboard.
                      </p>
                    )}
                  </div>
                </div>
                <div id="mixflip-track-seek-outer">
                  <div
                    ref={progressBarRef}
                    id="mixflip-progress-bar-outline"
                    className="playhead-bg w-full h-1.5 @[450px]:h-1 relative cursor-pointer rounded"
                    onClick={handleProgressBarClick}
                  >
                    <div
                      ref={progressRef}
                      id="mixflip-progress-bar-playhead"
                      className="absolute top-0 left-0 h-full rounded playhead-progress"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            {!isClassicPlayer && (
              <div
                id="mixflip-toggle"
                className="flex flex-row w-full mb-6 rounded-lg @[450px]:mb-0 toggle-border overflow-clip"
                ref={sliderRef}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <button
                  id="mixflip-beforeBtn"
                  className={`w-1/2 py-2 text-xs @[450px]:text-sm flex items-center justify-center gap-2 transition-all duration-150 ${
                    isBeforeActive
                      ? 'before-button-active'
                      : 'before-button-inactive'
                  }
              ${isPlaying && isBeforeActive ? 'glow' : ''}
          
              `}
                  onClick={() => handleToggleClick(true)}
                  title={`${player?.before_audio_label || 'Before'}: Press ← (left arrow) or alternately, press "T" to toggle before and after`}
                >
                  <div
                    className={`flex items-center justify-center gap-2 truncate ${
                      isBeforeActive
                        ? 'before-text-color-active'
                        : 'before-text-color-inactive'
                    }`}
                  >
                    {player?.before_audio_label || 'Before'}
                  </div>
                </button>
                <button
                  id="mixflip-afterBtn"
                  className={`w-1/2 py-2 text-xs @[450px]:text-sm flex items-center justify-center gap-2 transition-all duration-150 ${
                    !isBeforeActive
                      ? 'after-button-active'
                      : 'after-button-inactive'
                  }
            ${isPlaying && !isBeforeActive ? 'glow' : ''}
            `}
                  onClick={() => handleToggleClick(false)}
                  title={`${player?.after_audio_label || 'After'}: Press → (right arrow) or alternately, press "T" to toggle before and after`}
                >
                  <div
                    className={`flex items-center justify-center gap-2 truncate ${
                      isBeforeActive
                        ? 'after-text-color-inactive'
                        : 'after-text-color-active'
                    }`}
                  >
                    {player?.after_audio_label || 'After'}
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>

        {validPlaylistSongs.length > 1 && (
          <div
            id="mixflip-bottom-section"
            className="w-full rounded-lg playlist-border overflow-clip  max-h-96 overflow-y-auto"
          >
            <ul
              id="mixflip-player-playlist-tracklist"
              className="last:*:border-none"
            >
              {validPlaylistSongs.map((song, index) => (
                <li
                  key={song.id || `song-${index}`}
                  className={`py-2 px-4 text-xs @[450px]:text-sm cursor-pointer transition-all duration-150 ${
                    currentSong?.id === song.id
                      ? 'selected-track-bg hover:selected-track-bg/90 selected-track-text'
                      : 'playlist-bg playlist-text'
                  } border-b playlist-divider antialiased`}
                  onClick={() => handleTrackClick(song)}
                >
                  {getPlaylistDisplayElements(song, player.playlist_order)
                    .map((element) => element.content)
                    .filter(Boolean)
                    .join(' – ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center pt-2 pb-0.5" id="mixflipwatermark">
          {player?.show_branding && source !== 'landingPage' && (
            <a
              href={`https://mixflip.io/?utm_source=MixFlipPlayer&utm_medium=player&utm_campaign=${player.id}`}
              target="_blank"
              rel="noopener"
            >
              <p className="text-[11px] transition-all duration-150 branding-text opacity-90 hover:opacity-100">
                Powered by MixFlip
              </p>
            </a>
          )}
        </div>

        {/* Keyboard shortcuts help icon - bottom right */}
        {player?.show_branding && (
          <div className="absolute bottom-3 right-2 hidden @[450px]:block">
            <div className="relative group">
              <HelpCircle className="size-3 branding-text opacity-50 hover:opacity-80 transition-opacity cursor-help" />
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-neutral-900/80 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <div className="text-left space-y-1">
                  <div className="font-semibold mb-2">Keyboard Shortcuts</div>
                  {!isClassicPlayer && (
                    <>
                      <div>
                        <strong>T</strong> Toggle before/after
                      </div>
                      <div>
                        <strong>←</strong> Before
                      </div>
                      <div>
                        <strong>→</strong> After
                      </div>
                    </>
                  )}
                  {validPlaylistSongs.length > 1 && (
                    <div>
                      <strong>↑/↓</strong> Previous/next song
                    </div>
                  )}
                  <div>
                    <strong>Space</strong> Play/pause
                  </div>
                </div>
                {/* Tooltip arrow */}
                <div className="absolute top-full right-2 border-4 border-transparent border-t-black border-opacity-90"></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MixFlipPlayer;
