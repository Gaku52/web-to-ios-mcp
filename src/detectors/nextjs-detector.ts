/**
 * Next.js project detector
 */

import path from 'path';
import { promises as fs } from 'fs';
import { NextJsProjectInfo } from '../types/index.js';
import { readPackageJson, safeReadFile } from '../utils/file.js';

/**
 * Detect if a project is using Next.js
 */
export async function detectNextJsProject(
  projectPath: string
): Promise<NextJsProjectInfo | null> {
  const packageJson = await readPackageJson(projectPath);

  if (!packageJson) {
    return null;
  }

  // Check for Next.js dependency
  const nextVersion =
    packageJson.dependencies?.next ||
    packageJson.devDependencies?.next;

  if (!nextVersion) {
    return null;
  }

  // Detect router type (App Router vs Pages Router)
  const routerType = await detectRouterType(projectPath);

  // Check for API routes
  const hasApiRoutes = await detectApiRoutes(projectPath, routerType);

  // Detect if static export is configured
  const isStaticExport = await detectStaticExport(projectPath);

  // Get build command
  const buildCommand = packageJson.scripts?.build || 'next build';

  // Determine build output directory
  const buildOutputDir = isStaticExport ? 'out' : '.next';

  return {
    framework: 'nextjs',
    version: nextVersion,
    routerType,
    hasApiRoutes,
    isStaticExport,
    buildCommand,
    buildOutputDir,
  };
}

/**
 * Detect Next.js router type (App Router vs Pages Router)
 */
async function detectRouterType(
  projectPath: string
): Promise<'app' | 'pages' | 'unknown'> {
  const appDirPath = path.join(projectPath, 'app');
  const pagesDirPath = path.join(projectPath, 'pages');
  const srcAppDirPath = path.join(projectPath, 'src', 'app');
  const srcPagesDirPath = path.join(projectPath, 'src', 'pages');

  const hasAppDir = await isDirectory(appDirPath) || await isDirectory(srcAppDirPath);
  const hasPagesDir = await isDirectory(pagesDirPath) || await isDirectory(srcPagesDirPath);

  // App Router takes priority if both exist
  if (hasAppDir) {
    return 'app';
  }

  if (hasPagesDir) {
    return 'pages';
  }

  return 'unknown';
}

/**
 * Detect if project has API routes
 */
async function detectApiRoutes(
  projectPath: string,
  routerType: 'app' | 'pages' | 'unknown'
): Promise<boolean> {
  if (routerType === 'pages') {
    // Check for pages/api directory
    const pagesApiPath = path.join(projectPath, 'pages', 'api');
    const srcPagesApiPath = path.join(projectPath, 'src', 'pages', 'api');

    return await isDirectory(pagesApiPath) || await isDirectory(srcPagesApiPath);
  }

  if (routerType === 'app') {
    // Check for route.ts/route.js files in app directory
    const appDirPath = path.join(projectPath, 'app');
    const srcAppDirPath = path.join(projectPath, 'src', 'app');

    const hasApiInApp = await hasRouteFiles(appDirPath);
    const hasApiInSrcApp = await hasRouteFiles(srcAppDirPath);

    return hasApiInApp || hasApiInSrcApp;
  }

  return false;
}

/**
 * Check if directory contains route.ts or route.js files (App Router API routes)
 */
async function hasRouteFiles(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true, recursive: true });

    return entries.some(entry =>
      entry.isFile() &&
      (entry.name === 'route.ts' || entry.name === 'route.js')
    );
  } catch {
    return false;
  }
}

/**
 * Detect if static export is configured
 */
async function detectStaticExport(projectPath: string): Promise<boolean> {
  const configNames = [
    'next.config.js',
    'next.config.mjs',
    'next.config.ts',
  ];

  for (const name of configNames) {
    const configPath = path.join(projectPath, name);
    const configContent = await safeReadFile(configPath);

    if (!configContent) {
      continue;
    }

    // Check for output: 'export' configuration
    // Matches: output: 'export' or output:"export"
    if (/output\s*:\s*['"]export['"]/.test(configContent)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if path is a directory
 */
async function isDirectory(dirPath: string): Promise<boolean> {
  try {
    const stats = await fs.stat(dirPath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}
