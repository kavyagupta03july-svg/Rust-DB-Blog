import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Terminal,
  Code2,
  Database,
  CheckCircle2,
  Cpu,
  HardDrive,
  Sparkles,
} from 'lucide-react';

export interface VideoEpisode {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  filename: string;
  command: string;
  durationSec: number;
  codeLines: string[];
  outputStages: {
    atProgress: number; // 0.0 to 1.0
    stageTitle: string;
    stageDetail: string;
    terminalLines: string[];
    metrics: {
      pagesAllocated: number;
      tuplesCommitted: number;
      walLsn: string;
      latencyUs: number;
    };
    activeBlocks: {
      label: string;
      status: 'idle' | 'writing' | 'committed' | 'indexed';
      fillPct: number;
    }[];
  }[];
}

export const RUSTDB_VIDEO_EPISODES: VideoEpisode[] = [
  {
    id: 'ep-atomic-file-init',
    badge: 'EPISODE 01 · CORE ENGINE',
    title: 'Writing a RustDB Storage Engine: AtomicFile & Sorted Table Creation',
    subtitle:
      'Watch how RustDB initializes crash-safe Copy-on-Write page files, compiles SQL table schemas, and executes atomic inserts.',
    filename: 'src/bin/rustdb_engine_demo.rs',
    command: 'cargo run --release --bin rustdb_engine_demo',
    durationSec: 24,
    codeLines: [
      '// RustDB Pure-Rust Relational Storage Engine (#[forbid(unsafe_code)])',
      'use rustdb::{AtomicFile, Database, BuiltinMap, Value};',
      'use std::sync::Arc;',
      '',
      'fn main() -> std::io::Result<()> {',
      '    println!("[RustDB] Initializing CoW AtomicFile storage kernel...");',
      '    let storage = Box::new(AtomicFile::new("rustdb_blog.db", "upd")?);',
      '    let db = Database::new(storage, "", BuiltinMap::default());',
      '',
      '    // Create sorted-file relational table with B+Tree primary key',
      '    db.run_sql("CREATE SCHEMA blog_kernel GO")?;',
      '    db.run_sql("CREATE TABLE blog_kernel.Article (id int, slug str, views int) GO")?;',
      '',
      '    // Insert records into slotted 8KiB pages',
      '    db.run_sql("INSERT INTO blog_kernel.Article VALUES (101, \'rustdb-mvcc\', 4820) GO")?;',
      '    db.run_sql("INSERT INTO blog_kernel.Article VALUES (102, \'btree-pages\', 9150) GO")?;',
      '',
      '    // Flush dirty pages atomically and query result set',
      '    let rows = db.query("SELECT id, slug, views FROM blog_kernel.Article ORDER BY id")?;',
      '    println!("[RustDB] Committed {} rows to disk:", rows.len());',
      '    for row in rows {',
      '        println!("  -> Row: {:?}", row);',
      '    }',
      '    Ok(())',
      '}',
    ],
    outputStages: [
      {
        atProgress: 0.0,
        stageTitle: '1. Crate Imports & Safe-Rust Setup',
        stageDetail:
          'Importing `AtomicFile` and `Database` from the `rustdb` crate. Memory safety is guaranteed at compile time with zero `unsafe` blocks.',
        terminalLines: [
          '$ cargo run --release --bin rustdb_engine_demo',
          '   Compiling rustdb v4.2.0',
          '   Compiling nextgen-rustdb-demo v0.1.0 (/workspace/rustdb-blog)',
        ],
        metrics: {
          pagesAllocated: 1,
          tuplesCommitted: 0,
          walLsn: '0x0000_0000',
          latencyUs: 0,
        },
        activeBlocks: [
          { label: 'Page #0 (Catalog)', status: 'writing', fillPct: 18 },
          { label: 'Page #1 (B+Tree Root)', status: 'idle', fillPct: 0 },
          { label: 'Page #2 (Leaf Data)', status: 'idle', fillPct: 0 },
          { label: 'Upd File (CoW Log)', status: 'idle', fillPct: 0 },
        ],
      },
      {
        atProgress: 0.25,
        stageTitle: '2. AtomicFile Copy-on-Write Initialization',
        stageDetail:
          '`AtomicFile::new("rustdb_blog.db", "upd")` opens the primary database file alongside a crash-recovery update journal.',
        terminalLines: [
          '$ cargo run --release --bin rustdb_engine_demo',
          '   Compiling rustdb v4.2.0',
          '   Compiling nextgen-rustdb-demo v0.1.0 (/workspace/rustdb-blog)',
          '    Finished `release` profile [optimized] target(s) in 0.42s',
          '     Running `target/release/rustdb_engine_demo`',
          '[RustDB] Initializing CoW AtomicFile storage kernel...',
          '[Kernel] Mounted primary file "rustdb_blog.db" (8192 B page frames)',
        ],
        metrics: {
          pagesAllocated: 2,
          tuplesCommitted: 0,
          walLsn: '0x0001_0040',
          latencyUs: 14,
        },
        activeBlocks: [
          { label: 'Page #0 (Catalog)', status: 'committed', fillPct: 35 },
          { label: 'Page #1 (B+Tree Root)', status: 'writing', fillPct: 22 },
          { label: 'Page #2 (Leaf Data)', status: 'idle', fillPct: 0 },
          { label: 'Upd File (CoW Log)', status: 'writing', fillPct: 15 },
        ],
      },
      {
        atProgress: 0.52,
        stageTitle: '3. Schema Compilation & B+Tree Slotted Page Inserts',
        stageDetail:
          'Executing `CREATE TABLE` and `INSERT INTO` statements. Tuples are serialized into slotted page frames and indexed by primary key.',
        terminalLines: [
          '$ cargo run --release --bin rustdb_engine_demo',
          '    Finished `release` profile [optimized] target(s) in 0.42s',
          '     Running `target/release/rustdb_engine_demo`',
          '[RustDB] Initializing CoW AtomicFile storage kernel...',
          '[Kernel] Mounted primary file "rustdb_blog.db" (8192 B page frames)',
          '[Schema] Created table `blog_kernel.Article` (root_page = 1)',
          '[B+Tree] Inserted key=101 into Leaf Page #2 (slot=0, offset=8144)',
          '[B+Tree] Inserted key=102 into Leaf Page #2 (slot=1, offset=8096)',
        ],
        metrics: {
          pagesAllocated: 3,
          tuplesCommitted: 2,
          walLsn: '0x0001_01A8',
          latencyUs: 29,
        },
        activeBlocks: [
          { label: 'Page #0 (Catalog)', status: 'committed', fillPct: 48 },
          { label: 'Page #1 (B+Tree Root)', status: 'indexed', fillPct: 40 },
          { label: 'Page #2 (Leaf Data)', status: 'writing', fillPct: 68 },
          { label: 'Upd File (CoW Log)', status: 'writing', fillPct: 54 },
        ],
      },
      {
        atProgress: 0.8,
        stageTitle: '4. Atomic Commit & Query Result Output',
        stageDetail:
          'Dirty pages flush to disk atomically and the sorted B+Tree scan returns the verified relational rows.',
        terminalLines: [
          '$ cargo run --release --bin rustdb_engine_demo',
          '[RustDB] Initializing CoW AtomicFile storage kernel...',
          '[Kernel] Mounted primary file "rustdb_blog.db" (8192 B page frames)',
          '[Schema] Created table `blog_kernel.Article` (root_page = 1)',
          '[B+Tree] Inserted key=101 into Leaf Page #2 (slot=0, offset=8144)',
          '[B+Tree] Inserted key=102 into Leaf Page #2 (slot=1, offset=8096)',
          '[RustDB] Committed 2 rows to disk:',
          '  -> Row: [Int(101), Str("rustdb-mvcc"), Int(4820)]',
          '  -> Row: [Int(102), Str("btree-pages"), Int(9150)]',
          '[Process exited with code 0 in 1.18ms]',
        ],
        metrics: {
          pagesAllocated: 3,
          tuplesCommitted: 2,
          walLsn: '0x0001_02F0',
          latencyUs: 19,
        },
        activeBlocks: [
          { label: 'Page #0 (Catalog)', status: 'committed', fillPct: 48 },
          { label: 'Page #1 (B+Tree Root)', status: 'committed', fillPct: 40 },
          { label: 'Page #2 (Leaf Data)', status: 'committed', fillPct: 68 },
          { label: 'Upd File (CoW Log)', status: 'committed', fillPct: 100 },
        ],
      },
    ],
  },
  {
    id: 'ep-slotted-page-split',
    badge: 'EPISODE 02 · B+TREE INTERNALS',
    title: 'Slotted-Page Tuple Allocator & Automatic B+Tree Leaf Split',
    subtitle:
      'Step-by-step implementation of RustDB fixed-size slotted pages, bidirectional free-space pointers, and O(log N) key lookups.',
    filename: 'src/storage/slotted_page_demo.rs',
    command: 'cargo run --release --bin slotted_page_demo',
    durationSec: 22,
    codeLines: [
      '#[repr(C)]',
      '#[derive(Debug, Clone, Copy)]',
      'pub struct SlotPointer { pub offset: u16, pub len: u16 }',
      '',
      'pub struct RustDbPage {',
      '    buf: [u8; 4096],',
      '    slots: Vec<SlotPointer>,',
      '    free_top: u16,',
      '}',
      '',
      'impl RustDbPage {',
      '    pub fn new() -> Self {',
      '        Self { buf: [0; 4096], slots: Vec::new(), free_top: 4096 }',
      '    }',
      '',
      '    pub fn insert_record(&mut self, tuple: &[u8]) -> Result<usize, &\'static str> {',
      '        let header_bytes = (self.slots.len() + 1) * 4;',
      '        if (self.free_top as usize) < header_bytes + tuple.len() {',
      '            return Err("PAGE_FULL_SPLIT_REQUIRED");',
      '        }',
      '        self.free_top -= tuple.len() as u16;',
      '        let start = self.free_top as usize;',
      '        self.buf[start..start + tuple.len()].copy_from_slice(tuple);',
      '        self.slots.push(SlotPointer { offset: self.free_top, len: tuple.len() as u16 });',
      '        Ok(self.slots.len() - 1)',
      '    }',
      '}',
    ],
    outputStages: [
      {
        atProgress: 0.0,
        stageTitle: '1. Defining Zero-Overhead Slot Headers',
        stageDetail:
          'Each tuple in a 4KiB RustDB page is addressed via a 4-byte `SlotPointer` (`offset: u16`, `len: u16`) so physical compaction never invalidates external Tuple IDs.',
        terminalLines: [
          '$ cargo run --release --bin slotted_page_demo',
          '   Compiling rustdb-storage-kernel v0.4.1',
          '[Allocator] Initialized 4096-byte Slotted Page (free_top = 4096)',
        ],
        metrics: {
          pagesAllocated: 1,
          tuplesCommitted: 0,
          walLsn: '0x0004_1000',
          latencyUs: 4,
        },
        activeBlocks: [
          { label: 'Slot Array [0..N]', status: 'writing', fillPct: 12 },
          { label: 'Contiguous Free Space', status: 'idle', fillPct: 88 },
          { label: 'Tuple Payload Heap', status: 'idle', fillPct: 0 },
          { label: 'Sibling Leaf Page', status: 'idle', fillPct: 0 },
        ],
      },
      {
        atProgress: 0.45,
        stageTitle: '2. Bidirectional Growth (Slots Down, Payloads Up)',
        stageDetail:
          'As records are inserted, `free_top` decrements from 4096 downward while the `slots` vector grows upward from offset 0.',
        terminalLines: [
          '$ cargo run --release --bin slotted_page_demo',
          '[Allocator] Initialized 4096-byte Slotted Page (free_top = 4096)',
          '[Insert] Slot #0 -> offset=4032, len=64B | free_space=4028B',
          '[Insert] Slot #1 -> offset=3952, len=80B | free_space=3944B',
          '[Insert] Slot #2 -> offset=3824, len=128B | free_space=3812B',
        ],
        metrics: {
          pagesAllocated: 1,
          tuplesCommitted: 3,
          walLsn: '0x0004_1180',
          latencyUs: 9,
        },
        activeBlocks: [
          { label: 'Slot Array [0..3]', status: 'indexed', fillPct: 34 },
          { label: 'Contiguous Free Space', status: 'writing', fillPct: 42 },
          { label: 'Tuple Payload Heap', status: 'writing', fillPct: 68 },
          { label: 'Sibling Leaf Page', status: 'idle', fillPct: 0 },
        ],
      },
      {
        atProgress: 0.8,
        stageTitle: '3. Leaf Split Detection & Separator Promotion',
        stageDetail:
          'When free space drops below tuple size, `PAGE_FULL_SPLIT_REQUIRED` triggers an automatic 50/50 split into a new sibling leaf page.',
        terminalLines: [
          '$ cargo run --release --bin slotted_page_demo',
          '[Insert] Slot #0 -> offset=4032, len=64B | free_space=4028B',
          '[Insert] Slot #1 -> offset=3952, len=80B | free_space=3944B',
          '[Insert] Slot #2 -> offset=3824, len=128B | free_space=3812B',
          '[Split] Threshold reached! Allocating Sibling Leaf Page #3...',
          '[Split] Redistributed 32 upper keys -> Promoted separator key=2048 to Parent',
          '[Verify] Zero-copy slice lookup `page.get_slot(1)` -> OK ("rustdb_btree_node")',
          '[Process exited with code 0 in 0.64ms]',
        ],
        metrics: {
          pagesAllocated: 2,
          tuplesCommitted: 64,
          walLsn: '0x0004_18C0',
          latencyUs: 11,
        },
        activeBlocks: [
          { label: 'Slot Array [0..32]', status: 'committed', fillPct: 50 },
          { label: 'Contiguous Free Space', status: 'committed', fillPct: 50 },
          { label: 'Tuple Payload Heap', status: 'committed', fillPct: 50 },
          { label: 'Sibling Leaf Page', status: 'committed', fillPct: 50 },
        ],
      },
    ],
  },
  {
    id: 'ep-mvcc-transactions',
    badge: 'EPISODE 03 · MVCC CONCURRENCY',
    title: 'Non-Blocking MVCC Snapshot Isolation in RustDB',
    subtitle:
      'See how Rust ownership and `xmin`/`xmax` transaction timestamps let readers query consistent snapshots without blocking concurrent writers.',
    filename: 'src/storage/mvcc_snapshot.rs',
    command: 'cargo test --release mvcc_snapshot_isolation -- --nocapture',
    durationSec: 20,
    codeLines: [
      '#[derive(Debug, Clone)]',
      'pub struct VersionedTuple<T> {',
      '    pub xmin: u64,',
      '    pub xmax: Option<u64>,',
      '    pub payload: T,',
      '}',
      '',
      'impl<T> VersionedTuple<T> {',
      '    pub fn is_visible_to(&self, reader_tx_id: u64) -> bool {',
      '        let created_before = self.xmin <= reader_tx_id;',
      '        let alive_at_snapshot = match self.xmax {',
      '            None => true,',
      '            Some(deleted_at) => deleted_at > reader_tx_id,',
      '        };',
      '        created_before && alive_at_snapshot',
      '    }',
      '}',
      '',
      'fn main() {',
      '    let v1 = VersionedTuple { xmin: 100, xmax: Some(105), payload: "v1: 1200_views" };',
      '    let v2 = VersionedTuple { xmin: 105, xmax: None, payload: "v2: 1950_views" };',
      '    println!("Reader TXN #102 sees v1? {}", v1.is_visible_to(102));',
      '    println!("Reader TXN #108 sees v2? {}", v2.is_visible_to(108));',
      '}',
    ],
    outputStages: [
      {
        atProgress: 0.0,
        stageTitle: '1. Defining Tuple Visibility Metadata (`xmin` / `xmax`)',
        stageDetail:
          'Every versioned record stores the transaction ID that created it (`xmin`) and the transaction ID that superseded it (`xmax`).',
        terminalLines: [
          '$ cargo test --release mvcc_snapshot_isolation -- --nocapture',
          '   Compiling rustdb-mvcc v0.3.0',
          '[MVCC] Initializing lock-free snapshot registry...',
        ],
        metrics: {
          pagesAllocated: 2,
          tuplesCommitted: 1,
          walLsn: '0x0009_0010',
          latencyUs: 3,
        },
        activeBlocks: [
          { label: 'Tuple V1 (xmin=100)', status: 'committed', fillPct: 100 },
          { label: 'Reader TXN #102', status: 'writing', fillPct: 45 },
          { label: 'Writer TXN #105', status: 'idle', fillPct: 0 },
          { label: 'Tuple V2 (xmin=105)', status: 'idle', fillPct: 0 },
        ],
      },
      {
        atProgress: 0.5,
        stageTitle: '2. Concurrent Writer Appends New Version (TXN #105)',
        stageDetail:
          'Writer TXN #105 sets `xmax = Some(105)` on V1 and appends V2 (`xmin = 105`) without acquiring read locks.',
        terminalLines: [
          '$ cargo test --release mvcc_snapshot_isolation -- --nocapture',
          '[MVCC] Initializing lock-free snapshot registry...',
          '[TXN #102] Acquired read snapshot at timestamp = 102',
          '[TXN #105] Concurrent UPDATE -> marked V1.xmax = 105, inserted V2.xmin = 105',
        ],
        metrics: {
          pagesAllocated: 2,
          tuplesCommitted: 2,
          walLsn: '0x0009_00A4',
          latencyUs: 6,
        },
        activeBlocks: [
          { label: 'Tuple V1 (xmax=105)', status: 'committed', fillPct: 100 },
          { label: 'Reader TXN #102', status: 'indexed', fillPct: 80 },
          { label: 'Writer TXN #105', status: 'committed', fillPct: 100 },
          { label: 'Tuple V2 (xmin=105)', status: 'writing', fillPct: 90 },
        ],
      },
      {
        atProgress: 0.82,
        stageTitle: '3. Deterministic Snapshot Output Verification',
        stageDetail:
          'Reader TXN #102 deterministically reads `v1` while Reader TXN #108 reads `v2`—zero mutex contention.',
        terminalLines: [
          '$ cargo test --release mvcc_snapshot_isolation -- --nocapture',
          '[TXN #102] Acquired read snapshot at timestamp = 102',
          '[TXN #105] Concurrent UPDATE -> marked V1.xmax = 105, inserted V2.xmin = 105',
          'Reader TXN #102 sees v1? true  (payload = "v1: 1200_views")',
          'Reader TXN #102 sees v2? false (created after snapshot #102)',
          'Reader TXN #108 sees v2? true  (payload = "v2: 1950_views")',
          'test mvcc_snapshot_isolation ... ok (0.19ms)',
        ],
        metrics: {
          pagesAllocated: 2,
          tuplesCommitted: 2,
          walLsn: '0x0009_0120',
          latencyUs: 5,
        },
        activeBlocks: [
          { label: 'Tuple V1 (xmax=105)', status: 'committed', fillPct: 100 },
          { label: 'Reader TXN #102', status: 'committed', fillPct: 100 },
          { label: 'Writer TXN #105', status: 'committed', fillPct: 100 },
          { label: 'Tuple V2 (xmin=105)', status: 'committed', fillPct: 100 },
        ],
      },
    ],
  },
];

