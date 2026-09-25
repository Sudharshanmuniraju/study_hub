import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export type PdfPageInfo = {
  pageNumber: number;
  width: number;
  height: number;
};

export type LoadedPdf = {
  pdf: pdfjsLib.PDFDocumentProxy;
  numPages: number;
  fileName: string;
  byteSize: number;
};

export async function loadPdf(file: File): Promise<LoadedPdf> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  return {
    pdf,
    numPages: pdf.numPages,
    fileName: file.name,
    byteSize: file.size,
  };
}

export async function renderPageToCanvas(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale: number,
): Promise<PdfPageInfo> {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context not available');

  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${viewport.width}px`;
  canvas.style.height = `${viewport.height}px`;

  context.clearRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvas, canvasContext: context, viewport }).promise;

  return { pageNumber, width: viewport.width, height: viewport.height };
}

export async function extractPagesToPdf(
  file: File,
  startPage: number,
  endPage: number,
): Promise<Blob> {
  const arrayBuffer = await file.arrayBuffer();
  const sourceDoc = await PDFDocument.load(arrayBuffer);
  const targetDoc = await PDFDocument.create();

  const pageIndices: number[] = [];
  for (let i = startPage; i <= endPage; i++) {
    pageIndices.push(i - 1);
  }

  const copiedPages = await targetDoc.copyPages(sourceDoc, pageIndices);
  copiedPages.forEach((page) => targetDoc.addPage(page));

  const pdfBytes = await targetDoc.save();
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
