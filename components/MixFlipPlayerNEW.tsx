'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Howl } from 'howler';
import { Play, Pause, Loader } from 'lucide-react';
import Image from 'next/image';

const supabase = createClient();
const storagePrefix = 'https://r2.mixflip.io/';

interface Song {
  id: number;
  song_name: string;
  artist: string;
  album_artwork_url: string;
  before_audio_url: string;
  after_audio_url: string;
}

interface MixFlipPlayerProps {
  playerId: number;
}

interface Player {
  id: number;
  accent_color: string;
  before_audio_label: string;
  after_audio_label: string;
  user_id: string;
}

const MixFlipPlayer: React.FC<MixFlipPlayerProps> = ({ playerId }) => {
  const [playerInfo, setPlayerInfo] = useState<Player | null>(null);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeforeActive, setIsBeforeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);

  const beforeSoundRef = useRef<Howl | null>(null);
  const afterSoundRef = useRef<Howl | null>(null);
  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const updateProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchPlayerInfo = async () => {
      const { data: playerInfo, error: playerError } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (playerError) {
        console.error('Error fetching player info:', playerError);
      } else {
        setPlayerInfo(playerInfo);
      }
    };

    const fetchPlaylistSongs = async () => {
      const { data, error } = await supabase
        .from('player_songs')
        .select(
          `
          order,
          songs (
            id,
            song_name,
            artist,
            album_artwork_url,
            before_audio_url,
            after_audio_url
          )
        `
        )
        .eq('player_id', playerId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching playlist songs:', error);
      } else {
        const playlist = data.map((item: any) => ({
          ...item.songs,
          album_artwork_url: storagePrefix + item.songs.album_artwork_url,
          before_audio_url: storagePrefix + item.songs.before_audio_url,
          after_audio_url: storagePrefix + item.songs.after_audio_url
        }));
        setPlaylistSongs(playlist);
        setCurrentTrack(playlist[0] || null);
      }
    };

    fetchPlayerInfo();
    fetchPlaylistSongs();
  }, [playerId]);

  useEffect(() => {
    if (currentTrack) {
      resetAudio(currentTrack);
    }
    return () => {
      if (updateProgressIntervalRef.current) {
        clearInterval(updateProgressIntervalRef.current);
      }
    };
  }, [currentTrack]);

  const initializeAudio = (track: Song) => {
    beforeSoundRef.current = new Howl({
      src: [track.before_audio_url],
      preload: false
    });

    afterSoundRef.current = new Howl({
      src: [track.after_audio_url],
      preload: false
    });

    console.log('Audio initialized');
  };

  const resetAudio = (track: Song) => {
    if (beforeSoundRef.current) {
      beforeSoundRef.current.unload();
    }
    if (afterSoundRef.current) {
      afterSoundRef.current.unload();
    }

    initializeAudio(track);

    setIsBeforeActive(false);
    beforeSoundRef.current!.mute(true);
    afterSoundRef.current!.mute(false);

    if (isPlaying) {
      playAudio();
    }
  };

  const playAudio = () => {
    if (!beforeSoundRef.current || !afterSoundRef.current) {
      initializeAudio(currentTrack!);
    }

    if (
      beforeSoundRef.current!.state() === 'unloaded' ||
      afterSoundRef.current!.state() === 'unloaded'
    ) {
      setIsLoading(true);

      let loadedCount = 0;
      const onLoad = () => {
        loadedCount++;
        if (loadedCount === 2) {
          setIsLoading(false);
          startPlayback();
        }
      };

      beforeSoundRef.current!.once('load', onLoad);
      afterSoundRef.current!.once('load', onLoad);

      beforeSoundRef.current!.load();
      afterSoundRef.current!.load();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    beforeSoundRef.current!.play();
    afterSoundRef.current!.play();

    if (isBeforeActive) {
      afterSoundRef.current!.mute(true);
      beforeSoundRef.current!.mute(false);
    } else {
      beforeSoundRef.current!.mute(true);
      afterSoundRef.current!.mute(false);
    }

    setIsPlaying(true);

    if (updateProgressIntervalRef.current) {
      clearInterval(updateProgressIntervalRef.current);
    }

    updateProgressIntervalRef.current = setInterval(updateProgress, 100);

    beforeSoundRef.current!.on('end', () => {
      clearInterval(updateProgressIntervalRef.current!);
    });

    beforeSoundRef.current!.on('pause', () => {
      clearInterval(updateProgressIntervalRef.current!);
    });
  };

  const pauseAudio = () => {
    beforeSoundRef.current!.pause();
    afterSoundRef.current!.pause();
    setIsPlaying(false);
    if (updateProgressIntervalRef.current) {
      clearInterval(updateProgressIntervalRef.current);
    }
  };

  const handleTrackSelection = (track: Song) => {
    setCurrentTrack(track);
  };

  const handlePlayPauseClick = () => {
    if (!isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  };

  const handleBeforeClick = () => {
    setIsBeforeActive(true);
    beforeSoundRef.current!.mute(false);
    afterSoundRef.current!.mute(true);
  };

  const handleAfterClick = () => {
    setIsBeforeActive(false);
    beforeSoundRef.current!.mute(true);
    afterSoundRef.current!.mute(false);
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (
      beforeSoundRef.current &&
      afterSoundRef.current &&
      progressBarRef.current
    ) {
      const progressBarWidth = progressBarRef.current.offsetWidth;
      const clickPosition = event.nativeEvent.offsetX;
      const seekPercentage = clickPosition / progressBarWidth;
      const seekTime = seekPercentage * beforeSoundRef.current.duration();

      beforeSoundRef.current.seek(seekTime);
      afterSoundRef.current.seek(seekTime);
      setProgressPercentage(seekPercentage * 100);
    }
  };

  const updateProgress = () => {
    if (beforeSoundRef.current && isPlaying) {
      const progressPercentage =
        (beforeSoundRef.current.seek() / beforeSoundRef.current.duration()) *
        100;
      setProgressPercentage(progressPercentage);
      console.log('Progress updated:', progressPercentage);
    }
  };

  const albumArtworkUrl =
    currentTrack?.album_artwork_url &&
    currentTrack.album_artwork_url !== 'https://r2.mixflip.io/null'
      ? currentTrack.album_artwork_url
      : '/placeholder.svg';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="w-full p-4 text-white bg-neutral-900 rounded-xl">
        <div
          id="ab-upper-section"
          className="flex flex-col gap-4 mb-6 md:flex-row"
        >
          <div id="ab-album-cover-box" className="hidden md:block">
            {currentTrack && (
              <img
                id="ab-album-cover"
                src={albumArtworkUrl}
                alt="album cover"
                className="rounded w-36 h-36"
              />
            )}
          </div>
          <div id="ab-track-info-controls" className="flex-grow">
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-5">
              <div id="ab-mobile-album-cover-box" className="w-1/4 md:hidden">
                {currentTrack && (
                  <img
                    id="ab-album-cover-mobile"
                    src={albumArtworkUrl}
                    alt="album cover"
                    className="rounded"
                  />
                )}
              </div>
              <div className="justify-between flex-grow">
                <div id="ab-info-row-1" className="flex flex-row gap-4 mb-5">
                  <button
                    id="ab-playPauseBtn"
                    className="rounded-full bg-primary size-14 md:size-14"
                    style={{
                      backgroundColor: playerInfo?.accent_color || '#000000'
                    }}
                    onClick={handlePlayPauseClick}
                  >
                    {isLoading ? (
                      <Loader className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause />
                    ) : (
                      <Play />
                    )}
                  </button>
                  <div id="ab-song-artist-names" className="">
                    <p
                      id="ab-player-song-name"
                      className="font-bold text-white"
                    >
                      {currentTrack?.song_name}
                    </p>
                    <p id="ab-player-artist-name" className="text-white">
                      {currentTrack?.artist}
                    </p>
                  </div>
                </div>
                <div id="ab-track-seek-outer">
                  <div
                    id="ab-progress-bar-outline"
                    className="bg-neutral-700 w-full h-1.5 md:h-1 relative cursor-pointer rounded"
                    onClick={handleProgressBarClick}
                    ref={progressBarRef}
                  >
                    <div
                      id="ab-progress-bar-playhead"
                      className="absolute top-0 left-0 h-full rounded bg-primary"
                      style={{
                        backgroundColor: playerInfo?.accent_color || '#000000',
                        width: `${progressPercentage}%`
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div id="ab-toggle" className="flex flex-row w-full">
              <button
                id="ab-beforeBtn"
                className={`w-1/2 py-2 rounded-l-lg ${isBeforeActive ? 'bg-red-700' : 'bg-neutral-700 hover:bg-red-700/20'}`}
                onClick={handleBeforeClick}
              >
                {playerInfo?.before_audio_label || 'Before Mixing'}
              </button>
              <button
                id="ab-afterBtn"
                className={`w-1/2 py-2 rounded-r-lg ${isBeforeActive ? 'bg-neutral-700 hover:bg-primary/20' : 'bg-primary'}`}
                onClick={handleAfterClick}
                style={{
                  backgroundColor: playerInfo?.accent_color || '#000000'
                }}
              >
                {playerInfo?.after_audio_label || 'Final Mix and Master'}
              </button>
            </div>
          </div>
        </div>

        <div id="ab-bottom-section" className="w-full rounded-lg">
          <ul
            id="ab-player-playlist-tracklist"
            className="first:rounded-t-lg last:rounded-b-lg last:border-none"
          >
            {playlistSongs.map((song, index) => (
              <li
                key={song.id}
                className={`py-2 px-4 text-sm cursor-pointer ${currentTrack?.id === song.id ? 'bg-primary' : 'bg-neutral-700 hover:bg-neutral-600'} border-b border-neutral-600`}
                onClick={() => handleTrackSelection(song)}
              >
                {song.song_name} by {song.artist}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MixFlipPlayer;
