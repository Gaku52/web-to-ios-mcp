# Web to iOS MCP Server Setup

This guide explains how to configure and use the Web to iOS MCP server with Claude Code.

## Prerequisites

- Node.js 18.0.0 or later
- npm or yarn
- Claude Code installed

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Build the MCP Server

```bash
npm run build
```

This will compile TypeScript to JavaScript in the `dist/` directory.

## Configuration

### Add MCP Server to Claude Code

1. Open your Claude Code configuration file:
   - macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - Windows: `%APPDATA%/Claude/claude_desktop_config.json`
   - Linux: `~/.config/Claude/claude_desktop_config.json`

2. Add the MCP server configuration:

```json
{
  "mcpServers": {
    "web-to-ios": {
      "command": "node",
      "args": ["/absolute/path/to/web-to-ios-mcp/dist/index.js"]
    }
  }
}
```

Replace `/absolute/path/to/web-to-ios-mcp` with the actual absolute path to your cloned repository.

### Example Configuration

```json
{
  "mcpServers": {
    "web-to-ios": {
      "command": "node",
      "args": ["/Users/gaku/web-to-ios-mcp/dist/index.js"]
    },
    "spec-generator": {
      "command": "npx",
      "args": ["-y", "evolution-mcp"]
    }
  }
}
```

## Available MCP Tools

Once configured, the following tools will be available in Claude Code:

### 1. detect_web_framework

Detects the web framework used in a project.

**Parameters:**
- `projectPath` (required): Absolute path to the web project directory

**Example:**
```
Use the detect_web_framework tool to analyze /Users/gaku/spark-vault
```

### 2. generate_ios_migration_spec

Generates a detailed iOS migration specification document.

**Parameters:**
- `projectPath` (required): Absolute path to the web project
- `appName` (required): Name of the iOS app (e.g., "Spark Vault")
- `bundleId` (required): Bundle identifier (e.g., "com.ogadix.sparkvault")
- `primaryColor` (optional): Primary color in hex format (e.g., "#8b5cf6")

**Example:**
```
Use the generate_ios_migration_spec tool with:
- projectPath: /Users/gaku/spark-vault
- appName: Spark Vault
- bundleId: com.ogadix.sparkvault
- primaryColor: #8b5cf6
```

### 3. generate_capacitor_config

Generates Capacitor configuration files and setup guide.

**Parameters:**
- `appName` (required): Name of the app
- `appId` (required): Bundle identifier
- `webDir` (required): Build output directory (e.g., "dist", "out", "build")
- `framework` (required): Framework type ("vite", "nextjs", or "cra")
- `primaryColor` (optional): Primary color in hex format

**Example:**
```
Use the generate_capacitor_config tool with:
- appName: Spark Vault
- appId: com.ogadix.sparkvault
- webDir: dist
- framework: vite
- primaryColor: #8b5cf6
```

## Testing

### Test the MCP Server Manually

You can test the MCP server in development mode:

```bash
npm run dev
```

This will start the server and wait for JSON-RPC messages on stdin.

### Test with Claude Code

1. Restart Claude Code after adding the configuration
2. Start a new conversation
3. Try using one of the MCP tools:

```
Please detect the framework for my project at /Users/gaku/spark-vault
```

Claude Code will automatically use the `detect_web_framework` MCP tool.

## Troubleshooting

### MCP Server Not Found

**Error:** "MCP server 'web-to-ios' not found"

**Solutions:**
1. Check that the path in `claude_desktop_config.json` is absolute, not relative
2. Verify the path exists: `ls /absolute/path/to/web-to-ios-mcp/dist/index.js`
3. Restart Claude Code completely (not just the window)

### Build Errors

**Error:** "Cannot find module..."

**Solutions:**
1. Clean and rebuild: `rm -rf dist node_modules && npm install && npm run build`
2. Check Node.js version: `node --version` (must be >= 18.0.0)

### Permission Errors

**Error:** "EACCES: permission denied"

**Solutions:**
1. Make sure the script is executable: `chmod +x dist/index.js`
2. Check file ownership: `ls -l dist/index.js`

### MCP Tools Not Appearing

**Solutions:**
1. Check Claude Code logs (Help → View Logs)
2. Verify JSON syntax in `claude_desktop_config.json`
3. Ensure the MCP server starts without errors: `npm run dev`

## Development

### Watch Mode

For active development, use watch mode to automatically rebuild on changes:

```bash
npm run watch
```

In another terminal, restart Claude Code or test manually.

### Updating the MCP Server

After making changes to the source code:

1. Rebuild: `npm run build`
2. Restart Claude Code

## Next Steps

Once the MCP server is working:

1. Test with your actual web project (e.g., Spark Vault)
2. Use the generated specs to guide your iOS migration
3. Follow the Capacitor configuration guide
4. Open in Xcode and build

## Support

For issues or questions:
- GitHub Issues: https://github.com/Gaku52/web-to-ios-mcp/issues
- Documentation: See README.md and SPECIFICATION.md
