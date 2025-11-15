/**
 * Web to iOS MCP - Type Definitions
 */
/**
 * Supported web frameworks
 */
export type FrameworkType = 'vite' | 'nextjs' | 'cra' | 'unknown';
/**
 * UI libraries
 */
export type UILibrary = 'react' | 'vue' | 'svelte' | 'angular' | 'unknown';
/**
 * Base project information
 */
export interface ProjectInfo {
    framework: FrameworkType;
    version: string;
    buildCommand: string;
    buildOutputDir: string;
}
/**
 * Vite-specific project information
 */
export interface ViteProjectInfo extends ProjectInfo {
    framework: 'vite';
    uiLibrary: UILibrary;
    viteConfigPath: string | null;
    hasReactRouter: boolean;
    hasVueRouter: boolean;
}
/**
 * Next.js-specific project information
 */
export interface NextJsProjectInfo extends ProjectInfo {
    framework: 'nextjs';
    routerType: 'app' | 'pages' | 'unknown';
    hasApiRoutes: boolean;
    isStaticExport: boolean;
}
/**
 * Create React App project information
 */
export interface CRAProjectInfo extends ProjectInfo {
    framework: 'cra';
    hasReactRouter: boolean;
}
/**
 * Union type for all project info
 */
export type AnyProjectInfo = ViteProjectInfo | NextJsProjectInfo | CRAProjectInfo;
/**
 * Options for generating iOS migration spec
 */
export interface GenerateSpecOptions {
    projectPath: string;
    appName: string;
    bundleId: string;
    primaryColor?: string;
}
/**
 * Options for generating Capacitor config
 */
export interface CapacitorConfigOptions {
    appName: string;
    appId: string;
    webDir: string;
    framework: FrameworkType;
    primaryColor?: string;
}
/**
 * Detection result
 */
export interface DetectionResult {
    success: boolean;
    projectInfo?: AnyProjectInfo;
    error?: string;
    suggestions?: string[];
}
//# sourceMappingURL=index.d.ts.map