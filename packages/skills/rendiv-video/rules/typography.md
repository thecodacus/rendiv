---
name: typography
description: >
  Loading and using Google Fonts and local font files in rendiv compositions,
  with automatic render-hold to prevent FOUT during rendering.
---

# Typography

Both font packages use `holdRender` internally — the renderer waits for fonts
to load before capturing frames, preventing blank or fallback-font frames.

## @rendiv/google-fonts

Load any Google Font by name.

```tsx
import { useFont } from '@rendiv/google-fonts';

export const Title: React.FC = () => {
  const fontFamily = useFont({ family: 'Space Grotesk', weight: '700' });

  return (
    <h1 style={{ fontFamily, fontSize: 80 }}>
      Hello Rendiv
    </h1>
  );
};
```

### `useFont` (hook)

```ts
useFont(options: {
  family: string;               // Google Font name (required)
  weight?: string | number;     // default: '400'
  style?: 'normal' | 'italic'; // default: 'normal'
  display?: FontDisplay;        // default: 'block'
  subsets?: string[];           // default: ['latin']
  text?: string;                // only load glyphs for this text
}): string  // returns CSS fontFamily value, e.g. '"Space Grotesk", sans-serif'
```

### `fetchFont` (imperative)

```ts
import { fetchFont } from '@rendiv/google-fonts';

const { fontFamily, cleanup } = await fetchFont({
  family: 'Roboto',
  weight: '400',
});
// Use fontFamily in styles
// Call cleanup() when done
```

### `buildGoogleFontsUrl`

```ts
import { buildGoogleFontsUrl } from '@rendiv/google-fonts';

const url = buildGoogleFontsUrl({ family: 'Inter', weight: '500' });
// Returns a Google Fonts CSS v2 URL
```

### Behavior

- Injects a `<link>` stylesheet for the font
- Waits for the font to load via `document.fonts.load()`
- Uses `holdRender` with a 30-second timeout
- Removes the `<link>` on unmount (hook) or when `cleanup()` is called (imperative)

## @rendiv/fonts

Load local font files (WOFF2, WOFF, TTF, OTF).

```tsx
import { useLocalFont } from '@rendiv/fonts';
import { staticFile } from '@rendiv/core';

export const CustomTitle: React.FC = () => {
  const fontFamily = useLocalFont({
    family: 'MyCustomFont',
    src: staticFile('fonts/my-font.woff2'),
  });

  return <h1 style={{ fontFamily }}>Custom Typography</h1>;
};
```

### `useLocalFont` (hook)

```ts
useLocalFont(options: {
  family: string;                      // Font family name to register (required)
  src: string;                         // URL or path to font file (required)
  format?: 'woff2' | 'woff' | 'truetype' | 'opentype'; // auto-detected from extension
  weight?: string | number;            // default: '400'
  style?: 'normal' | 'italic';        // default: 'normal'
  display?: FontDisplay;               // default: 'block'
  unicodeRange?: string;               // optional Unicode range
}): string  // returns CSS fontFamily value
```

### `fetchLocalFont` (imperative)

```ts
import { fetchLocalFont } from '@rendiv/fonts';

const { fontFamily, cleanup } = await fetchLocalFont({
  family: 'BrandFont',
  src: '/fonts/brand.woff2',
});
```

### Behavior

- Creates a `FontFace` object and adds it to `document.fonts`
- Waits for the font to load
- Uses `holdRender` with a 30-second timeout
- Calls `cleanup()` / unmount removes the font from `document.fonts`

## Font Display Values

| Value | Behavior |
|---|---|
| `'block'` | Short block period, infinite swap (default, best for rendering) |
| `'swap'` | Minimal block, infinite swap |
| `'fallback'` | Short block, short swap |
| `'optional'` | Minimal block, no swap |
| `'auto'` | Browser default |

For video rendering, `'block'` is recommended — the `holdRender` mechanism ensures
the font loads before any frame is captured anyway.

## Multiple weights / styles

Load multiple variants by calling the hook multiple times:

```tsx
const regular = useFont({ family: 'Inter', weight: '400' });
const bold = useFont({ family: 'Inter', weight: '700' });
const italic = useFont({ family: 'Inter', weight: '400', style: 'italic' });
```

Each call loads its variant independently with its own `holdRender`.
