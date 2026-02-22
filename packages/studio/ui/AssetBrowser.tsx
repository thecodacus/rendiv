import React, { useState, useEffect, useCallback, useRef } from 'react';
import { colors, fonts } from './styles';

export interface AssetEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size: number;
  children?: AssetEntry[];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'bmp', 'ico'].includes(ext)) return '\u{1F5BC}';
  if (['mp4', 'webm', 'mov', 'avi', 'mkv'].includes(ext)) return '\u{1F3AC}';
  if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) return '\u{1F3B5}';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext)) return 'Aa';
  if (['json', 'srt', 'vtt', 'txt', 'csv'].includes(ext)) return '\u{1F4C4}';
  if (['lottie'].includes(ext)) return '\u2728';
  return '\u{1F4CE}';
}

function parentDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.substring(0, idx) : '';
}

// --- SVG icon components ---

const UploadIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 10V3" />
    <path d="M4.5 5.5L8 2l3.5 3.5" />
    <path d="M14 10v3a1 1 0 01-1 1H3a1 1 0 01-1-1v-3" />
  </svg>
);

const FolderPlusIcon: React.FC<{ size?: number }> = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4a1 1 0 011-1h3.5l1.5 2H13a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
    <path d="M8 7v4" />
    <path d="M6 9h4" />
  </svg>
);

// --- Context menu ---

interface ContextMenuState {
  x: number;
  y: number;
  entry: AssetEntry;
}

interface ContextMenuItem {
  label: string;
  action: () => void;
  danger?: boolean;
}

const ContextMenu: React.FC<{
  menu: ContextMenuState;
  items: ContextMenuItem[];
  onClose: () => void;
}> = ({ menu, items, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        left: menu.x,
        top: menu.y,
        zIndex: 100,
        backgroundColor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: 6,
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        padding: '4px 0',
        minWidth: 160,
      }}
    >
      {items.map((item) => (
        <ContextMenuButton key={item.label} item={item} onClose={onClose} />
      ))}
    </div>
  );
};

const ContextMenuButton: React.FC<{ item: ContextMenuItem; onClose: () => void }> = ({ item, onClose }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        padding: '6px 12px',
        fontSize: 12,
        cursor: 'pointer',
        color: item.danger ? colors.error : colors.textPrimary,
        backgroundColor: hovered ? colors.surfaceHover : 'transparent',
      }}
      onClick={() => { item.action(); onClose(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {item.label}
    </div>
  );
};

// --- Inline rename/create input ---

const InlineInput: React.FC<{
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  depth: number;
  placeholder?: string;
}> = ({ defaultValue, onSubmit, onCancel, depth, placeholder }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  return (
    <div style={{ padding: `4px 12px 4px ${22 + depth * 16}px` }}>
      <input
        ref={inputRef}
        defaultValue={defaultValue}
        placeholder={placeholder}
        style={{
          width: '100%',
          padding: '3px 6px',
          fontSize: 12,
          fontFamily: fonts.sans,
          backgroundColor: colors.bg,
          color: colors.textPrimary,
          border: `1px solid ${colors.accent}`,
          borderRadius: 4,
          outline: 'none',
          boxSizing: 'border-box',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            const val = (e.target as HTMLInputElement).value.trim();
            if (val) onSubmit(val);
            else onCancel();
          } else if (e.key === 'Escape') {
            onCancel();
          }
        }}
        onBlur={(e) => {
          const val = e.target.value.trim();
          if (val && val !== defaultValue) onSubmit(val);
          else onCancel();
        }}
      />
    </div>
  );
};

// --- FileNode ---

interface FileNodeProps {
  entry: AssetEntry;
  depth: number;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  copiedPath: string | null;
  onCopy: (path: string) => void;
  selectedPath: string | null;
  onSelect?: (entry: AssetEntry) => void;
  onContextMenu: (e: React.MouseEvent, entry: AssetEntry) => void;
  dragOverDir: string | null;
  onDragStart: (e: React.DragEvent, entry: AssetEntry) => void;
  onDirDragOver: (e: React.DragEvent, dirPath: string) => void;
  onDirDragLeave: () => void;
  onDirDrop: (e: React.DragEvent, dirPath: string) => void;
  renamingPath: string | null;
  onRenameSubmit: (oldPath: string, newName: string) => void;
  onRenameCancel: () => void;
  creatingFolderIn: string | null;
  onCreateFolderSubmit: (parentDir: string, name: string) => void;
  onCreateFolderCancel: () => void;
}

