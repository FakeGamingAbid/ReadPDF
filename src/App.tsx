import React, { useState, useEffect, useRef } from 'react';
import { 
  SAMPLE_PDF_BASE64 
} from './data/samplePdf';
import { 
  PDFDocumentInfo, 
  Bookmark as PDFBookmark, 
  PDFNote, 
  ReaderTheme 
} from './types';
import Toolbar from './components/Toolbar';
import Sidebar from './components/Sidebar';
import PageRenderer from './components/PageRenderer';
import EmptyState from './components/EmptyState';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

// ==========================================
// IndexedDB Helper implementation for large file blobs persistent storage 
// ==========================================
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PDFReaderDB', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const storePDFRaw = async (id: string, file: Blob): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const req = store.put(file, id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB error inside storage: ", e);
  }
};

const getPDFRaw = async (id: string): Promise<Blob | null> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly');
      const store = tx.objectStore('files');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB error inside read: ", e);
    return null;
  }
};

const deletePDFRaw = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      const store = tx.objectStore('files');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error("IndexedDB error inside delete: ", e);
  }
};

// ==========================================
// Converter: Base64 string to native file Blob
// ==========================================
const base64ToBlob = (base64: string, type = 'application/pdf'): Blob => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type });
};

export default function App() {
  const [uploadedPdfs, setUploadedPdfs] = useState<PDFDocumentInfo[]>([]);
  const [activePdf, setActivePdf] = useState<PDFDocumentInfo | null>(null);
  const [pdfDocument, setPdfDocument] = useState<any | null>(null);

  // Reader Settings State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [zoom, setZoom] = useState<number>(0);

  const handleZoomChange = (value: number) => {
    setZoom(value);
    localStorage.setItem('pdf_reader_zoom', String(value));
  };

  const [theme, setTheme] = useState<ReaderTheme>('light');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [presentationMode, setPresentationMode] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);

  // Bookmarks & Sticky Notes (Session + localStorage persisted)
  const [bookmarks, setBookmarks] = useState<PDFBookmark[]>([]);
  const [notes, setNotes] = useState<PDFNote[]>([]);

  // App core states
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [pdfLoading, setPdfLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [pdfToDelete, setPdfToDelete] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial local state configurations load
  useEffect(() => {
    try {
      // 1. Restore PDFs metadata registry list
      const savedList = localStorage.getItem('pdf_reader_list');
      if (savedList) {
        setUploadedPdfs(JSON.parse(savedList));
      }
      
      // 2. Restore active pdf selection index
      const savedActiveId = localStorage.getItem('pdf_reader_active_id');
      
      // 3. Restore visual selections
      const savedTheme = localStorage.getItem('pdf_reader_theme') as ReaderTheme;
      if (savedTheme) setTheme(savedTheme);

      const savedZoom = localStorage.getItem('pdf_reader_zoom');
      if (savedZoom) setZoom(parseFloat(savedZoom));
      
      const savedBookmarks = localStorage.getItem('pdf_reader_bookmarks');
      if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));

      const savedNotes = localStorage.getItem('pdf_reader_notes');
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      
      setAppLoading(false);

      if (savedActiveId && savedList) {
        const parsedList = JSON.parse(savedList) as PDFDocumentInfo[];
        const target = parsedList.find(item => item.id === savedActiveId);
        if (target) {
          handleSelectPdf(target.id);
        }
      }
    } catch (e) {
      console.error("Initialization restore failure:", e);
      setAppLoading(false);
    }
  }, []);

  // Sync Bookmarks to LocalStorage
  const handleAddBookmark = () => {
    if (!activePdf) return;
    const isAlreadyBookmarked = bookmarks.some(
      (b) => b.pageNumber === currentPage
    );
    if (isAlreadyBookmarked) return;

    const newBookmark: PDFBookmark = {
      id: `${activePdf.id}-page-${currentPage}`,
      pageNumber: currentPage,
      createdAt: new Date().toISOString()
    };

    const updated = [...bookmarks, newBookmark];
    setBookmarks(updated);
    localStorage.setItem('pdf_reader_bookmarks', JSON.stringify(updated));
  };

  const handleRemoveBookmark = (id: string) => {
    const updated = bookmarks.filter((b) => b.id !== id);
    setBookmarks(updated);
    localStorage.setItem('pdf_reader_bookmarks', JSON.stringify(updated));
  };

  // Sync Sticky Notes to LocalStorage
  const handleAddNote = (text: string) => {
    if (!activePdf) return;
    const newNote: PDFNote = {
      id: `note-${activePdf.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageNumber: currentPage,
      text: text,
      color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      createdAt: new Date().toISOString()
    };

    const updated = [...notes, newNote];
    setNotes(updated);
    localStorage.setItem('pdf_reader_notes', JSON.stringify(updated));
  };

  const handleRemoveNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem('pdf_reader_notes', JSON.stringify(updated));
  };

  // Custom page change handler that persists the current page parameter locally per document
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (activePdf) {
      localStorage.setItem(`pdf_reader_page_${activePdf.id}`, String(page));
    }
  };

  // Switch Active PDF
  const handleSelectPdf = async (id: string) => {
    setPdfLoading(true);
    setErrorBanner(null);
    setRotation(0);

    try {
      const docMeta = uploadedPdfs.find((doc) => doc.id === id);
      const restoredMeta = docMeta || JSON.parse(localStorage.getItem('pdf_reader_list') || '[]').find((doc: any) => doc.id === id);
      
      if (!restoredMeta) {
        throw new Error("Target document metadata index not found.");
      }

      // Read real binary from IndexedDB
      const fileBlob = await getPDFRaw(id);
      if (!fileBlob) {
        throw new Error("Specified document binary content is missing inside database registry.");
      }

      const activeArray = await fileBlob.arrayBuffer();
      
      const windowObj = window as any;
      
      // Resiliently wait up to 4.5s for PDFJS loading from CDN to eliminate transient load race conditions
      let retries = 0;
      while (!windowObj.pdfjsLib && retries < 15) {
        await new Promise((resolve) => setTimeout(resolve, 300));
        retries++;
      }

      if (!windowObj.pdfjsLib) {
        throw new Error("Core PDF rendering library (PDF.js) failed to load via network CDN. Please check your internet connection.");
      }

      // Initialize the PDFJs document loader
      const loadingTask = windowObj.pdfjsLib.getDocument({ data: new Uint8Array(activeArray) });
      const parsedDoc = await loadingTask.promise;

      setPdfDocument(parsedDoc);
      setTotalPages(parsedDoc.numPages);
      setActivePdf(restoredMeta);
      
      // Load saved last viewed page number for this PDF
      const savedPageNum = localStorage.getItem(`pdf_reader_page_${id}`);
      const pageToSet = savedPageNum ? Math.min(Math.max(1, parseInt(savedPageNum, 10)), parsedDoc.numPages) : 1;
      setCurrentPage(pageToSet);
      
      localStorage.setItem('pdf_reader_active_id', id);
    } catch (err: any) {
      console.error("Failed to load selected PDF document:", err);
      setErrorBanner(err.message || "Failed to parse PDF document.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Handle PDF file upload (from EmptyState or sidebar input)
  const handlePdfUpload = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert("Please upload a valid PDF document file (*.pdf)");
      return;
    }

    setPdfLoading(true);
    setErrorBanner(null);

    const docId = `pdf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newDocMeta: PDFDocumentInfo = {
      id: docId,
      name: file.name,
      size: file.size,
      uploadDate: new Date().toISOString()
    };

    try {
      // 1. Store the original document bytes safely into IndexedDB
      await storePDFRaw(docId, file);

      // 2. Append meta records
      const updatedList = [newDocMeta, ...uploadedPdfs];
      setUploadedPdfs(updatedList);
      localStorage.setItem('pdf_reader_list', JSON.stringify(updatedList));

      // 3. Immediately switch viewer to focus this file
      setRotation(0);
      
      const windowObj = window as any;
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = windowObj.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const parsedDoc = await loadingTask.promise;

      setPdfDocument(parsedDoc);
      setTotalPages(parsedDoc.numPages);
      setActivePdf(newDocMeta);
      setCurrentPage(1);
      localStorage.setItem(`pdf_reader_page_${docId}`, '1');
      
      localStorage.setItem('pdf_reader_active_id', docId);
    } catch (err: any) {
      console.error("PDF upload or parsing failed:", err);
      setErrorBanner(err.message || "Failed to process target PDF file.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Load and inject the initial gorgeous Sample PDF document 
  const handleLoadSamplePdf = async () => {
    setPdfLoading(true);
    setErrorBanner(null);

    const docId = 'sample-pdf-doc';
    const sampleMeta: PDFDocumentInfo = {
      id: docId,
      name: 'Guide - PDF Reader Features.pdf',
      size: 5320, // dummy size
      uploadDate: new Date().toISOString()
    };

    try {
      // Convert standard Base64 back into a compliant file blob context
      const sampleBlob = base64ToBlob(SAMPLE_PDF_BASE64);
      await storePDFRaw(docId, sampleBlob);

      const updatedList = [sampleMeta, ...uploadedPdfs.filter(d => d.id !== docId)];
      setUploadedPdfs(updatedList);
      localStorage.setItem('pdf_reader_list', JSON.stringify(updatedList));

      setRotation(0);

      const windowObj = window as any;
      const arrayBuffer = await sampleBlob.arrayBuffer();
      const loadingTask = windowObj.pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const parsedDoc = await loadingTask.promise;

      setPdfDocument(parsedDoc);
      setTotalPages(parsedDoc.numPages);
      setActivePdf(sampleMeta);
      
      const savedPageNum = localStorage.getItem(`pdf_reader_page_${docId}`);
      const pageToSet = savedPageNum ? Math.min(Math.max(1, parseInt(savedPageNum, 10)), parsedDoc.numPages) : 1;
      setCurrentPage(pageToSet);
      
      localStorage.setItem('pdf_reader_active_id', docId);
    } catch (err: any) {
      console.error("Failed loading local sample PDF:", err);
      setErrorBanner("Could not inject sample presentation. Please try manually uploading a standard PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  // Delete PDF file references
  const handleDeletePdf = (id: string) => {
    setPdfToDelete(id);
  };

  const executeDeletePdf = async (id: string) => {
    try {
      await deletePDFRaw(id);
      const updatedList = uploadedPdfs.filter((doc) => doc.id !== id);
      setUploadedPdfs(updatedList);
      localStorage.setItem('pdf_reader_list', JSON.stringify(updatedList));

      // Clean bookmarks and notes associated with this document
      const filteredBookmarks = bookmarks.filter((b) => !b.id.startsWith(id));
      setBookmarks(filteredBookmarks);
      localStorage.setItem('pdf_reader_bookmarks', JSON.stringify(filteredBookmarks));

      localStorage.removeItem(`pdf_reader_page_${id}`);

      if (activePdf?.id === id) {
        setPdfDocument(null);
        setActivePdf(null);
        setTotalPages(0);
        localStorage.removeItem('pdf_reader_active_id');
      }
    } catch (e) {
      console.error("Deletion task error:", e);
    } finally {
      setPdfToDelete(null);
    }
  };

  // Document actions: Real Original PDF Printing!
  const handlePrintPdf = async () => {
    if (!activePdf) return;
    try {
      const blob = await getPDFRaw(activePdf.id);
      if (!blob) throw new Error("Could not restore file context for printing.");
      
      const fileUrl = URL.createObjectURL(blob);
      const printWindow = window.open(fileUrl, '_blank');
      if (printWindow) {
        printWindow.focus();
      }
    } catch (e: any) {
      alert("Print failed: " + e.message);
    }
  };

  // Document actions: Real Original PDF Download!
  const handleDownloadPdf = async () => {
    if (!activePdf) return;
    try {
      const blob = await getPDFRaw(activePdf.id);
      if (!blob) throw new Error("Could not restore file context for download.");

      const fileUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = activePdf.name;
      link.click();
      URL.revokeObjectURL(fileUrl);
    } catch (e: any) {
      alert("Download failed: " + e.message);
    }
  };

  // Sidebar Toggling
  const handleToggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Full-screen Presentation toggle
  const handleTogglePresentation = () => {
    if (!presentationMode) {
      // Enter fullscreen
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch((err) => console.error(err));
      }
      setPresentationMode(true);
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => console.error(err));
      }
      setPresentationMode(false);
    }
  };

  // Rotate clockwise/counter-clockwise
  const handleRotate = (direction: 'cw' | 'ccw') => {
    if (direction === 'cw') {
      setRotation((prev) => (prev + 90) % 360);
    } else {
      setRotation((prev) => (prev - 90 + 360) % 360);
    }
  };

  // Render initialization loading bar
  if (appLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-natural-bg space-y-3">
        <Loader2 className="animate-spin text-natural-sage h-8 w-8" />
        <span className="text-sm font-extrabold text-natural-text">Waking PDF Canvas Engine...</span>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-natural-bg select-none font-sans text-natural-text">
      
      {/* Hidden file input targetable globally */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handlePdfUpload(e.target.files[0]);
          }
        }}
        className="hidden"
      />

      {/* Top Core navigation panel */}
      {activePdf && (
        <Toolbar
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          theme={theme}
          sidebarOpen={sidebarOpen}
          presentationMode={presentationMode}
          activePdfName={activePdf.name}
          rotation={rotation}
          onPageChange={handlePageChange}
          onZoomChange={handleZoomChange}
          onThemeChange={setTheme}
          onToggleSidebar={handleToggleSidebar}
          onTogglePresentation={handleTogglePresentation}
          onRotate={handleRotate}
          onPrint={handlePrintPdf}
          onDownload={handleDownloadPdf}
        />
      )}

      {/* Main split reading interface container */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">
        <AnimatePresence>
          {/* Mobile slide-out backdrop overlay */}
          {activePdf && sidebarOpen && (
            <motion.div 
              key="sidebar-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSidebarOpen(false)}
              className="md:hidden fixed inset-0 bg-[#2D2A26]/40 backdrop-blur-xs z-30 cursor-pointer"
            />
          )}

          {/* Left Interactive panel (only visible if document loaded and sidebarOpen) */}
          {activePdf && sidebarOpen && (
            <motion.div
              key="sidebar-panel"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="fixed md:relative inset-y-0 left-0 w-[80vw] sm:w-[320px] md:w-80 md:min-w-80 h-full z-40 border-r border-natural-border shadow-2xl md:shadow-none bg-natural-sidebar overflow-hidden flex flex-col"
            >
              <Sidebar
                pdfDocument={pdfDocument}
                activePdf={activePdf}
                uploadedPdfs={uploadedPdfs}
                bookmarks={bookmarks.filter(b => b.id.startsWith(activePdf.id))}
                notes={notes}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onSelectPdf={handleSelectPdf}
                onUploadClick={() => fileInputRef.current?.click()}
                onLoadSample={handleLoadSamplePdf}
                onDeletePdf={handleDeletePdf}
                onAddBookmark={handleAddBookmark}
                onRemoveBookmark={handleRemoveBookmark}
                onAddNote={handleAddNote}
                onRemoveNote={handleRemoveNote}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Core stage center frame */}
        <div className="flex-1 flex flex-col overflow-hidden bg-natural-bg relative min-w-0">
          
          {/* Global error banner notifications */}
          {errorBanner && (
            <div className="bg-rose-50 border-b border-rose-200 py-3 px-4 flex items-center space-x-3 text-rose-800 text-xs">
              <AlertCircle size={16} className="text-rose-500 shrink-0" />
              <div className="flex-1 font-semibold leading-relaxed">
                {errorBanner}
              </div>
              <button 
                onClick={() => setErrorBanner(null)} 
                className="text-rose-400 hover:text-rose-700 font-extrabold text-sm"
              >
                ×
              </button>
            </div>
          )}

          {/* Render PDF Canvas, or Empty Landing State */}
          {pdfLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-natural-bg space-y-4">
              <div className="relative flex items-center justify-center">
                {/* Visual glowing aura rings */}
                <span className="absolute h-12 w-12 rounded-full bg-natural-sage/10 animate-ping" />
                <Loader2 className="animate-spin text-natural-sage h-8 w-8 z-10" />
              </div>
              <div className="space-y-1 text-center">
                <p className="text-sm font-bold text-natural-text">Ingesting document metadata...</p>
                <p className="text-xs text-natural-muted">Loading vector elements and bookmarks mapping.</p>
              </div>
            </div>
          ) : activePdf && pdfDocument ? (
            <PageRenderer
              pdfDocument={pdfDocument}
              currentPage={currentPage}
              zoom={zoom}
              theme={theme}
              rotation={rotation}
              onPageChange={handlePageChange}
              onZoomChange={handleZoomChange}
              onPdfError={(msg) => setErrorBanner(msg)}
              totalPages={totalPages}
            />
          ) : (
            <EmptyState
              onFileUpload={handlePdfUpload}
              onLoadSample={handleLoadSamplePdf}
            />
          )}

        </div>
        
      </div>

      {/* Custom Delete Confirmation Modal */}
      {pdfToDelete && (
        <div className="fixed inset-0 bg-[#2D2A26]/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-natural-card border border-natural-border rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-start space-x-3.5">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                <AlertCircle size={20} />
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <h3 className="text-sm font-extrabold text-natural-text">
                  Delete PDF Document?
                </h3>
                <p className="text-xs text-natural-muted leading-relaxed break-words">
                  Are you sure you want to delete <span className="font-bold text-natural-text">"{uploadedPdfs.find(p => p.id === pdfToDelete)?.name || 'this PDF'}"</span>? This action is permanent!
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPdfToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-natural-muted hover:text-natural-text hover:bg-natural-sidebar rounded-xl border border-natural-border-muted transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => executeDeletePdf(pdfToDelete)}
                className="px-4 py-2 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Delete PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
