import React, { useCallback } from 'react';
import { colors, fonts } from './styles';

export type RenderJobStatus = 'queued' | 'bundling' | 'rendering' | 'encoding' | 'done' | 'error' | 'cancelled';

export interface RenderProfilePhase {
  avgMs: number;
  maxMs: number;
  totalMs: number;
}

export interface RenderJobProfile {
  totalFrames: number;
  totalTimeMs: number;
  avgFrameTimeMs: number;
  phases: {
    setFrame: RenderProfilePhase;
    waitForHolds: RenderProfilePhase;
    screenshot: RenderProfilePhase;
  };
  bottleneck: string;
  framesPerSecond: number;
}

export interface RenderJob {
  id: string;
  compositionId: string;
  compositionName: string;
  renderType?: 'video' | 'still';
  codec: 'mp4' | 'webm';
  outputPath: string;
  inputProps: Record<string, unknown>;
  status: RenderJobStatus;
  progress: number;
  renderedFrames: number;
  totalFrames: number;
  error?: string;
  frame?: number;
  avgFrameTimeMs?: number;
  estimatedRemainingMs?: number;
  profile?: RenderJobProfile;
}

interface RenderQueueProps {
  jobs: RenderJob[];
  onCancel: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onDownload: (jobId: string) => void;
  onClear: () => void;
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (minutes < 60) return `${minutes}m ${secs}s`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

function statusLabel(job: RenderJob): string {
  const isStill = job.renderType === 'still';
  switch (job.status) {
    case 'queued':
      return 'Queued';
    case 'bundling':
      return 'Bundling...';
    case 'rendering': {
      if (isStill) return `Rendering still \u00b7 frame ${job.frame ?? 0}`;
      let label = `Rendering ${job.renderedFrames}/${job.totalFrames}`;
      if (job.avgFrameTimeMs != null) {
        label += ` \u00b7 ~${Math.round(job.avgFrameTimeMs)}ms/frame`;
      }
      if (job.estimatedRemainingMs != null && job.estimatedRemainingMs > 0) {
        label += ` \u00b7 ETA ${formatDuration(job.estimatedRemainingMs)}`;
      }
      return label;
    }
    case 'encoding':
      return 'Encoding...';
    case 'done':
      if (isStill) return `Still \u00b7 frame ${job.frame ?? 0}`;
      return 'Done';
    case 'error':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
  }
}

function statusColor(status: RenderJobStatus): string {
  switch (status) {
    case 'done':
      return colors.badge;
    case 'error':
      return colors.error;
    case 'cancelled':
      return colors.textSecondary;
    default:
      return colors.accent;
  }
}

function overallProgress(job: RenderJob): number {
  if (job.renderType === 'still') {
    switch (job.status) {
      case 'queued': return 0;
      case 'bundling': return job.progress * 0.3;
      case 'rendering': return 0.3 + job.progress * 0.7;
      case 'done': return 1;
      default: return 0;
    }
  }
  switch (job.status) {
    case 'queued':
      return 0;
    case 'bundling':
      return job.progress * 0.1;
    case 'rendering':
      return 0.1 + job.progress * 0.8;
    case 'encoding':
      return 0.9;
    case 'done':
      return 1;
    default:
      return 0;
  }
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'setFrame': return 'React render';
    case 'waitForHolds': return 'Wait for holds';
    case 'screenshot': return 'Screenshot';
    default: return phase;
  }
}

function ProfileSummary({ profile }: { profile: RenderJobProfile }) {
  const totalPhaseTime = profile.phases.setFrame.avgMs + profile.phases.waitForHolds.avgMs + profile.phases.screenshot.avgMs;

  const phases = [
    { key: 'setFrame', ...profile.phases.setFrame },
    { key: 'waitForHolds', ...profile.phases.waitForHolds },
    { key: 'screenshot', ...profile.phases.screenshot },
  ];

  return (
    <div style={{
      fontSize: 10,
      color: colors.textSecondary,
      marginBottom: 4,
      padding: '4px 6px',
      backgroundColor: colors.surfaceHover,
      borderRadius: 4,
      fontFamily: fonts.mono,
      lineHeight: 1.6,
    }}>
      <div style={{ marginBottom: 2 }}>
        {profile.totalFrames} frames in {formatDuration(profile.totalTimeMs)} ({profile.framesPerSecond.toFixed(1)} fps)
      </div>
      {phases.map((p) => {
        const pct = totalPhaseTime > 0 ? Math.round((p.avgMs / totalPhaseTime) * 100) : 0;
        const isBottleneck = p.key === profile.bottleneck;
        return (
          <div key={p.key} style={{ color: isBottleneck ? colors.warning : colors.textSecondary }}>
            {phaseLabel(p.key)}: {Math.round(p.avgMs)}ms ({pct}%){isBottleneck ? ' \u2190 bottleneck' : ''}
          </div>
        );
      })}
    </div>
  );
}