const FileNode: React.FC<FileNodeProps> = ({
  entry, depth, expandedDirs, onToggleDir, copiedPath, onCopy, selectedPath, onSelect,
  onContextMenu, dragOverDir, onDragStart, onDirDragOver, onDirDragLeave, onDirDrop,
  renamingPath, onRenameSubmit, onRenameCancel, creatingFolderIn, onCreateFolderSubmit, onCreateFolderCancel,
}) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expandedDirs.has(entry.path);
  const isCopied = copiedPath === entry.path;
  const isSelected = selectedPath === entry.path;
  const isDragTarget = dragOverDir === entry.path;
  const isRenaming = renamingPath === entry.path;

  if (isRenaming) {
    const icon = entry.type === 'directory' ? '\u{1F4C1}' : getFileIcon(entry.name);
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: `0 0 0 ${(entry.type === 'directory' ? 12 : 22) + depth * 16}px` }}>
        <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
        <div style={{ flex: 1 }}>
          <InlineInput
            defaultValue={entry.name}
            onSubmit={(newName) => onRenameSubmit(entry.path, newName)}
            onCancel={onRenameCancel}
            depth={0}
          />
        </div>
      </div>
    );
  }

  if (entry.type === 'directory') {
    return (
      <>
        <div
          draggable
          onDragStart={(e) => onDragStart(e, entry)}
          onDragOver={(e) => onDirDragOver(e, entry.path)}
          onDragLeave={onDirDragLeave}
          onDrop={(e) => onDirDrop(e, entry.path)}
          onContextMenu={(e) => onContextMenu(e, entry)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: `6px 12px 6px ${12 + depth * 16}px`,
            fontSize: 12,
            fontWeight: 600,
            color: colors.textSecondary,
            cursor: 'pointer',
            userSelect: 'none',
            backgroundColor: isDragTarget ? 'rgba(88, 166, 255, 0.12)' : hovered ? colors.surfaceHover : 'transparent',
            borderLeft: isDragTarget ? `2px solid ${colors.accent}` : '2px solid transparent',
          }}
          onClick={() => onToggleDir(entry.path)}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          <span style={{ fontSize: 10, width: 10, textAlign: 'center' }}>{isExpanded ? '\u25BC' : '\u25B6'}</span>
          <span style={{ fontSize: 13 }}>{'\u{1F4C1}'}</span>
          <span>{entry.name}</span>
          {entry.children && (
            <span style={{ color: colors.textSecondary, fontSize: 11 }}>
              ({entry.children.length})
            </span>
          )}
        </div>
        {isExpanded && entry.children?.map((child) => (
          <FileNode
            key={child.path}
            entry={child}
            depth={depth + 1}
            expandedDirs={expandedDirs}
            onToggleDir={onToggleDir}
            copiedPath={copiedPath}
            onCopy={onCopy}
            selectedPath={selectedPath}
            onSelect={onSelect}
            onContextMenu={onContextMenu}
            dragOverDir={dragOverDir}
            onDragStart={onDragStart}
            onDirDragOver={onDirDragOver}
            onDirDragLeave={onDirDragLeave}
            onDirDrop={onDirDrop}
            renamingPath={renamingPath}
            onRenameSubmit={onRenameSubmit}
            onRenameCancel={onRenameCancel}
            creatingFolderIn={creatingFolderIn}
            onCreateFolderSubmit={onCreateFolderSubmit}
            onCreateFolderCancel={onCreateFolderCancel}
          />
        ))}
        {isExpanded && creatingFolderIn === entry.path && (
          <InlineInput
            defaultValue=""
            placeholder="New folder name"
            onSubmit={(name) => onCreateFolderSubmit(entry.path, name)}
            onCancel={onCreateFolderCancel}
            depth={depth + 1}
          />
        )}
      </>
    );
  }

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, entry)}
      onContextMenu={(e) => onContextMenu(e, entry)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: `6px 12px 6px ${22 + depth * 16}px`,
        cursor: 'pointer',
        fontSize: 13,
        color: isSelected ? colors.accent : isCopied ? colors.accent : colors.textPrimary,
        userSelect: 'none',
        backgroundColor: isSelected ? 'rgba(88, 166, 255, 0.08)' : hovered ? colors.surfaceHover : 'transparent',
        borderLeft: isSelected ? `2px solid ${colors.accent}` : isCopied ? `2px solid ${colors.accent}` : '2px solid transparent',
      }}
      onClick={() => { onSelect?.(entry); onCopy(entry.path); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`Click to preview & copy: staticFile('${entry.path}')`}
    >
      <span style={{ fontSize: 13, width: 18, textAlign: 'center', flexShrink: 0 }}>
        {getFileIcon(entry.name)}
      </span>
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {entry.name}
      </span>
      {isCopied ? (
        <span style={{ fontSize: 11, color: colors.accent, fontWeight: 600, flexShrink: 0 }}>
          Copied!
        </span>
      ) : (
        <span style={{ fontSize: 11, color: colors.textSecondary, fontFamily: fonts.mono, flexShrink: 0 }}>
          {formatSize(entry.size)}
        </span>
      )}
    </div>
  );
};

