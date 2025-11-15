/**
 * Vite project detector
 */

import path from 'path';
import { ViteProjectInfo, UILibrary } from '../types/index.js';
import { readPackageJson, fileExists, safeReadFile } from '../utils/file.js';

/**
 * Detect if a project is using Vite
 */
export async function detectViteProject(
  projectPath: string
): Promise<ViteProjectInfo | null> {
  const packageJson = await readPackageJson(projectPath);

  if (!packageJson) {
    return null;
  }

  // Check for Vite dependency
  const viteVersion =
    packageJson.dependencies?.vite ||
    packageJson.devDependencies?.vite;

  if (!viteVersion) {
    return null;
  }

  // Detect UI library
  const uiLibrary = detectUILibrary(packageJson);

  // Find Vite config file
  const viteConfigPath = await findViteConfig(projectPath);

  // Detect build output directory
  const buildOutputDir = await detectBuildOutputDir(projectPath, viteConfigPath);

  // Detect routing libraries
  const hasReactRouter = !!(
    packageJson.dependencies?.['react-router-dom'] ||
    packageJson.devDependencies?.['react-router-dom'] ||
    packageJson.dependencies?.['react-router'] ||
    packageJson.devDependencies?.['react-router']
  );

  const hasVueRouter = !!(
    packageJson.dependencies?.['vue-router'] ||
    packageJson.devDependencies?.['vue-router']
  );

  // Get build command
  const buildCommand = packageJson.scripts?.build || 'vite build';

  return {
    framework: 'vite',
    version: viteVersion,
    uiLibrary,
    viteConfigPath,
    buildCommand,
    buildOutputDir,
    hasReactRouter,
    hasVueRouter,
  };
}

/**
 * Detect UI library from package.json
 */
function detectUILibrary(packageJson: any): UILibrary {
  const deps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  if (deps.react) return 'react';
  if (deps.vue) return 'vue';
  if (deps.svelte) return 'svelte';
  if (deps['@angular/core']) return 'angular';

  return 'unknown';
}

/**
 * Find Vite config file
 */
async function findViteConfig(projectPath: string): Promise<string | null> {
  const configNames = [
    'vite.config.ts',
    'vite.config.js',
    'vite.config.mjs',
    'vite.config.cjs',
  ];

  for (const name of configNames) {
    const configPath = path.join(projectPath, name);
    if (await fileExists(configPath)) {
      return name;
    }
  }

  return null;
}

/**
 * Detect build output directory from Vite config
 */
async function detectBuildOutputDir(
  projectPath: string,
  viteConfigPath: string | null
): Promise<string> {
  // Default Vite output directory
  let outputDir = 'dist';

  if (!viteConfigPath) {
    return outputDir;
  }

  const configPath = path.join(projectPath, viteConfigPath);
  const configContent = await safeReadFile(configPath);

  if (!configContent) {
    return outputDir;
  }

  // Simple regex to find outDir in config
  // Example: build: { outDir: 'build' }
  const match = configContent.match(/outDir\s*:\s*['"]([^'"]+)['"]/);

  if (match && match[1]) {
    outputDir = match[1];
  }

  return outputDir;
}
