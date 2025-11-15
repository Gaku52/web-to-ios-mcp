/**
 * Detect web framework tool
 */
import { detectViteProject } from '../detectors/vite-detector.js';
import { detectNextJsProject } from '../detectors/nextjs-detector.js';
export async function detectFrameworkTool(args) {
    const { projectPath } = args;
    try {
        // Try detecting different frameworks
        const viteProject = await detectViteProject(projectPath);
        const nextjsProject = await detectNextJsProject(projectPath);
        const projectInfo = viteProject || nextjsProject;
        if (!projectInfo) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ No supported framework detected in: ${projectPath}\n\nSupported frameworks:\n- Vite (React, Vue, Svelte, Angular)\n- Next.js\n- Create React App (coming soon)\n\nPlease ensure:\n- package.json exists\n- Framework is installed in dependencies or devDependencies`,
                    },
                ],
            };
        }
        // Format detection result
        let result = `✓ Framework detected: **${projectInfo.framework.toUpperCase()}**\n\n`;
        result += `**Version:** ${projectInfo.version}\n`;
        result += `**Build Command:** \`${projectInfo.buildCommand}\`\n`;
        result += `**Build Output:** \`${projectInfo.buildOutputDir}\`\n\n`;
        // Add framework-specific details
        if (projectInfo.framework === 'vite') {
            result += `**UI Library:** ${projectInfo.uiLibrary}\n`;
            result += `**Vite Config:** ${projectInfo.viteConfigPath || 'Not found'}\n`;
            if (projectInfo.hasReactRouter) {
                result += `**React Router:** Yes\n`;
            }
            if (projectInfo.hasVueRouter) {
                result += `**Vue Router:** Yes\n`;
            }
        }
        if (projectInfo.framework === 'nextjs') {
            result += `**Router Type:** ${projectInfo.routerType === 'app' ? 'App Router (app/)' : projectInfo.routerType === 'pages' ? 'Pages Router (pages/)' : 'Unknown'}\n`;
            result += `**API Routes:** ${projectInfo.hasApiRoutes ? 'Yes ⚠️' : 'No'}\n`;
            result += `**Static Export:** ${projectInfo.isStaticExport ? 'Enabled ✓' : 'Not configured ⚠️'}\n\n`;
            if (!projectInfo.isStaticExport) {
                result += `> ⚠️ **Important:** Next.js requires static export for Capacitor.\n`;
                result += `> Add \`output: 'export'\` to next.config.js\n\n`;
            }
            if (projectInfo.hasApiRoutes) {
                result += `> ⚠️ **Warning:** API routes detected. These won't work with static export.\n`;
                result += `> Consider moving to external backend (Supabase, Firebase, etc.)\n\n`;
            }
        }
        // CRA support coming soon
        // if (projectInfo.framework === 'cra') {
        //   result += `**React Router:** ${projectInfo.hasReactRouter ? 'Yes' : 'No'}\n`;
        // }
        result += `\n**Capacitor Compatibility:** ${isCapacitorReady(projectInfo) ? '✓ Ready' : '⚠️ Needs configuration'}`;
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Error detecting framework: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
/**
 * Check if project is ready for Capacitor
 */
function isCapacitorReady(projectInfo) {
    if (projectInfo.framework === 'nextjs') {
        return projectInfo.isStaticExport && !projectInfo.hasApiRoutes;
    }
    // Vite and CRA are generally ready
    return true;
}
//# sourceMappingURL=detect-framework.js.map