// --- AssetBrowser ---

interface AssetBrowserProps {
  selectedAssetPath?: string | null;
  onSelect?: (entry: AssetEntry) => void;
}

export const AssetBrowser: React.FC<AssetBrowserProps> = ({ selectedAssetPath, onSelect }) => {
  const [entries, setEntries] = useState<AssetEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dragOverExternal, setDragOverExternal] = useState(false);
  const [dragOverDir, setDragOverDir] = useState<string | null>(null);
  const [draggedEntry, setDraggedEntry] = useState<AssetEntry | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [creatingFolderIn, setCreatingFolderIn] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadDirRef = useRef<string>('');

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    setLoading(true);
    fetch('/__rendiv_api__/assets/list')
      .then((res) => res.ok ? res.json() : { entries: [] })
      .then((data: { entries: AssetEntry[] }) => {
        setEntries(data.entries);
        setLoading(false);
        setExpandedDirs((prev) => {
          // On first load, expand top-level dirs. On refresh, keep current state.
          if (prev.size > 0) return prev;
          const topDirs = data.entries.filter((e) => e.type === 'directory').map((e) => e.path);
          return new Set(topDirs);
        });
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, [refreshKey]);

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleCopy = useCallback((filePath: string) => {
    const code = `staticFile('${filePath}')`;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedPath(filePath);
      setTimeout(() => setCopiedPath(null), 1500);
    }).catch(() => {});
  }, []);

  const handleUpload = useCallback(async (files: FileList | File[], dir = '') => {
    if (files.length === 0) return;
    setUploading(true);
    setActionError(null);

    try {
      for (const file of Array.from(files)) {
        const params = new URLSearchParams({ filename: file.name });
        if (dir) params.set('dir', dir);
        const res = await fetch(`/__rendiv_api__/assets/upload?${params.toString()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: file,
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || `Upload failed: ${res.status}`);
        }
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }, [refresh]);

  // --- Move ---

  const handleMove = useCallback(async (fromPath: string, toPath: string) => {
    setActionError(null);
    try {
      const params = new URLSearchParams({ from: fromPath, to: toPath });
      const res = await fetch(`/__rendiv_api__/assets/move?${params.toString()}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Move failed: ${res.status}`);
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  }, [refresh]);

  // --- Delete ---

  const handleDelete = useCallback(async (path: string) => {
    setActionError(null);
    try {
      const params = new URLSearchParams({ path });
      const res = await fetch(`/__rendiv_api__/assets/delete?${params.toString()}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Delete failed: ${res.status}`);
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  }, [refresh]);

  // --- Create folder ---

  const handleCreateFolder = useCallback(async (parentPath: string, name: string) => {
    setActionError(null);
    setCreatingFolderIn(null);
    try {
      const folderPath = parentPath ? `${parentPath}/${name}` : name;
      const params = new URLSearchParams({ path: folderPath });
      const res = await fetch(`/__rendiv_api__/assets/mkdir?${params.toString()}`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Create folder failed: ${res.status}`);
      }
      // Auto-expand the parent so the new folder is visible
      if (parentPath) {
        setExpandedDirs((prev) => new Set([...prev, parentPath]));
      }
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  }, [refresh]);

  // --- Rename ---

  const handleRename = useCallback(async (oldPath: string, newName: string) => {
    setRenamingPath(null);
    const parent = parentDir(oldPath);
    const newPath = parent ? `${parent}/${newName}` : newName;
    if (newPath === oldPath) return;
    await handleMove(oldPath, newPath);
  }, [handleMove]);

  // --- Drag-and-drop (internal moves) ---

  const handleNodeDragStart = useCallback((e: React.DragEvent, entry: AssetEntry) => {
    setDraggedEntry(entry);
    e.dataTransfer.setData('text/plain', entry.path);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDirDragOver = useCallback((e: React.DragEvent, dirPath: string) => {
    // Only handle internal moves (from dragged entries), not external file drops
    if (!draggedEntry) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDir(dirPath);
  }, [draggedEntry]);

  const handleDirDragLeave = useCallback(() => {
    setDragOverDir(null);
  }, []);

  const handleDirDrop = useCallback((e: React.DragEvent, dirPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDir(null);
    const fromPath = e.dataTransfer.getData('text/plain');
    if (fromPath && fromPath !== dirPath && parentDir(fromPath) !== dirPath) {
      handleMove(fromPath, dirPath);
    }
    setDraggedEntry(null);
  }, [handleMove]);

  // --- Root drop zone (move items to root) ---

  const handleRootDragOver = useCallback((e: React.DragEvent) => {
    if (!draggedEntry) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDir('__root__');
  }, [draggedEntry]);

  const handleRootDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverDir(null);
    const fromPath = e.dataTransfer.getData('text/plain');
    if (fromPath && parentDir(fromPath) !== '') {
      // Move to root — extract just the filename
      const name = fromPath.split('/').pop() ?? fromPath;
      handleMove(fromPath, name);
    }
    setDraggedEntry(null);
  }, [handleMove]);

  // --- External file drag-and-drop (upload) ---

  const handleExternalDragOver = useCallback((e: React.DragEvent) => {
    if (draggedEntry) return; // Internal move, not external upload
    e.preventDefault();
    e.stopPropagation();
    setDragOverExternal(true);
  }, [draggedEntry]);

  const handleExternalDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverExternal(false);
  }, []);

  const handleExternalDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverExternal(false);
    if (e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  }, [handleUpload]);

  // --- Context menu ---

  const handleContextMenu = useCallback((e: React.MouseEvent, entry: AssetEntry) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, entry });
  }, []);

  const getContextMenuItems = useCallback((entry: AssetEntry): ContextMenuItem[] => {
    if (entry.type === 'directory') {
      return [
        {
          label: 'Upload here',
          action: () => {
            uploadDirRef.current = entry.path;
            fileInputRef.current?.click();
          },
        },
        {
          label: 'New subfolder',
          action: () => {
            setExpandedDirs((prev) => new Set([...prev, entry.path]));
            setCreatingFolderIn(entry.path);
          },
        },
        {
          label: 'Rename',
          action: () => setRenamingPath(entry.path),
        },
        {
          label: 'Delete',
          danger: true,
          action: () => {
            if (confirm(`Delete folder "${entry.name}"? It must be empty.`)) {
              handleDelete(entry.path);
            }
          },
        },
      ];
    }

    return [
      {
        label: 'Copy path',
        action: () => handleCopy(entry.path),
      },
      {
        label: 'Rename',
        action: () => setRenamingPath(entry.path),
      },
      {
        label: 'Delete',
        danger: true,
        action: () => {
          if (confirm(`Delete "${entry.name}"?`)) {
            handleDelete(entry.path);
          }
        },
      },
    ];
  }, [handleCopy, handleDelete]);

  // --- Icon button style ---

  const iconBtnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
    padding: 0,
    border: `1px solid ${colors.border}`,
    borderRadius: 4,
    cursor: 'pointer',
    backgroundColor: 'transparent',
    color: colors.textSecondary,
  };

  // --- Render ---

  const hiddenInput = (
    <input
      ref={fileInputRef}
      type="file"
      multiple
      style={{ display: 'none' }}
      onChange={(e) => {
        if (e.target.files) {
          handleUpload(e.target.files, uploadDirRef.current);
          uploadDirRef.current = '';
        }
        e.target.value = '';
      }}
    />
  );

  const errorBanner = actionError && (
    <div style={{
      padding: '6px 12px',
      fontSize: 11,
      color: colors.error,
      backgroundColor: 'rgba(248, 81, 73, 0.1)',
      borderBottom: `1px solid ${colors.border}`,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <span>{actionError}</span>
      <button
        onClick={() => setActionError(null)}
        style={{
          background: 'none',
          border: 'none',
          color: colors.error,
          cursor: 'pointer',
          fontSize: 11,
          padding: '0 4px',
        }}
      >
        {'\u2715'}
      </button>
    </div>
  );

  const dragOverlay = dragOverExternal && (
    <div style={{
      position: 'absolute',
      inset: 0,
      backgroundColor: 'rgba(88, 166, 255, 0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      pointerEvents: 'none',
    }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.accent }}>
        Drop files to upload
      </div>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 16, color: colors.textSecondary, fontSize: 12 }}>
        Loading assets...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: colors.error, fontSize: 12 }}>
        Failed to load assets: {error}
      </div>
    );
  }

  const toolbar = (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 12px',
      fontSize: 11,
      color: colors.textSecondary,
      borderBottom: `1px solid ${colors.border}`,
    }}>
      <span>
        Click a file to copy its <span style={{ fontFamily: fonts.mono }}>staticFile()</span> path
      </span>
      <div style={{ display: 'flex', gap: 4 }}>
        <button
          onClick={() => {
            uploadDirRef.current = '';
            fileInputRef.current?.click();
          }}
          disabled={uploading}
          style={{ ...iconBtnStyle, opacity: uploading ? 0.5 : 1, cursor: uploading ? 'default' : 'pointer' }}
          title="Upload files"
        >
          <UploadIcon />
        </button>
        <button
          onClick={() => setCreatingFolderIn('__root__')}
          style={iconBtnStyle}
          title="Create folder"
        >
          <FolderPlusIcon />
        </button>
      </div>
    </div>
  );

  if (entries.length === 0) {
    return (
      <div
        style={{
          flex: 1,
          position: 'relative',
          outline: dragOverExternal ? `2px dashed ${colors.accent}` : 'none',
          outlineOffset: -2,
          display: 'flex',
          flexDirection: 'column',
        }}
        onDragOver={handleExternalDragOver}
        onDragLeave={handleExternalDragLeave}
        onDrop={handleExternalDrop}
      >
        {hiddenInput}
        {toolbar}
        {errorBanner}
        {creatingFolderIn === '__root__' && (
          <InlineInput
            defaultValue=""
            placeholder="New folder name"
            onSubmit={(name) => handleCreateFolder('', name)}
            onCancel={() => setCreatingFolderIn(null)}
            depth={0}
          />
        )}
        <div style={{ padding: 16, color: colors.textSecondary, fontSize: 12, lineHeight: 1.6, flex: 1 }}>
          No assets found.<br />
          Drop files here or use the upload button to add files to the{' '}
          <span style={{ fontFamily: fonts.mono, color: colors.textPrimary }}>public/</span> folder.
        </div>
        {dragOverlay}
      </div>
    );
  }

  return (
    <div
      style={{
        overflowY: 'auto',
        flex: 1,
        position: 'relative',
        outline: dragOverExternal ? `2px dashed ${colors.accent}` : 'none',
        outlineOffset: -2,
      }}
      onDragOver={handleExternalDragOver}
      onDragLeave={handleExternalDragLeave}
      onDrop={handleExternalDrop}
    >
      {hiddenInput}
      {toolbar}
      {errorBanner}

      {/* Root drop zone for moving items to root */}
      {draggedEntry && parentDir(draggedEntry.path) !== '' && (
        <div
          onDragOver={handleRootDragOver}
          onDragLeave={() => setDragOverDir(null)}
          onDrop={handleRootDrop}
          style={{
            padding: '6px 12px',
            fontSize: 11,
            color: dragOverDir === '__root__' ? colors.accent : colors.textSecondary,
            backgroundColor: dragOverDir === '__root__' ? 'rgba(88, 166, 255, 0.08)' : 'transparent',
            borderBottom: `1px solid ${colors.border}`,
            borderLeft: dragOverDir === '__root__' ? `2px solid ${colors.accent}` : '2px solid transparent',
            textAlign: 'center',
          }}
        >
          Drop here to move to root
        </div>
      )}

      {creatingFolderIn === '__root__' && (
        <InlineInput
          defaultValue=""
          placeholder="New folder name"
          onSubmit={(name) => handleCreateFolder('', name)}
          onCancel={() => setCreatingFolderIn(null)}
          depth={0}
        />
      )}

      {entries.map((entry) => (
        <FileNode
          key={entry.path}
          entry={entry}
          depth={0}
          expandedDirs={expandedDirs}
          onToggleDir={handleToggleDir}
          copiedPath={copiedPath}
          onCopy={handleCopy}
          selectedPath={selectedAssetPath ?? null}
          onSelect={onSelect}
          onContextMenu={handleContextMenu}
          dragOverDir={dragOverDir}
          onDragStart={handleNodeDragStart}
          onDirDragOver={handleDirDragOver}
          onDirDragLeave={handleDirDragLeave}
          onDirDrop={handleDirDrop}
          renamingPath={renamingPath}
          onRenameSubmit={handleRename}
          onRenameCancel={() => setRenamingPath(null)}
          creatingFolderIn={creatingFolderIn}
          onCreateFolderSubmit={handleCreateFolder}
          onCreateFolderCancel={() => setCreatingFolderIn(null)}
        />
      ))}

      {contextMenu && (
        <ContextMenu
          menu={contextMenu}
          items={getContextMenuItems(contextMenu.entry)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {dragOverlay}
    </div>
  );
};
