import React, { useState } from 'react';
import { ArrowUpRight, Cpu } from 'lucide-react';
import type { Article } from '../types/blog';

interface ArticleCardProps {
  article: Article;
  onSelectArticle: (article: Article) => void;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({
  article,
  onSelectArticle,
}) => {
  const [imgFailed, setImgFailed] = useState(false);
  const [tiltTransform, setTiltTransform] = useState('perspective(900px) rotateX(0deg) rotateY(0deg)');

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateX = (-y * 5.5).toFixed(2);
    const rotateY = (x * 5.5).toFixed(2);
    setTiltTransform(`perspective(900px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-3px)`);
  };

  const handleMouseLeave = () => {
    setTiltTransform('perspective(900px) rotateX(0deg) rotateY(0deg) translateY(0px)');
  };

  return (
    <article
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transform: tiltTransform }}
      className="group relative flex flex-col justify-between rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800/90 overflow-hidden transition-transform duration-150 ease-out"
    >
      <div>
        {/* Media Frame with Zero-Broken-Image Fallback */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-900 border-b border-slate-200 dark:border-slate-800/80">
          {!imgFailed ? (
            <img
              src={article.imageUrl}
              alt={article.imageAlt}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-104"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-center">
              <Cpu className="w-8 h-8 text-sky-400 mb-2" />
              <span className="text-xs font-mono text-slate-300">{article.category}</span>
            </div>
          )}

          {/* Measured contrast gradient overlay */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent"
          />
        </div>

        {/* Card Body */}
        <div className="p-6">
          {/* Unboxed Metadata with Typographic Separators (Zero-Pill Discipline) */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
            <span className="font-medium text-blue-600 dark:text-sky-400">{article.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt} className="tabular-nums">
              {article.publishedAt}
            </time>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{article.readingTimeMinutes} min read</span>
          </div>

          <h3 className="font-display font-bold text-lg text-slate-900 dark:text-slate-100 leading-snug mb-2.5 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors">
            <button
              type="button"
              onClick={() => onSelectArticle(article)}
              className="text-left cursor-pointer focus:outline-none"
            >
              {article.title}
            </button>
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        </div>
      </div>

      {/* Card Footer: Author Info & Read More Action */}
      <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/70 flex items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-400 truncate">
          <span className="font-semibold text-slate-900 dark:text-slate-200">
            {article.author.name}
          </span>
          <span aria-hidden="true" className="mx-1.5">
            ·
          </span>
          <span>{article.author.role}</span>
        </div>

        <button
          type="button"
          onClick={() => onSelectArticle(article)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-sky-400 hover:text-blue-500 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>Read Article</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </article>
  );
};
