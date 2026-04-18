# Apps In Toss MCP Setup

This project is prepared to use the official Apps In Toss MCP server.

## What was set up

- Added `.cursor/mcp.json`
- Configured the `apps-in-toss` MCP server to start through `ax mcp start`

## Why this setup

Based on the official Apps In Toss AI development guide:

- Cursor project config uses `.cursor/mcp.json`
- The official MCP server command is `ax mcp start`

## Current environment check

- `ax` is already installed in this environment
- `ax version` returns `0.5.1`

## Next recommended step

If you want, the next step is scaffolding the actual mini app project.

### WebView app

```powershell
npm create ait-app .
```

### Existing web project

```powershell
npm install @apps-in-toss/web-framework
npx ait init
```

## Official docs

- AI development guide: https://developers-apps-in-toss.toss.im/development/llms.html
- WebView quickstart: https://developers-apps-in-toss.toss.im/tutorials/webview.html
