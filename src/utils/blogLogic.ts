import type { Article, ArticleCategory } from '../types/blog';

export interface FilterArticlesOptions {
  category: ArticleCategory | 'All';
  searchQuery: string;
  onlyBookmarked?: boolean;
  bookmarkedIds?: string[];
  sortBy?: 'latest' | 'reading-time-asc' | 'reading-time-desc';
}

/**
 * Filters and sorts articles deterministically by category, search query, and bookmarks.
 */
export function filterAndSortArticles(
  articles: Article[],
  options: FilterArticlesOptions
): Article[] {
  const normalizedQuery = options.searchQuery.trim().toLowerCase();
  const bookmarkSet = new Set(options.bookmarkedIds ?? []);

  const filtered = articles.filter((article) => {
    if (options.onlyBookmarked && !bookmarkSet.has(article.id)) {
      return false;
    }

    if (options.category !== 'All' && article.category !== options.category) {
      return false;
    }

    if (!normalizedQuery) {
      return true;
    }

    const inTitle = article.title.toLowerCase().includes(normalizedQuery);
    const inExcerpt = article.excerpt.toLowerCase().includes(normalizedQuery);
    const inCategory = article.category.toLowerCase().includes(normalizedQuery);
    const inAuthor = article.author.name.toLowerCase().includes(normalizedQuery);
    const inTags = article.tags.some((t) => t.toLowerCase().includes(normalizedQuery));
    const inSections = article.sections.some(
      (s) =>
        s.heading.toLowerCase().includes(normalizedQuery) ||
        s.paragraphs.some((p) => p.toLowerCase().includes(normalizedQuery))
    );

    return inTitle || inExcerpt || inCategory || inAuthor || inTags || inSections;
  });

  const sorted = [...filtered];
  const sortBy = options.sortBy ?? 'latest';

  sorted.sort((a, b) => {
    if (sortBy === 'reading-time-asc') {
      return a.readingTimeMinutes - b.readingTimeMinutes;
    }
    if (sortBy === 'reading-time-desc') {
      return b.readingTimeMinutes - a.readingTimeMinutes;
    }
    // Default: latest publication date first
    return b.publishedAt.localeCompare(a.publishedAt);
  });

  return sorted;
}

/**
 * Calculates estimated reading time in minutes from article text and code blocks.
 */
export function calculateReadingTimeMinutes(text: string, codeLinesCount = 0): number {
  const words = text
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const proseMinutes = words / 220;
  const codeMinutes = codeLinesCount / 35;
  return Math.max(1, Math.round(proseMinutes + codeMinutes));
}

/**
 * Toggles an article ID inside a bookmark list cleanly without duplicates.
 */
export function toggleBookmarkId(currentIds: string[], targetId: string): string[] {
  const cleanId = targetId.trim();
  if (!cleanId) return currentIds;
  if (currentIds.includes(cleanId)) {
    return currentIds.filter((id) => id !== cleanId);
  }
  return [...currentIds, cleanId];
}

/**
 * Generates an URL-safe SEO slug from an article title.
 */
export function createSeoSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export interface BTreeSimulationMetrics {
  treeHeight: number;
  pageReadsPerLookup: number;
  leafPageCount: number;
  bufferPoolHitRatioPercent: number;
  estimatedLatencyMicros: number;
}

/**
 * Computes realistic B+Tree page hierarchy and lookup metrics for the RustDB Educational Simulator.
 * Based on standard slotted-page B-Tree mathematics (page size, branching factor, row count, and buffer cache ratio).
 */
export function simulateBTreeStorageMetrics(params: {
  totalRows: number;
  pageSizeKb: 4 | 8 | 16;
  averageRowBytes: number;
  cacheMemoryMb: number;
}): BTreeSimulationMetrics {
  const safeRows = Math.max(100, params.totalRows);
  const pageBytes = params.pageSizeKb * 1024;
  const usablePageBytes = Math.floor(pageBytes * 0.88); // 12% page header & slot array overhead
  const rowsPerLeafPage = Math.max(2, Math.floor(usablePageBytes / Math.max(32, params.averageRowBytes)));
  const leafPageCount = Math.max(1, Math.ceil(safeRows / rowsPerLeafPage));

  // Internal node entry: 16-byte key + 8-byte child page ID = 24 bytes
  const branchingFactor = Math.max(4, Math.floor(usablePageBytes / 24));
  const treeHeight = Math.max(
    1,
    Math.ceil(Math.log(leafPageCount) / Math.log(branchingFactor)) + 1
  );

  const totalTreeSizeMb = (leafPageCount * 1.15 * pageBytes) / (1024 * 1024);
  const rawHitRatio = Math.min(0.998, Math.max(0.15, params.cacheMemoryMb / Math.max(1, totalTreeSizeMb)));
  const bufferPoolHitRatioPercent = Math.round(rawHitRatio * 1000) / 10;

  // Root and upper internal nodes stay pinned in buffer pool; leaf access depends on hit ratio
  const expectedUncachedReads = Math.max(0, (1 - rawHitRatio) * 1.25);
  const pageReadsPerLookup = Math.round((1 + expectedUncachedReads) * 100) / 100;

  // Memory page traversal (~0.35us per level) + NVMe read (~65us per uncached page)
  const estimatedLatencyMicros =
    Math.round((treeHeight * 0.35 + expectedUncachedReads * 65) * 10) / 10;

  return {
    treeHeight,
    pageReadsPerLookup,
    leafPageCount,
    bufferPoolHitRatioPercent,
    estimatedLatencyMicros,
  };
}
