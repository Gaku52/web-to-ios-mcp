#!/usr/bin/env node

/**
 * Web to iOS MCP Server
 * Entry point
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Tools will be registered here
import { detectFrameworkTool } from './tools/detect-framework.js';
import { generateSpecTool } from './tools/generate-spec.js';
import { generateConfigTool } from './tools/generate-config.js';

// Resources will be provided here
import { loadImplementationGuide, loadCommonIssues } from './resources/index.js';

/**
 * Create and configure MCP server
 */
async function main() {
  const server = new Server(
    {
      name: 'web-to-ios-mcp',
      version: '0.1.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
      },
    }
  );

  /**
   * List available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'detect_web_framework',
          description:
            'Detect the web framework used in a project (Vite, Next.js, CRA). Returns framework type, version, and build configuration.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Absolute path to the web project directory',
              },
            },
            required: ['projectPath'],
          },
        },
        {
          name: 'generate_ios_migration_spec',
          description:
            'Generate a detailed iOS migration specification document based on the detected framework.',
          inputSchema: {
            type: 'object',
            properties: {
              projectPath: {
                type: 'string',
                description: 'Absolute path to the web project directory',
              },
              appName: {
                type: 'string',
                description: 'Name of the iOS app (e.g., "Spark Vault")',
              },
              bundleId: {
                type: 'string',
                description:
                  'Bundle identifier (e.g., "com.ogadix.sparkvault")',
              },
              primaryColor: {
                type: 'string',
                description:
                  'Optional: Primary color in hex format (e.g., "#8b5cf6")',
              },
            },
            required: ['projectPath', 'appName', 'bundleId'],
          },
        },
        {
          name: 'generate_capacitor_config',
          description:
            'Generate a Capacitor configuration file (capacitor.config.ts) optimized for the detected framework.',
          inputSchema: {
            type: 'object',
            properties: {
              appName: {
                type: 'string',
                description: 'Name of the app',
              },
              appId: {
                type: 'string',
                description: 'Bundle identifier',
              },
              webDir: {
                type: 'string',
                description:
                  'Build output directory (e.g., "dist", "out", "build")',
              },
              framework: {
                type: 'string',
                description: 'Framework type (vite, nextjs, cra)',
                enum: ['vite', 'nextjs', 'cra'],
              },
              primaryColor: {
                type: 'string',
                description: 'Optional: Primary color in hex format',
              },
            },
            required: ['appName', 'appId', 'webDir', 'framework'],
          },
        },
      ],
    };
  });

  /**
   * List available resources
   */
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'web-to-ios://guides/implementation',
          name: 'Implementation Guide',
          description: 'Complete guide for iOS migration implementation, including design principles, risk management, and quality checklist',
          mimeType: 'text/markdown',
        },
        {
          uri: 'web-to-ios://guides/troubleshooting',
          name: 'Common Issues & Solutions',
          description: 'Troubleshooting guide for web-to-iOS conversion covering build errors, runtime issues, and framework-specific problems',
          mimeType: 'text/markdown',
        },
      ],
    };
  });

  /**
   * Read resource content
   */
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    switch (uri) {
      case 'web-to-ios://guides/implementation':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: await loadImplementationGuide(),
            },
          ],
        };

      case 'web-to-ios://guides/troubleshooting':
        return {
          contents: [
            {
              uri,
              mimeType: 'text/markdown',
              text: await loadCommonIssues(),
            },
          ],
        };

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  });

  /**
   * Handle tool calls
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'detect_web_framework':
          return await detectFrameworkTool(args);

        case 'generate_ios_migration_spec':
          return await generateSpecTool(args);

        case 'generate_capacitor_config':
          return await generateConfigTool(args);

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${errorMessage}`,
          },
        ],
      };
    }
  });

  /**
   * Start server
   */
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Web to iOS MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
