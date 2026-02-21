# @rendiv/bundler

Vite-based bundler for Rendiv compositions. Used internally by `@rendiv/renderer` and `@rendiv/cli` to build compositions for rendering.

## Installation

```bash
npm install @rendiv/bundler
```

## Usage

```ts
import { bundle } from '@rendiv/bundler';

const serveUrl = await bundle({
  entryPoint: 'src/index.tsx',
});
// serveUrl points to the built static files
```

## How it works

1. Writes a temporary entry file (`__rendiv_entry__.jsx`) and HTML file (`__rendiv_entry__.html`) to the user's project root
2. Runs `vite build` in library mode targeting the entry
3. Outputs static files that can be served and opened in a headless browser
4. Cleans up temporary files in a `finally` block

::: tip Why project root?
The temp files must be in the project root (not `/tmp/`) because Vite resolves `node_modules` relative to its root directory. If the entry file were elsewhere, imports like `@rendiv/core` wouldn't resolve.
:::

## bundle(options)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `entryPoint` | `string` | required | Path to your `src/index.tsx` |
| `outDir` | `string` | `'dist/bundle'` | Output directory |
