'use client';
import { Track, Profile, formatDuration } from '@/lib/store';
import TrackMenu from './TrackMenu';

interface Props {
  track: Track;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  profile: Profile;
  onPlay: (t: Track) => void;
  onProfileChange: (p: Profile) => void;
  onAddToQueue: (t: Track) => void;
}

export default function TrackRow({ track, index, isActive, isPlaying, profile, onPlay, onProfileChange, onAddToQueue }: Props) {
  return (
    <div className={`track-row ${isActive ? 'is-active' : ''}`} onClick={() => onPlay(track)}>
      <div className="track-num-cell">{isActive && isPlaying ? <div className="eq"><span/><span/><span/></div> : index + 1}</div>
      <div className="track-play-icon">
        <svg width="14" height="14" fill={isActive ? '#1db954' : 'currentColor'} viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21" /></svg>
      </div>
      <div className="track-info">
        <img className="track-img" src={track.thumbnail} alt={track.title} />
        <div className="track-meta">
          <div className="track-title">{track.title}</div>
          <div className="track-artist">{track.artist}</div>
        </div>
      </div>
      <TrackMenu className="track-menu" profile={profile} track={track} onProfileChange={onProfileChange} onAddToQueue={onAddToQueue} />
      <div className="track-dur">{formatDuration(track.duration)}</div>
    </div>
  );
}
