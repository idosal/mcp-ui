import { defineConfig } from 'vitepress';

export default defineConfig({
  lang: 'en-US', // Default language
  title: 'MCP UI',
  description: 'MCP-UI Client & Server SDK Documentation',
  base: '/mcp-ui/', // For GitHub Pages deployment

  vite: {
    // Vite specific config for VitePress
    plugins: [],
  },

  themeConfig: {
    // Nav will be common for all locales, or can be localized if needed
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/introduction' },
      // Add links to API docs if generated, e.g., using TypeDoc
      // { text: 'API', items: [
      //   { text: 'Client API', link: '/api/client/' },
      //   { text: 'Server API', link: '/api/server/' },
      //   { text: 'Shared API', link: '/api/shared/' },
      // ]}
    ],

    // Locale specific configurations
    locales: {
      root: {
        label: 'English',
        lang: 'en-US',
        sidebar: {
          '/guide/': [
            {
              text: 'Overview',
              items: [
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Protocol Details', link: '/guide/protocol-details' },
              ],
            },
            {
              text: 'Server SDK (@mcp-ui/server)',
              items: [
                { text: 'Overview', link: '/guide/server/overview' },
                { text: 'Usage & Examples', link: '/guide/server/usage-examples' },
                // { text: 'API', link: '/guide/server/api' } // Placeholder
              ],
            },
            {
              text: 'Client SDK (@mcp-ui/client)',
              items: [
                { text: 'Overview', link: '/guide/client/overview' },
                {
                  text: 'HtmlResource Component',
                  link: '/guide/client/html-resource',
                },
                { text: 'Usage & Examples', link: '/guide/client/usage-examples' },
                // { text: 'API', link: '/guide/client/api' } // Placeholder
              ],
            },
          ],
        },
      },
      ru: {
        label: 'Русский',
        lang: 'ru-RU',
        link: '/ru/guide/introduction', // Link for the language switcher
        sidebar: {
          '/ru/guide/': [
            {
              text: 'Обзор', // Russian: Overview
              items: [
                { text: 'Введение', link: '/ru/guide/introduction' }, // Russian: Introduction
                { text: 'Начало работы', link: '/ru/guide/getting-started' }, // Russian: Getting Started
                // { text: 'Детали протокола', link: '/ru/guide/protocol-details' }, // Placeholder for future translation
              ],
            },
            // Add translated sections for Server and Client SDKs when available
            // {
            //   text: 'Server SDK (@mcp-ui/server)',
            //   items: [
            //     { text: 'Обзор', link: '/ru/guide/server/overview' },
            //     { text: 'Использование и примеры', link: '/ru/guide/server/usage-examples' },
            //   ],
            // },
            // {
            //   text: 'Client SDK (@mcp-ui/client)',
            //   items: [
            //     { text: 'Обзор', link: '/ru/guide/client/overview' },
            //     { text: 'Компонент HtmlResource', link: '/ru/guide/client/html-resource' },
            //     { text: 'Использование и примеры', link: '/ru/guide/client/usage-examples' },
            //   ],
            // },
          ],
        },
      }
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/idosal/mcp-ui' }, // TODO: Update this link
    ],

    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2025-present Ido Salomon',
    },
  },
  markdown: {
    // options for markdown-it-anchor
    // anchor: { permalink: anchor.permalink.headerLink() },
    // options for markdown-it-toc
    // toc: { includeLevel: [1, 2] },
  },
});
