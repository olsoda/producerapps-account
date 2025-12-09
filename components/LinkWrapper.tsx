'use client';

import { useCallback } from 'react';

interface ClickEventProps {
  type: 'social' | 'custom';
  id: string;
  text: string;
  url: string;
  platform?: string;
}

interface LinkWrapperProps {
  type: 'social' | 'custom';
  id: string;
  text: string;
  url: string;
  platform?: string;
  children: React.ReactNode;
}

export default function LinkWrapper({
  type,
  id,
  text,
  url,
  platform,
  children
}: LinkWrapperProps) {
  const trackClick = useCallback(() => {
    // @ts-ignore
    window.plausibleMixFlip('Link Click', {
      props: {
        type,
        id,
        text,
        url,
        ...(platform && { platform })
      }
    });
  }, [type, id, text, url, platform]);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={text}
      className="transition-opacity hover:opacity-90"
      onClick={trackClick}
    >
      {children}
    </a>
  );
}
