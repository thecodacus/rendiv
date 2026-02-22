import React, { useState, useEffect, useCallback } from 'react';
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

interface FileNodeProps {
  entry: AssetEntry;
  depth: number;
  expandedDirs: Set<string>;
  onToggleDir: (path: string) => void;
  copiedPath: string | null;
  onCopy: (path: string) => void;
  selectedPath: string | null;
  onSelect?: (entry: AssetEntry) => void;
}

const FileNode: React.FC<FileNodeProps> = ({ entry, depth, expandedDirs, onToggleDir, copiedPath, onCopy, selectedPath, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const isExpanded = expandedDirs.has(entry.path);
  const isCopied = copiedPath === entry.path;
  const isSelected = selectedPath === entry.path;

  if (entry.type === 'directory') {
    return (
      <>
        <div
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
            backgroundColor: hovered ? colors.surfaceHover : 'transparent',
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
          />
        ))}
      </>
    );
  }

  return (
    <div
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

  useEffect(() => {
    fetch('/__rendiv_api__/assets/list')
      .then((res) => res.ok ? res.json() : { entries: [] })
      .then((data: { entries: AssetEntry[] }) => {
        setEntries(data.entries);
        setLoading(false);
        // Auto-expand top-level directories
        const topDirs = data.entries.filter((e) => e.type === 'directory').map((e) => e.path);
        setExpandedDirs(new Set(topDirs));
      })
      .catch((err) => {
        setError(String(err));
        setLoading(false);
      });
  }, []);

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

  if (entries.length === 0) {
    return (
      <div style={{ padding: 16, color: colors.textSecondary, fontSize: 12, lineHeight: 1.6 }}>
        No assets found.<br />
        Add files to the <span style={{ fontFamily: fonts.mono, color: colors.textPrimary }}>public/</span> folder.
      </div>
    );
  }

  return (
    <div style={{ overflowY: 'auto', flex: 1 }}>
      <div style={{ padding: '8px 12px', fontSize: 11, color: colors.textSecondary, borderBottom: `1px solid ${colors.border}` }}>
        Click a file to copy its <span style={{ fontFamily: fonts.mono }}>staticFile()</span> path
      </div>
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
        />
      ))}
    </div>
  );
};
