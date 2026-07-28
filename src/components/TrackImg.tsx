'use client';
import { useState } from 'react';
import VinylArt from './VinylArt';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  // An alternate URL to try once before giving up to the vinyl placeholder
  // (e.g. a guessed hqdefault.jpg thumbnail) — existing single-retry
  // fallbacks stay the first try, vinyl is only the last resort.
  retrySrc?: string;
}

// Drop-in replacement for a thumbnail <img> — falls back to the vinyl
// placeholder instead of a broken-image icon when the URL 404s/fails.
export default function TrackImg({ src, alt, className, style, retrySrc, ...rest }: Props) {
  const [triedRetry, setTriedRetry] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return <VinylArt className={className} style={{ width: '100%', height: '100%', ...style }} />;
  }

  return (
    <img
      src={triedRetry && retrySrc ? retrySrc : src}
      alt={alt}
      className={className}
      style={style}
      onError={() => { if (retrySrc && !triedRetry) setTriedRetry(true); else setFailed(true); }}
      {...rest}
    />
  );
}
