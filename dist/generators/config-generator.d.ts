/**
 * Capacitor Configuration Generator
 */
import { CapacitorConfigOptions } from '../types/index.js';
/**
 * Generate capacitor.config.ts content
 */
export declare function generateCapacitorConfig(options: CapacitorConfigOptions): string;
/**
 * Generate package.json scripts for Capacitor
 */
export declare function generateCapacitorScripts(framework: string): Record<string, string>;
/**
 * Generate iOS Info.plist permissions template
 */
export declare function generateInfoPlistPermissions(): string;
/**
 * Generate .gitignore entries for Capacitor
 */
export declare function generateGitignoreEntries(): string;
/**
 * Generate complete setup guide
 */
export declare function generateSetupGuide(options: CapacitorConfigOptions): string;
//# sourceMappingURL=config-generator.d.ts.map