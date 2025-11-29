# Supported Hosts

`mcp-ui` is supported by a growing number of MCP-compatible hosts. Feature support is constantly expanding:

## MCP-UI Native Hosts

These hosts natively support the MCP-UI protocol:

| Host      | Rendering | UI Actions | Notes
| :-------- | :-------: | :--------: | :--------: |
| [Nanobot](https://www.nanobot.ai/)    |     ✅    |     ✅     |
| [Postman](https://www.postman.com/)   |     ✅    |     ⚠️      |
| [Goose](https://block.github.io/goose/)     |     ✅    |     ⚠️      |
| [LibreChat](https://www.librechat.ai/)    |     ✅    |     ⚠️     |
| [Smithery](https://smithery.ai/playground)  |     ✅    |     ❌     |
| [MCPJam](https://www.mcpjam.com/)    |     ✅    |     ❌     |
| [fast-agent](https://fast-agent.ai/mcp/mcp-ui/) | ✅ | ❌ |
| [VSCode](https://github.com/microsoft/vscode/issues/260218) (TBA)    |    ?    |    ?     |

## Hosts Requiring Adapters

These hosts use different protocols but can render MCP-UI widgets via adapters:

| Host      | Protocol | Rendering | UI Actions | Guide |
| :-------- | :------: | :-------: | :--------: | :---: |
| [ChatGPT](https://chatgpt.com/) | Apps SDK | ✅ | ⚠️ | [Apps SDK Guide](./apps-sdk.md) |
| MCP Apps SEP Hosts | MCP Apps | ✅ | ✅ | [MCP Apps Guide](./mcp-apps.md) |

### Adapter Overview

MCP-UI provides two adapters to bridge protocol differences:

- **Apps SDK Adapter**: For ChatGPT and other Apps SDK hosts. Uses `text/html+skybridge` MIME type.
- **MCP Apps Adapter**: For hosts implementing the [MCP Apps SEP protocol](https://github.com/modelcontextprotocol/ext-apps). Uses `text/html+mcp` MIME type.

Both adapters are automatically injected into your HTML when enabled, translating MCP-UI messages to the host's native protocol.

**Legend:**
- ✅: Supported
- ⚠️: Partial Support
- ❌: Not Supported (yet)
