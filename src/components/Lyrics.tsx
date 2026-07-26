'use client';

import React, { useEffect, useState } from 'react';
import { Track } from '@/lib/store';
import { getLyrics } from '@/lib/lyrics';
import { X, RefreshCw } from 'lucide-react';

interface LyricsProps {
  currentTrack: Track | null;
  onClose: () => void;
}

export function Lyrics({ currentTrack, onClose }: LyricsProps) {
  const [lyrics, setLyrics] = useState<string>('Memuat lirik...');
  const [isLoading, setIsLoading] = useState(false);

  const fetchLyricsData = async () => {
    if (!currentTrack) return;
    setIsLoading(true);
    const text = await getLyrics(currentTrack.title, currentTrack.artist);
    setLyrics(text);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchLyricsData();
  }, [currentTrack]);

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>Lirik Lagu</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={fetchLyricsData} style={iconBtnStyle} title="Muat ulang lirik">
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button onClick={onClose} style={iconBtnStyle}>
            <X size={20} />
          </button>
        </div>
      </div>

      {currentTrack && (
        <div style={trackHeaderStyle}>
          <img src={currentTrack.thumbnail} alt={currentTrack.title} style={thumbStyle} />
          <div>
            <div style={trackTitleStyle}>{currentTrack.title}</div>
            <div style={artistStyle}>{currentTrack.artist}</div>
          </div>
        </div>
      )}

      <div style={lyricsBodyStyle}>
        {isLoading ? (
          <div style={{ color: '#a0a0b8' }}>Mencari lirik...</div>
        ) : (
          <pre style={lyricsPreStyle}>{lyrics}</pre>
        )}
      </div>
    </div>
  );
}

const containerStyle: React.CSSProperties = {
  width: '360px',
  backgroundColor: '#16161e',
  borderLeft: '1px solid rgba(255,255,255,0.08)',
  padding: '24px',
  height: 'calc(100vh - 90px)',
  position: 'fixed',
  top: 0,
  right: 0,
  zIndex: 900,
  display: 'flex',
  flexDirection: 'column',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '20px',
};

const titleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: '700',
  color: '#fff',
};

const iconBtnStyle: React.CSSProperties = {
  color: '#a0a0b8',
};

const trackHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '20px',
  paddingBottom: '16px',
  borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const thumbStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '6px',
  objectFit: 'cover',
};

const trackTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#fff',
};

const artistStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#a0a0b8',
};

const lyricsBodyStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  paddingRight: '8px',
};

const lyricsPreStyle: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: '15px',
  lineHeight: '1.8',
  color: '#e0e0e0',
  whiteSpace: 'pre-wrap',
  fontWeight: '500',
};
