import React, { useState, useMemo } from 'react';
import type { CompositionEntry } from '@rendiv/core';
import { sidebarStyles, colors, fonts } from './styles';
import { AssetBrowser, type AssetEntry } from './AssetBrowser';

type SidebarTab = 'compositions' | 'assets';

interface SidebarProps {
  compositions: CompositionEntry[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  selectedAssetPath?: string | null;
  onAssetSelect?: (entry: AssetEntry) => void;
}

function formatDuration(durationInFrames: number, fps: number): string {
  const seconds = durationInFrames / fps;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

interface FolderGroup {
  name: string;
  compositions: CompositionEntry[];
}

const SIDEBAR_TAB_KEY = 'rendiv-studio:sidebar-tab';

export const Sidebar: React.FC<SidebarProps> = React.memo(({ compositions, selectedId, onSelect, selectedAssetPath, onAssetSelect }) => {
  const [activeTab, setActiveTab] = useState<SidebarTab>(() => {
    const saved = localStorage.getItem(SIDEBAR_TAB_KEY);
    return saved === 'assets' ? 'assets' : 'compositions';
  });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const { ungrouped, folders } = useMemo(() => {
    const ungrouped: CompositionEntry[] = [];
    const folderMap = new Map<string, CompositionEntry[]>();

    for (const comp of compositions) {
      if (comp.group === null) {
        ungrouped.push(comp);
      } else {
        if (!folderMap.has(comp.group)) folderMap.set(comp.group, []);
        folderMap.get(comp.group)!.push(comp);
      }
    }

    const folders: FolderGroup[] = Array.from(folderMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, compositions]) => ({ name, compositions }));

    return { ungrouped, folders };
  }, [compositions]);

  const toggleFolder = (name: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const renderItem = (comp: CompositionEntry) => {
    const isSelected = comp.id === selectedId;
    const style = isSelected ? sidebarStyles.itemSelected : sidebarStyles.item;

    return (
      <div
        key={comp.id}
        style={style}
        onClick={() => onSelect(comp.id)}
        data-sidebar-item=""
        data-selected={isSelected ? 'true' : undefined}
      >
        <span>{comp.id}</span>
        <span
          style={{
            ...sidebarStyles.badge,
            backgroundColor: comp.type === 'still' ? colors.badgeStill : colors.badge,
          }}
        >
          {comp.type === 'still' ? 'still' : 'comp'}
        </span>
        <span style={sidebarStyles.duration}>
          {formatDuration(comp.durationInFrames, comp.fps)}
        </span>
      </div>
    );
  };

  const handleTabChange = (tab: SidebarTab) => {
    setActiveTab(tab);
    localStorage.setItem(SIDEBAR_TAB_KEY, tab);
  };

  return (
    <div style={{ ...sidebarStyles.container, display: 'flex', flexDirection: 'column' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 12px',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', gap: 2, padding: 2, backgroundColor: colors.bg, borderRadius: 6 }}>
          {(['compositions', 'assets'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              style={{
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 500,
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                backgroundColor: activeTab === tab ? colors.accentBg : 'transparent',
                color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                fontFamily: fonts.sans,
              }}
            >
              {tab === 'compositions' ? 'Compositions' : 'Assets'}
            </button>
          ))}
        </div>
      </div>

      {/* Compositions tab */}
      <div style={{ display: activeTab === 'compositions' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflowY: 'auto' }}>
        <div style={sidebarStyles.header}>Compositions</div>

        {ungrouped.map(renderItem)}

        {folders.map((folder) => {
          const isCollapsed = collapsedFolders.has(folder.name);

          return (
            <div key={folder.name}>
              <div
                style={sidebarStyles.folderHeader}
                onClick={() => toggleFolder(folder.name)}
              >
                <span style={{ fontSize: 10 }}>{isCollapsed ? '\u25B6' : '\u25BC'}</span>
                <span>{folder.name}</span>
                <span style={{ color: colors.textSecondary, fontSize: 11 }}>
                  ({folder.compositions.length})
                </span>
              </div>
              {!isCollapsed && folder.compositions.map(renderItem)}
            </div>
          );
        })}

        {compositions.length === 0 && (
          <div style={{ padding: '16px', color: colors.textSecondary, fontSize: 12 }}>
            No compositions registered.
          </div>
        )}
      </div>

      {/* Assets tab */}
      <div style={{ display: activeTab === 'assets' ? 'flex' : 'none', flex: 1, flexDirection: 'column', overflow: 'hidden' }}>
        <AssetBrowser selectedAssetPath={selectedAssetPath} onSelect={onAssetSelect} />
      </div>
    </div>
  );
});
