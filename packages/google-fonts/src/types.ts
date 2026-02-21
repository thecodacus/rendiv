export type FontDisplay = 'auto' | 'block' | 'swap' | 'fallback' | 'optional';

export interface GoogleFontOptions {
  /** Google Font family name (e.g. 'Roboto', 'Open Sans') */
  family: string;
  /** Font weight. Default: '400' */
  weight?: string | number;
  /** Font style. Default: 'normal' */
  style?: 'normal' | 'italic';
  /** CSS font-display. Default: 'block' */
  display?: FontDisplay;
  /** Unicode subsets to load. Default: ['latin'] */
  subsets?: string[];
  /** Only load glyphs for this text (smaller payload) */
  text?: string;
}

export interface GoogleFontResult {
  /** CSS font-family value to use in styles */
  fontFamily: string;
  /** Call to remove the stylesheet and unregister the font */
  cleanup: () => void;
}
