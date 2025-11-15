/**
 * iOS Migration Specification Generator
 */

import { AnyProjectInfo, GenerateSpecOptions } from '../types/index.js';

/**
 * Generate iOS migration specification
 */
export async function generateMigrationSpec(
  projectInfo: AnyProjectInfo,
  options: GenerateSpecOptions
): Promise<string> {
  const { appName, bundleId, primaryColor } = options;

  const sections = [
    generateHeader(appName, projectInfo),
    generateProjectOverview(projectInfo),
    generateCapacitorSetup(projectInfo, appName, bundleId),
    generateFrameworkSpecificSteps(projectInfo),
    generateCommonIssues(projectInfo),
    generateBuildSteps(projectInfo),
    generateTestingChecklist(),
    generateNextSteps(primaryColor),
  ];

  return sections.join('\n\n');
}

/**
 * Generate specification header
 */
function generateHeader(appName: string, projectInfo: AnyProjectInfo): string {
  return `# iOS Migration Specification: ${appName}

Generated: ${new Date().toISOString()}
Framework: ${projectInfo.framework.toUpperCase()}
Version: ${projectInfo.version}

---`;
}

/**
 * Generate project overview section
 */
function generateProjectOverview(projectInfo: AnyProjectInfo): string {
  let overview = `## Project Overview

- **Framework**: ${projectInfo.framework}
- **Version**: ${projectInfo.version}
- **Build Command**: \`${projectInfo.buildCommand}\`
- **Build Output**: \`${projectInfo.buildOutputDir}\``;

  if (projectInfo.framework === 'vite') {
    overview += `
- **UI Library**: ${projectInfo.uiLibrary}
- **React Router**: ${projectInfo.hasReactRouter ? 'Yes' : 'No'}
- **Vue Router**: ${projectInfo.hasVueRouter ? 'Yes' : 'No'}`;
  }

  if (projectInfo.framework === 'nextjs') {
    overview += `
- **Router Type**: ${projectInfo.routerType === 'app' ? 'App Router' : projectInfo.routerType === 'pages' ? 'Pages Router' : 'Unknown'}
- **API Routes**: ${projectInfo.hasApiRoutes ? 'Yes (⚠️ Requires backend setup)' : 'No'}
- **Static Export**: ${projectInfo.isStaticExport ? 'Yes ✓' : 'No (⚠️ Required for Capacitor)'}`;
  }

  if (projectInfo.framework === 'cra') {
    overview += `
- **React Router**: ${projectInfo.hasReactRouter ? 'Yes' : 'No'}`;
  }

  return overview;
}

/**
 * Generate Capacitor setup instructions
 */
function generateCapacitorSetup(
  projectInfo: AnyProjectInfo,
  appName: string,
  bundleId: string
): string {
  return `## Capacitor Setup

### 1. Install Capacitor

\`\`\`bash
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios
\`\`\`

### 2. Initialize Capacitor

\`\`\`bash
npx cap init "${appName}" "${bundleId}" --web-dir="${projectInfo.buildOutputDir}"
\`\`\`

### 3. Add iOS Platform

\`\`\`bash
npx cap add ios
\`\`\``;
}

/**
 * Generate framework-specific migration steps
 */
function generateFrameworkSpecificSteps(projectInfo: AnyProjectInfo): string {
  if (projectInfo.framework === 'nextjs') {
    return generateNextJsSteps(projectInfo);
  }

  if (projectInfo.framework === 'vite') {
    return generateViteSteps(projectInfo);
  }

  if (projectInfo.framework === 'cra') {
    return generateCRASteps(projectInfo);
  }

  return '';
}

/**
 * Generate Next.js specific steps
 */
function generateNextJsSteps(projectInfo: AnyProjectInfo): string {
  if (projectInfo.framework !== 'nextjs') return '';

  let steps = `## Next.js Specific Configuration

### 1. Enable Static Export

${projectInfo.isStaticExport ? '✓ Static export is already enabled.' : '⚠️ **CRITICAL**: You must enable static export for Capacitor.'}

${!projectInfo.isStaticExport ? `Edit \`next.config.js\`:

\`\`\`javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true, // Required for static export
  },
};

module.exports = nextConfig;
\`\`\`

` : ''}### 2. Handle Dynamic Features

${projectInfo.hasApiRoutes ? `⚠️ **API Routes Detected**: API routes don't work with static export.
Options:
- Move API logic to external backend (Supabase, Firebase, etc.)
- Use serverless functions (Vercel, Netlify)
- Create separate backend service` : '✓ No API routes detected.'}

${projectInfo.routerType === 'app' ? `
### 3. App Router Considerations

- Remove server components that use \`fetch\` at build time
- Convert \`generateStaticParams\` for all dynamic routes
- Use \`getStaticProps\` pattern with static data` : ''}

