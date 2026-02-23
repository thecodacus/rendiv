import React, { useEffect, useRef, useState } from 'react';
import { extractWaveform } from './waveform';

interface WaveformBlockProps {
  src: string;
  width: number;
  height: number;
  color: string;
}

function lightenColor(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r + (255 - r) * amount);
  const ng = Math.round(g + (255 - g) * amount);
  const nb = Math.round(b + (255 - b) * amount);
  return `rgb(${nr}, ${ng}, ${nb})`;
}

export const WaveformBlock: React.FC<WaveformBlockProps> = ({ src, width, height, color }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveform, setWaveform] = useState<Float32Array | null>(null);

  const samplesCount = Math.max(1, Math.floor(width / 2));

  useEffect(() => {
    let cancelled = false;
    extractWaveform(src, samplesCount)
      .then((data) => { if (!cancelled) setWaveform(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [src, samplesCount]);

  useEffect(() => {
    if (!waveform) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    ctx.fillStyle = lightenColor(color, 0.4);
    ctx.globalAlpha = 0.5;

    const barWidth = width / waveform.length;
    const centerY = height / 2;
    const maxBarHeight = height * 0.8;

    for (let i = 0; i < waveform.length; i++) {
      const barH = waveform[i] * maxBarHeight;
      const x = i * barWidth;
      ctx.fillRect(x, centerY - barH / 2, Math.max(1, barWidth - 0.5), barH);
    }
  }, [waveform, width, height, color]);

  if (!waveform) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        borderRadius: 'inherit',
        pointerEvents: 'none',
      }}
    />
  );
};
