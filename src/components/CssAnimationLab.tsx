import React, { useState } from 'react';
import { Check, Copy, Sparkles, ArrowRight, Layers } from 'lucide-react';
import { CSS_ANIMATION_DEMOS } from '../data/cssAnimationsData';
import type { CssAnimationDemo } from '../types/blog';

export const CssAnimationLab: React.FC = () => {
  const [selectedDemo, setSelectedDemo] = useState<CssAnimationDemo>(CSS_ANIMATION_DEMOS[0]);
  const [activeCodeTab, setActiveCodeTab] = useState<'html' | 'css' | 'js'>('css');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [scrollSimProgress, setScrollSimProgress] = useState<number>(0.72);
  const [flippedCard, setFlippedCard] = useState<boolean>(false);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // clipboard fallback
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Renders live hardware-accelerated CSS demonstration inside each card
  const renderLiveDemoStage = (demoId: string) => {
    switch (demoId) {
      case 'css-3d-cube':
        return (
          <div className="relative w-20 h-20" style={{ perspective: '500px' }}>
            <div
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
                animation: 'cubeRotate3D 8s infinite linear',
              }}
            >
              {[
                { label: 'CORE', transform: 'rotateY(0deg) translateZ(40px)' },
                { label: 'RUST', transform: 'rotateY(180deg) translateZ(40px)' },
                { label: 'GPU', transform: 'rotateY(90deg) translateZ(40px)' },
                { label: 'WASM', transform: 'rotateY(-90deg) translateZ(40px)' },
                { label: 'AI', transform: 'rotateX(90deg) translateZ(40px)' },
                { label: 'SQL', transform: 'rotateX(-90deg) translateZ(40px)' },
              ].map((face) => (
                <div
                  key={face.label}
                  style={{ transform: face.transform }}
                  className="absolute inset-0 bg-slate-900/85 border border-sky-400/70 text-sky-300 font-mono text-[10px] font-bold flex items-center justify-center"
                >
                  {face.label}
                </div>
              ))}
            </div>
          </div>
        );

      case 'css-neon-button':
        return (
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-b from-blue-600 to-blue-900 text-white font-semibold text-xs border border-sky-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_0_22px_rgba(56,189,248,0.55)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_0_32px_rgba(56,189,248,0.85)] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer"
          >
            Deploy Compute Cluster
          </button>
        );

      case 'css-animated-gradient':
        return (
          <div
            style={{
              background: 'linear-gradient(-45deg, #0f172a, #1d4ed8, #7c3aed, #0284c7)',
              backgroundSize: '300% 300%',
              animation: 'meshGradientShift 5s ease infinite',
            }}
            className="w-44 h-20 rounded-xl border border-white/20 flex items-center justify-center text-xs font-mono font-semibold text-white shadow-inner"
          >
            SPECTRAL MESH
          </div>
        );

      case 'css-glassmorphism':
        return (
          <div className="relative w-48 h-24 flex items-center justify-center">
            <div className="absolute -left-2 -top-1 w-12 h-12 rounded-full bg-sky-500/80" />
            <div className="absolute right-1 bottom-0 w-14 h-14 rounded-lg rotate-12 bg-violet-600/80" />
            <div className="relative z-10 px-4 py-2.5 rounded-xl bg-slate-900/60 backdrop-blur-md border border-white/20 text-left">
              <div className="text-xs font-semibold text-white">Optical Layer</div>
              <div className="text-[10px] font-mono text-sky-300">IOR 1.52 · Frosted</div>
            </div>
          </div>
        );

      case 'css-liquid-morph':
        return (
          <div
            style={{
              animation: 'liquidMorph 6.5s ease-in-out infinite',
            }}
            className="w-20 h-20 bg-gradient-to-tr from-sky-400 via-blue-600 to-violet-500 shadow-lg flex items-center justify-center text-[10px] font-mono font-bold text-white"
          >
            FLUID
          </div>
        );

      case 'css-particle-field':
        return (
          <div className="relative w-44 h-20 rounded-lg bg-slate-950/90 border border-slate-800 overflow-hidden flex items-center justify-center">
            {[
              { left: '18%', top: '65%', delay: '0s', size: 'w-2 h-2 bg-sky-400' },
              { left: '38%', top: '55%', delay: '0.6s', size: 'w-1.5 h-1.5 bg-violet-400' },
              { left: '58%', top: '70%', delay: '1.2s', size: 'w-2.5 h-2.5 bg-blue-400' },
              { left: '78%', top: '60%', delay: '0.3s', size: 'w-1.5 h-1.5 bg-sky-300' },
              { left: '48%', top: '35%', delay: '0.9s', size: 'w-2 h-2 bg-indigo-400' },
            ].map((p, idx) => (
              <span
                key={idx}
                style={{
                  left: p.left,
                  top: p.top,
                  animation: `floatParticle 2.8s ease-in-out ${p.delay} infinite`,
                }}
                className={`absolute rounded-full ${p.size}`}
              />
            ))}
            <span className="text-[10px] font-mono text-slate-400">QUANTUM DRIFT</span>
          </div>
        );

      case 'css-hover-transition':
        return (
          <div className="group/tile px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-sky-400 hover:-translate-y-1 transition-all duration-150 flex items-center gap-2 text-xs font-medium text-slate-100">
            <span>Inspect Kernel Trace</span>
            <ArrowRight className="w-3.5 h-3.5 text-sky-400 transition-transform duration-150 group-hover/tile:translate-x-1.5" />
          </div>
        );

      case 'css-3d-flip-card':
        return (
          <div
            onClick={(e) => {
              e.stopPropagation();
              setFlippedCard((f) => !f);
            }}
            style={{ perspective: '700px' }}
            className="w-44 h-20 cursor-pointer group/flip"
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: flippedCard ? 'rotateY(180deg)' : undefined,
              }}
              className="relative w-full h-full transition-transform duration-500 group-hover/flip:[transform:rotateY(180deg)]"
            >
              <div
                style={{ backfaceVisibility: 'hidden' }}
                className="absolute inset-0 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center p-2"
              >
                <span className="text-[10px] font-mono text-sky-400">FRONT FACE</span>
                <span className="text-xs font-semibold text-white">Hover or Click to Flip</span>
              </div>
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
                className="absolute inset-0 rounded-lg bg-blue-950 border border-sky-400 flex flex-col items-center justify-center p-2"
              >
                <span className="text-[10px] font-mono text-emerald-400">BACK FACE</span>
                <span className="text-xs font-semibold text-white">MVCC Snapshot Verified</span>
              </div>
            </div>
          </div>
        );

      case 'css-orbital-loader':
        return (
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div
              style={{ animation: 'orbitalSpin 1.2s linear infinite' }}
              className="absolute inset-0 rounded-full border-2 border-sky-400/20 border-t-sky-400"
            />
            <div
              style={{ animation: 'orbitalSpin 1.8s linear infinite reverse' }}
              className="absolute inset-2.5 rounded-full border-2 border-violet-400/20 border-b-violet-400"
            />
            <span className="text-[9px] font-mono text-slate-300">SYNC</span>
          </div>
        );

      case 'css-scroll-choreography':
      default:
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-48 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-2"
          >
            <div className="h-1.5 w-full bg-slate-800 rounded overflow-hidden">
              <div
                className="h-full bg-sky-400 origin-left transition-transform duration-100"
                style={{ transform: `scaleX(${scrollSimProgress})` }}
              />
            </div>
            <input
              type="range"
              aria-label="Simulate scroll progress"
              min="0.1"
              max="1"
              step="0.05"
              value={scrollSimProgress}
              onChange={(e) => setScrollSimProgress(parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer h-1"
            />
            <div className="text-[10px] font-mono text-slate-400 flex justify-between tabular-nums">
              <span>Scroll Scrub</span>
              <span>{Math.round(scrollSimProgress * 100)}%</span>
            </div>
          </div>
        );
    }
  };

  const activeSnippet =
    activeCodeTab === 'html'
      ? selectedDemo.htmlCode
      : activeCodeTab === 'css'
      ? selectedDemo.cssCode
      : selectedDemo.jsCode || '/* Pure CSS compositor animation — zero JavaScript required */';

  return (
    <section
      id="css-lab"
      aria-labelledby="css-lab-heading"
      className="py-20 border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#060913]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-2">
            03. HARDWARE-ACCELERATED CSS ANIMATION LAB
          </div>
          <h2
            id="css-lab-heading"
            className="font-display font-bold text-3xl text-slate-900 dark:text-white tracking-tight mb-3"
          >
            10 Production CSS3 &amp; 3D Compositor Demonstrations
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Interact with each live demonstration below. Select any module to inspect its complete
            HTML structure, CSS keyframes, compositor mathematics, and copy-ready source code.
          </p>
        </div>

        {/* 10-Module Interactive Grid + Live Code Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: 10 Live Interactive Demo Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CSS_ANIMATION_DEMOS.map((demo) => {
              const isSelected = selectedDemo.id === demo.id;
              return (
                <div
                  key={demo.id}
                  onClick={() => {
                    setSelectedDemo(demo);
                    setActiveCodeTab('css');
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedDemo(demo);
                    }
                  }}
                  className={`rounded-xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900/95 text-white border-blue-500 ring-1 ring-blue-500/50'
                      : 'bg-slate-50 dark:bg-[#0b101e] border-slate-200 dark:border-slate-800 hover:border-blue-500/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2">
                      <span className={isSelected ? 'text-sky-400' : 'text-blue-600 dark:text-sky-400'}>
                        {demo.category}
                      </span>
                      <span>Live Demo</span>
                    </div>

                    <h3
                      className={`font-display font-bold text-sm mb-3 ${
                        isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'
                      }`}
                    >
                      {demo.title}
                    </h3>
                  </div>

                  {/* Live Stage Viewport */}
                  <div className="h-32 rounded-lg bg-[#050811] border border-slate-800/90 flex items-center justify-center overflow-hidden my-2">
                    {renderLiveDemoStage(demo.id)}
                  </div>

                  <p
                    className={`text-xs mt-2 leading-relaxed ${
                      isSelected ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {demo.summary}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right 5 Columns: Sticky Code & Architecture Inspector for Selected CSS Demo */}
          <div className="lg:col-span-5 lg:sticky lg:top-20 rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050811] text-slate-100">
            <div className="p-5 bg-slate-900/90 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
                <Layers className="w-3.5 h-3.5" />
                <span>SELECTED MODULE SPECIFICATION</span>
              </div>
              <h3 className="font-display font-bold text-lg text-white">{selectedDemo.title}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                <strong className="text-sky-300">How It Works: </strong>
                {selectedDemo.howItWorks}
              </p>
            </div>

            {/* Code Tabs & Copy Action */}
            <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1">
                {(
                  [
                    { id: 'html', label: 'HTML' },
                    { id: 'css', label: 'CSS' },
                    { id: 'js', label: 'JS' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCodeTab(tab.id)}
                    className={`px-3 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
                      activeCodeTab === tab.id
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => handleCopy(selectedDemo.id, activeSnippet)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {copiedId === selectedDemo.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy {activeCodeTab.toUpperCase()}</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-5 text-xs font-mono text-sky-100 overflow-x-auto leading-relaxed max-h-[380px]">
              <code>{activeSnippet}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
};
