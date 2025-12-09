// this version wastes bandwidth by loading the audio files on page load rather than on demand, but the UI updates the progress bar
// MixFlipPlayer.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Howl } from 'howler';
import { Play, Pause, Loader } from 'lucide-react';
import Image from 'next/image';

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

const supabase = createClient(/* your Supabase configuration */);
const storagePrefix = 'https://r2.mixflip.io/';

const MixFlipPlayer: React.FC<MixFlipPlayerProps> = ({ playerId }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [playlistSongs, setPlaylistSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeforeActive, setIsBeforeActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [beforeSound, setBeforeSound] = useState<Howl | null>(null);
  const [afterSound, setAfterSound] = useState<Howl | null>(null);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [hasActivePlan, setHasActivePlan] = useState<boolean | null>(null);

  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [audioReady, setAudioReady] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [accentColor, setAccentColor] = useState('#299fa7');

  const customStyles = `
    .accent-bg {
      background-color: ${accentColor};
    }
    .accent-bg:hover {
      background-color: ${accentColor}ee;
    }
    .accent-bg-hover:hover {
      background-color: ${accentColor}66;
    }
  `;

  useEffect(() => {
    const fetchPlayer = async () => {
      const { data, error } = await supabase
        .from('players')
        .select(
          'id, accent_color, before_audio_label, after_audio_label, user_id'
        )
        .eq('id', playerId)
        .single();

      if (error) {
        console.error('Error fetching player:', error);
      } else {
        setPlayer(data as Player);
        setAccentColor(data.accent_color);
        checkUserSubscription(data.user_id);
      }
    };

    const checkUserSubscription = async (userId: string) => {
      const { data: userData, error } = await supabase
        .from('user_subscriptions')
        .select('has_active_subscription')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching subscription status:', error);
        setHasActivePlan(false);
      } else {
        setHasActivePlan(userData.has_active_subscription);
      }
    };

    fetchPlayer();
  }, [playerId]);

  useEffect(() => {
    const fetchSongs = async () => {
      const { data, error } = await supabase
        .from('songs')
        .select(
          'id, song_name, artist, album_artwork_url, before_audio_url, after_audio_url'
        );

      if (error) {
        console.error('Error fetching songs:', error);
        setSongs([]);
      } else {
        setSongs(data as Song[]);
      }
    };

    fetchSongs();
  }, []);

  useEffect(() => {
    const fetchPlaylistSongs = async () => {
      const { data, error } = await supabase
        .from('player_songs')
        .select(
          `
        songs(
          id,
          song_name,
          artist,
          album_artwork_url,
          before_audio_url,
          after_audio_url
        ),
        order
      `
        )
        .eq('player_id', playerId)
        .order('order', { ascending: true });

      if (error) {
        console.error('Error fetching playlist songs:', error);
        setPlaylistSongs([]);
      } else {
        const fetchedPlaylistSongs = (
          data as unknown as { songs: unknown; order: number }[]
        )
          .map((ps) => {
            if (
              ps.songs &&
              typeof ps.songs === 'object' &&
              'id' in ps.songs &&
              'song_name' in ps.songs &&
              'artist' in ps.songs &&
              'album_artwork_url' in ps.songs &&
              'before_audio_url' in ps.songs &&
              'after_audio_url' in ps.songs
            ) {
              const {
                id,
                song_name,
                artist,
                album_artwork_url,
                before_audio_url,
                after_audio_url
              } = ps.songs as Song;
              return {
                id,
                song_name,
                artist,
                album_artwork_url: storagePrefix + album_artwork_url,
                before_audio_url: storagePrefix + before_audio_url,
                after_audio_url: storagePrefix + after_audio_url
              };
            }
            return null;
          })
          .filter((song): song is Song => song !== null);

        setPlaylistSongs(fetchedPlaylistSongs);
        setCurrentSong(fetchedPlaylistSongs[0]);
      }
      setIsLoading(false);
    };

    fetchPlaylistSongs();
  }, [playerId]);

  useEffect(() => {
    if (currentSong) {
      initializeAudio(currentSong);
    }
  }, [currentSong]);

  useEffect(() => {
    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying]);

  const albumArtworkUrl =
    currentSong?.album_artwork_url &&
    currentSong.album_artwork_url !== 'https://r2.mixflip.io/null'
      ? currentSong.album_artwork_url
      : '/placeholder.svg';

  const initializeAudio = (song: Song) => {
    console.log('Initializing audio');
    const beforeSound = new Howl({
      src: [song.before_audio_url],
      preload: false
    });

    const afterSound = new Howl({
      src: [song.after_audio_url],
      preload: false
    });

    setBeforeSound(beforeSound);
    setAfterSound(afterSound);
  };

  const playAudio = () => {
    //load non-preloaded audio files

    if (beforeSound && afterSound) {
      afterSound.load();
      beforeSound.load();
      beforeSound.play();
      afterSound.play();

      if (isBeforeActive) {
        afterSound.mute(true);
        beforeSound.mute(false);
      } else {
        beforeSound.mute(true);
        afterSound.mute(false);
      }

      setIsPlaying(true);
      updateProgress();
    }
  };

  const pauseAudio = () => {
    if (beforeSound && afterSound) {
      beforeSound.pause();
      afterSound.pause();
      setIsPlaying(false);
    }
  };
  const handleTrackClick = async (song: Song) => {
    if (beforeSound && afterSound) {
      // Pause and unload the currently playing audio
      beforeSound.stop();
      afterSound.stop();
      beforeSound.unload();
      afterSound.unload();
    }

    // Set the new current song
    setCurrentSong(song);
    setIsBeforeActive(false);

    // Create new Howl instances for the selected song
    const newBeforeSound = new Howl({
      src: [song.before_audio_url],
      preload: true,
      autoplay: false
    });

    const newAfterSound = new Howl({
      src: [song.after_audio_url],
      preload: true,
      autoplay: false
    });

    // Wait for both audio files to load
    await Promise.all([
      new Promise((resolve) => newBeforeSound.once('load', resolve)),
      new Promise((resolve) => newAfterSound.once('load', resolve))
    ]);

    // Update the state with the new Howl instances
    setBeforeSound(newBeforeSound);
    setAfterSound(newAfterSound);

    if (isPlaying) {
      // If the player was previously playing, start playback of the new song
      newBeforeSound.play();
      newAfterSound.play();

      if (isBeforeActive) {
        newAfterSound.mute(true);
        newBeforeSound.mute(false);
      } else {
        newBeforeSound.mute(true);
        newAfterSound.mute(false);
      }
      updateProgress();
    }
  };

  const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (beforeSound && afterSound && progressBarRef.current) {
      const progressBarWidth = progressBarRef.current.offsetWidth;
      const clickPosition = event.nativeEvent.offsetX;
      const seekPercentage = clickPosition / progressBarWidth;
      const seekTime = seekPercentage * beforeSound.duration();

      beforeSound.seek(seekTime);
      afterSound.seek(seekTime);
      setProgressPercentage(seekPercentage * 100);
    }
  };

  const updateProgress = () => {
    if (beforeSound && isPlaying) {
      const progressPercentage =
        (beforeSound.seek() / beforeSound.duration()) * 100;
      setProgressPercentage(progressPercentage);
      requestAnimationFrame(updateProgress);
    }
  };

  if (isLoading || hasActivePlan === null) {
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
    <div className="w-full max-w-3xl">
      <style>{customStyles}</style>
      <div className="w-full p-4 pb-2 text-white bg-neutral-900 rounded-xl">
        <div
          id="ab-upper-section"
          className="flex flex-col gap-4 mb-6 md:flex-row"
        >
          <div id="ab-album-cover-box" className="hidden md:block">
            <img
              id="ab-album-cover"
              src={albumArtworkUrl}
              alt="album cover"
              className="rounded w-36 h-36"
            />
          </div>
          <div id="ab-track-info-controls" className="flex-grow">
            <div className="flex flex-row items-center gap-4 mb-6 md:mb-5">
              <div id="ab-mobile-album-cover-box" className="w-1/4 md:hidden">
                <img
                  id="ab-album-cover-mobile"
                  src={albumArtworkUrl}
                  alt="album cover"
                  className="rounded"
                />
              </div>
              <div className="justify-between flex-grow">
                <div id="ab-info-row-1" className="flex flex-row gap-4 mb-5">
                  <button
                    id="ab-playPauseBtn"
                    className={`rounded-full accent-bg size-14 md:size-14`}
                    onClick={() => {
                      setIsPlaying(!isPlaying);
                    }}
                  >
                    {isPlaying ? (
                      <Pause fill="#fff" className="mx-auto size-6" />
                    ) : (
                      <Play fill="#ffffff" className="mx-auto size-6" />
                    )}
                  </button>
                  <div id="ab-song-artist-names" className="">
                    <p
                      id="ab-player-song-name"
                      className="font-bold text-white"
                    >
                      {currentSong?.song_name || 'This Player Is Empty'}
                    </p>
                    <p
                      id="ab-player-artist-name"
                      className="text-sm text-white"
                    >
                      {currentSong?.artist ||
                        'If you own this player, you can add songs to it in your MixFlip Dashboard.'}
                    </p>
                  </div>
                </div>
                <div id="ab-track-seek-outer">
                  <div
                    ref={progressBarRef}
                    id="ab-progress-bar-outline"
                    className="bg-neutral-700 w-full h-1.5 md:h-1 relative cursor-pointer rounded"
                    onClick={handleProgressBarClick}
                  >
                    <div
                      id="ab-progress-bar-playhead"
                      className={`accent-bg h-full absolute top-0 left-0 rounded`}
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
            <div id="ab-toggle" className="flex flex-row w-full">
              <button
                id="ab-beforeBtn"
                className={`w-1/2 py-2 rounded-l-lg ${
                  isBeforeActive
                    ? `bg-red-700 glow`
                    : 'bg-neutral-700 hover:bg-red-700/20'
                }`}
                onClick={() => {
                  setIsBeforeActive(true);
                  beforeSound?.mute(false);
                  afterSound?.mute(true);
                }}
              >
                {player?.before_audio_label || 'Before Mixing'}
              </button>
              <button
                id="ab-afterBtn"
                className={`w-1/2 py-2 rounded-r-lg ${
                  !isBeforeActive
                    ? `accent-bg glow`
                    : 'bg-neutral-700 accent-bg-hover'
                }`}
                onClick={() => {
                  setIsBeforeActive(false);
                  beforeSound?.mute(true);
                  afterSound?.mute(false);
                }}
              >
                {player?.after_audio_label || 'Final Mix and Master'}
              </button>
            </div>
          </div>
        </div>

        <div id="ab-bottom-section" className="w-full rounded-lg">
          <ul
            id="ab-player-playlist-tracklist"
            className="first:*:rounded-t-lg last:*:rounded-b-lg last:*:border-none"
          >
            {playlistSongs.map((song, index) => (
              <li
                key={song.id}
                className={`py-2 px-4 text-sm cursor-pointer ${
                  currentSong?.id === song.id
                    ? 'accent-bg hover:accent-bg/90'
                    : 'bg-neutral-700 hover:bg-neutral-600'
                } border-b border-neutral-600`}
                onClick={() => handleTrackClick(song)}
              >
                {song.song_name} – {song.artist}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-center pt-2" id="mixflipwatermark">
          <a href="https://mixflip.io/" target="_blank">
            <p className="text-xs text-gray-400 hover:text-neutral-200">
              Powered by MixFlip
            </p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default MixFlipPlayer;
