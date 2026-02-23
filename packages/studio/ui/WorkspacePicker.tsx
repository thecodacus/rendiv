import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createRoot } from 'react-dom/client';

// Desaturated dark theme — matching Studio's styles.ts
const colors = {
  bg: '#0e0e12',
  surface: '#161619',
  surfaceHover: '#1e1e22',
  border: 'rgba(255,255,255,0.06)',
  textPrimary: '#e0e0e0',
  textSecondary: '#6b6b78',
  accent: '#00d4ff',
  accentMuted: '#0088cc',
  badge: '#28c840',
  error: '#f85149',
  warning: '#d4a017',
};

const fonts = {
  sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", "SF Mono", "Fira Code", Consolas, "Liberation Mono", Menlo, monospace',
};

interface WorkspaceProject {
  name: string;
  path: string;
  hasNodeModules: boolean;
  entryPoint: string;
}

const WorkspacePicker: React.FC = () => {
  const [projects, setProjects] = useState<WorkspaceProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [createError, setCreateError] = useState('');
  const [createStatus, setCreateStatus] = useState('');
  const [switching, setSwitching] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch('/__rendiv_api__/workspace/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
      }
    } catch {
      // retry silently
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenProject = useCallback(async (project: WorkspaceProject) => {
    if (!project.hasNodeModules) return;
    setSwitching(project.name);
    try {
      await fetch('/__rendiv_api__/workspace/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: project.path }),
      });
      // Server will restart, browser will auto-reconnect via Vite HMR
    } catch {
      setSwitching(null);
    }
  }, []);

  const handleCreateProject = useCallback(async () => {
    const name = newProjectName.trim();
    if (!name) return;

    setCreateError('');
    setCreateStatus('Creating project...');

    try {
      const res = await fetch('/__rendiv_api__/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || 'Failed to create project');
        setCreateStatus('');
        return;
      }

      setCreateStatus('');
      setNewProjectName('');
      setCreating(false);
      await fetchProjects();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Failed to create project');
      setCreateStatus('');
    }
  }, [newProjectName, fetchProjects]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateProject();
    if (e.key === 'Escape') {
      setCreating(false);
      setNewProjectName('');
      setCreateError('');
      setCreateStatus('');
    }
  }, [handleCreateProject]);

  useEffect(() => {
    if (creating && inputRef.current) {
      inputRef.current.focus();
    }
  }, [creating]);

  return (
    <div style={rootStyle}>
      <style dangerouslySetInnerHTML={{ __html: globalCSS }} />

      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <svg width="28" height="28" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="6" y="8" width="26" height="20" rx="3" stroke={colors.accent} strokeWidth="2" opacity="0.35"/>
            <rect x="12" y="14" width="26" height="20" rx="3" stroke={colors.accent} strokeWidth="2"/>
            <polygon points="12,34 30,14 38,14 38,34" fill={colors.accent} opacity="0.25"/>
            <path d="M22 20L30 24L22 28Z" fill={colors.accent}/>
          </svg>
          <span style={{ fontSize: 18, fontWeight: 600, color: colors.textPrimary }}>Rendiv Studio</span>
        </div>
        <span style={{ fontSize: 13, color: colors.textSecondary, fontFamily: fonts.mono }}>Workspace</span>
      </div>

      {/* Content */}
      <div style={contentStyle}>
        {loading ? (
          <div style={emptyStateStyle}>
            <span style={{ color: colors.textSecondary }}>Loading projects...</span>
          </div>
        ) : (
          <>
            <div style={titleRowStyle}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: colors.textPrimary, margin: 0 }}>
                Projects
              </h2>
              {!creating && (
                <button
                  style={newButtonStyle}
                  onClick={() => setCreating(true)}
                >
                  + New Project
                </button>
              )}
            </div>

            {/* Create project form */}
            {creating && (
              <div style={createFormStyle}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="project-name"
                    value={newProjectName}
                    onChange={(e) => {
                      setNewProjectName(e.target.value);
                      setCreateError('');
                    }}
                    onKeyDown={handleKeyDown}
                    style={inputStyle}
                    disabled={!!createStatus}
                  />
                  <button
                    style={{
                      ...actionButtonStyle,
                      opacity: newProjectName.trim() && !createStatus ? 1 : 0.5,
                    }}
                    onClick={handleCreateProject}
                    disabled={!newProjectName.trim() || !!createStatus}
                  >
                    {createStatus || 'Create'}
                  </button>
                  <button
                    style={cancelButtonStyle}
                    onClick={() => {
                      setCreating(false);
                      setNewProjectName('');
                      setCreateError('');
                      setCreateStatus('');
                    }}
                    disabled={!!createStatus}
                  >
                    Cancel
                  </button>
                </div>
                {createError && (
                  <div style={{ color: colors.error, fontSize: 12, marginTop: 6 }}>{createError}</div>
                )}
              </div>
            )}

            {/* Project grid */}
            {projects.length === 0 && !creating ? (
              <div style={emptyStateStyle}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 16, opacity: 0.3 }}>🎬</div>
                  <div style={{ color: colors.textSecondary, fontSize: 14, marginBottom: 16 }}>
                    No projects yet
                  </div>
                  <button
                    style={newButtonStyle}
                    onClick={() => setCreating(true)}
                  >
                    Create your first project
                  </button>
                </div>
              </div>
            ) : (
              <div style={gridStyle}>
                {projects.map((project) => (
                  <div
                    key={project.name}
                    style={{
                      ...cardStyle,
                      cursor: project.hasNodeModules ? 'pointer' : 'default',
                      opacity: switching && switching !== project.name ? 0.5 : 1,
                    }}
                    onClick={() => handleOpenProject(project)}
                    onMouseEnter={(e) => {
                      if (project.hasNodeModules) {
                        e.currentTarget.style.backgroundColor = colors.surfaceHover;
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <svg width="20" height="20" viewBox="0 0 16 16" fill={colors.accent}>
                        <path d="M1.75 1A1.75 1.75 0 0 0 0 2.75v10.5C0 14.216.784 15 1.75 15h12.5A1.75 1.75 0 0 0 16 13.25v-8.5A1.75 1.75 0 0 0 14.25 3H7.5a.25.25 0 0 1-.2-.1l-.9-1.2C6.07 1.26 5.55 1 5 1H1.75Z"/>
                      </svg>
                      <span style={{ fontSize: 14, fontWeight: 600, color: colors.textPrimary }}>
                        {project.name}
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono, marginTop: 8 }}>
                      {project.entryPoint}
                    </div>

                    <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                      {project.hasNodeModules ? (
                        <>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.badge }} />
                          <span style={{ fontSize: 11, color: colors.textSecondary }}>Ready</span>
                        </>
                      ) : (
                        <>
                          <div style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#d4a017' }} />
                          <span style={{ fontSize: 11, color: '#d4a017' }}>Missing node_modules</span>
                        </>
                      )}
                    </div>

                    {switching === project.name && (
                      <div style={{ marginTop: 8, fontSize: 11, color: colors.accent }}>
                        Opening...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Styles ---

const globalCSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.08) transparent;
}
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
`;

const rootStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100vh',
  backgroundColor: colors.bg,
  color: colors.textPrimary,
  fontFamily: fonts.sans,
  fontSize: 13,
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  height: 48,
  padding: '0 24px',
  backgroundColor: colors.surface,
  flexShrink: 0,
};

const contentStyle: React.CSSProperties = {
  flex: 1,
  overflow: 'auto',
  padding: '32px 48px',
  maxWidth: 960,
  margin: '0 auto',
  width: '100%',
};

const titleRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
};

const emptyStateStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 300,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
  gap: 16,
};

const cardStyle: React.CSSProperties = {
  padding: 16,
  background: 'linear-gradient(170deg, #161619 0%, #111114 100%)',
  border: 'none',
  borderRadius: 12,
  boxShadow: '0 4px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.03)',
  transition: 'background-color 0.15s',
};

const newButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: 'linear-gradient(135deg, #0088cc 0%, #00b8d9 100%)',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: fonts.sans,
  boxShadow: '0 0 12px rgba(0,212,255,0.25)',
};

const createFormStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: colors.surface,
  borderRadius: 8,
  marginBottom: 20,
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  fontSize: 13,
  fontFamily: fonts.mono,
  backgroundColor: colors.bg,
  color: colors.textPrimary,
  border: 'none',
  borderRadius: 6,
  outline: 'none',
};

const actionButtonStyle: React.CSSProperties = {
  padding: '8px 16px',
  fontSize: 13,
  fontWeight: 600,
  color: '#fff',
  background: 'linear-gradient(135deg, #0088cc 0%, #00b8d9 100%)',
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: fonts.sans,
  whiteSpace: 'nowrap',
  boxShadow: '0 0 12px rgba(0,212,255,0.25)',
};

const cancelButtonStyle: React.CSSProperties = {
  padding: '8px 12px',
  fontSize: 13,
  fontWeight: 500,
  color: colors.textSecondary,
  backgroundColor: colors.surfaceHover,
  border: 'none',
  borderRadius: 6,
  cursor: 'pointer',
  fontFamily: fonts.sans,
};

// --- Mount function ---

export function createWorkspaceApp(container: HTMLElement | null): void {
  if (!container) {
    throw new Error('Rendiv Studio: Could not find #root element');
  }
  createRoot(container).render(<WorkspacePicker />);
}
