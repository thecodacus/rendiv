import React, { useEffect, useState } from 'react';
import { extractThumbnails } from './thumbnails';

interface ThumbnailBlockProps {
  src: string;
  width: number;
  height: number;
}

const THUMB_HEIGHT = 28;
const THUMB_WIDTH = Math.round(THUMB_HEIGHT * (16 / 9));

export const ThumbnailBlock: React.FC<ThumbnailBlockProps> = ({ src, width, height }) => {
  const [thumbnails, setThumbnails] = useState<string[] | null>(null);

  const count = Math.max(1, Math.floor(width / THUMB_WIDTH));

  useEffect(() => {
    let cancelled = false;
    extractThumbnails(src, count, THUMB_WIDTH, THUMB_HEIGHT)
      .then((data) => { if (!cancelled) setThumbnails(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [src, count]);

  if (!thumbnails || thumbnails.length === 0) return null;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }}
    >
      {thumbnails.map((thumb, i) => (
        <img
          key={i}
          src={thumb}
          alt=""
          style={{
            height: '100%',
            width: width / thumbnails.length,
            objectFit: 'cover',
            opacity: 0.6,
            flexShrink: 0,
          }}
        />
      ))}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};
