import React, { useCallback } from 'react';
import { colors, fonts } from './styles';

export type RenderJobStatus = 'queued' | 'bundling' | 'rendering' | 'encoding' | 'done' | 'error' | 'cancelled';

export interface RenderJob {
  id: string;
  compositionId: string;
  compositionName: string;
  codec: 'mp4' | 'webm';
  outputPath: string;
  inputProps: Record<string, unknown>;
  status: RenderJobStatus;
  progress: number;
  renderedFrames: number;
  totalFrames: number;
  error?: string;
}

interface RenderQueueProps {
  jobs: RenderJob[];
  open: boolean;
  onToggle: () => void;
  onCancel: (jobId: string) => void;
  onRemove: (jobId: string) => void;
  onClear: () => void;
}

function statusLabel(job: RenderJob): string {
  switch (job.status) {
    case 'queued':
      return 'Queued';
    case 'bundling':
      return 'Bundling...';
    case 'rendering':
      return `Rendering ${job.renderedFrames}/${job.totalFrames}`;
    case 'encoding':
      return 'Encoding...';
    case 'done':
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

export const RenderQueue: React.FC<RenderQueueProps> = ({
  jobs,
  open,
  onToggle,
  onCancel,
  onRemove,
  onClear,
}) => {
  const activeCount = jobs.filter((j) => j.status === 'queued' || j.status === 'bundling' || j.status === 'rendering' || j.status === 'encoding').length;
  const hasFinished = jobs.some((j) => j.status === 'done' || j.status === 'error' || j.status === 'cancelled');

  const handleCancel = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onCancel(jobId);
  }, [onCancel]);

  const handleRemove = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onRemove(jobId);
  }, [onRemove]);

  if (!open) return null;

  return (
    <div style={panelStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={{ fontWeight: 600, fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
          Render Queue
          {activeCount > 0 && (
            <span style={{ marginLeft: 6, color: colors.accent, fontWeight: 600 }}>
              ({activeCount})
            </span>
          )}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {hasFinished && (
            <button
              type="button"
              style={clearBtnStyle}
              onClick={onClear}
              title="Clear finished jobs"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            style={closeBtnStyle}
            onClick={onToggle}
            title="Close panel"
          >
            {'\u2715'}
          </button>
        </div>
      </div>

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
                    <button
                      type="button"
                      style={cancelBtnStyle}
                      onClick={(e) => handleRemove(e, job.id)}
                      title="Remove"
                    >
                      {'\u2715'}
                    </button>
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

const panelStyle: React.CSSProperties = {
  width: 300,
  minWidth: 300,
  height: '100%',
  backgroundColor: colors.surface,
  borderLeft: `1px solid ${colors.border}`,
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  color: colors.textSecondary,
  borderBottom: `1px solid ${colors.border}`,
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
  backgroundColor: colors.border,
  borderRadius: 2,
  overflow: 'hidden',
};

const progressBarStyle: React.CSSProperties = {
  height: '100%',
  borderRadius: 2,
  transition: 'width 0.3s ease',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: colors.textSecondary,
  cursor: 'pointer',
  fontSize: 12,
  padding: '2px 4px',
};

const clearBtnStyle: React.CSSProperties = {
  background: 'none',
  border: `1px solid ${colors.border}`,
  color: colors.textSecondary,
  cursor: 'pointer',
  fontSize: 10,
  padding: '2px 8px',
  borderRadius: 4,
  fontFamily: fonts.sans,
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
