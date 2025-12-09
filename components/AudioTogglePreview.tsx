import { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { Play, Pause, Loader } from 'lucide-react';

interface ToggleAudioPreviewProps {
  beforeUrl: string;
  afterUrl: string;
}

const ToggleAudioPreview: React.FC<ToggleAudioPreviewProps> = ({
  beforeUrl,
  afterUrl
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBeforeActive, setIsBeforeActive] = useState(false);
  const [beforeSound, setBeforeSound] = useState<Howl | null>(null);
  const [afterSound, setAfterSound] = useState<Howl | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Remove progressPercentage state and add refs
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    // Initialize progress bar width to 0%
    if (progressRef.current) {
      progressRef.current.style.width = '0%';
    }

    if (isPlaying) {
      playAudio();
    } else {
      pauseAudio();
    }
  }, [isPlaying]);

  useEffect(() => {
    const cleanup = () => {
      if (beforeSound) {
        beforeSound.stop();
        beforeSound.unload();
      }
      if (afterSound) {
        afterSound.stop();
        afterSound.unload();
      }
      setIsPlaying(false);
    };

    // Add event listeners for page hide and unload
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('unload', cleanup);

    return () => {
      cleanup();
      window.removeEventListener('pagehide', cleanup);
      window.removeEventListener('unload', cleanup);
    };
  }, [beforeSound, afterSound]);

  const initializeAudio = async () => {
    return new Promise<void>((resolve) => {
      const howelBeforeSound = new Howl({
        src: [beforeUrl],
        preload: true,
        autoplay: false,
        volume: isBeforeActive ? 1 : 0,
        onend: () => {
          setIsPlaying(false);
        },
        onload: () => {
          checkBothLoaded();
        }
      });

      const howelAfterSound = new Howl({
        src: [afterUrl],
        preload: true,
        autoplay: false,
        volume: isBeforeActive ? 0 : 1,
        onend: () => {
          setIsPlaying(false);
        },
        onload: () => {
          checkBothLoaded();
        }
      });

      let beforeLoaded = false;
      let afterLoaded = false;

      const checkBothLoaded = () => {
        if (beforeLoaded && afterLoaded) {
          setBeforeSound(howelBeforeSound);
          setAfterSound(howelAfterSound);
          setAudioReady(true);
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
    });
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

  const updateProgressWidth = () => {
    if (progressRef.current && beforeSound) {
      const progressPercentage =
        (beforeSound.seek() / beforeSound.duration()) * 100;
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  };

  const updateProgress = () => {
    updateProgressWidth();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const playAudio = () => {
    if (beforeSound && afterSound) {
      beforeSound.volume(isBeforeActive ? 1 : 0);
      afterSound.volume(isBeforeActive ? 0 : 1);

      beforeSound.play();
      afterSound.play();
      setIsPlaying(true);
      updateProgress();
    }
  };

  const pauseAudio = () => {
    if (beforeSound && afterSound) {
      beforeSound.pause();
      afterSound.pause();
      setIsPlaying(false);
      updateProgressWidth();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
      updateProgressWidth();
    }
  };

  const handlePlayButtonClick = async () => {
    if (!isPlaying) {
      if (!audioReady) {
        setIsLoading(true);
        await initializeAudio();
        setIsLoading(false);
        setIsPlaying(true);
      } else {
        setIsPlaying(true);
      }
    }
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <div className="flex items-center w-full p-2 rounded-full bg-neutral-100 dark:bg-muted dark:border border-border audio-player">
        <button
          type="button"
          className="flex items-center justify-center size-8 bg-background dark:bg-muted-foreground/20 rounded-full play-button hover:bg-accent dark:hover:bg-muted-foreground/20 p-2"
          onClick={handlePlayButtonClick}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="size-4 animate-spin text-foreground" />
          ) : isPlaying ? (
            <Pause fill="currentColor" className="size-4 text-foreground" />
          ) : (
            <Play fill="currentColor" className="size-4 text-foreground" />
          )}
        </button>
        <div
          ref={progressBarRef}
          className="flex-grow h-2 mx-4 overflow-hidden bg-gray-300 dark:bg-muted-foreground/30 rounded-full cursor-pointer progress-bar"
          onClick={handleProgressBarClick}
        >
          <div
            ref={progressRef}
            className="h-full bg-primary progress"
          ></div>
        </div>
        <div>
          <button
            type="button"
            className={`py-1 px-4 rounded-l-full ${
              isBeforeActive 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-background dark:bg-muted-foreground/20 hover:bg-destructive/20 dark:hover:bg-destructive/30 text-foreground'
            }`}
            onClick={() => {
              setIsBeforeActive(true);
              if (beforeSound && afterSound) {
                crossfade(afterSound, beforeSound, 10);
              }
            }}
          >
            Before
          </button>
          <button
            type="button"
            className={`py-1 px-4 rounded-r-full ${
              !isBeforeActive 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-background dark:bg-muted-foreground/20 hover:bg-primary/20 dark:hover:bg-primary/30 text-foreground'
            }`}
            onClick={() => {
              setIsBeforeActive(false);
              if (beforeSound && afterSound) {
                crossfade(beforeSound, afterSound, 10);
              }
            }}
          >
            After
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToggleAudioPreview;
