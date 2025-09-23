# MCP-UI Development Instructions

**ALWAYS follow these instructions first and fallback to additional search and context gathering only if the information here is incomplete or found to be in error.**

MCP-UI is a Model Context Protocol UI SDK monorepo providing TypeScript and Ruby SDKs for building MCP enabled applications with interactive UI components. The repository includes client SDKs, server SDKs, documentation, and examples.

## Working Effectively

### Bootstrap and Build (CRITICAL - Set 60+ minute timeouts)
- Install Node.js 22.x and pnpm 9+: `npm install -g pnpm`
- Install Ruby 3.x and bundler: `sudo apt-get install -y ruby ruby-dev build-essential && sudo gem install bundler`
- Clone repository: `git clone https://github.com/idosal/mcp-ui.git && cd mcp-ui`
- Install dependencies: `pnpm install` -- takes ~60 seconds. NEVER CANCEL.
- Build all packages: `pnpm build` -- takes ~15 seconds. NEVER CANCEL. Set timeout to 120+ seconds.
- Build documentation: `pnpm docs:build` -- takes ~17 seconds. NEVER CANCEL. Set timeout to 180+ seconds.

### Testing (CRITICAL - Set 30+ minute timeouts)
- Run TypeScript tests: `pnpm test:ts` -- takes ~6 seconds. NEVER CANCEL. Set timeout to 300+ seconds.
- Run Ruby tests: `pnpm test:ruby` -- takes ~1 second. NEVER CANCEL. Set timeout to 300+ seconds.
- Run all tests: `pnpm test` -- combines TypeScript and Ruby tests. NEVER CANCEL. Set timeout to 600+ seconds.
- Run with coverage: `pnpm coverage` -- NEVER CANCEL. Set timeout to 600+ seconds.

### Code Quality (Always run before committing)
- Lint code: `pnpm lint` -- takes ~2.4 seconds. Uses ESLint with TypeScript parser.
- Fix linting issues: `pnpm lint:fix`
- Format code: `pnpm format` -- Uses Prettier with single quotes, trailing commas, 100 char width.

### Development Workflow
- Run TypeScript SDKs in development: `pnpm dev` -- starts all TypeScript package dev servers in parallel.
- Run docs in development: `pnpm docs:dev` -- starts VitePress dev server.
- Preview builds: `pnpm preview` -- preview built packages.

## Validation (CRITICAL - Always perform these after changes)

### Mandatory End-to-End Validation Scenarios
1. **Always build and test after making changes:** Run `pnpm build && pnpm test` to ensure nothing is broken.
2. **Validate examples work:** Test working examples by running:
   - `cd examples/remote-dom-demo && npm run build` -- takes ~1 second. Always works.
   - `cd examples/wc-demo && npm run build` -- takes ~1 second. Always works.
   - NOTE: `typescript-server-demo` may have import issues and should be tested separately after SDK changes.
3. **Test UI components:** When changing client components, manually verify React rendering works by running example applications.
4. **Validate SDK functionality:** When changing server SDKs, test resource creation with both TypeScript and Ruby implementations.
5. **Documentation validation:** When updating docs, run `pnpm docs:build` and verify no broken links or build errors.

### Ruby SDK Specific Validation
- Ruby gems must be installed with `sudo bundle install` in `sdks/ruby/` directory
- Run Ruby linting: `cd sdks/ruby && sudo bundle exec rubocop`
- Ruby tests validate resource creation: `cd sdks/ruby && sudo bundle exec rake spec`

## Project Structure

### Key Directories
- `sdks/typescript/` - TypeScript SDKs (client, server, shared)
  - `client/` - React components for rendering MCP-UI resources
  - `server/` - Utilities for creating UI resources on MCP servers
  - `shared/` - Common types and utilities
- `sdks/ruby/` - Ruby SDK (`mcp_ui_server` gem)
- `examples/` - Demo applications showcasing SDK usage
  - `remote-dom-demo/` - Interactive UI script testing
  - `typescript-server-demo/` - Complete TypeScript server example
  - `ruby-server-demo/` - Complete Ruby server example
- `docs/` - VitePress documentation site

### Critical Files
- `package.json` - Root monorepo configuration with pnpm workspaces
- `pnpm-workspace.yaml` - Workspace configuration for TypeScript packages and examples
- `.github/workflows/ci.yml` - CI pipeline with build, test, and release steps
- `vitest.config.ts` - Test configuration for TypeScript packages
- `tsconfig.base.json` - Base TypeScript configuration

## Build System Details

### Package Management
- Uses pnpm workspaces for monorepo management
- TypeScript packages use Vite for building with dual ESM/CJS output
- Ruby uses standard gem building with bundler

### Dependencies and Versions
- Node.js 22.x (required for TypeScript SDKs)
- pnpm 9+ (required for workspace management)
- Ruby 3.x (required for Ruby SDK)
- React 18+ (peer dependency for client SDK)

### Build Outputs
- TypeScript client: Builds to `dist/` with ESM, CJS, and Web Component builds
- TypeScript server: Builds to `dist/` with ESM and CJS formats
- Ruby gem: Standard gem structure in `lib/`
- Documentation: Static site built to `docs/src/.vitepress/dist/`

## Common Development Tasks

### Adding New Features
1. Determine if change affects TypeScript SDKs, Ruby SDK, or both
2. Make changes following existing patterns
3. Add appropriate tests (Vitest for TypeScript, RSpec for Ruby)
4. Update documentation if needed
5. Run full validation workflow: `pnpm build && pnpm test && pnpm lint`

### Working with Examples
- Examples use workspace dependencies and build independently
- Remote DOM demo showcases client-side rendering capabilities
- Server demos show complete MCP server implementations
- Always test example builds after making SDK changes

### Documentation Updates
- Documentation uses VitePress with enhanced styling
- Edit files in `docs/src/` directory
- Test changes with `pnpm docs:dev` before building
- Always build docs to check for errors: `pnpm docs:build`

## Troubleshooting

### Common Issues
- **TypeScript version warnings:** Current setup uses TypeScript 5.8.3 with ESLint plugins that support <5.4.0. This is expected and working.
- **Ruby permission errors:** Use `sudo bundle install` and `sudo bundle exec` for Ruby commands in CI environment.
- **Build failures:** Always run `pnpm install` first, then check individual package builds.
- **Test failures:** Check if all dependencies are installed and built before running tests.

### CI/CD Pipeline
- CI runs on Node.js 22.x with pnpm 10
- Separate jobs for TypeScript and Ruby testing
- Path filtering prevents unnecessary builds
- Semantic release handles versioning and publishing

### Performance Notes
- TypeScript builds are fast (~15 seconds total)
- Ruby tests run very quickly (~1 second)
- Documentation builds may take longer (~17 seconds)
- Full CI pipeline completes in under 5 minutes

## CRITICAL REMINDERS
- **NEVER CANCEL builds or long-running commands** - Always set appropriate timeouts
- **Always validate changes** with complete build and test cycle
- **Test examples** after SDK changes to ensure compatibility
- **Run linting and formatting** before committing changes
- **Update documentation** when adding or changing features
- **Use workspace commands** from root directory for consistency