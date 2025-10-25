module.exports = {
  branches: [
    'main',
    {
      name: 'alpha',
      prerelease: true,
    },
  ],
  repositoryUrl: 'https://github.com/idosal/mcp-ui',
  tagFormat: 'python-server-sdk/v${version}',
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
          "sed -i.bak 's/version = \".*\"/version = \"${nextRelease.version}\"/' pyproject.toml && rm -f pyproject.toml.bak && uv sync && uv build",
        publishCmd: 'echo "Publishing handled by pypa/gh-action-pypi-publish"',
      },
    ],
    '@semantic-release/github',
    [
      '@semantic-release/git',
      {
        assets: ['CHANGELOG.md', 'pyproject.toml', 'uv.lock'],
        message:
          'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}',
      },
    ],
  ],
};

