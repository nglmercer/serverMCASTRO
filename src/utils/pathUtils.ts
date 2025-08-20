/**
 * Shared path normalization utility for consistent path handling across components
 */

const ROOT_PATH = '/';
const normalizedPathCache = new Map<string, string>();

/**
 * Normalizes file paths to ensure consistent format across the application.
 * Handles both forward slashes and backslashes, removes duplicates, and ensures proper formatting.
 * 
 * @param path - The path to normalize
 * @returns Normalized path string
 */
export function normalizePath(path: string | undefined | null): string {
  if (!path) return ROOT_PATH;
  
  // Check if we're in a browser environment before accessing window
  const selectedServer = typeof window !== 'undefined' ? (window as any).selectedServer : null;
  
  // Check if we already have this path in cache
  if (normalizedPathCache.has(path)) {
    return normalizedPathCache.get(path)!;
  }

  // 1. Replace all backslashes (\) with forward slashes (/)
  let normalized = path.replace(/\\/g, '/');

  // 2. Remove duplicate slashes (e.g., // -> /)
  normalized = normalized.replace(/\/{2,}/g, '/');
  
  // 3. Remove server name duplications if it exists
  if (selectedServer && selectedServer.trim() !== '') {
    const serverName = selectedServer.trim();
    
    // Split the path into segments to analyze duplications
    const segments = normalized.split('/').filter(segment => segment !== '');
    
    // Remove consecutive duplicate server segments
    const cleanedSegments: string[] = [];
    let lastSegment = '';
    
    for (const segment of segments) {
      // If the current segment is different from the previous one, or it's not the server name, add it
      if (segment !== lastSegment || segment !== serverName) {
        cleanedSegments.push(segment);
      }
      lastSegment = segment;
    }
    
    // Rebuild the path
    normalized = cleanedSegments.length > 0 ? '/' + cleanedSegments.join('/') : ROOT_PATH;
  }

  // 4. Ensure it starts with a slash, unless it's just the root
  if (normalized !== ROOT_PATH && !normalized.startsWith(ROOT_PATH)) {
    normalized = ROOT_PATH + normalized;
  }

  // 5. Remove trailing slash if it's not the root
  if (normalized !== ROOT_PATH && normalized.endsWith('/') && normalized.length > 1) {
    normalized = normalized.slice(0, -1);
  }
  
  // 6. If after all this it's empty (e.g., input was just "//"), return ROOT_PATH
  if (normalized === '' && path && path.length > 0) {
    normalized = ROOT_PATH;
  }

  // Cache the result for future use
  normalizedPathCache.set(path, normalized || ROOT_PATH);
  return normalized || ROOT_PATH;
}

/**
 * Clears the path normalization cache
 */
export function clearPathCache(): void {
  normalizedPathCache.clear();
}

/**
 * Gets the root path constant
 */
export function getRootPath(): string {
  return ROOT_PATH;
}

export { ROOT_PATH };