export const RenderQueue: React.FC<RenderQueueProps> = ({
  jobs,
  onCancel,
  onRemove,
  onDownload,
  onClear,
}) => {
  const hasFinished = jobs.some((j) => j.status === 'done' || j.status === 'error' || j.status === 'cancelled');

  const handleCancel = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onCancel(jobId);
  }, [onCancel]);

  const handleRemove = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onRemove(jobId);
  }, [onRemove]);

  const handleDownload = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onDownload(jobId);
  }, [onDownload]);

  return (
    <div style={contentStyle}>
      {/* Actions bar */}
      {hasFinished && (
        <div style={actionsBarStyle}>
          <button
            type="button"
            style={clearBtnStyle}
            onClick={onClear}
            title="Clear finished jobs"
          >
            Clear finished
          </button>
        </div>
      )}

      {/* Job list */}
      <div style={listStyle}>
        {jobs.length === 0 ? (
          <div style={emptyStyle}>
            No render jobs
          </div>
        ) : (
          jobs.map((job) => {
            const isActive = job.status === 'bundling' || job.status === 'rendering' || job.status === 'encoding';
            const isQueued = job.status === 'queued';
            const isDone = job.status === 'done' || job.status === 'error' || job.status === 'cancelled';
            const progress = overallProgress(job);

            return (
              <div key={job.id} style={jobStyle}>
                {/* Job info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 500, color: colors.textPrimary }}>
                    {job.compositionName}
                  </span>
                  {(isActive || isQueued) && (
                    <button
                      type="button"
                      style={cancelBtnStyle}
                      onClick={(e) => handleCancel(e, job.id)}
                      title="Cancel"
                    >
                      {'\u2715'}
                    </button>
                  )}
                  {isDone && (
                    <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {job.status === 'done' && (
                        <button
                          type="button"
                          style={downloadBtnStyle}
                          onClick={(e) => handleDownload(e, job.id)}
                          title="Download"
                        >
                          {'\u2913'}
                        </button>
                      )}
                      <button
                        type="button"
                        style={cancelBtnStyle}
                        onClick={(e) => handleRemove(e, job.id)}
                        title="Remove"
                      >
                        {'\u2715'}
                      </button>
                    </span>
                  )}
                </div>

                {/* Status line */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: statusColor(job.status) }}>
                    {statusLabel(job)}
                  </span>
                  <span style={{ fontSize: 10, color: colors.textSecondary, fontFamily: fonts.mono }}>
                    {job.outputPath}
                  </span>
                </div>

                {/* Error message */}
                {job.status === 'error' && job.error && (
                  <div style={{ fontSize: 10, color: colors.error, marginBottom: 4, wordBreak: 'break-all' as const }}>
                    {job.error}
                  </div>
                )}

                {/* Profiling summary */}
                {job.status === 'done' && job.profile && (
                  <ProfileSummary profile={job.profile} />
                )}

                {/* Progress bar */}
                {(isActive || isQueued) && (
                  <div style={progressTrackStyle}>
                    <div
                      style={{
                        ...progressBarStyle,
                        width: `${progress * 100}%`,
                        backgroundColor: isQueued ? colors.textSecondary : colors.accent,
                      }}
                    />
                  </div>
                )}

                {/* Done indicator */}
                {job.status === 'done' && (
                  <div style={progressTrackStyle}>
                    <div style={{ ...progressBarStyle, width: '100%', backgroundColor: colors.badge }} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Styles

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  overflow: 'hidden',
};

const actionsBarStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  padding: '6px 8px',
  flexShrink: 0,
};

const listStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 8,
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: 80,
  color: colors.textSecondary,
  fontSize: 12,
};

const jobStyle: React.CSSProperties = {
  padding: '10px 12px',
  backgroundColor: colors.bg,
  borderRadius: 6,
  marginBottom: 6,
};

const progressTrackStyle: React.CSSProperties = {
  height: 3,
  backgroundColor: colors.surfaceHover,
  borderRadius: 2,
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.3s ease',
};

const clearBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textSecondary,
  cursor: 'pointer',
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 4,
  fontFamily: fonts.sans,
  backgroundColor: colors.surfaceHover,
};

const downloadBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.badge,
  cursor: 'pointer',
  fontSize: 13,
  padding: '2px 4px',
  lineHeight: 1,
};

const cancelBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textSecondary,
  cursor: 'pointer',
  fontSize: 10,
  padding: '2px 4px',
  lineHeight: 1,
};
