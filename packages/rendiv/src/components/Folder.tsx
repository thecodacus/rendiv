import React, { useContext, type ReactNode } from 'react';
import { FolderContext } from '../context/FolderContext';

export interface FolderProps {
  name: string;
  children: ReactNode;
}

export const Folder: React.FC<FolderProps> = ({ name, children }) => {
  const parentFolder = useContext(FolderContext);
  const fullPath = parentFolder ? `${parentFolder}/${name}` : name;

  return (
    <FolderContext.Provider value={fullPath}>
      {children}
    </FolderContext.Provider>
  );
};

Folder.displayName = 'Folder';
