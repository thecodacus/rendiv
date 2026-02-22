import React, { useRef, useEffect, useState } from 'react';
import type { AssetEntry } from './AssetBrowser';
import { previewStyles, colors, fonts } from './styles';

interface AssetPreviewProps {
  asset: AssetEntry;
  onClose: () => void;
}

function getMediaType(name: string): 'image' | 'video' | 'audio' | 'unknown' {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico'].includes(ext)) return 'image';
  if (['mp4', 'webm', 'mov'].includes(ext)) return 'video';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) return 'audio';
  return 'unknown';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const AssetPreview: React.FC<AssetPreviewProps> = ({ asset, onClose }) => {
  const mediaType = getMediaType(asset.name);
  const url = `/${asset.path}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoDimensions, setVideoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Reset dimensions when asset changes
  useEffect(() => {
    setVideoDimensions(null);
    setImageDimensions(null);
  }, [asset.path]);

  return (
    <div style={previewStyles.container}>
      {/* Metadata bar */}
      <div style={previewStyles.metadataBar}>
        <span>
          <span style={previewStyles.metadataLabel}>File </span>
          <span style={previewStyles.metadataValue}>{asset.name}</span>
        </span>
        <span>
          <span style={previewStyles.metadataLabel}>Size </span>
          <span style={previewStyles.metadataValue}>{formatSize(asset.size)}</span>
        </span>
        {imageDimensions && (
          <span>
            <span style={previewStyles.metadataLabel}>Dimensions </span>
            <span style={previewStyles.metadataValue}>{imageDimensions.width}x{imageDimensions.height}</span>
          </span>
        )}
        {videoDimensions && (
          <span>
            <span style={previewStyles.metadataLabel}>Dimensions </span>
            <span style={previewStyles.metadataValue}>{videoDimensions.width}x{videoDimensions.height}</span>
          </span>
        )}
        <span>
          <span style={previewStyles.metadataLabel}>Type </span>
          <span style={previewStyles.metadataValue}>{mediaType}</span>
        </span>
        <span style={{ marginLeft: 'auto' }}>
          <button
            onClick={onClose}
            style={{
              padding: '2px 8px',
              fontSize: 11,
              fontWeight: 500,
              border: `1px solid ${colors.border}`,
              borderRadius: 4,
              cursor: 'pointer',
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              fontFamily: fonts.sans,
            }}
          >
            Back to composition
          </button>
        </span>
      </div>

      {/* Media preview */}
      <div style={{ ...previewStyles.playerWrapper, alignItems: 'center' }}>
        {mediaType === 'image' && (
          <img
            key={asset.path}
            src={url}
            alt={asset.name}
            onLoad={(e) => {
              const img = e.currentTarget;
              setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 4,
            }}
          />
        )}
        {mediaType === 'video' && (
          <video
            key={asset.path}
            ref={videoRef}
            src={url}
            controls
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setVideoDimensions({ width: v.videoWidth, height: v.videoHeight });
            }}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              borderRadius: 4,
              backgroundColor: '#000',
            }}
          />
        )}
        {mediaType === 'audio' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
            <div style={{ fontSize: 48 }}>{'\u{1F3B5}'}</div>
            <div style={{ fontSize: 14, color: colors.textPrimary, fontWeight: 500 }}>{asset.name}</div>
            <audio
              key={asset.path}
              src={url}
              controls
              style={{ width: 400, maxWidth: '100%' }}
            />
          </div>
        )}
        {mediaType === 'unknown' && (
          <div style={{ textAlign: 'center', color: colors.textSecondary }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{'\u{1F4CE}'}</div>
            <div style={{ fontSize: 14 }}>No preview available for this file type</div>
            <div style={{ fontSize: 12, fontFamily: fonts.mono, marginTop: 8, color: colors.textPrimary }}>
              {asset.name}
            </div>
          </div>
        )}
      </div>

      {/* Path info bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        backgroundColor: colors.surface,
        borderRadius: 8,
        fontSize: 12,
      }}>
        <span style={{ fontFamily: fonts.mono, color: colors.textSecondary }}>
          staticFile(<span style={{ color: colors.accent }}>'{asset.path}'</span>)
        </span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`staticFile('${asset.path}')`).catch(() => {});
          }}
          style={{
            padding: '3px 10px',
            fontSize: 11,
            fontWeight: 500,
            border: `1px solid ${colors.border}`,
            borderRadius: 4,
            cursor: 'pointer',
            backgroundColor: 'transparent',
            color: colors.textSecondary,
            fontFamily: fonts.sans,
          }}
        >
          Copy
        </button>
      </div>
    </div>
  );
};
