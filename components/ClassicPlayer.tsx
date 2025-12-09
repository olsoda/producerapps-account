'use client';
import { useState, useEffect, useRef } from 'react';
import { Howl, Howler } from 'howler';
import { Play, Pause, Loader } from 'lucide-react';
import Image from 'next/image';
import PlayingIndicator from './PlayingIndicator';
import { getGoogleFontsURL, getCustomFontCSS } from '@/config/fonts';

interface Song {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  classic_audio_url: string;
}

interface Player {
  id: number;
  accent_color: string;
  background_color: string;
  foreground_neutral: string;
  text_color: string;
  user_id: string;
  show_branding: boolean;
  show_artwork: boolean;
  auto_advance: boolean;
  font_family: string | null;
  player_border_color: string | null;
  play_button_border_color: string | null;
  playlist_border_color: string | null;
  player_type: string;
}

interface ResolvedColors {
  playButtonBackgroundColor: string;
  playPauseIconColor: string;
  songNameColor: string;
  artistNameColor: string;
  playheadBackgroundColor: string;
  playheadProgressColor: string;
  playlistBackgroundColor: string;
  playlistSelectedTrackTextColor: string;
  playlistTextColor: string;
  selectedTrackColor: string;
  playlistDividerColor: string;
  playerBorderColor: string | null;
  playButtonBorderColor: string | null;
  playlistBorderColor: string | null;
}

interface ClassicPlayerProps {
  player: Player;
  hasActivePlan: boolean;
  playlistSongs: Song[];
  colors: ResolvedColors;
  source?: 'landingPage' | 'playerLoader' | string;
}

const isValidSong = (song: Song): boolean => {
  return (
    typeof song.song_name === 'string' &&
    song.song_name.trim() !== '' &&
    typeof song.classic_audio_url === 'string' &&
    song.classic_audio_url.trim() !== '' &&
    song.classic_audio_url !== 'https://r2.mixflip.io/null'
  );
};

