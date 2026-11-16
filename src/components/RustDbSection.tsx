import React, { useState, useMemo } from 'react';
import { Database, Cpu, HardDrive, Layers, Check, Copy, ShieldCheck } from 'lucide-react';
import { simulateBTreeStorageMetrics } from '../utils/blogLogic';
import { RustDbVideoStudio } from './RustDbVideoStudio';

const RUSTDB_CODE_EXAMPLES = [
  {
    id: 'rustdb-crate-example',
    title: '1. Pure-Rust Relational Engine (`rustdb` Crate by George Barwood)',
    filename: 'src/bin/rustdb_embedded.rs',
    description:
      'Demonstrates initializing an atomic sorted-file database instance using the official `rustdb` crate architecture (`AtomicFile`, `Database`, and built-in CExp/SQL execution).',
    code: `// Cargo.toml: rustdb = "4"
use rustdb::{AtomicFile, Database, BuiltinMap, CExp};
use std::sync::Arc;

pub fn init_embedded_storage(db_path: &str) -> std::io::Result<Arc<Database>> {
    // AtomicFile guarantees crash-safe copy-on-write page commits
    let file = Box::new(AtomicFile::new(db_path, "upd")?);
    let builtins = BuiltinMap::default();
    let db = Database::new(file, "", builtins);
    Ok(db)
}`,
  },
  {
    id: 'axum-sqlx-postgres',
    title: '2. Production Blog Backend (`Axum` + `SQLx` + `PostgreSQL`)',
    filename: 'src/backend/blog_api.rs',
    description:
      'Scalable REST API service in Rust using Axum and SQLx with compile-time verified queries, MVCC transaction isolation, and primary key indexing.',
    code: `use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use sqlx::{postgres::PgPoolOptions, FromRow, PgPool};

#[derive(Debug, Serialize, FromRow)]
pub struct ArticleRecord {
    pub id: String,
    pub slug: String,
    pub title: String,
    pub category: String,
    pub reading_time_minutes: i32,
}

#[derive(Debug, Deserialize)]
pub struct SearchParams {
    pub category: Option<String>,
    pub q: Option<String>,
}

pub async fn search_articles(
    State(pool): State<PgPool>,
    Query(params): Query<SearchParams>,
) -> Result<Json<Vec<ArticleRecord>>, StatusCode> {
    let pattern = format!("%{}%", params.q.unwrap_or_default());
    let rows = sqlx::query_as::<_, ArticleRecord>(
        r#"
        SELECT id, slug, title, category, reading_time_minutes
        FROM articles
        WHERE ($1::text IS NULL OR category = $1)
          AND (title ILIKE $2 OR excerpt ILIKE $2)
        ORDER BY published_at DESC
        LIMIT 50
        "#,
    )
    .bind(params.category)
    .bind(pattern)
    .fetch_all(&pool)
    .await
    .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;

    Ok(Json(rows))
}`,
  },
  {
    id: 'redb-embedded-kv',
    title: '3. Zero-Copy Embedded B-Tree Transactions (`redb` Storage Engine)',
    filename: 'src/storage/btree_tx.rs',
    description:
      'ACID-compliant copy-on-write B-Tree transactions in pure Rust (`redb`), illustrating how modern Rust storage engines enforce borrow-checked zero-copy reads.',
    code: `use redb::{Database, Error, ReadableTable, TableDefinition};

const ARTICLES_TABLE: TableDefinition<&str, &[u8]> = TableDefinition::new("articles_by_slug");

pub fn write_and_read_snapshot(db_path: &str) -> Result<(), Error> {
    let db = Database::create(db_path)?;
    let write_txn = db.begin_write()?;
    {
        let mut table = write_txn.open_table(ARTICLES_TABLE)?;
        table.insert("rustdb-architecture", b"MVCC + Slotted B-Tree Pages")?;
    }
    write_txn.commit()?;

    // Read transactions never block concurrent writers
    let read_txn = db.begin_read()?;
    let table = read_txn.open_table(ARTICLES_TABLE)?;
    let guard = table.get("rustdb-architecture")?.unwrap();
    assert_eq!(guard.value(), b"MVCC + Slotted B-Tree Pages");
    Ok(())
}`,
  },
];

