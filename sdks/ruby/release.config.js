module.exports = {
  branches: [
    'main',
    {
      name: 'alpha',
      prerelease: true,
    },
  ],
  repositoryUrl: 'https://github.com/idosal/mcp-ui',
  tagFormat: 'ruby-server-sdk/v${version}',
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    [
      '@semantic-release/changelog',
      {
        changelogFile: 'CHANGELOG.md',
      },
    ],
    [
      '@semantic-release/exec',
      {
        prepareCmd:
          "sed -i 's/VERSION = \".*\"/VERSION = \"${nextRelease.version}\"/' lib/mcp_ui_server/version.rb && bundle install && gem build mcp_ui_server.gemspec",
        publishCmd: 'gem push *.gem',
      },
    ],
    [
      '@semantic-release/github',
      {
        assets: '*.gem',
      },
    ],
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'lib/mcp_ui_server/version.rb', 'Gemfile.lock'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
}; 