${projectInfo.routerType === 'pages' ? `
### 3. Pages Router Considerations

- Replace \`getServerSideProps\` with \`getStaticProps\`
- Ensure all dynamic routes have \`getStaticPaths\`
- Remove API routes or move to external service` : ''}`;

  return steps;
}

/**
 * Generate Vite specific steps
 */
function generateViteSteps(projectInfo: AnyProjectInfo): string {
  if (projectInfo.framework !== 'vite') return '';

  return `## Vite Specific Configuration

### 1. Base Path Configuration

Update \`vite.config.${projectInfo.viteConfigPath?.split('.').pop() || 'ts'}\`:

\`\`\`typescript
export default defineConfig({
  base: './', // Important for mobile
  build: {
    outDir: '${projectInfo.buildOutputDir}',
  },
});
\`\`\`

### 2. Environment Variables

Vite uses \`import.meta.env\`:
- Prefix with \`VITE_\` for client-side variables
- Create \`.env.production\` for production builds

### 3. Router Configuration

${projectInfo.hasReactRouter ? `**React Router detected**:
\`\`\`typescript
import { BrowserRouter } from 'react-router-dom';

// Use BrowserRouter (hash routing not needed for Capacitor)
<BrowserRouter>
  <App />
</BrowserRouter>
\`\`\`` : ''}

${projectInfo.hasVueRouter ? `**Vue Router detected**:
\`\`\`typescript
import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(), // Use web history
  routes,
});
\`\`\`` : ''}`;
}

/**
 * Generate CRA specific steps
 */
function generateCRASteps(projectInfo: AnyProjectInfo): string {
  if (projectInfo.framework !== 'cra') return '';

  return `## Create React App Configuration

### 1. Environment Variables

- Use \`REACT_APP_\` prefix for client-side variables
- Create \`.env.production\` for production

### 2. Homepage Configuration

Update \`package.json\`:

\`\`\`json
{
  "homepage": "."
}
\`\`\`

${projectInfo.hasReactRouter ? `### 3. Router Configuration

\`\`\`typescript
import { BrowserRouter } from 'react-router-dom';

<BrowserRouter>
  <App />
</BrowserRouter>
\`\`\`` : ''}`;
}

/**
 * Generate common issues section
 */
function generateCommonIssues(_projectInfo: AnyProjectInfo): string {
  return `## Common Issues & Solutions

### 1. CORS and API Calls

⚠️ Mobile apps don't have CORS restrictions, but:
- Use absolute URLs for API calls
- Configure proper authentication headers
- Test with actual backend endpoints

### 2. Local Storage & Cookies

✓ Works normally in Capacitor
- Consider using Capacitor Storage for sensitive data
- \`@capacitor/preferences\` for persistent storage

### 3. File Access & Camera

Add Capacitor plugins as needed:

\`\`\`bash
npm install @capacitor/camera @capacitor/filesystem
\`\`\`

### 4. Deep Linking

Configure URL schemes in \`capacitor.config.ts\`:

\`\`\`typescript
{
  server: {
    androidScheme: 'https'
  }
}
\`\`\`

### 5. Safe Area & Notch

Add viewport meta tag and CSS:

\`\`\`css
body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
          env(safe-area-inset-bottom) env(safe-area-inset-left);
}
\`\`\``;
}

/**
 * Generate build steps
 */
function generateBuildSteps(projectInfo: AnyProjectInfo): string {
  return `## Build & Deploy Steps

### 1. Build Web Assets

\`\`\`bash
${projectInfo.buildCommand}
\`\`\`

### 2. Sync with Capacitor

\`\`\`bash
npx cap sync ios
\`\`\`

### 3. Open in Xcode

\`\`\`bash
npx cap open ios
\`\`\`

### 4. Configure in Xcode

- Set development team (Signing & Capabilities)
- Configure app icons and splash screens
- Set deployment target (iOS 13.0+)
- Add required permissions to Info.plist

### 5. Build & Run

- Select device/simulator
- Click Run (⌘R) or Build (⌘B)`;
}

/**
 * Generate testing checklist
 */
function generateTestingChecklist(): string {
  return `## Testing Checklist

- [ ] App launches without crashes
- [ ] Navigation works correctly
- [ ] API calls succeed
- [ ] Authentication flows work
- [ ] Local storage persists
- [ ] Images and assets load
- [ ] Forms submit properly
- [ ] Responsive layout on different screen sizes
- [ ] Status bar and safe area handled
- [ ] Back button behavior correct`;
}

/**
 * Generate next steps
 */
function generateNextSteps(primaryColor?: string): string {
  return `## Next Steps

1. **App Icon & Splash Screen**
   - Use \`@capacitor/assets\` for generation
   - Prepare 1024x1024 icon${primaryColor ? ` (use ${primaryColor} as primary color)` : ''}

2. **App Store Preparation**
   - Create App Store Connect listing
   - Prepare screenshots (6.5", 5.5")
   - Write app description and keywords

3. **Testing**
   - Test on physical device
   - Submit to TestFlight for beta testing

4. **Performance Optimization**
   - Minimize bundle size
   - Optimize images
   - Enable code splitting

---

**Generated by web-to-ios-mcp**`;
}
