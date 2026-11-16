import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Share2,
  BookOpen,
  Terminal,
  Sliders,
} from 'lucide-react';
import type { Article } from '../types/blog';
import { RustDbVideoStudio } from './RustDbVideoStudio';

interface ArticleReaderViewProps {
  article: Article;
  allArticles: Article[];
  onClose: () => void;
  onSelectArticle: (article: Article) => void;
}

export const ArticleReaderView: React.FC<ArticleReaderViewProps> = ({
  article,
  allArticles,
  onClose,
  onSelectArticle,
}) => {
  const [readingProgress, setReadingProgress] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>(
    article.sections[0]?.id || ''
  );

  // Embedded Interactive Simulation State inside article reading view
  const [simExpertsCount, setSimExpertsCount] = useState(64);
  const [simActiveTopK, setSimActiveTopK] = useState(4);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveSectionId(article.sections[0]?.id || '');
  }, [article.id]);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight =
        document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (docHeight <= 0) {
        setReadingProgress(100);
        return;
      }
      const pct = Math.min(100, Math.max(0, Math.round((window.scrollY / docHeight) * 100)));
      setReadingProgress(pct);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article.id]);

  const currentIndex = allArticles.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? allArticles[currentIndex - 1] : null;
  const nextArticle =
    currentIndex >= 0 && currentIndex < allArticles.length - 1
      ? allArticles[currentIndex + 1]
      : null;

  const relatedArticles = allArticles
    .filter((a) => a.id !== article.id && (a.category === article.category || a.featured))
    .slice(0, 3);

  const handleCopyCode = async (key: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    } catch {
      setCopiedKey(key);
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?article=${encodeURIComponent(article.slug)}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard fallback
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  const computeSavingsPct = Math.round((1 - simActiveTopK / simExpertsCount) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#060913] text-slate-900 dark:text-slate-100 pb-24">
      {/* Sticky Reading Progress Header */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-[#060913]/95 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-[1280px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-sky-400 cursor-pointer whitespace-nowrap shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to All Articles</span>
          </button>

          <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 truncate">
            <BookOpen className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            <span className="truncate max-w-md">{article.title}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">{readingProgress}% read</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-800 hover:border-blue-500 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {shareCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{shareCopied ? 'Link Copied' : 'Share Article'}</span>
            </button>
          </div>
        </div>

        {/* Reading Progress Bar */}
        <div className="w-full h-0.5 bg-slate-200 dark:bg-slate-800">
          <div
            data-testid="reading-progress-bar"
            className="h-full bg-blue-600 dark:bg-sky-400 transition-all duration-150"
            style={{ width: `${readingProgress}%` }}
          />
        </div>
      </div>

      {/* Article Hero Header */}
      <header className="max-w-[1040px] mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
          <span className="font-semibold text-blue-600 dark:text-sky-400">{article.category}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={article.publishedAt} className="tabular-nums">
            Published {article.publishedAt}
          </time>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums">{article.readingTimeMinutes} min read</span>
          <span aria-hidden="true">·</span>
          <span>By {article.author.name}</span>
        </div>

        <h1
          className="font-display font-bold text-slate-900 dark:text-white tracking-tight mb-6"
          style={{ fontSize: 'clamp(2rem, 3.6vw, 3.1rem)', lineHeight: 1.12, textWrap: 'balance' }}
        >
          {article.title}
        </h1>

        <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed mb-8 max-w-3xl">
          {article.excerpt}
        </p>

        {/* Featured Image */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900 aspect-[16/9]">
          <img
            src={article.imageUrl}
            alt={article.imageAlt}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Main 2-Column Layout: Sticky TOC Sidebar + Article Prose & Code */}
      <div className="max-w-[1040px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Table of Contents & Author Sidebar */}
        <aside className="lg:col-span-4 lg:sticky lg:top-20 space-y-6">
          <div className="rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Table of Contents
            </h2>
            <nav aria-label="Article Table of Contents" className="space-y-2">
              {article.sections.map((sec) => (
                <a
                  key={sec.id}
                  href={`#${sec.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveSectionId(sec.id);
                    document.getElementById(sec.id)?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`block text-xs leading-snug py-1 transition-colors ${
                    activeSectionId === sec.id
                      ? 'text-blue-600 dark:text-sky-400 font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {sec.heading}
                </a>
              ))}
            </nav>
          </div>

          {/* Author Profile Box */}
          <div className="rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600 text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                {article.author.avatarInitials}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white">
                  {article.author.name}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {article.author.role}
                </div>
              </div>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
              {article.author.bio}
            </p>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              GitHub: @{article.author.githubHandle}
            </div>
          </div>
        </aside>

        {/* Primary Article Body */}
        <div className="lg:col-span-8 space-y-10">
          {/* Executive Summary / Key Takeaways */}
          <div className="rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
              Architectural Key Takeaways
            </h2>
            <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
              {article.keyTakeaways.map((point, idx) => (
                <li key={idx} className="leading-relaxed">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Article Sections */}
          {article.sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
              <h2 className="font-display font-bold text-2xl text-slate-900 dark:text-white tracking-tight">
                {section.heading}
              </h2>

              {section.paragraphs.map((para, pIdx) => (
                <p
                  key={pIdx}
                  className="text-base text-slate-700 dark:text-slate-300 leading-relaxed"
                >
                  {para}
                </p>
              ))}

              {section.callout && (
                <div className="rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-800 p-5 my-4">
                  <div className="text-xs font-mono font-semibold text-blue-600 dark:text-sky-400 mb-1">
                    {section.callout.title}
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {section.callout.body}
                  </p>
                </div>
              )}

              {section.codeSnippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-[#050811] my-6">
                  <div className="px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                      <Terminal className="w-3.5 h-3.5 text-sky-400" />
                      <span>{section.codeSnippet.filename}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-slate-500">{section.codeSnippet.language}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyCode(section.id, section.codeSnippet?.code || '')
                      }
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                    >
                      {copiedKey === section.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Code</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                    <code>{section.codeSnippet.code}</code>
                  </pre>
                </div>
              )}
            </section>
          ))}

          {/* Embedded RustDB Video Animation showing how the code is written & program output */}
          <div className="my-8">
            <RustDbVideoStudio compact />
          </div>

          {/* Embedded Interactive Architecture Widget inside Article */}
          <div className="rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div>
                <div className="text-xs font-mono text-blue-600 dark:text-sky-400">
                  EMBEDDED INTERACTIVE TELEMETRY SIMULATOR
                </div>
                <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white">
                  Sparse Parameter Routing &amp; Compute Budget Calculator
                </h3>
              </div>
              <Sliders className="w-5 h-5 text-sky-500 shrink-0" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div>
                <label
                  htmlFor="sim-experts-range"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2"
                >
                  Total Routed Experts per Layer:{' '}
                  <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                    {simExpertsCount}
                  </strong>
                </label>
                <input
                  id="sim-experts-range"
                  type="range"
                  min="16"
                  max="128"
                  step="16"
                  value={simExpertsCount}
                  onChange={(e) => setSimExpertsCount(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <label
                  htmlFor="sim-topk-range"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-2"
                >
                  Active Top-K Experts per Token:{' '}
                  <strong className="font-mono text-slate-900 dark:text-white tabular-nums">
                    {simActiveTopK}
                  </strong>
                </label>
                <input
                  id="sim-topk-range"
                  type="range"
                  min="1"
                  max="8"
                  step="1"
                  value={simActiveTopK}
                  onChange={(e) => setSimActiveTopK(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Active FLOP Ratio</div>
                <div className="text-lg font-mono font-bold text-blue-600 dark:text-sky-400 tabular-nums">
                  {((simActiveTopK / simExpertsCount) * 100).toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Compute Saved</div>
                <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {computeSavingsPct}%
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Est. Token Latency</div>
                <div className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {(4.2 + (simActiveTopK / simExpertsCount) * 28).toFixed(1)} ms
                </div>
              </div>
            </div>
          </div>

          {/* Previous / Next Article Navigation */}
          <nav
            aria-label="Previous and Next Articles"
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-slate-200 dark:border-slate-800"
          >
            {prevArticle ? (
              <button
                type="button"
                onClick={() => onSelectArticle(prevArticle)}
                className="p-4 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-1">
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Previous Dispatch</span>
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {prevArticle.title}
                </div>
              </button>
            ) : (
              <div />
            )}

            {nextArticle && (
              <button
                type="button"
                onClick={() => onSelectArticle(nextArticle)}
                className="p-4 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-right transition-colors cursor-pointer"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-end gap-1 mb-1">
                  <span>Next Dispatch</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                  {nextArticle.title}
                </div>
              </button>
            )}
          </nav>

          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="pt-8 border-t border-slate-200 dark:border-slate-800">
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">
                Related Engineering Dispatches
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {relatedArticles.map((rel) => (
                  <button
                    key={rel.id}
                    type="button"
                    onClick={() => onSelectArticle(rel)}
                    className="p-4 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 hover:border-blue-500 text-left transition-colors cursor-pointer"
                  >
                    <div className="text-xs text-blue-600 dark:text-sky-400 mb-1">
                      {rel.category}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-2 mb-2">
                      {rel.title}
                    </div>
                    <div className="text-xs text-slate-500 tabular-nums">
                      {rel.readingTimeMinutes} min read
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
