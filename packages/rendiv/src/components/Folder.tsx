import React, { type ReactNode } from 'react';

export interface FolderProps {
  name: string;
  children: ReactNode;
}

export const Folder: React.FC<FolderProps> = ({ children }) => {
  // In Phase 1, Folder is a pass-through.
  // Phase 2 (Studio) will use the `name` prop to group compositions in the sidebar.
  return <>{children}</>;
};

Folder.displayName = 'Folder';