interface RustDbVideoStudioProps {
  compact?: boolean;
}

export const RustDbVideoStudio: React.FC<RustDbVideoStudioProps> = ({ compact = false }) => {
  const [episodeIndex, setEpisodeIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  // Start at 0.85 so on initial load the user immediately sees rich typed code + program output, while continuous animation loops smoothly!
  const [progress, setProgress] = useState<number>(0.85);

  const episode = RUSTDB_VIDEO_EPISODES[episodeIndex] || RUSTDB_VIDEO_EPISODES[0];
  const lastTickRef = useRef<number>(performance.now());

  useEffect(() => {
    if (!isPlaying) return;
    let rafId = 0;
    lastTickRef.current = performance.now();

    const step = (now: number) => {
      const dtSec = Math.min((now - lastTickRef.current) / 1000, 0.1);
      lastTickRef.current = now;

      setProgress((prev) => {
        const next = prev + (dtSec * playbackSpeed) / episode.durationSec;
        return next >= 1 ? 0.05 : next;
      });

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackSpeed, episode.durationSec]);

  // Calculate how many characters of code to reveal at current progress
  const fullCodeText = episode.codeLines.join('\n');
  // Code finishes typing at progress = 0.78 so the remaining 22% of the video showcases the full program output
  const typingProgress = Math.min(1, progress / 0.78);
  const visibleCharCount = Math.max(24, Math.floor(fullCodeText.length * typingProgress));
  const visibleCodeText = fullCodeText.slice(0, visibleCharCount);
  const visibleLines = visibleCodeText.split('\n');
  const activeLineNumber = visibleLines.length;

  // Determine active execution stage for terminal output & storage diagram
  const activeStage =
    [...episode.outputStages].reverse().find((s) => progress >= s.atProgress) ||
    episode.outputStages[0];

  const currentSec = Math.round(progress * episode.durationSec);
  const formatTime = (sec: number) => `00:${sec.toString().padStart(2, '0')}`;

  const handleSelectEpisode = (idx: number) => {
    setEpisodeIndex(idx);
    setProgress(0.15);
    setIsPlaying(true);
  };

  const handleRestart = () => {
    setProgress(0.05);
    setIsPlaying(true);
  };

  return (
    <div
      data-testid="rustdb-video-studio"
      className="rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050811] text-slate-100 shadow-2xl"
    >
      {/* Top Cinema Studio Bar */}
      <div className="px-5 py-4 bg-slate-900/95 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RUSTDB LIVE CODE &amp; PROGRAM OUTPUT VIDEO ANIMATION</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">
              {isPlaying ? '● REC / LIVE EXECUTION' : '❚❚ PAUSED'}
            </span>
          </div>
          <h3 className="font-display font-bold text-lg sm:text-xl text-white tracking-tight">
            {episode.title}
          </h3>
          {!compact && (
            <p className="text-xs text-slate-400 mt-0.5 max-w-3xl">{episode.subtitle}</p>
          )}
        </div>

        {/* Episode Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          {RUSTDB_VIDEO_EPISODES.map((ep, idx) => (
            <button
              key={ep.id}
              type="button"
              onClick={() => handleSelectEpisode(idx)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                episodeIndex === idx
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800'
              }`}
            >
              Episode 0{idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Video Viewport: Left = Animated Rust Code Writing | Right = Engine Visualization + Program Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* LEFT PANE (7 Cols): Animated Code Editor Showing How RustDB Code Is Written */}
        <div className="lg:col-span-7 flex flex-col bg-[#060a15]">
          <div className="px-4 py-2.5 bg-slate-950 border-b border-slate-800/90 flex items-center justify-between gap-2 text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Code2 className="w-4 h-4 text-sky-400" />
              <span>{episode.filename}</span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="text-emerald-400">#[forbid(unsafe_code)]</span>
            </div>
            <div className="text-slate-400 tabular-nums">
              Line {activeLineNumber} / {episode.codeLines.length}
            </div>
          </div>

          <div className="p-4 sm:p-5 font-mono text-xs leading-relaxed overflow-x-auto min-h-[340px] flex-1">
            {episode.codeLines.map((fullLine, idx) => {
              const lineNum = idx + 1;
              const isRendered = lineNum <= visibleLines.length;
              const isCurrentLine = lineNum === visibleLines.length;
              const textToShow = isRendered ? visibleLines[idx] : '';

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3 px-2 py-0.5 rounded transition-colors ${
                    isCurrentLine
                      ? 'bg-blue-950/60 border-l-2 border-sky-400'
                      : isRendered
                      ? 'opacity-100'
                      : 'opacity-20'
                  }`}
                >
                  <span className="w-6 text-right text-slate-600 select-none tabular-nums shrink-0">
                    {lineNum}
                  </span>
                  <pre className="whitespace-pre-wrap break-all text-slate-100 flex-1">
                    <code>
                      {isRendered ? textToShow : fullLine}
                      {isCurrentLine && typingProgress < 1 && (
                        <span
                          aria-hidden="true"
                          className="inline-block w-2 h-3.5 ml-0.5 align-middle bg-sky-400 animate-pulse"
                        />
                      )}
                    </code>
                  </pre>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE (5 Cols): Live Storage Engine Animation + Real-Time Program Output Terminal */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-[#080d1a]">
          {/* Top-Right: Animated Storage Kernel Page Visualization */}
          <div className="p-4 sm:p-5 border-b border-slate-800">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs font-mono text-sky-400">
                <Database className="w-3.5 h-3.5" />
                <span>LIVE RUSTDB ENGINE STATE</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400 tabular-nums">
                WAL LSN: {activeStage.metrics.walLsn}
              </span>
            </div>

            <div className="mb-3 p-3 rounded-lg bg-slate-900/90 border border-slate-800">
              <div className="text-xs font-bold text-white mb-0.5">{activeStage.stageTitle}</div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {activeStage.stageDetail}
              </p>
            </div>

            {/* Animated Page Frame Bars */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {activeStage.activeBlocks.map((block) => (
                <div
                  key={block.label}
                  className="p-2.5 rounded-lg bg-slate-950/90 border border-slate-800/90"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
                    <span className="text-slate-200 truncate">{block.label}</span>
                    <span
                      className={`uppercase text-[10px] font-bold ${
                        block.status === 'committed'
                          ? 'text-emerald-400'
                          : block.status === 'writing'
                          ? 'text-amber-400'
                          : block.status === 'indexed'
                          ? 'text-sky-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {block.status}
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        block.status === 'committed'
                          ? 'bg-emerald-500'
                          : block.status === 'writing'
                          ? 'bg-amber-400'
                          : block.status === 'indexed'
                          ? 'bg-sky-400'
                          : 'bg-slate-700'
                      }`}
                      style={{ width: `${block.fillPct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Telemetry Readout */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-mono">Pages Pinned</div>
                <div className="text-xs font-mono font-bold text-white tabular-nums">
                  {activeStage.metrics.pagesAllocated} frames
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-mono">Tuples Saved</div>
                <div className="text-xs font-mono font-bold text-emerald-400 tabular-nums">
                  {activeStage.metrics.tuplesCommitted} rows
                </div>
              </div>
              <div className="p-2 rounded bg-slate-900/70 border border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-mono">Commit Time</div>
                <div className="text-xs font-mono font-bold text-sky-400 tabular-nums">
                  {activeStage.metrics.latencyUs} µs
                </div>
              </div>
            </div>
          </div>

          {/* Bottom-Right: Live Program Output Console */}
          <div className="p-4 sm:p-5 bg-[#04070f] flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 text-xs font-mono text-slate-400 mb-2.5">
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>PROGRAM STDOUT / EXECUTION OUTPUT</span>
                </div>
                <span className="text-[11px] text-slate-500">rustc 1.85.0</span>
              </div>

              <div
                data-testid="rustdb-program-output"
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 font-mono text-xs space-y-1.5 min-h-[155px]"
              >
                {activeStage.terminalLines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.startsWith('$')
                        ? 'text-sky-400 font-semibold'
                        : line.includes('Row:') || line.includes('ok') || line.includes('Committed')
                        ? 'text-emerald-400'
                        : 'text-slate-300'
                    }
                  >
                    {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Video Player Timeline & Transport Controls */}
      <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            aria-label={isPlaying ? 'Pause RustDB code video' : 'Play RustDB code video'}
            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause Video' : 'Play Video'}</span>
          </button>

          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart video animation"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setProgress((p) => Math.max(0, p - 0.2))}
            aria-label="Step backward"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setProgress((p) => Math.min(0.98, p + 0.2))}
            aria-label="Step forward"
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Interactive Scrubber Bar */}
        <div className="flex items-center gap-3 w-full sm:flex-1 max-w-xl">
          <span className="text-xs font-mono text-slate-400 tabular-nums w-11 text-right">
            {formatTime(currentSec)}
          </span>
          <input
            type="range"
            aria-label="Seek RustDB code animation timeline"
            min="0"
            max="1"
            step="0.01"
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />
          <span className="text-xs font-mono text-slate-400 tabular-nums w-11">
            {formatTime(episode.durationSec)}
          </span>
        </div>

        {/* Playback Speed Selector */}
        <div className="flex items-center gap-1">
          {[0.75, 1, 1.5, 2].map((spd) => (
            <button
              key={spd}
              type="button"
              onClick={() => setPlaybackSpeed(spd)}
              className={`px-2 py-1 rounded text-xs font-mono cursor-pointer ${
                playbackSpeed === spd
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
