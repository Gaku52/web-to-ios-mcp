/**
 * MCP Resources for web-to-ios-mcp
 * Provides documentation and guides as MCP resources
 */
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * Load the Implementation Guide from IMPLEMENTATION_GUIDE.md
 */
export async function loadImplementationGuide() {
    const filePath = path.join(__dirname, '../../IMPLEMENTATION_GUIDE.md');
    return await fs.readFile(filePath, 'utf-8');
}
/**
 * Load the Common Issues guide from COMMON_ISSUES.md
 */
export async function loadCommonIssues() {
    const filePath = path.join(__dirname, '../../COMMON_ISSUES.md');
    return await fs.readFile(filePath, 'utf-8');
}
//# sourceMappingURL=index.js.map