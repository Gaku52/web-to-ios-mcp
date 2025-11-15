/**
 * Generate Capacitor config tool
 */
import { generateCapacitorConfig, generateCapacitorScripts, generateSetupGuide, generateInfoPlistPermissions, generateGitignoreEntries, } from '../generators/config-generator.js';
export async function generateConfigTool(args) {
    const { appName, appId, webDir, framework, primaryColor } = args;
    try {
        // Generate config file content
        const configContent = generateCapacitorConfig({
            appName,
            appId,
            webDir,
            framework,
            primaryColor,
        });
        // Generate npm scripts
        const scripts = generateCapacitorScripts(framework);
        // Generate setup guide
        const setupGuide = generateSetupGuide({
            appName,
            appId,
            webDir,
            framework,
            primaryColor,
        });
        // Generate permissions template
        const permissions = generateInfoPlistPermissions();
        // Generate gitignore entries
        const gitignore = generateGitignoreEntries();
        const output = `# Capacitor Configuration Generated

## 1. capacitor.config.ts

\`\`\`typescript
${configContent}
\`\`\`

## 2. Add these scripts to package.json

\`\`\`json
{
  "scripts": {
${Object.entries(scripts)
            .map(([key, value]) => `    "${key}": "${value}"`)
            .join(',\n')}
  }
}
\`\`\`

## 3. Update .gitignore

\`\`\`
${gitignore}
\`\`\`

## 4. iOS Permissions Template

${permissions}

---

## Setup Guide

${setupGuide}`;
        return {
            content: [
                {
                    type: 'text',
                    text: output,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Error generating config: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
//# sourceMappingURL=generate-config.js.map