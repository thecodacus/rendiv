import React, { useState, useCallback, useEffect, useRef, type CSSProperties } from 'react';
import type { CompositionEntry } from '@rendiv/core';
import { colors, fonts, buttonStyles, inputStyles, panelStyles, sectionLabelStyle } from './styles';

export interface RenderSettings {
  renderType: 'video' | 'still';
  codec: 'mp4' | 'webm';
  outputPath: string;
  crf: number;
  concurrency: number;
  imageFormat: 'png' | 'jpeg';
  encodingPreset?: string;
  videoEncoder?: string;
  gl: 'swiftshader' | 'egl' | 'angle';
  profiling: boolean;
  frame: number;
}

interface RenderSettingsModalProps {
  composition: CompositionEntry;
  inputProps: Record<string, unknown>;
  currentFrame?: number;
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
  currentFrame: currentPlayheadFrame = 0,
  onSubmit,
  onClose,
}) => {
  const isStillComposition = composition.type === 'still';
  const defaultRenderType = isStillComposition ? 'still' : 'video';
  const defaultExt = isStillComposition ? 'png' : 'mp4';

  const [renderType, setRenderType] = useState<'video' | 'still'>(defaultRenderType);
  const [codec, setCodec] = useState<'mp4' | 'webm'>('mp4');
  const [outputPath, setOutputPath] = useState(`out/${composition.id}.${defaultExt}`);
  const [crf, setCrf] = useState(18);
  const [concurrency, setConcurrency] = useState(4);
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('jpeg');
  const [encodingPreset, setEncodingPreset] = useState('');
  const [videoEncoder, setVideoEncoder] = useState('');
  const [gl, setGl] = useState<'swiftshader' | 'egl' | 'angle'>('angle');
  const [profiling, setProfiling] = useState(true);
  const [frame, setFrame] = useState(isStillComposition ? 0 : currentPlayheadFrame);
  const modalRef = useRef<HTMLDivElement>(null);

  const isStill = renderType === 'still';

  // Update output path extension when render type, codec, or image format changes
  const handleRenderTypeChange = useCallback((type: 'video' | 'still') => {
    setRenderType(type);
    setOutputPath(prev => {
      const base = prev.replace(/\.[^.]+$/, '');
      if (type === 'still') {
        return `${base}.${imageFormat === 'jpeg' ? 'jpeg' : 'png'}`;
      }
      return `${base}.${codec === 'webm' ? 'webm' : 'mp4'}`;
    });
  }, [imageFormat, codec]);

  const handleCodecChange = useCallback((newCodec: 'mp4' | 'webm') => {
    setCodec(newCodec);
    setOutputPath(prev => {
      const ext = newCodec === 'webm' ? '.webm' : '.mp4';
      return prev.replace(/\.(mp4|webm)$/, ext);
    });
  }, []);

  const handleImageFormatChange = useCallback((newFormat: 'png' | 'jpeg') => {
    setImageFormat(newFormat);
    if (renderType === 'still') {
      setOutputPath(prev => {
        const base = prev.replace(/\.[^.]+$/, '');
        return `${base}.${newFormat}`;
      });
    }
  }, [renderType]);

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
      renderType,
      codec,
      outputPath,
      crf,
      concurrency,
      imageFormat,
      encodingPreset: encodingPreset || undefined,
      videoEncoder: videoEncoder || undefined,
      gl,
      profiling,
      frame,
    });
  }, [renderType, codec, outputPath, crf, concurrency, imageFormat, encodingPreset, videoEncoder, gl, profiling, frame, onSubmit]);

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
          {/* Render Type Toggle */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Render Type</span>
            <div style={{ display: 'flex', gap: 0, borderRadius: 6, overflow: 'hidden', border: `1px solid ${colors.border}` }}>
              <button
                type="button"
                onClick={() => handleRenderTypeChange('video')}
                style={{
                  ...toggleButtonStyle,
                  ...(renderType === 'video' ? toggleActiveStyle : {}),
                }}
              >
                Video
              </button>
              <button
                type="button"
                onClick={() => handleRenderTypeChange('still')}
                style={{
                  ...toggleButtonStyle,
                  ...(renderType === 'still' ? toggleActiveStyle : {}),
                }}
              >
                Still Frame
              </button>
            </div>
          </div>

          {/* Still Frame Number */}
          {isStill && (
            <div style={sectionStyle}>
              <span style={sectionLabelStyle}>Frame</span>
              <div style={fieldRowStyle}>
                <label style={labelStyle}>Frame Number</label>
                <input
                  type="number"
                  min={0}
                  max={composition.durationInFrames - 1}
                  value={frame}
                  onChange={e => setFrame(Math.max(0, Math.min(composition.durationInFrames - 1, Number(e.target.value))))}
                  style={{ ...inputStyles.text, width: 80, fontSize: 12, textAlign: 'center' }}
                />
                <span style={{ fontSize: 11, color: colors.textSecondary }}>
                  0 – {composition.durationInFrames - 1}
                </span>
              </div>
            </div>
          )}

          {/* Output Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Output</span>
            {!isStill && (
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
            )}
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Output Path</label>
              <input
                type="text"
                value={outputPath}
                onChange={e => setOutputPath(e.target.value)}
                style={{ ...inputStyles.text, flex: 1, fontSize: 12 }}
              />
            </div>
            <div style={fieldRowStyle}>
              <label style={labelStyle}>Image Format</label>
              <select
                value={imageFormat}
                onChange={e => handleImageFormatChange(e.target.value as 'png' | 'jpeg')}
                style={selectStyle}
              >
                {imageFormatOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Quality & Encoding — video only */}
          {!isStill && (
            <>
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
            </>
          )}

          {/* Performance Section */}
          <div style={sectionStyle}>
            <span style={sectionLabelStyle}>Performance</span>
            {!isStill && (
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
            )}
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
            {!isStill && (
              <div style={fieldRowStyle}>
                <label style={labelStyle}>Profiling</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={profiling}
                    onChange={e => setProfiling(e.target.checked)}
                    style={{ margin: 0 }}
                  />
                  <span style={{ fontSize: 12, color: colors.textSecondary }}>
                    Show per-frame timing breakdown
                  </span>
                </label>
              </div>
            )}
          </div>
        </div>

        <div style={footerStyle}>
          <button type="button" style={buttonStyles.secondary} onClick={onClose}>
            Cancel
          </button>
          <button type="button" style={buttonStyles.primary} onClick={handleSubmit}>
            {isStill ? 'Render Still' : 'Start Render'}
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

const toggleButtonStyle: CSSProperties = {
  flex: 1,
  padding: '6px 12px',
  fontSize: 12,
  fontWeight: 500,
  border: 'none',
  cursor: 'pointer',
  backgroundColor: colors.surfaceHover,
  color: colors.textSecondary,
  fontFamily: fonts.sans,
};

const toggleActiveStyle: CSSProperties = {
  backgroundColor: colors.accent,
  color: '#ffffff',
};
