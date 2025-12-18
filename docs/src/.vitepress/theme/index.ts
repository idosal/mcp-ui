import DefaultTheme from 'vitepress/theme';
import { h } from 'vue';
import type { Theme } from 'vitepress';
import './custom.css';

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      'home-hero-before': () => h('div', { class: 'announcement-banner' }, [
        h('span', '🎉 '),
        h('span', { style: 'font-weight: bold;' }, 'MCP-UI is now standardized into MCP Apps!'),
        h('span', ' '),
        h('a', { href: 'https://github.com/modelcontextprotocol/modelcontextprotocol/pull/1865', style: 'text-decoration: underline; color: inherit;' }, 'Learn more →')
      ])
    })
  },
  enhanceApp({ app: _app, router: _router, siteData: _siteData }) {
    // Custom app enhancements can go here
  },
} satisfies Theme;
