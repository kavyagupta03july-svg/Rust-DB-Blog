import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { INITIAL_ARTICLES } from './src/data/articlesData.ts';
import {
  filterAndSortArticles,
  calculateReadingTimeMinutes,
  createSeoSlug,
  toggleBookmarkId,
} from './src/utils/blogLogic.ts';
import type { Article, ArticleCategory, UserSession } from './src/types/blog.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-memory persistent store for runtime session (seeded with INITIAL_ARTICLES)
const articlesStore: Article[] = [...INITIAL_ARTICLES];
const userBookmarksStore = new Map<string, string[]>();
userBookmarksStore.set('default-user', ['art-rustdb-storage-internals', 'art-chatgpt6-moe-inference']);

const activeUsers = new Map<string, UserSession>();
const defaultSession: UserSession = {
  id: 'usr-architect-01',
  name: 'Alex Rivera',
  email: 'alex.rivera@nextgentech.dev',
  role: 'Staff Systems Architect',
  token: 'ngt-session-token-2026',
};
activeUsers.set(defaultSession.token, defaultSession);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '2mb' }));

  // Health & API Architecture Metadata
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      engine: 'NextGen Tech API Gateway (Node/Express + Rust/Axum Parity Specification)',
      articlesCount: articlesStore.length,
    });
  });

  // GET /api/articles - Supports category, q (search), bookmarkedOnly, sortBy
  app.get('/api/articles', (req, res) => {
    const category = (req.query.category as ArticleCategory | 'All') || 'All';
    const searchQuery = (req.query.q as string) || '';
    const onlyBookmarked = req.query.bookmarked === 'true';
    const sortBy =
      (req.query.sortBy as 'latest' | 'reading-time-asc' | 'reading-time-desc') || 'latest';
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    const bookmarkedIds = userBookmarksStore.get(userId) || [];

    const results = filterAndSortArticles(articlesStore, {
      category,
      searchQuery,
      onlyBookmarked,
      bookmarkedIds,
      sortBy,
    });

    res.json({
      articles: results,
      total: results.length,
      bookmarkedIds,
    });
  });

  // GET /api/articles/:slug
  app.get('/api/articles/:slug', (req, res) => {
    const article = articlesStore.find(
      (a) => a.slug === req.params.slug || a.id === req.params.slug
    );
    if (!article) {
      res.status(404).json({ error: 'Article not found' });
      return;
    }
    res.json({ article });
  });

  // POST /api/articles - Create new technical article
  app.post('/api/articles', (req, res) => {
    const { title, excerpt, category, authorName, authorRole, contentParagraphs, codeSnippet, tags } =
      req.body || {};

    if (!title || typeof title !== 'string' || title.trim().length < 5) {
      res.status(400).json({ error: 'A valid article title (min 5 characters) is required.' });
      return;
    }
    if (!excerpt || typeof excerpt !== 'string' || excerpt.trim().length < 15) {
      res.status(400).json({ error: 'A concise technical excerpt (min 15 characters) is required.' });
      return;
    }
    if (!category) {
      res.status(400).json({ error: 'Article category is required.' });
      return;
    }

    const slug = createSeoSlug(title) + '-' + Date.now().toString().slice(-4);
    const paragraphs: string[] = Array.isArray(contentParagraphs)
      ? contentParagraphs.filter((p: string) => p.trim().length > 0)
      : [String(contentParagraphs || excerpt)];

    const fullText = [title, excerpt, ...paragraphs].join(' ');
    const codeLines = codeSnippet?.code ? String(codeSnippet.code).split('\n').length : 0;
    const readingTimeMinutes = calculateReadingTimeMinutes(fullText, codeLines);

    const newArticle: Article = {
      id: `art-${Date.now()}`,
      slug,
      title: title.trim(),
      excerpt: excerpt.trim(),
      category: category as ArticleCategory,
      publishedAt: new Date().toISOString().split('T')[0],
      readingTimeMinutes,
      imageUrl: '/src/assets/images/article_ai_neural_architecture_1794819739892.jpg',
      imageAlt: `${title.trim()} technical illustration`,
      author: {
        name: (authorName || 'Alex Rivera').trim(),
        role: (authorRole || 'Staff Systems Architect').trim(),
        bio: 'Systems contributor publishing on NextGen Tech.',
        avatarInitials: (authorName || 'AR')
          .split(' ')
          .map((n: string) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2),
        githubHandle: 'nextgen-contributor',
      },
      tags: Array.isArray(tags) && tags.length > 0 ? tags : [category, 'Systems Architecture'],
      keyTakeaways: [
        excerpt.trim(),
        'Published via the NextGen Tech REST API article management system.',
      ],
      sections: [
        {
          id: 'section-overview',
          heading: '1. Architectural Overview & Implementation',
          paragraphs,
          ...(codeSnippet && codeSnippet.code
            ? {
                codeSnippet: {
                  language: codeSnippet.language || 'rust',
                  filename: codeSnippet.filename || 'implementation.rs',
                  code: codeSnippet.code,
                },
              }
            : {}),
        },
      ],
    };

    articlesStore.unshift(newArticle);
    res.status(201).json({ article: newArticle });
  });

  // GET /api/bookmarks
  app.get('/api/bookmarks', (req, res) => {
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    const bookmarkedIds = userBookmarksStore.get(userId) || [];
    res.json({ bookmarkedIds });
  });

  // POST /api/bookmarks/toggle
  app.post('/api/bookmarks/toggle', (req, res) => {
    const { articleId } = req.body || {};
    if (!articleId || typeof articleId !== 'string') {
      res.status(400).json({ error: 'articleId is required' });
      return;
    }
    const userId = (req.headers['x-user-id'] as string) || 'default-user';
    const current = userBookmarksStore.get(userId) || [];
    const updated = toggleBookmarkId(current, articleId);
    userBookmarksStore.set(userId, updated);
    res.json({ bookmarkedIds: updated });
  });

  // POST /api/auth/login - Session authentication endpoint
  app.post('/api/auth/login', (req, res) => {
    const { email, name } = req.body || {};
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      res.status(400).json({ error: 'Please enter a valid engineering email address.' });
      return;
    }
    const cleanName =
      typeof name === 'string' && name.trim().length > 1
        ? name.trim()
        : email.split('@')[0].replace(/[._-]/g, ' ');

    const session: UserSession = {
      id: `usr-${Date.now()}`,
      name: cleanName,
      email: email.trim().toLowerCase(),
      role: 'Staff Systems Architect',
      token: `ngt-token-${Date.now()}`,
    };
    activeUsers.set(session.token, session);
    res.json({ session });
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NextGen Tech server running on http://localhost:${PORT}`);
  });
}

startServer();
