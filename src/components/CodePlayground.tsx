import React, { useState, useMemo } from 'react';
import { Play, RotateCcw, Copy, Check, Code2, Terminal } from 'lucide-react';
import { PLAYGROUND_TEMPLATES } from '../data/playgroundTemplates';

export const CodePlayground: React.FC = () => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    PLAYGROUND_TEMPLATES[0].id
  );
  const currentTemplate = useMemo(
    () =>
      PLAYGROUND_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
      PLAYGROUND_TEMPLATES[0],
    [selectedTemplateId]
  );

  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('js');
  const [htmlCode, setHtmlCode] = useState<string>(PLAYGROUND_TEMPLATES[0].html);
  const [cssCode, setCssCode] = useState<string>(PLAYGROUND_TEMPLATES[0].css);
  const [jsCode, setJsCode] = useState<string>(PLAYGROUND_TEMPLATES[0].js);
  const [compiledDoc, setCompiledDoc] = useState<string>(() =>
    buildSrcDoc(
      PLAYGROUND_TEMPLATES[0].html,
      PLAYGROUND_TEMPLATES[0].css,
      PLAYGROUND_TEMPLATES[0].js
    )
  );
  const [runCount, setRunCount] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  function buildSrcDoc(html: string, css: string, js: string): string {
    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <style>${css}</style>
  </head>
  <body>
    ${html}
    <script>
      try {
        ${js}
      } catch (err) {
        const pre = document.createElement('pre');
        pre.style.cssText = 'position:fixed;bottom:8px;left:8px;right:8px;background:#450a0a;color:#fecaca;padding:10px;border-radius:6px;font-family:monospace;font-size:12px;z-index:9999;';
        pre.textContent = 'Runtime Error: ' + (err && err.message ? err.message : String(err));
        document.body.appendChild(pre);
      }
    </script>
  </body>
</html>`;
  }

  const handleSelectTemplate = (tplId: string) => {
    const found = PLAYGROUND_TEMPLATES.find((t) => t.id === tplId);
    if (!found) return;
    setSelectedTemplateId(found.id);
    setHtmlCode(found.html);
    setCssCode(found.css);
    setJsCode(found.js);
    setCompiledDoc(buildSrcDoc(found.html, found.css, found.js));
    setRunCount((c) => c + 1);
  };

  const handleRunCode = () => {
    setCompiledDoc(buildSrcDoc(htmlCode, cssCode, jsCode));
    setRunCount((c) => c + 1);
  };

  const handleResetCode = () => {
    setHtmlCode(currentTemplate.html);
    setCssCode(currentTemplate.css);
    setJsCode(currentTemplate.js);
    setCompiledDoc(buildSrcDoc(currentTemplate.html, currentTemplate.css, currentTemplate.js));
    setRunCount((c) => c + 1);
  };

  const activeCodeValue =
    activeTab === 'html' ? htmlCode : activeTab === 'css' ? cssCode : jsCode;

  const handleCodeChange = (val: string) => {
    if (activeTab === 'html') setHtmlCode(val);
    else if (activeTab === 'css') setCssCode(val);
    else setJsCode(val);
  };

  const handleCopyActiveCode = async () => {
    try {
      await navigator.clipboard.writeText(activeCodeValue);
    } catch {
      // ignore clipboard fallback
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const lineNumbers = useMemo(() => {
    const count = Math.max(1, activeCodeValue.split('\n').length);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [activeCodeValue]);

  return (
    <section
      id="playground"
      aria-labelledby="playground-heading"
      className="scroll-mt-16 py-20 border-b border-slate-200 dark:border-slate-800/90 bg-slate-100/60 dark:bg-[#080d1a]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-10">
          <div>
            <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-2">
              02. INTERACTIVE SANDBOX ENVIRONMENT
            </div>
            <h2
              id="playground-heading"
              className="font-display font-bold text-3xl text-slate-900 dark:text-white tracking-tight"
            >
              Real-Time Systems &amp; Spatial Code Playground
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-2xl">
              Edit HTML5, CSS3, and ES6+ JavaScript and execute directly inside an isolated
              sandboxed iframe. Switch between 3D projection kernels, slotted-page database
              allocators, and spatial telemetry cards.
            </p>
          </div>

          {/* Preset Template Switcher */}
          <div className="flex flex-wrap items-center gap-2">
            {PLAYGROUND_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  selectedTemplateId === tpl.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-white dark:bg-[#0b101e] text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-800 hover:border-blue-500'
                }`}
              >
                {tpl.name}
              </button>
            ))}
          </div>
        </div>

        {/* Main Playground Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column: Multi-Tab Code Editor */}
          <div className="lg:col-span-6 flex flex-col rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050811] text-slate-100">
            {/* Editor Toolbar */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-1" role="tablist" aria-label="Code Editor Language Tabs">
                {(
                  [
                    { id: 'html', label: 'index.html' },
                    { id: 'css', label: 'styles.css' },
                    { id: 'js', label: 'kernel.js' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyActiveCode}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  {copied ? (
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

                <button
                  type="button"
                  onClick={handleResetCode}
                  className="px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Code</span>
                </button>

                <button
                  type="button"
                  onClick={handleRunCode}
                  className="px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-semibold text-white flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5" fill="currentColor" />
                  <span>Run Code</span>
                </button>
              </div>
            </div>

            {/* Code Input Area with Line Numbers */}
            <div className="relative flex-1 flex min-h-[420px] max-h-[480px] overflow-auto font-mono text-xs">
              <div
                aria-hidden="true"
                className="select-none py-4 px-3 text-right bg-slate-950 text-slate-600 border-r border-slate-800/80 leading-relaxed tabular-nums"
              >
                {lineNumbers.map((n) => (
                  <div key={n}>{n}</div>
                ))}
              </div>
              <textarea
                aria-label={`${activeTab.toUpperCase()} Code Editor`}
                value={activeCodeValue}
                onChange={(e) => handleCodeChange(e.target.value)}
                spellCheck={false}
                className="flex-1 p-4 bg-[#050811] text-sky-100 font-mono text-xs leading-relaxed focus:outline-none resize-none"
              />
            </div>

            {/* Editor Status Footer */}
            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5 text-sky-400" />
                <span>{currentTemplate.category}</span>
              </div>
              <span className="tabular-nums">{lineNumbers.length} lines</span>
            </div>
          </div>

          {/* Right Column: Live Sandboxed Iframe Preview */}
          <div className="lg:col-span-6 flex flex-col rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050811]">
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-mono text-slate-200">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sandboxed Output Frame (allow-scripts)</span>
              </div>
              <span className="text-xs font-mono text-slate-400 tabular-nums">
                Execution #{runCount}
              </span>
            </div>

            <div className="relative flex-1 min-h-[420px] bg-[#050811]">
              <iframe
                key={runCount}
                title="Live Code Playground Sandbox Preview"
                data-testid="playground-preview-iframe"
                sandbox="allow-scripts"
                srcDoc={compiledDoc}
                className="w-full h-full min-h-[420px] border-0"
              />
            </div>

            <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
              <span>{currentTemplate.description}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
