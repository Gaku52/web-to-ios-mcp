/**
 * Generate iOS migration specification tool
 */
import { detectViteProject } from '../detectors/vite-detector.js';
import { detectNextJsProject } from '../detectors/nextjs-detector.js';
import { generateMigrationSpec } from '../generators/spec-generator.js';
export async function generateSpecTool(args) {
    const { projectPath, appName, bundleId, primaryColor } = args;
    try {
        // Detect project framework
        const viteProject = await detectViteProject(projectPath);
        const nextjsProject = await detectNextJsProject(projectPath);
        const projectInfo = viteProject || nextjsProject;
        if (!projectInfo) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `❌ Could not detect a supported framework in: ${projectPath}\n\nSupported frameworks:\n- Vite (React, Vue, Svelte)\n- Next.js\n\nPlease ensure the project has a valid package.json with framework dependencies.`,
                    },
                ],
            };
        }
        // Generate specification
        const spec = await generateMigrationSpec(projectInfo, {
            projectPath,
            appName,
            bundleId,
            primaryColor,
        });
        return {
            content: [
                {
                    type: 'text',
                    text: spec,
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ Error generating specification: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
        };
    }
}
//# sourceMappingURL=generate-spec.js.map