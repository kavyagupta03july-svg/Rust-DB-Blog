import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterAndSortArticles,
  calculateReadingTimeMinutes,
  toggleBookmarkId,
  createSeoSlug,
  simulateBTreeStorageMetrics,
} from './blogLogic';
import type { Article } from '../types/blog';

const sampleArticles: Article[] = [
  {
    id: 'art-1',
    slug: 'chatgpt-6-multimodal-reasoning',
    title: 'ChatGPT 6 and Sparse Mixture-of-Experts Routing at Scale',
    excerpt: 'Dissecting dynamic token routing and speculative decoding in frontier transformers.',
    category: 'ChatGPT 6',
    publishedAt: '2026-11-10',
    readingTimeMinutes: 9,
    imageUrl: '/test1.jpg',
    imageAlt: 'AI Chip',
    author: {
      name: 'Dr. Elena Rostova',
      role: 'Principal AI Systems Architect',
      bio: 'Distributed inference researcher.',
      avatarInitials: 'ER',
      githubHandle: 'erostova',
    },
    tags: ['MoE', 'Speculative Decoding', 'Transformers'],
    keyTakeaways: ['Dynamic routing cuts FLOPs per token'],
    sections: [
      {
        id: 'sec-1',
        heading: 'Token Routing Topology',
        paragraphs: ['All-to-all communication over NVLink dominates latency.'],
      },
    ],
  },
  {
    id: 'art-2',
    slug: 'rustdb-mvcc-storage-engine',
    title: 'Inside RustDB: Page-Oriented B-Trees and Write-Ahead Logging',
    excerpt: 'How zero-cost abstractions and strict ownership prevent buffer pool data races.',
    category: 'RustDB Database Technology',
    publishedAt: '2026-11-14',
    readingTimeMinutes: 14,
    imageUrl: '/test2.jpg',
    imageAlt: 'RustDB Storage',
    author: {
      name: 'Marcus Vance',
      role: 'Storage Engine Lead',
      bio: 'Database kernel engineer.',
      avatarInitials: 'MV',
      githubHandle: 'mvance-db',
    },
    tags: ['RustDB', 'B-Tree', 'MVCC', 'WAL'],
    keyTakeaways: ['Borrow checker enforces page pin lifetimes'],
    sections: [
      {
        id: 'sec-2',
        heading: 'Slotted Page Layout',
        paragraphs: ['Fixed 8KB pages store tuple offsets from the header downward.'],
      },
    ],
  },
];

test('filterAndSortArticles filters by category and search query accurately', () => {
  const byCategory = filterAndSortArticles(sampleArticles, {
    category: 'RustDB Database Technology',
    searchQuery: '',
  });
  assert.equal(byCategory.length, 1);
  assert.equal(byCategory[0].id, 'art-2');

  const byDeepSectionSearch = filterAndSortArticles(sampleArticles, {
    category: 'All',
    searchQuery: 'NVLink',
  });
  assert.equal(byDeepSectionSearch.length, 1);
  assert.equal(byDeepSectionSearch[0].id, 'art-1');
});

test('filterAndSortArticles respects bookmark filter and sorting order', () => {
  const bookmarkedOnly = filterAndSortArticles(sampleArticles, {
    category: 'All',
    searchQuery: '',
    onlyBookmarked: true,
    bookmarkedIds: ['art-1'],
  });
  assert.equal(bookmarkedOnly.length, 1);
  assert.equal(bookmarkedOnly[0].id, 'art-1');

  const sortedByShortest = filterAndSortArticles(sampleArticles, {
    category: 'All',
    searchQuery: '',
    sortBy: 'reading-time-asc',
  });
  assert.equal(sortedByShortest[0].id, 'art-1');
  assert.equal(sortedByShortest[1].id, 'art-2');
});

test('toggleBookmarkId adds and removes bookmark IDs deterministically', () => {
  const added = toggleBookmarkId(['art-1'], 'art-2');
  assert.deepEqual(added, ['art-1', 'art-2']);

  const removed = toggleBookmarkId(added, 'art-1');
  assert.deepEqual(removed, ['art-2']);
});

test('calculateReadingTimeMinutes and createSeoSlug produce expected outputs', () => {
  const words440 = new Array(440).fill('architecture').join(' ');
  assert.equal(calculateReadingTimeMinutes(words440, 35), 3);
  assert.equal(
    createSeoSlug('RustDB & Axum: High-Concurrency SQL Engine!'),
    'rustdb-axum-high-concurrency-sql-engine'
  );
});

test('simulateBTreeStorageMetrics computes valid B-Tree depth and hit ratio', () => {
  const smallCached = simulateBTreeStorageMetrics({
    totalRows: 50_000,
    pageSizeKb: 8,
    averageRowBytes: 128,
    cacheMemoryMb: 256,
  });
  const largeUncached = simulateBTreeStorageMetrics({
    totalRows: 10_000_000,
    pageSizeKb: 4,
    averageRowBytes: 256,
    cacheMemoryMb: 64,
  });

  assert.ok(smallCached.treeHeight >= 2);
  assert.ok(largeUncached.treeHeight > smallCached.treeHeight);
  assert.ok(smallCached.bufferPoolHitRatioPercent > largeUncached.bufferPoolHitRatioPercent);
  assert.ok(smallCached.estimatedLatencyMicros < largeUncached.estimatedLatencyMicros);
});
