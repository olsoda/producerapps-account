//AudioPlayer.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { PlayIcon, PauseIcon } from 'lucide-react';

interface AudioPlayerProps {
  src: string;
  progressBar?: boolean;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  progressBar = true
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<Howl | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const durationRef = useRef<number>(0);

  useEffect(() => {
    // Initialize progress bar width to 0%
    if (progressRef.current) {
      progressRef.current.style.width = '0%';
    }

    audioRef.current = new Howl({
      src: [src],
      format: [''],
      html5: true,
      onload: () => {
        durationRef.current = audioRef.current?.duration() || 0;
      },
      onplay: () => {
        setIsPlaying(true);
        // Only start the progress update if we don't already have an animation frame
        if (!animationFrameRef.current) {
          updateProgress();
        }
      },
      onpause: () => {
        setIsPlaying(false);
        // Cancel the animation frame when paused
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      },
      onend: () => {
        setIsPlaying(false);
        if (progressRef.current) {
          progressRef.current.style.width = '0%';
        }
        // Make sure to cancel animation frame on end
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      },
      onseek: () => {
        updateProgressWidth();
      }
    });

    return () => {
      audioRef.current?.unload();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [src]);

  const updateProgressWidth = () => {
    if (progressRef.current && audioRef.current) {
      const currentTime = audioRef.current.seek() as number;
      const progressPercentage = (currentTime / durationRef.current) * 100;
      progressRef.current.style.width = `${progressPercentage}%`;
    }
  };

  const updateProgress = () => {
    updateProgressWidth();
    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
  };

  const handleProgressClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const progressBarWidth = progressBarRef.current?.clientWidth || 0;
    const clickX = event.nativeEvent.offsetX;
    const percentage = clickX / progressBarWidth;
    const newTime = durationRef.current * percentage;
    audioRef.current?.seek(newTime);
  };

  return (
    <div className="flex items-center w-full p-2 rounded-full bg-neutral-100 dark:bg-muted dark:border border-border audio-player">
      <button
        type="button"
        className="flex items-center justify-center size-8 bg-background dark:bg-muted-foreground/20 rounded-full play-button hover:bg-accent dark:hover:bg-muted-foreground/20 p-2"
        onClick={togglePlayback}
      >
        {isPlaying ? (
          <PauseIcon fill="currentColor" className="size-4 text-foreground" />
        ) : (
          <PlayIcon fill="currentColor" className="size-4 text-foreground" />
        )}
      </button>
      {progressBar && (
        <div
          id="progress-bar"
          className="flex-grow h-2 mx-4 overflow-hidden bg-gray-300 dark:bg-muted-foreground/30 rounded-full cursor-pointer progress-bar"
          ref={progressBarRef}
          onClick={handleProgressClick}
        >
          <div className="h-full bg-primary progress" ref={progressRef}></div>
        </div>
      )}
    </div>
  );
};

export default AudioPlayer;
