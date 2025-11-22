import { defineConfig } from 'vitepress';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    lang: 'en-US',
    title: 'MCP-UI',
    description:
      'Interactive UI for MCP - Build rich, dynamic interfaces with MCP-UI',
    base: '/',
    cleanUrls: true,

    head: [
      ['meta', { name: 'theme-color', content: '#3c82f6' }],
      ['meta', { name: 'og:type', content: 'website' }],
      ['meta', { name: 'og:locale', content: 'en' }],
      [
        'meta',
        {
          name: 'og:title',
          content: 'MCP-UI | Interactive UI Components for MCP',
        },
      ],
      ['meta', { name: 'og:site_name', content: 'MCP-UI' }],
      ['meta', { name: 'og:image', content: 'https://mcpui.dev/og-image.png' }],
      ['meta', { name: 'og:url', content: 'https://mcpui.dev/' }],
      ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
      ['meta', { name: 'twitter:site', content: '@idosal1' }],
      ['meta', { name: 'twitter:url', content: 'https://mcpui.dev/' }],
      ['meta', { name: 'twitter:domain', content: 'mcpui.dev' }],
      [
        'meta',
        { name: 'twitter:image', content: 'https://mcpui.dev/og-image.png' },
      ],
      [
        'meta',
        {
          name: 'twitter:description',
          content:
            'Interactive UI for MCP - Build rich, dynamic interfaces with MCP-UI',
        },
      ],
      ['link', { rel: 'icon', type: 'image/png', href: '/logo.png' }],
      ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],
      [
        'style',
        {},
        `.VPNavBar .VPNavBarSocialLinks a[href*="npmjs.com/package/@mcp-ui/server"] { border-left: 1px solid var(--vp-c-divider); margin-left: 8px; padding-left: 12px; }`
      ],
    ],

    vite: {
      plugins: [],
      optimizeDeps: {
        include: ['vue', '@vue/shared'],
      },
    },

    themeConfig: {
      logo: {
        light: '/logo-black.png',
        dark: '/logo.png',
        alt: 'MCP-UI Logo',
      },

      nav: [
        { text: 'Home', link: '/' },
        { text: 'Guide', link: '/guide/introduction' },
        { text: 'Team', link: '/team' },
        {
          text: 'Examples',
          items: [
            {
              text: 'Live Demo',
              link: 'https://scira-mcp-chat-git-main-idosals-projects.vercel.app/',
            },
            {
              text: 'UI Inspector',
              link: 'https://github.com/idosal/ui-inspector',
            },
            {
              text: 'Server Examples',
              items: [
                {
                  text: 'TypeScript',
                  link: '/guide/server/typescript/usage-examples',
                },
                { text: 'Ruby', link: '/guide/server/ruby/usage-examples' },
                { text: 'Python', link: '/guide/server/python/usage-examples' },
              ],
            },
            {
              text: 'Client Examples',
              items: [
                { text: 'React', link: '/guide/client/react-usage-examples' },
                {
                  text: 'Web Components',
                  link: '/guide/client/wc-usage-examples',
                },
              ],
            },
          ],
        },
        { text: 'Changelog', link: 'https://github.com/idosal/mcp-ui/blob/main/CHANGELOG.md' },
      ],

      sidebar: [
        {
          text: 'Introduction',
          items: [
            { text: 'What is MCP-UI?', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Protocol Details', link: '/guide/protocol-details' },
            { text: 'Supported Hosts', link: '/guide/supported-hosts' },
            { text: 'Apps SDK', link: '/guide/apps-sdk' },
            { text: 'Embeddable UI', link: '/guide/embeddable-ui' },
          ],
        },
        {
          text: 'Server SDK',
          items: [
            {
              text: 'TypeScript',
              items: [
                { text: 'Overview', link: '/guide/server/typescript/overview' },
                {
                  text: 'Walkthrough',
                  link: '/guide/server/typescript/walkthrough',
                },
                {
                  text: 'Examples',
                  link: '/guide/server/typescript/usage-examples',
                },
              ],
            },
            {
              text: 'Ruby',
              items: [
                { text: 'Overview', link: '/guide/server/ruby/overview' },
                { text: 'Walkthrough', link: '/guide/server/ruby/walkthrough' },
                { text: 'Examples', link: '/guide/server/ruby/usage-examples' },
              ],
            },
            {
              text: 'Python',
              items: [
                { text: 'Overview', link: '/guide/server/python/overview' },
                {
                  text: 'Walkthrough',
                  link: '/guide/server/python/walkthrough',
                },
                {
                  text: 'Examples',
                  link: '/guide/server/python/usage-examples',
                },
              ],
            },
          ],
        },
        {
          text: 'Client SDK',
          items: [
            { text: 'Overview', link: '/guide/client/overview' },
            { text: 'Using a Proxy', link: '/guide/client/using-a-proxy' },
            { text: 'Resource Renderer', link: '/guide/client/resource-renderer' },
            {
              text: 'HTML Resource',
              link: '/guide/client/html-resource',
            },
            {
              text: 'Remote DOM Resource',
              link: '/guide/client/remote-dom-resource',
            },
            {
              text: 'Custom Component Libraries',
              link: '/guide/client/custom-component-libraries',
            },
            {
              text: 'Examples',
              items: [
                { text: 'React', link: '/guide/client/react-usage-examples' },
                {
                  text: 'Web Components',
                  link: '/guide/client/wc-usage-examples',
                },
              ],
            },
          ],
        },
      ],

      socialLinks: [
        { icon: 'github', link: 'https://github.com/idosal/mcp-ui' },
        { icon: 'npm', link: 'https://www.npmjs.com/package/@mcp-ui/server' },
      ],

      footer: {
        message: 'Released under the Apache-2.0 License.',
        copyright: 'Copyright © 2024-present Ido Salomon',
      },
    },
  })
);
