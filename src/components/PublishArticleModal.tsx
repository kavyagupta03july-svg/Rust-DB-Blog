import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { ALL_CATEGORIES, type Article, type ArticleCategory } from '../types/blog';

interface PublishArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticleCreated: (article: Article) => void;
}

export const PublishArticleModal: React.FC<PublishArticleModalProps> = ({
  isOpen,
  onClose,
  onArticleCreated,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ArticleCategory>('RustDB Database Technology');
  const [excerpt, setExcerpt] = useState('');
  const [authorName, setAuthorName] = useState('Alex Rivera');
  const [contentBody, setContentBody] = useState('');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (title.trim().length < 5) {
      setErrorMsg('Please enter an article title with at least 5 characters.');
      return;
    }
    if (excerpt.trim().length < 15) {
      setErrorMsg('Please provide a technical summary of at least 15 characters.');
      return;
    }
    if (contentBody.trim().length < 20) {
      setErrorMsg('Please enter the primary technical article body (min 20 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          excerpt: excerpt.trim(),
          authorName: authorName.trim() || 'Alex Rivera',
          contentParagraphs: contentBody
            .split('\n\n')
            .map((p) => p.trim())
            .filter(Boolean),
          codeSnippet: codeSnippet.trim()
            ? {
                language: 'rust',
                filename: 'src/kernel_module.rs',
                code: codeSnippet.trim(),
              }
            : undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMsg(data.error || 'Failed to publish article.');
        setSubmitting(false);
        return;
      }

      onArticleCreated(data.article);
      setTitle('');
      setExcerpt('');
      setContentBody('');
      setCodeSnippet('');
      setSubmitting(false);
      onClose();
    } catch {
      setErrorMsg('Network error communicating with the REST API.');
      setSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
    >
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600 dark:text-sky-400" />
            <h2
              id="publish-modal-title"
              className="font-display font-bold text-lg text-slate-900 dark:text-white"
            >
              Publish Engineering Dispatch
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/40 text-red-600 dark:text-red-300 text-xs flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label
              htmlFor="article-title-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Article Headline
            </label>
            <input
              id="article-title-input"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Lock-Free MVCC Garbage Collection in RustDB"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="article-category-select"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Category
              </label>
              <select
                id="article-category-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as ArticleCategory)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              >
                {ALL_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="article-author-input"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
              >
                Author Name
              </label>
              <input
                id="article-author-input"
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="article-excerpt-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Executive Summary / Excerpt
            </label>
            <textarea
              id="article-excerpt-input"
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Concise summary of the architectural problem and findings..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="article-body-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Technical Analysis Body
            </label>
            <textarea
              id="article-body-input"
              rows={4}
              value={contentBody}
              onChange={(e) => setContentBody(e.target.value)}
              placeholder="Write full technical paragraphs separated by blank lines..."
              className="w-full px-3.5 py-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="article-code-input"
              className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1"
            >
              Optional Code Implementation (Rust / TypeScript / SQL)
            </label>
            <textarea
              id="article-code-input"
              rows={3}
              value={codeSnippet}
              onChange={(e) => setCodeSnippet(e.target.value)}
              placeholder="pub fn verify_page_checksum(page: &[u8]) -> bool { ... }"
              className="w-full px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-sky-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Publishing...' : 'Publish Dispatch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