export const RustDbSection: React.FC = () => {
  const [totalRows, setTotalRows] = useState<number>(1_000_000);
  const [pageSizeKb, setPageSizeKb] = useState<4 | 8 | 16>(8);
  const [averageRowBytes, setAverageRowBytes] = useState<number>(160);
  const [cacheMemoryMb, setCacheMemoryMb] = useState<number>(256);
  const [selectedCodeId, setSelectedCodeId] = useState<string>(RUSTDB_CODE_EXAMPLES[0].id);
  const [copied, setCopied] = useState<boolean>(false);

  const metrics = useMemo(
    () =>
      simulateBTreeStorageMetrics({
        totalRows,
        pageSizeKb,
        averageRowBytes,
        cacheMemoryMb,
      }),
    [totalRows, pageSizeKb, averageRowBytes, cacheMemoryMb]
  );

  const activeExample =
    RUSTDB_CODE_EXAMPLES.find((c) => c.id === selectedCodeId) || RUSTDB_CODE_EXAMPLES[0];

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(activeExample.code);
    } catch {
      // ignore
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section
      id="rustdb"
      aria-labelledby="rustdb-heading"
      className="scroll-mt-16 py-20 border-b border-slate-200 dark:border-slate-800/90 bg-slate-100/60 dark:bg-[#080d1a]"
    >
      <div className="max-w-[1280px] mx-auto px-6">
        {/* Section Header */}
        <div className="max-w-3xl mb-8">
          <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-2">
            01. RUSTDB CODE ANIMATION STUDIO &amp; STORAGE ARCHITECTURE
          </div>
          <h2
            id="rustdb-heading"
            className="font-display font-bold text-2xl sm:text-3xl text-slate-900 dark:text-white tracking-tight mb-4"
          >
            RustDB Engineering Studio: Live Code Writing, Execution &amp; Storage Internals
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Watch how RustDB relational engine code is written line-by-line, inspect live Copy-on-Write
            page allocation and B+Tree leaf splits, and verify real-time program output from the RustDB
            storage kernel.
          </p>
        </div>

        {/* Editorial Spotlight: Bridging the Academic Curriculum vs. Industry RustDB Gap */}
        <div
          data-testid="rustdb-academic-industry-bridge"
          className="mb-10 rounded-2xl bg-white dark:bg-[#0b101e] border border-blue-500/30 dark:border-sky-500/30 p-5 sm:p-7 shadow-lg"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold text-blue-600 dark:text-sky-400">
                <Layers className="w-4 h-4 shrink-0" />
                <span>EDITORIAL MISSION · BRIDGING THE ACADEMIC-TO-INDUSTRY DATABASE GAP</span>
              </div>

              <h3 className="font-display font-bold text-xl sm:text-2xl text-slate-900 dark:text-white leading-snug">
                Why Academic Curricula Stop at PostgreSQL, MySQL &amp; MongoDB—While Modern Tech Companies Prefer RustDB
              </h3>

              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                Nowadays, most colleges and universities still do not provide practical engineering
                knowledge around <strong>RustDB</strong> or next-generation systems storage engines.
                Standard academic database courses focus almost entirely on traditional systems like{' '}
                <strong>PostgreSQL, MySQL, and MongoDB</strong>. While PostgreSQL, MySQL, and MongoDB
                are excellent foundational tools for creating general-purpose databases and learning
                relational schemas or document collections, modern technology companies increasingly
                prefer <strong>RustDB and Rust-based storage engines</strong> for high-performance,
                memory-safe production infrastructure.
              </p>

              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                In real-world engineering, companies face challenges never covered in a traditional
                classroom: <strong>C/C++ buffer-pool memory vulnerabilities</strong>,{' '}
                <strong>unpredictable p99.9 tail-latency spikes</strong> from garbage collection,{' '}
                <strong>cloud NVMe IOPS costs</strong>, and <strong>zero-copy edge deployment</strong>.
                This blog is written specifically to bridge that gap—showing students and engineers how
                RustDB works under the hood, how the Rust code is written line-by-line, and how its
                live program output executes.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-mono font-bold text-blue-600 dark:text-sky-400 mb-1">
                    01. Memory Guarantee
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Compile-time borrow checking (<code className="text-[11px]">#[forbid(unsafe_code)]</code>) eliminates buffer-pool segfaults common in legacy C/C++ engines.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    02. Flat p99.9 Latency
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Deterministic RAII page-frame unpinning and CoW snapshots avoid stop-the-world GC pauses under heavy write bursts.
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 mb-1">
                    03. Cloud &amp; Edge Density
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Embeds directly via <code className="text-[11px]">AtomicFile</code> with sub-millisecond startup and up to 6x lower RAM overhead.
                  </p>
                </div>
              </div>
            </div>

            {/* Side-by-Side Comparison: Traditional Classroom DBs vs. Industry RustDB */}
            <div className="lg:col-span-5 rounded-xl bg-slate-50 dark:bg-[#060a15] border border-slate-200 dark:border-slate-800 p-4 sm:p-5 overflow-x-auto">
              <div className="text-xs font-mono font-semibold text-blue-600 dark:text-sky-400 mb-1">
                CURRICULUM VS. PRODUCTION REALITY
              </div>
              <h4 className="font-display font-bold text-base text-slate-900 dark:text-white mb-3">
                Traditional DBs (PostgreSQL / MySQL / MongoDB) vs. RustDB
              </h4>

              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                    <th className="py-2 pr-2">Dimension</th>
                    <th className="py-2 pr-2">PostgreSQL / MySQL / MongoDB</th>
                    <th className="py-2 text-blue-600 dark:text-sky-400">RustDB (Modern Industry)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300">
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 dark:text-white">
                      Academic Focus
                    </td>
                    <td className="py-2.5 pr-2">
                      Taught in colleges for standard CRUD, SQL joins &amp; JSON documents
                    </td>
                    <td className="py-2.5 font-medium text-emerald-600 dark:text-emerald-400">
                      Rarely taught in classrooms; high demand in systems engineering
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 dark:text-white">
                      Kernel Memory Safety
                    </td>
                    <td className="py-2.5 pr-2">
                      Legacy C / C++ codebases (manual pointer management)
                    </td>
                    <td className="py-2.5 font-medium text-blue-600 dark:text-sky-400">
                      100% Safe Rust borrow-checked page &amp; tuple lifetimes
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 dark:text-white">
                      Deployment Footprint
                    </td>
                    <td className="py-2.5 pr-2">
                      Standalone server daemon + TCP/IP connection pool overhead
                    </td>
                    <td className="py-2.5">
                      Zero-dependency embedded <code className="text-[11px]">AtomicFile</code> or microservice kernel
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 dark:text-white">
                      Crash Recovery
                    </td>
                    <td className="py-2.5 pr-2">
                      Complex multi-file WAL replay &amp; checkpoint tuning
                    </td>
                    <td className="py-2.5">
                      Deterministic Copy-on-Write (<code className="text-[11px]">upd</code>) atomic page commits
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-2 font-semibold text-slate-900 dark:text-white">
                      Best Suited For
                    </td>
                    <td className="py-2.5 pr-2">
                      General monolithic web apps &amp; introductory DB courses
                    </td>
                    <td className="py-2.5 font-medium text-blue-600 dark:text-sky-400">
                      High-frequency systems, AI telemetry, edge &amp; zero-trust infra
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Featured Video Animation Player: How RustDB Code Is Written & Program Output */}
        <div className="mb-12">
          <RustDbVideoStudio />
        </div>

        {/* Part 1: Accuracy & Taxonomy Grid (Distinguishing RustDB from Rust DB Libraries) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          <div className="lg:col-span-5 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-blue-600 dark:text-sky-400 mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>ARCHITECTURAL TAXONOMY &amp; VERIFICATION</span>
              </div>
              <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white mb-3">
                What is RustDB? Distinguishing the Product from the Ecosystem
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                In production engineering, <strong>RustDB</strong> refers specifically to the open-source{' '}
                <code className="text-xs bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded">
                  rustdb
                </code>{' '}
                crate authored by George Barwood—a 100% safe Rust (<code className="text-xs">#[forbid(unsafe_code)]</code>)
                relational database engine designed around sorted-file page trees, copy-on-write
                atomic file updates (<code className="text-xs">AtomicFile</code>), and compiled
                stored procedures.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                It must be clearly distinguished from general Rust SQL client toolkits (like{' '}
                <code className="text-xs">SQLx</code> and <code className="text-xs">Diesel</code>)
                and distributed or embedded storage engines implemented in Rust (such as{' '}
                <code className="text-xs">TiKV</code>, <code className="text-xs">redb</code>,{' '}
                <code className="text-xs">sled</code>, <code className="text-xs">SurrealDB</code>,
                and Apache <code className="text-xs">DataFusion</code>).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Memory Safety</span>
                <strong className="font-mono text-slate-900 dark:text-white">
                  Compile-Time Borrow Checked
                </strong>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block">Commit Durability</span>
                <strong className="font-mono text-slate-900 dark:text-white">
                  Copy-on-Write + WAL
                </strong>
              </div>
            </div>
          </div>

          {/* Ecosystem Comparison Table */}
          <div className="lg:col-span-7 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6 overflow-x-auto">
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">
              Verified Rust Database &amp; Storage Engine Matrix
            </h3>
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-mono">
                  <th className="py-2.5 pr-4">Project / Crate</th>
                  <th className="py-2.5 pr-4">Classification</th>
                  <th className="py-2.5 pr-4">Storage / Indexing Model</th>
                  <th className="py-2.5">Primary Use Case</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70 text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-blue-600 dark:text-sky-400">
                    rustdb
                  </td>
                  <td className="py-3 pr-4">Embedded Relational Engine</td>
                  <td className="py-3 pr-4">Sorted Data Files + CoW AtomicFile</td>
                  <td className="py-3">Safe-Rust embedded SQL &amp; stored procedures</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                    sqlx
                  </td>
                  <td className="py-3 pr-4">Async SQL Toolkit / Driver</td>
                  <td className="py-3 pr-4">Delegates to PostgreSQL / MySQL / SQLite</td>
                  <td className="py-3">Compile-time verified SQL in Axum backends</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                    redb
                  </td>
                  <td className="py-3 pr-4">Embedded Key-Value Store</td>
                  <td className="py-3 pr-4">Copy-on-Write B-Tree Pages (MVCC)</td>
                  <td className="py-3">High-speed ACID local state &amp; indexing</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                    TiKV
                  </td>
                  <td className="py-3 pr-4">Distributed Transactional KV</td>
                  <td className="py-3 pr-4">Multi-Raft + RocksDB LSM-Tree</td>
                  <td className="py-3">Planet-scale distributed ACID storage</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-white">
                    DataFusion
                  </td>
                  <td className="py-3 pr-4">Query Execution Engine</td>
                  <td className="py-3 pr-4">Apache Arrow Columnar In-Memory</td>
                  <td className="py-3">Vectorized SQL &amp; OLAP query planning</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Part 2: Architecture Pipeline Diagram + Interactive B+Tree Storage Simulator */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-12">
          {/* Architecture Pipeline Diagram */}
          <div className="lg:col-span-6 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6">
            <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-1">
              QUERY TO NVMe EXECUTION PATH
            </div>
            <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-5">
              Layered Rust Database Kernel Architecture
            </h3>

            <div className="space-y-3">
              {[
                {
                  step: 'Layer 01',
                  title: 'SQL Parser & Logical Planner',
                  detail:
                    'Tokenizes SQL AST, resolves schema catalogs, and applies predicate pushdown + join reordering.',
                },
                {
                  step: 'Layer 02',
                  title: 'Physical Execution & Index Access',
                  detail:
                    'Selects B+Tree range scan vs. hash join; traverses internal separator keys in O(log_B N) steps.',
                },
                {
                  step: 'Layer 03',
                  title: 'MVCC Snapshot & Lock-Free Buffer Pool',
                  detail:
                    'Validates tuple visibility (xmin/xmax) and pins 8KB page frames via RAII lifetime guards.',
                },
                {
                  step: 'Layer 04',
                  title: 'Write-Ahead Log (WAL) & Atomic Page Flush',
                  detail:
                    'Appends physiological redo records and fsyncs dirty slotted pages to NVMe blocks.',
                },
              ].map((layer) => (
                <div
                  key={layer.step}
                  className="p-3.5 rounded-lg bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-start gap-3.5"
                >
                  <span className="text-xs font-mono font-bold text-blue-600 dark:text-sky-400 shrink-0 pt-0.5">
                    {layer.step}
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {layer.title}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {layer.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive B+Tree Storage & Buffer Pool Calculator */}
          <div className="lg:col-span-6 rounded-xl bg-white dark:bg-[#0b101e] border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono text-blue-600 dark:text-sky-400 mb-1">
                INTERACTIVE INDEXING &amp; PAGE SIMULATOR
              </div>
              <h3 className="font-display font-bold text-lg text-slate-900 dark:text-white mb-4">
                B+Tree Page Hierarchy &amp; Buffer Cache Modeler
              </h3>

              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <label htmlFor="rustdb-rows-input" className="text-slate-600 dark:text-slate-400">
                      Table Cardinality (Total Rows)
                    </label>
                    <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                      {totalRows.toLocaleString()} rows
                    </span>
                  </div>
                  <input
                    id="rustdb-rows-input"
                    type="range"
                    min="50000"
                    max="10000000"
                    step="50000"
                    value={totalRows}
                    onChange={(e) => setTotalRows(Number(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="rustdb-rowbytes-input" className="text-slate-600 dark:text-slate-400">
                        Avg Tuple Size
                      </label>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {averageRowBytes} B
                      </span>
                    </div>
                    <input
                      id="rustdb-rowbytes-input"
                      type="range"
                      min="64"
                      max="512"
                      step="32"
                      value={averageRowBytes}
                      onChange={(e) => setAverageRowBytes(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <label htmlFor="rustdb-cache-input" className="text-slate-600 dark:text-slate-400">
                        Buffer Pool RAM
                      </label>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {cacheMemoryMb} MB
                      </span>
                    </div>
                    <input
                      id="rustdb-cache-input"
                      type="range"
                      min="32"
                      max="2048"
                      step="32"
                      value={cacheMemoryMb}
                      onChange={(e) => setCacheMemoryMb(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Page Size Selector */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400">
                    Slotted Page Frame Size:
                  </span>
                  <div className="flex items-center gap-2">
                    {([4, 8, 16] as const).map((kb) => (
                      <button
                        key={kb}
                        type="button"
                        onClick={() => setPageSizeKb(kb)}
                        className={`px-3 py-1 rounded text-xs font-mono cursor-pointer transition-colors ${
                          pageSizeKb === kb
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {kb} KiB
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Computed Telemetry Readout */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/90">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">B+Tree Depth</div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {metrics.treeHeight} levels
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/90">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Leaf Pages</div>
                <div className="text-base font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                  {metrics.leafPageCount.toLocaleString()}
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/90">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Cache Hit Ratio</div>
                <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {metrics.bufferPoolHitRatioPercent}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/90">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">Point Lookup</div>
                <div className="text-base font-mono font-bold text-blue-600 dark:text-sky-400 tabular-nums">
                  {metrics.estimatedLatencyMicros} µs
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Part 3: Practical Syntax-Highlighted Rust Code Examples */}
        <div className="rounded-xl overflow-hidden border border-slate-300 dark:border-slate-800 bg-[#050811] text-slate-100">
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {RUSTDB_CODE_EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedCodeId(ex.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    selectedCodeId === ex.id
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {ex.title}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCopyCode}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Rust Source</span>
                </>
              )}
            </button>
          </div>

          <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800/80 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-2">
            <span>{activeExample.description}</span>
            <span className="font-mono text-sky-400">{activeExample.filename}</span>
          </div>

          <pre className="p-5 text-xs font-mono text-sky-100 overflow-x-auto leading-relaxed">
            <code>{activeExample.code}</code>
          </pre>
        </div>
      </div>
    </section>
  );
};
