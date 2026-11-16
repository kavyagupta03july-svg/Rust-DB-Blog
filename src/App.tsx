import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ArrowUp,
  Menu,
  X,
  SlidersHorizontal,
  RotateCcw,
  Github,
  Linkedin,
  Mail,
} from 'lucide-react';
import { INITIAL_ARTICLES } from './data/articlesData';
import { ALL_CATEGORIES, type Article, type ArticleCategory } from './types/blog';
import { filterAndSortArticles } from './utils/blogLogic';
import { Hero3DScene } from './components/Hero3DScene';
import { ArticleCard } from './components/ArticleCard';
import { ArticleReaderView } from './components/ArticleReaderView';
import { CodePlayground } from './components/CodePlayground';
import { CssAnimationLab } from './components/CssAnimationLab';
import { RustDbSection } from './components/RustDbSection';

const THEME_STORAGE_KEY = 'nextgen_tech_theme_v1';

const DYNAMIC_TITLE_PHRASES = [
  'RustDB Storage Kernels',
  'Live Code & Output Video',
  'B+Tree Slotted Pages',
  'MVCC Snapshot Isolation',
  '3D Spatial WebGL Systems',
] as const;

export default function App() {
  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [selectedCategory, setSelectedCategory] = useState<ArticleCategory | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'latest' | 'reading-time-asc' | 'reading-time-desc'>('latest');

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === 'light' || saved === 'dark') return saved;
    } catch {
      // ignore
    }
    return 'dark';
  });

  const [activeArticle, setActiveArticle] = useState<Article | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const [showBackToTop, setShowBackToTop] = useState<boolean>(false);

  // Dynamic Changing Title state (both on-page Hero & Browser document.title)
  const [phraseIndex, setPhraseIndex] = useState<number>(0);
  const [activeSectionLabel, setActiveSectionLabel] = useState<string>('RustDB Studio');
  const [isTabHidden, setIsTabHidden] = useState<boolean>(false);

  const currentDynamicPhrase = DYNAMIC_TITLE_PHRASES[phraseIndex];

  const handleCyclePhrase = () => {
    setPhraseIndex((prev) => (prev + 1) % DYNAMIC_TITLE_PHRASES.length);
  };

  // Auto-cycle dynamic title phrase every 3.2 seconds
  useEffect(() => {
    const timer = window.setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % DYNAMIC_TITLE_PHRASES.length);
    }, 3200);
    return () => window.clearInterval(timer);
  }, []);

  // Track browser tab visibility for dynamic title switching
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsTabHidden(document.hidden);
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, []);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Sync articles with backend REST API on mount (Vercel static-safe)
  useEffect(() => {
    let mounted = true;
    fetch('/api/articles')
      .then((res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.ok && contentType.includes('application/json')) {
          return res.json();
        }
        return null;
      })
      .then((data) => {
        if (mounted && data && Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles(data.articles);
        }
      })
      .catch(() => {
        // Keep deterministic INITIAL_ARTICLES fallback on static Vercel deployments
      });

    // Check URL query parameter for direct article reading view
    const params = new URLSearchParams(window.location.search);
    const slugParam = params.get('article');
    if (slugParam) {
      const found = INITIAL_ARTICLES.find((a) => a.slug === slugParam || a.id === slugParam);
      if (found) setActiveArticle(found);
    }

    return () => {
      mounted = false;
    };
  }, []);

  // Global scroll progress, back-to-top visibility, and active section detection
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, Math.round((y / max) * 100)) : 0);
      setShowBackToTop(y > 520);

      // Detect active section for dynamic document title
      const sections: { id: string; label: string }[] = [
        { id: 'css-lab', label: 'CSS3 3D Animation Lab' },
        { id: 'playground', label: 'Interactive Code Playground' },
        { id: 'articles', label: 'RustDB Engineering Articles' },
        { id: 'rustdb', label: 'RustDB Live Code Studio' },
      ];

      if (y < 420) {
        setActiveSectionLabel('Explore the Future of Technology');
        return;
      }

      for (const sec of sections) {
        const el = document.getElementById(sec.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 240) {
            setActiveSectionLabel(sec.label);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Update dynamic document.title based on active article, tab visibility, scrolled section, and cycling phrase
  useEffect(() => {
    if (isTabHidden) {
      document.title = `⚡ Live RustDB Studio Ready | NextGen Tech`;
      return;
    }
    if (activeArticle) {
      document.title = `${activeArticle.title} | NextGen Tech · RustDB`;
      return;
    }
    if (selectedCategory !== 'All') {
      document.title = `${selectedCategory} Dispatches | NextGen Tech · RustDB`;
      return;
    }
    document.title = `${currentDynamicPhrase} · ${activeSectionLabel} | NextGen Tech`;
  }, [activeArticle, isTabHidden, selectedCategory, currentDynamicPhrase, activeSectionLabel]);

  const filteredArticles = useMemo(
    () =>
      filterAndSortArticles(articles, {
        category: selectedCategory,
        searchQuery,
        onlyBookmarked: false,
        bookmarkedIds: [],
        sortBy,
      }),
    [articles, selectedCategory, searchQuery, sortBy]
  );

  const scrollToSection = (sectionId: string) => {
    setActiveArticle(null);
    setMobileMenuOpen(false);
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 40);
  };

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSearchQuery('');
    setSortBy('latest');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-[#060913] dark:text-slate-100 transition-colors duration-200">
      {/* Top Viewport Scroll Progress Line */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-transparent pointer-events-none">
        <div
          className="h-full bg-blue-600 dark:bg-sky-400 transition-all duration-100"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#060913]/95 border-b border-slate-200 dark:border-slate-800/90 backdrop-blur-md">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-4 sm:gap-8">
          {/* Zone 1: Brand Web-Icon + Title */}
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              setActiveArticle(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2.5 font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            <img
              src="/favicon.svg"
              alt="NextGen Tech RustDB Web Icon"
              className="w-7 h-7 rounded-lg shrink-0"
            />
            <span>NextGen Tech · RustDB</span>
          </a>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#rustdb"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('rustdb');
              }}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              RustDB Studio
            </a>
            <a
              href="#articles"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('articles');
              }}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Articles
            </a>
            <a
              href="#playground"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('playground');
              }}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Playground
            </a>
            <a
              href="#css-lab"
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('css-lab');
              }}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              CSS Lab
            </a>
          </nav>

          {/* Zone 3: Mobile Menu Toggle on small viewports */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="md:hidden p-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Responsive Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label="Mobile Navigation"
            className="md:hidden px-4 sm:px-6 py-4 bg-white dark:bg-[#0b101e] border-t border-slate-200 dark:border-slate-800 space-y-2.5"
          >
            {[
              { id: 'rustdb', label: 'RustDB Studio' },
              { id: 'articles', label: 'Articles' },
              { id: 'playground', label: 'Playground' },
              { id: 'css-lab', label: 'CSS Lab' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection(item.id);
                }}
                className="block py-2 text-sm font-medium text-slate-700 dark:text-slate-200"
              >
                {item.label}
              </a>
            ))}
            <button
              type="button"
              onClick={() => {
                setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 text-sm font-medium text-blue-600 dark:text-sky-400"
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </button>
          </nav>
        )}
      </header>

      {/* Main Content Area: Either Dedicated Article Reading View OR Main Spatial Publication */}
      <main className="flex-1">
        {activeArticle ? (
          <ArticleReaderView
            article={activeArticle}
            allArticles={articles}
            onClose={() => setActiveArticle(null)}
            onSelectArticle={(art) => setActiveArticle(art)}
          />
        ) : (
          <>
            {/* 1. Cinematic 3D Hero Environment with Dynamic Changing Title */}
            <Hero3DScene
              onExploreArticles={() => scrollToSection('articles')}
              onDiscoverTech={() => scrollToSection('rustdb')}
              theme={theme}
              onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
              articleCount={articles.length}
              dynamicPhrase={currentDynamicPhrase}
              onCyclePhrase={handleCyclePhrase}
            />

            {/* 2. Dedicated RustDB Video Animation & Storage Architecture Section */}
            <RustDbSection />

            {/* 3. Blog Article Section with All 10 Categories, Search & 3D Tilt Cards */}
            <section
              id="articles"
              aria-labelledby="articles-heading"
              className="scroll-mt-16 py-14 sm:py-20 border-b border-slate-200 dark:border-slate-800/90"
            >
              <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
                {/* Section Header + Search & Sort Controls */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-6 mb-6 sm:mb-8">
                  <div>
                    <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-2">
                      02. RUSTDB &amp; SYSTEMS ENGINEERING DISPATCHES
                    </div>
                    <h2
                      id="articles-heading"
                      className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight"
                    >
                      RustDB Storage Internals &amp; Architecture Research
                    </h2>
                  </div>

                  {/* Search Input & Sort Dropdown (Comfortable full-width stack on mobile, inline on laptop) */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 sm:flex-initial">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="search"
                        aria-label="Search articles by title, topic, or keyword"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search RustDB, AtomicFile, B+Tree, MVCC..."
                        className="pl-9 pr-4 py-2.5 sm:py-2 w-full sm:w-72 rounded-lg bg-white dark:bg-[#0b101e] border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <select
                        aria-label="Sort articles"
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(
                            e.target.value as 'latest' | 'reading-time-asc' | 'reading-time-desc'
                          )
                        }
                        className="w-full sm:w-auto px-3 py-2.5 sm:py-2 rounded-lg bg-white dark:bg-[#0b101e] border border-slate-300 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                      >
                        <option value="latest">Latest Published</option>
                        <option value="reading-time-asc">Quickest Read</option>
                        <option value="reading-time-desc">Deepest Read</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Interactive Category Filter Bar (Horizontally scrollable on mobile, wrapped on laptop) */}
                <div
                  role="tablist"
                  aria-label="Article Categories"
                  className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-200/70 dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800/90 mb-8 sm:mb-10 overflow-x-auto no-scrollbar sm:flex-wrap"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={selectedCategory === 'All'}
                    onClick={() => setSelectedCategory('All')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedCategory === 'All'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Topics ({articles.length})
                  </button>

                  {ALL_CATEGORIES.map((category) => {
                    const active = selectedCategory === category;
                    return (
                      <button
                        key={category}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSelectedCategory(category)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          active
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {category}
                      </button>
                    );
                  })}
                </div>

                {/* Articles Grid or Empty Filter State */}
                {filteredArticles.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                    {filteredArticles.map((article) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        onSelectArticle={(art) => setActiveArticle(art)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center max-w-lg mx-auto">
                    <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-2">
                      No matching engineering dispatches found
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-6">
                      No articles matched your active filter combination ({selectedCategory}
                      {searchQuery ? ` · "${searchQuery}"` : ''}).
                    </p>
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* 4. Real Interactive Coding Playground */}
            <CodePlayground />

            {/* 5. Interactive CSS Animation Lab */}
            <CssAnimationLab />
          </>
        )}
      </main>

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll back to top"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40 p-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Editorial Footer with Web-Icon + GitHub & LinkedIn Social Icons */}
      <footer className="bg-white dark:bg-[#050811] border-t border-slate-200 dark:border-slate-800/90 py-10 sm:py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-3">
            <img
              src="/favicon.svg"
              alt="NextGen Tech RustDB Web Icon"
              className="w-8 h-8 rounded-lg shrink-0 mt-0.5"
            />
            <div>
              <div className="font-display font-bold text-base text-slate-900 dark:text-white">
                NextGen Tech – RustDB &amp; Future Technology Blog
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                RustDB storage internals, live animated code execution, interactive 3D visualizations,
                and systems architecture research.
              </p>
              <a
                href="mailto:kavyagupta03july@gmail.com"
                className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-mono text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors"
                aria-label="Send email to kavyagupta03july@gmail.com"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span>kavyagupta03july@gmail.com</span>
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-slate-600 dark:text-slate-400 w-full md:w-auto justify-between md:justify-end">
            <div className="flex flex-wrap items-center gap-4 sm:gap-6">
              <a
                href="#rustdb"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('rustdb');
                }}
                className="hover:text-slate-900 dark:hover:text-white"
              >
                RustDB Studio
              </a>
              <a
                href="#articles"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('articles');
                }}
                className="hover:text-slate-900 dark:hover:text-white"
              >
                Articles
              </a>
              <a
                href="#playground"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('playground');
                }}
                className="hover:text-slate-900 dark:hover:text-white"
              >
                Code Playground
              </a>
              <a
                href="#css-lab"
                onClick={(e) => {
                  e.preventDefault();
                  scrollToSection('css-lab');
                }}
                className="hover:text-slate-900 dark:hover:text-white"
              >
                CSS Lab
              </a>
            </div>

            {/* Social Profile & Contact Icons: Email, GitHub & LinkedIn */}
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-800">
              <a
                href="mailto:kavyagupta03july@gmail.com"
                aria-label="Email kavyagupta03july@gmail.com"
                title="kavyagupta03july@gmail.com"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="https://github.com/kavyagupta03july-svg"
                data-raw-url="https://github/kavyagupta03july-svg"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub Profile (kavyagupta03july-svg)"
                title="GitHub Profile"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://www.linkedin.com/in/kavya-gupta-465058386?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAb21jcATmSUZwZG9mAmV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp4vBQP3Gw2LJ3gzY-MSKOucf4znj73lQc6-iPtf7nRkZj-867Ar2-WTfnopG_aem_v1Zuog6oOSXDV1uglPnMYw"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Profile (Kavya Gupta)"
                title="LinkedIn Profile"
                className="p-2 rounded-lg bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:text-white hover:bg-blue-600 dark:hover:bg-blue-600 border border-slate-200 dark:border-slate-800 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
