export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

export interface LocalFontOptions {
  /** Font family name to register */
  family: string;
  /** URL or local path to the font file */
  src: string;
  /** Font format. Auto-detected from file extension if omitted */
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype';
  /** Font weight. Default: '400' */
  weight?: string | number;
  /** Font style. Default: 'normal' */
  style?: 'normal' | 'italic';
  /** CSS font-display. Default: 'block' */
  display?: FontDisplay;
  /** Unicode range */
  unicodeRange?: string;
}

export interface FontResult {
  /** CSS font-family value to use in styles */
  fontFamily: string;
  /** Call to unregister the font */
  cleanup: () => void;
}
