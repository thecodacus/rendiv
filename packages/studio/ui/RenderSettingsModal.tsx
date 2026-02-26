import React, { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import type { CompositionEntry } from '@rendiv/core';
import { colors, fonts, buttonStyles, inputStyles, panelStyles, sectionLabelStyle } from './styles';

export interface RenderSettings {
  codec: 'mp4' | 'webm';
  outputPath: string;
  crf: number;
  concurrency: number;
  imageFormat: 'png' | 'jpeg';
  encodingPreset?: string;
  videoEncoder?: string;
  gl: 'swiftshader' | 'egl' | 'angle';
}

interface RenderSettingsModalProps {
  composition: CompositionEntry;
  inputProps: Record<string, unknown>;
  onSubmit: (settings: RenderSettings) => void;
  onClose: () => void;
}

const codecOptions: Array<{ value: 'mp4' | 'webm'; label: string }> = [
  { value: 'mp4', label: 'MP4 (H.264)' },
  { value: 'webm', label: 'WebM (VP9)' },
];

const imageFormatOptions: Array<{ value: 'png' | 'jpeg'; label: string }> = [
  { value: 'png', label: 'PNG (lossless)' },
  { value: 'jpeg', label: 'JPEG (faster)' },
];

const presetOptions: Array<{ value: string; label: string }> = [
  { value: '', label: '(default)' },
  { value: 'ultrafast', label: 'ultrafast' },
  { value: 'fast', label: 'fast' },
  { value: 'medium', label: 'medium' },
  { value: 'slow', label: 'slow' },
  { value: 'veryslow', label: 'veryslow' },
];

const encoderOptions: Array<{ value: string; label: string }> = [
  { value: '', label: '(auto)' },
  { value: 'libx264', label: 'libx264 (CPU)' },
  { value: 'h264_videotoolbox', label: 'VideoToolbox (macOS GPU)' },
  { value: 'h264_nvenc', label: 'NVENC (NVIDIA GPU)' },
];

const glOptions: Array<{ value: 'swiftshader' | 'egl' | 'angle'; label: string }> = [
  { value: 'swiftshader', label: 'SwiftShader (CPU)' },
  { value: 'egl', label: 'EGL (GPU)' },
  { value: 'angle', label: 'ANGLE' },
];

export const RenderSettingsModal: React.FC<RenderSettingsModalProps> = React.memo(({
  composition,
  inputProps,
  onSubmit,
  onClose,
}) => {
  const [codec, setCodec] = useState<'mp4' | 'webm'>('mp4');
  const [outputPath, setOutputPath] = useState(`out/${composition.id}.mp4`);
  const [crf, setCrf] = useState(18);
  const [concurrency, setConcurrency] = useState(1);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [encodingPreset, setEncodingPreset] = useState('');
  const [videoEncoder, setVideoEncoder] = useState('');
  const [gl, setGl] = useState<'swiftshader' | 'egl' | 'angle'>('swiftshader');
  const modalRef = useRef<HTMLDivElement>(null);

  // Update output path extension when codec changes
  const handleCodecChange = useCallback((newCodec: 'mp4' | 'webm') => {
    setCodec(newCodec);
    setOutputPath(prev => {
      const ext = newCodec === 'webm' ? '.webm' : '.mp4';
      return prev.replace(/\.(mp4|webm)$/, ext);
    });
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Close on backdrop click
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  const handleSubmit = useCallback(() => {
    onSubmit({
      codec,
      outputPath,
      crf,
      concurrency,
      imageFormat,
      encodingPreset: encodingPreset || undefined,
      videoEncoder: videoEncoder || undefined,
      gl,
    });
  }, [codec, outputPath, crf, concurrency, imageFormat, encodingPreset, videoEncoder, gl, onSubmit]);

  return (
    <div style={backdropStyle} onClick={handleBackdropClick}>
      <div ref={modalRef} style={modalStyle}>
        <div style={headerStyle}>
          <span style={{ fontSize: 15, fontWeight: 600 }}>Render Settings</span>
          <span style={{ fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono }}>
            {composition.id}
          </span>
        </div>

        <div style={bodyStyle}>
          {/* Output Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Output</span>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Codec</label>
              <select
                value={codec}
                onChange={e => handleCodecChange(e.target.value as 'mp4' | 'webm')}
                style={selectStyle}
              >
                {codecOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Output Path</label>
              <input
                type="text"
                value={outputPath}
                onChange={e => setOutputPath(e.target.value)}
                style={{ ...inputStyles.text, flex: 1, fontSize: 12 }}
              />
            </div>
          </div>

          {/* Quality Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Quality</span>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>CRF</label>
              <input
                type="number"
                min={0}
                max={51}
                value={crf}
                onChange={e => setCrf(Number(e.target.value))}
                style={{ ...inputStyles.text, width: 64, fontSize: 12, textAlign: 'center' }}
              />
              <span style={{ fontSize: 11, color: colors.textSecondary }}>0 (best) – 51 (worst)</span>
            </div>
          </div>

          {/* Encoding Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Encoding</span>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Video Encoder</label>
              <select
                value={videoEncoder}
                onChange={e => setVideoEncoder(e.target.value)}
                style={selectStyle}
              >
                {encoderOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Preset</label>
              <select
                value={encodingPreset}
                onChange={e => setEncodingPreset(e.target.value)}
                style={selectStyle}
              >
                {presetOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Performance Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Performance</span>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Concurrency</label>
              <input
                type="number"
                min={1}
                max={16}
                value={concurrency}
                onChange={e => setConcurrency(Math.max(1, Number(e.target.value)))}
                style={{ ...inputStyles.text, width: 64, fontSize: 12, textAlign: 'center' }}
              />
              <span style={{ fontSize: 11, color: colors.textSecondary }}>parallel browser tabs</span>
            </div>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Frame Format</label>
              <select
                value={imageFormat}
                onChange={e => setImageFormat(e.target.value as 'png' | 'jpeg')}
                style={selectStyle}
              >
                {imageFormatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>GL Renderer</label>
              <select
                value={gl}
                onChange={e => setGl(e.target.value as 'swiftshader' | 'egl' | 'angle')}
                style={selectStyle}
              >
                {glOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={footerStyle}>
          <button type="button" style={buttonStyles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={buttonStyles.primary} onClick={handleSubmit}>
            Start Render
          </button>
        </div>
      </div>
    </div>
  );
});

RenderSettingsModal.displayName = 'RenderSettingsModal';

// --- Styles ---

const backdropStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 200,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  WebkitBackdropFilter: 'blur(4px)' as unknown as string,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const modalStyle: CSSProperties = {
  ...panelStyles.card,
  width: 480,
  maxWidth: '90vw',
  maxHeight: '85vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '16px 20px',
  borderBottom: `1px solid ${colors.border}`,
  color: colors.textPrimary,
  fontFamily: fonts.sans,
};

const bodyStyle: CSSProperties = {
  padding: '12px 20px',
  overflowY: 'auto',
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

const footerStyle: CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: 8,
  padding: '12px 20px',
  borderTop: `1px solid ${colors.border}`,
};

const sectionStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const fieldRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
};

const labelStyle: CSSProperties = {
  fontSize: 12,
  color: colors.textSecondary,
  fontFamily: fonts.sans,
  width: 100,
  flexShrink: 0,
};

const selectStyle: CSSProperties = {
  ...inputStyles.text,
  fontSize: 12,
  padding: '6px 10px',
  flex: 1,
  appearance: 'auto' as CSSProperties['appearance'],
};
