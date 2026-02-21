import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Rendiv',
  description: 'Programmatic video and motion graphics for the open web.',
  base: '/rendiv/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/rendiv/favicon.svg' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    ['link', { href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap', rel: 'stylesheet' }],
  ],
  themeConfig: {
    logo: { light: '/logo-nav-light.svg', dark: '/logo-nav.svg' },
    siteTitle: false,
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Packages', link: '/packages/core' },
      { text: 'GitHub', link: 'https://github.com/thecodacus/rendiv' },
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Core Concepts', link: '/guide/core-concepts' },
          ],
        },
        {
          text: 'Features',
          items: [
            { text: 'Animation', link: '/guide/animation' },
            { text: 'Media Components', link: '/guide/media' },
            { text: 'Studio', link: '/guide/studio' },
            { text: 'CLI Reference', link: '/guide/cli' },
          ],
        },
      ],
      '/packages/': [
        {
          text: 'Core',
          items: [
            { text: '@rendiv/core', link: '/packages/core' },
            { text: '@rendiv/player', link: '/packages/player' },
            { text: '@rendiv/renderer', link: '/packages/renderer' },
            { text: '@rendiv/bundler', link: '/packages/bundler' },
          ],
        },
        {
          text: 'Effects & Animation',
          items: [
            { text: '@rendiv/transitions', link: '/packages/transitions' },
            { text: '@rendiv/shapes', link: '/packages/shapes' },
            { text: '@rendiv/paths', link: '/packages/paths' },
            { text: '@rendiv/noise', link: '/packages/noise' },
            { text: '@rendiv/motion-blur', link: '/packages/motion-blur' },
          ],
        },
        {
          text: 'Integrations',
          items: [
            { text: '@rendiv/fonts', link: '/packages/fonts' },
            { text: '@rendiv/google-fonts', link: '/packages/google-fonts' },
          ],
        },
      ],
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/thecodacus/rendiv' },
    ],
    search: { provider: 'local' },
    footer: {
      message: 'Released under the Apache License 2.0.',
      copyright: '© Rendiv Contributors',
    },
  },
});
