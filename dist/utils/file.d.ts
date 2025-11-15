/**
 * File utility functions
 */
/**
 * Safely read a file
 * Returns null if file doesn't exist or is too large
 */
export declare function safeReadFile(filePath: string, maxSize?: number): Promise<string | null>;
/**
 * Check if file exists
 */
export declare function fileExists(filePath: string): Promise<boolean>;
/**
 * Read and parse JSON file
 */
export declare function readJsonFile<T = any>(filePath: string): Promise<T | null>;
/**
 * Read package.json from a project directory
 */
export declare function readPackageJson(projectPath: string): Promise<any | null>;
//# sourceMappingURL=file.d.ts.map