# @rendiv/fonts

Generic font loading from any URL or local file. Uses the browser's FontFace API with `holdRender` integration to ensure fonts are ready before frame capture.

## Installation

```bash
npm install @rendiv/fonts @rendiv/core react react-dom
```

## useLocalFont

React hook that loads a font and blocks rendering until it's ready.

```tsx
import { useLocalFont } from '@rendiv/fonts';
import { staticFile } from '@rendiv/core';

const fontFamily = useLocalFont({
  family: 'CustomFont',
  src: staticFile('custom.woff2'),
});

return <h1 style={{ fontFamily }}>Hello</h1>;
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `family` | `string` | required | Font family name to register |
| `src` | `string` | required | URL or path to the font file |
| `format` | `string` | auto | `'woff2'`, `'woff'`, `'truetype'`, `'opentype'` |
| `weight` | `string \| number` | `'400'` | Font weight |
| `style` | `'normal' \| 'italic'` | `'normal'` | Font style |
| `display` | `FontDisplay` | `'block'` | CSS `font-display` |
| `unicodeRange` | `string` | — | Unicode range |

Returns the CSS `font-family` string (e.g. `"CustomFont", sans-serif`).

## fetchLocalFont

Imperative version for use outside React components.

```ts
import { fetchLocalFont } from '@rendiv/fonts';

const { fontFamily, cleanup } = await fetchLocalFont({
  family: 'CustomFont',
  src: '/fonts/custom.woff2',
});

// ... use fontFamily in styles ...
cleanup(); // remove the font registration
```

Returns `Promise<{ fontFamily: string; cleanup: () => void }>`.
