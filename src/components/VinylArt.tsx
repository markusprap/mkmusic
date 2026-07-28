'use client';

interface Props {
  thumbnail?: string;
  spinning?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

// Spotify-style rotating vinyl: a black disc with grooves, the track's own
// thumbnail as the center label. Pure CSS/SVG — no licensed art asset, so
// this doubles as TrackImg's broken-image fallback (static, non-spinning).
export default function VinylArt({ thumbnail, spinning = false, size = 260, className, style }: Props) {
  return (
    <div
      className={`vinyl-art${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, animationPlayState: spinning ? 'running' : 'paused', ...style }}
    >
      <div className="vinyl-label">
        {thumbnail && <img src={thumbnail} alt="" />}
      </div>
      <div className="vinyl-hole" />
    </div>
  );
}