const ClassicPlayer: React.FC<ClassicPlayerProps> = ({
  player,
  hasActivePlan,
  playlistSongs,
  colors,
  source
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [sound, setSound] = useState<Howl | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [validPlaylistSongs, setValidPlaylistSongs] = useState<Song[]>([]);

  const trackPlay = () => {
    try {
      if (typeof window !== 'undefined' && window.plausibleMixFlip) {
        window.plausibleMixFlip('song_plays', {
          props: {
            player_id: player.id,
            player_location: source,
            song_id: currentSong?.id
          }
        });
      }
    } catch (error) {
      console.log('Error tracking play:', error);
    }
  };

  useEffect(() => {
    const filteredSongs = playlistSongs.filter(isValidSong);
    setValidPlaylistSongs(filteredSongs);
    setCurrentSong(filteredSongs[0] || null);
    setIsDataLoading(false);

    return () => {
      if (sound) {
        sound.unload();
      }
    };
  }, [player, playlistSongs]);

  useEffect(() => {
    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (sound) {
        sound.stop();
        sound.unload();
      }
      Howler.stop();
    };
  }, []);

  const albumArtworkUrl =
    currentSong?.album_artwork_url &&
    currentSong.album_artwork_url !== 'https://r2.mixflip.io/null'
      ? currentSong.album_artwork_url
      : '/placeholder.svg';

  const initializeAudio = async (song: Song) => {
    return new Promise<void>((resolve) => {
      const howlSound = new Howl({
        src: [song.classic_audio_url],
        preload: true,
        autoplay: false,
        volume: 1,
        onload: () => {
          setSound(howlSound);
          setAudioReady(true);
          resolve();
        },
        onend: () => {
          handleSongEnd();
        }
      });

      trackPlay();
    });
  };

  const unlockAudio = () => {
    return new Promise<void>((resolve) => {
      const hackAudio = new Howl({
        src: ['https://cdn.mixflip.io/silent.mp3'],
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
    if (!isUnlocked) {
      await unlockAudio();
      setIsUnlocked(true);
    }

    if (!isPlaying) {
      if (!audioReady) {
        if (currentSong) {
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
    if (sound) {
      sound.play();
      setIsPlaying(true);
      updateProgress();
    }
  };

  const pauseAudio = () => {
    if (sound) {
      sound.pause();
      setIsPlaying(false);
      setIsUnlocked(true);
    }
  };

  const handleTrackClick = async (song: Song) => {
    if (sound) {
      pauseAudio();
      sound.unload();
    }
    setCurrentSong(song);
    setIsLoading(true);

    if (!isUnlocked) {
      await unlockAudio();
      setIsUnlocked(true);
    }

    await initializeAudio(song);
    setIsLoading(false);
    setIsPlaying(true);

    playAudio();
    updateProgressWidth();
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (sound && progressBarRef.current) {
      const progressBarWidth = progressBarRef.current.clientWidth;
      const clickX = event.nativeEvent.offsetX;
      const percentage = clickX / progressBarWidth;
      const newTime = sound.duration() * percentage;
      sound.seek(newTime);
      updateProgressWidth();
    }
  };

  const updateProgressWidth = () => {
    if (progressRef.current && sound) {
      const progressPercentage = (sound.seek() / sound.duration()) * 100;
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  };

  const updateProgress = () => {
    updateProgressWidth();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handleSongEnd = () => {
    if (player.auto_advance) {
      // Handle auto advance logic here if needed
    }
    setIsPlaying(false);
  };

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

    #mixflip-player-root {
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
    
    #mixflip-bottom-section {
      ${colors.playlistBorderColor ? `border: 1px solid ${colors.playlistBorderColor};` : ''}
    }
  `;

  if (isDataLoading) {
    return (
      <div className="w-full max-w-3xl p-4 text-white bg-neutral-900 rounded-xl">
        <div className="flex items-center justify-center h-64">
          <Loader className="animate-spin" />
        </div>
      </div>
    );
  }

  if (!hasActivePlan) {
    return (
      <div className="w-full max-w-3xl p-4 text-white bg-neutral-900 rounded-xl">
        <a href="https://mixflip.io">
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="flex flex-row items-center gap-2">
              <Image
                src="/favicon.png"
                width={64}
                height={64}
                alt="MixFlip Logo"
              />
              <h3 className="text-4xl font-bold">MixFlip</h3>
            </div>
            <p className="max-w-md text-center">
              No subscription found. If you're the owner of this player, please
              renew your subscription to continue using MixFlip.
            </p>
          </div>
        </a>
      </div>
    );
  }

  return (
    <div id="mixflip-player-root" className="w-full max-w-4xl">
      <style>{customStyles}</style>
      <link rel="preconnect" href="https://cdn.mixflip.io" />
      <div className="w-full p-4 pb-2 text-white player-background player-border rounded-xl">
        <div
          id="mixflip-upper-section"
          className="flex flex-col items-center gap-4 mb-6 sm:flex-row"
        >
          {player?.show_artwork && (
            <div id="mixflip-album-cover-box" className="hidden sm:block">
              <Image
                id="mixflip-album-cover"
                src={albumArtworkUrl}
                alt="album cover"
                className="rounded w-36 h-36"
                width={144}
                height={144}
                quality={85}
              />
            </div>
          )}
          <div
            id="mixflip-track-info-controls"
            className="flex-grow w-full sm:w-auto"
          >
            <div className="flex flex-row items-center gap-3 mb-5">
              {player?.show_artwork && (
                <div
                  id="mixflip-mobile-album-cover-box"
                  className="sm:hidden max-[330px]:hidden shrink-0"
                >
                  <Image
                    id="mixflip-album-cover-mobile"
                    width={96}
                    height={96}
                    quality={85}
                    src={albumArtworkUrl}
                    alt="album cover"
                    className="rounded w-22 h-22 shrink-0"
                  />
                </div>
              )}
              <div className="justify-between flex-grow">
                <div
                  id="mixflip-info-row-1"
                  className="flex flex-row items-center gap-4 mb-5"
                >
                  <button
                    id="mixflip-playPauseBtn"
                    aria-label="Play/Pause"
                    className={`rounded-full play-button-bg play-button-border size-14 flex items-center justify-center transition-all duration-150 shrink-0`}
                    onClick={() => {
                      handlePlayButtonClick();
                    }}
                    disabled={isLoading}
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
                    className="my-auto space-y-1"
                  >
                    <p
                      id="mixflip-player-song-name"
                      className="font-bold"
                      style={{ color: colors.songNameColor }}
                    >
                      {currentSong?.song_name || 'This Player Is Empty'}
                    </p>
                    {currentSong?.artist && (
                      <p
                        style={{ color: colors.artistNameColor }}
                        className="text-sm"
                      >
                        {currentSong.artist}
                      </p>
                    )}
                  </div>
                </div>
                <div id="mixflip-track-seek-outer">
                  <div
                    ref={progressBarRef}
                    id="mixflip-progress-bar-outline"
                    className="playhead-bg w-full h-1.5 sm:h-1 relative cursor-pointer rounded"
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
          </div>
        </div>

        {validPlaylistSongs.length > 1 && (
          <div
            id="mixflip-bottom-section"
            className="w-full rounded-lg playlist-border overflow-clip"
          >
            <ul
              id="mixflip-player-playlist-tracklist"
              className="last:*:border-none"
            >
              {validPlaylistSongs.map((song) => (
                <li
                  key={song.id}
                  className={`py-2 px-4 text-sm cursor-pointer transition-all duration-150 ${
                    currentSong?.id === song.id
                      ? 'selected-track-bg hover:selected-track-bg/90 selected-track-text'
                      : 'playlist-bg playlist-text'
                  } border-b playlist-divider antialiased`}
                  onClick={() => handleTrackClick(song)}
                >
                  {song.song_name} {song.artist ? `– ${song.artist}` : ''}
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
              <p className="text-xs transition-all duration-150 branding-text">
                Powered by MixFlip
              </p>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassicPlayer;
