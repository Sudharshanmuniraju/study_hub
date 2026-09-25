import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, Eye, Download, ZoomIn, ZoomOut,
  ChevronLeft, ChevronRight, Loader2, X, Scissors,
} from 'lucide-react';
import {
  loadPdf, renderPageToCanvas, extractPagesToPdf,
  downloadBlob, formatBytes, type LoadedPdf,
} from '@/lib/pdfUtils';
import { GlassCard } from '@/components/GlassCard';

type PreviewState = {
  currentPage: number;
  scale: number;
  rendering: boolean;
};

export function PdfExcerpt() {
  const [file, setFile] = useState<File | null>(null);
  const [loaded, setLoaded] = useState<LoadedPdf | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(1);
  const [downloading, setDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [preview, setPreview] = useState<PreviewState>({
    currentPage: 1,
    scale: 1.2,
    rendering: false,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const handleFile = useCallback(async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    setError(null);
    setLoading(true);
    setFile(selectedFile);
    setShowPreview(false);
    try {
      const result = await loadPdf(selectedFile);
      setLoaded(result);
      setStartPage(1);
      setEndPage(Math.min(result.numPages, 1));
      setPreview((p) => ({ ...p, currentPage: 1 }));
    } catch {
      setError('Failed to load PDF. The file may be corrupted or password-protected.');
      setFile(null);
      setLoaded(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFile(droppedFile);
  }, [handleFile]);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  // Clamp page range to loaded PDF
  useEffect(() => {
    if (!loaded) return;
    setStartPage((v) => Math.min(Math.max(1, v), loaded.numPages));
    setEndPage((v) => Math.min(Math.max(1, v), loaded.numPages));
  }, [loaded]);

  // Render preview page when preview is open
  useEffect(() => {
    if (!showPreview || !loaded || !canvasRef.current) return;
    let cancelled = false;

    const render = async () => {
      setPreview((p) => ({ ...p, rendering: true }));
      try {
        const canvas = canvasRef.current!;
        await renderPageToCanvas(
          loaded.pdf,
          preview.currentPage,
          canvas,
          preview.scale,
        );
      } catch {
        // ignore render errors on rapid navigation
      } finally {
        if (!cancelled) setPreview((p) => ({ ...p, rendering: false }));
      }
    };

    render();
    return () => { cancelled = true; };
  }, [showPreview, loaded, preview.currentPage, preview.scale]);

  const handlePreview = () => {
    if (!loaded) return;
    const clampedStart = Math.min(startPage, endPage);
    setPreview((p) => ({ ...p, currentPage: clampedStart, scale: 1.2 }));
    setShowPreview(true);
  };

  const handleDownload = async () => {
    if (!file || !loaded) return;
    const realStart = Math.min(startPage, endPage);
    const realEnd = Math.max(startPage, endPage);
    setDownloading(true);
    setError(null);
    try {
      const blob = await extractPagesToPdf(file, realStart, realEnd);
      const baseName = file.name.replace(/\.pdf$/i, '');
      downloadBlob(blob, `${baseName}_pages_${realStart}-${realEnd}.pdf`);
    } catch {
      setError('Failed to extract pages. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setLoaded(null);
    setShowPreview(false);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const realStart = loaded ? Math.min(startPage, endPage) : startPage;
  const realEnd = loaded ? Math.max(startPage, endPage) : endPage;
  const pageCount = realEnd - realStart + 1;

  const zoomIn = () => setPreview((p) => ({ ...p, scale: Math.min(p.scale + 0.25, 3) }));
  const zoomOut = () => setPreview((p) => ({ ...p, scale: Math.max(p.scale - 0.25, 0.5) }));
  const prevPage = () => setPreview((p) => ({ ...p, currentPage: Math.max(realStart, p.currentPage - 1) }));
  const nextPage = () => setPreview((p) => ({ ...p, currentPage: Math.min(realEnd, p.currentPage + 1) }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center">
          <Scissors size={20} className="text-accent" />
        </div>
        <div>
          <h2 className="font-semibold text-lg">PDF Excerpt Tool</h2>
          <p className="text-sm text-secondary">Upload a PDF, select a page range, preview and download an excerpt.</p>
        </div>
      </div>

      {/* Upload zone */}
      {!loaded && (
        <div
          ref={dropRef}
          onDrop={onDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`glass rounded-3xl p-12 text-center cursor-pointer transition-all ${
            dragging ? 'ring-2 ring-accent scale-[1.01]' : 'hover:border-accent/30'
          }`}
        >
          <motion.div
            animate={{ y: dragging ? -4 : 0 }}
            className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4"
          >
            {loading ? <Loader2 size={28} className="text-accent animate-spin" /> : <Upload size={28} className="text-accent" />}
          </motion.div>
          <h3 className="font-semibold mb-1">
            {loading ? 'Loading PDF…' : 'Drop your PDF here'}
          </h3>
          <p className="text-sm text-secondary mb-4">
            {loading ? 'Parsing pages' : 'or click to browse files'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={onFileInput}
            className="hidden"
          />
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="glass rounded-2xl p-4 flex items-center gap-3 border-red-500/20"
          >
            <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <X size={16} className="text-red-500" />
            </div>
            <p className="text-sm text-red-500">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loaded file info + page range selector */}
      {loaded && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <GlassCard glow className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText size={20} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{loaded.fileName}</p>
                  <p className="text-xs text-secondary mt-0.5">
                    {loaded.numPages} pages · {formatBytes(loaded.byteSize)}
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors shrink-0"
                aria-label="Remove file"
              >
                <X size={18} />
              </button>
            </div>
          </GlassCard>

          {/* Page range controls */}
          <div className="glass rounded-2xl p-5">
            <h4 className="font-medium text-sm mb-4">Select page range</h4>
            <div className="flex items-end gap-4 flex-wrap">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-secondary font-medium">Start Page</label>
                <input
                  type="number"
                  min={1}
                  max={loaded.numPages}
                  value={startPage}
                  onChange={(e) => setStartPage(Number(e.target.value) || 1)}
                  className="glass-input w-28 text-center"
                />
              </div>
              <div className="pb-2.5 text-secondary">
                <ChevronRight size={18} />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-secondary font-medium">End Page</label>
                <input
                  type="number"
                  min={1}
                  max={loaded.numPages}
                  value={endPage}
                  onChange={(e) => setEndPage(Number(e.target.value) || 1)}
                  className="glass-input w-28 text-center"
                />
              </div>
              <div className="pb-2.5 ml-auto">
                <span className="text-sm text-secondary">
                  <span className="font-semibold text-[var(--text-primary)]">{pageCount}</span> page{pageCount !== 1 ? 's' : ''} selected
                </span>
              </div>
            </div>

            {/* Quick range presets */}
            <div className="flex items-center gap-2 mt-4 flex-wrap">
              <span className="text-xs text-secondary">Quick select:</span>
              {[
                { label: 'First page', s: 1, e: 1 },
                { label: 'First 5', s: 1, e: Math.min(5, loaded.numPages) },
                { label: 'First 10', s: 1, e: Math.min(10, loaded.numPages) },
                { label: 'All pages', s: 1, e: loaded.numPages },
              ].map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { setStartPage(preset.s); setEndPage(preset.e); }}
                  className="text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 hover:border-accent/30 transition-colors text-secondary hover:text-[var(--text-primary)]"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 mt-5">
              <button
                onClick={handlePreview}
                disabled={pageCount < 1}
                className="btn-ghost flex items-center gap-2 border border-white/10"
              >
                <Eye size={16} /> Preview Excerpt
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading || pageCount < 1}
                className="btn-accent flex items-center gap-2"
              >
                {downloading ? (
                  <><Loader2 size={16} className="animate-spin" /> Extracting…</>
                ) : (
                  <><Download size={16} /> Download Excerpt</>
                )}
              </button>
            </div>
          </div>

          {/* Preview viewer */}
          <AnimatePresence>
            {showPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="glass rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-sm flex items-center gap-2">
                      <Eye size={16} className="text-accent" />
                      Preview · Page {preview.currentPage} of {loaded.numPages}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={zoomOut}
                        disabled={preview.scale <= 0.5}
                        className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors disabled:opacity-30"
                        aria-label="Zoom out"
                      >
                        <ZoomOut size={16} />
                      </button>
                      <span className="text-xs text-secondary w-12 text-center">
                        {Math.round(preview.scale * 100)}%
                      </span>
                      <button
                        onClick={zoomIn}
                        disabled={preview.scale >= 3}
                        className="p-2 rounded-lg hover:bg-white/10 text-secondary transition-colors disabled:opacity-30"
                        aria-label="Zoom in"
                      >
                        <ZoomIn size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Canvas area */}
                  <div className="relative rounded-xl bg-black/5 dark:bg-white/5 border border-white/10 overflow-auto flex items-center justify-center" style={{ minHeight: '400px', maxHeight: '600px' }}>
                    {preview.rendering && (
                      <div className="absolute inset-0 flex items-center justify-center z-10 bg-white/5 backdrop-blur-sm">
                        <Loader2 size={24} className="text-accent animate-spin" />
                      </div>
                    )}
                    <canvas
                      ref={canvasRef}
                      className="mx-auto my-4 shadow-lg rounded-lg"
                    />
                  </div>

                  {/* Page navigation */}
                  <div className="flex items-center justify-center gap-4 mt-4">
                    <button
                      onClick={prevPage}
                      disabled={preview.currentPage <= realStart}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-secondary"
                      aria-label="Previous page"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: realEnd - realStart + 1 }, (_, i) => i + realStart).map((pageNum) => (
                        <button
                          key={pageNum}
                          onClick={() => setPreview((p) => ({ ...p, currentPage: pageNum }))}
                          className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                            preview.currentPage === pageNum
                              ? 'bg-accent text-white'
                              : 'bg-white/5 text-secondary hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={nextPage}
                      disabled={preview.currentPage >= realEnd}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-secondary"
                      aria-label="Next page"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
