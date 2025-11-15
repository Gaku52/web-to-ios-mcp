/**
 * File utility functions
 */

import { promises as fs } from 'fs';
import path from 'path';

/**
 * Safely read a file
 * Returns null if file doesn't exist or is too large
 */
export async function safeReadFile(
  filePath: string,
  maxSize: number = 10 * 1024 * 1024 // 10MB
): Promise<string | null> {
  try {
    await fs.access(filePath);

    const stats = await fs.stat(filePath);
    if (stats.size > maxSize) {
      console.warn(`File too large: ${filePath} (${stats.size} bytes)`);
      return null;
    }

    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read and parse JSON file
 */
export async function readJsonFile<T = any>(filePath: string): Promise<T | null> {
  const content = await safeReadFile(filePath);
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content) as T;
  } catch (error) {
    console.error(`Failed to parse JSON: ${filePath}`, error);
    return null;
  }
}

/**
 * Read package.json from a project directory
 */
export async function readPackageJson(projectPath: string): Promise<any | null> {
  const pkgPath = path.join(projectPath, 'package.json');
  return readJsonFile(pkgPath);
}
