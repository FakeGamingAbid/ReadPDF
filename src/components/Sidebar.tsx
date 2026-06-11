import React, { useState } from 'react';
import { 
  FileText, 
  Trash2, 
  Plus, 
  FileCheck2,
  Bookmark,
  BookmarkPlus,
  StickyNote,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { PDFDocumentInfo, Bookmark as PDFBookmark, PDFNote } from '../types';

interface SidebarProps {
  pdfDocument: any; // Checked PDFJs document reference
  activePdf: PDFDocumentInfo | null;
  uploadedPdfs: PDFDocumentInfo[];
  bookmarks: PDFBookmark[];
  notes: PDFNote[];
  currentPage: number;
  onPageChange: (page: number) => void;
  onSelectPdf: (id: string) => void;
  onUploadClick: () => void;
  onLoadSample: () => void;
  onDeletePdf: (id: string) => void;
  onAddBookmark: () => void;
  onRemoveBookmark: (id: string) => void;
  onAddNote: (text: string) => void;
  onRemoveNote: (id: string) => void;
  onClose?: () => void;
}

export default function Sidebar({
  activePdf,
  uploadedPdfs,
  bookmarks,
  notes,
  currentPage,
  onPageChange,
  onSelectPdf,
  onUploadClick,
  onLoadSample,
  onDeletePdf,
  onAddBookmark,
  onRemoveBookmark,
  onAddNote,
  onRemoveNote,
  onClose,
  // Remaining props destructor parameters mapped to avoid unused warnings
  pdfDocument: _pdfDocument
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'bookmarks' | 'notes'>('files');
  const [noteText, setNoteText] = useState('');

  const isCurrentPageBookmarked = bookmarks.some(
    (b) => b.pageNumber === currentPage
  );

  // Filter notes belonging to the current PDF. 
  // We match ID prefix note-<pdfId>- or we show them for single/default cases safely.
  const pdfNotes = activePdf 
    ? notes.filter(n => n.id.includes(`note-${activePdf.id}-`)) 
    : [];

  return (
    <aside 
      id="pdf-sidebar" 
      className="w-full h-full bg-natural-sidebar flex flex-col"
    >
      {/* Mobile-only close bar */}
      {onClose && (
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-natural-card border-b border-natural-border">
          <span className="text-[10px] font-extrabold text-natural-muted uppercase tracking-wider">Navigation Menu</span>
          <button 
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-natural-text hover:text-red-500 bg-natural-sidebar px-2.5 py-1 rounded-md border border-natural-border cursor-pointer select-none"
            title="Dismiss navigation"
          >
            Close ×
          </button>
        </div>
      )}

      {/* Tabs Switcher Header */}
      <div className="flex border-b border-natural-border bg-natural-card p-1 shrink-0">
        <button
          onClick={() => setActiveTab('files')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
            activeTab === 'files'
              ? 'bg-natural-sidebar text-natural-sage-dark shadow-xs'
              : 'text-natural-muted hover:text-natural-text hover:bg-natural-sidebar/40'
          }`}
        >
          <FileText size={14} />
          <span>Files</span>
        </button>
        <button
          disabled={!activePdf}
          onClick={() => setActiveTab('bookmarks')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
            activeTab === 'bookmarks'
              ? 'bg-natural-sidebar text-natural-sage-dark shadow-xs'
              : 'text-natural-muted hover:text-natural-text hover:bg-natural-sidebar/40'
          }`}
        >
          <Bookmark size={14} />
          <span>Bookmarks</span>
        </button>
        <button
          disabled={!activePdf}
          onClick={() => setActiveTab('notes')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none ${
            activeTab === 'notes'
              ? 'bg-natural-sidebar text-natural-sage-dark shadow-xs'
              : 'text-natural-muted hover:text-natural-text hover:bg-natural-sidebar/40'
          }`}
        >
          <StickyNote size={14} />
          <span>Notes</span>
        </button>
      </div>

      {/* Tab Body content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col min-h-0">
        
        {/* FILES TAB */}
        {activeTab === 'files' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-extrabold text-natural-muted uppercase tracking-wider">Your documents</h3>
              <button
                id="sidebar-add-doc-btn"
                onClick={onUploadClick}
                className="flex items-center space-x-1 text-xs font-bold text-natural-sage hover:text-natural-sage-dark bg-natural-card border border-natural-border-muted py-1.5 px-2.5 rounded-lg shadow-2xs hover:bg-natural-paper transition-all cursor-pointer"
              >
                <Plus size={14} />
                <span>Upload</span>
              </button>
            </div>

            {uploadedPdfs.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-natural-border-muted rounded-2xl bg-natural-card space-y-3">
                <FileText size={32} className="text-natural-muted/50" />
                <div className="space-y-1">
                  <p className="text-sm font-bold text-natural-text">No PDFs uploaded yet</p>
                  <p className="text-xs text-natural-muted max-w-[180px] mx-auto">Upload files to save them in your active workspace library.</p>
                </div>
                <button
                  id="empty-state-load-sample"
                  onClick={onLoadSample}
                  className="mt-2 w-full max-w-[160px] inline-flex items-center justify-center space-x-2 py-2 px-4 bg-natural-sage hover:bg-natural-sage-dark text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition-all cursor-pointer"
                >
                  <FileCheck2 size={14} />
                  <span>Use Sample PDF</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto pr-1 flex-1 min-h-0">
                {uploadedPdfs.map((pdf) => {
                  const isActive = activePdf?.id === pdf.id;
                  const formattedSize = pdf.size > 1024 * 1024 
                    ? `${(pdf.size / (1024 * 1024)).toFixed(1)} MB` 
                    : `${(pdf.size / 1024).toFixed(0)} KB`;
                  return (
                    <div
                       key={pdf.id}
                       className={`group p-3 border rounded-xl flex items-center justify-between transition-all duration-200 relative ${
                         isActive
                           ? 'bg-natural-paper border-natural-sage shadow-xs ring-1 ring-natural-sage/20'
                           : 'bg-natural-card border-natural-border hover:border-natural-border-muted'
                       }`}
                    >
                      <button
                        onClick={() => {
                          onSelectPdf(pdf.id);
                          if (onClose) onClose();
                        }}
                        className="flex items-start space-x-3 text-left min-w-0 flex-1 pr-8 cursor-pointer"
                      >
                        <div className={`p-2 rounded-lg flex items-center justify-center ${isActive ? 'bg-[#FAF9F6] border border-natural-border-muted text-natural-sage' : 'bg-[#EBE7DF] text-natural-muted'}`}>
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isActive ? 'text-natural-sage-dark' : 'text-natural-text'}`}>
                            {pdf.name}
                          </p>
                          <span className="text-[10px] font-medium text-natural-muted flex items-center space-x-1.5 mt-0.5">
                            <span>{formattedSize}</span>
                            <span>•</span>
                            <span>{new Date(pdf.uploadDate).toLocaleDateString()}</span>
                          </span>
                        </div>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePdf(pdf.id);
                        }}
                        title="Remove PDF"
                        className="absolute right-3.5 text-red-500 hover:text-red-700 bg-red-50/80 hover:bg-red-100 active:bg-red-200/60 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center z-10 shadow-3xs"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BOOKMARKS TAB */}
        {activeTab === 'bookmarks' && activePdf && (
          <div className="flex flex-col h-full space-y-4">
            <div className="shrink-0 bg-natural-card border border-natural-border p-3.5 rounded-xl space-y-3.5">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-natural-text">Dynamic Bookmarking</h4>
                <p className="text-[10px] text-natural-muted leading-relaxed">
                  Pin key locations of <strong className="text-natural-text">"{activePdf.name}"</strong> to instantly reference them later.
                </p>
              </div>

              {isCurrentPageBookmarked ? (
                <div className="w-full py-2 px-3 bg-[#FAF9F6] border border-natural-sage/20 text-natural-sage-dark text-xs font-bold rounded-xl flex items-center justify-center space-x-2 select-none">
                  <CheckCircle size={14} className="text-natural-sage animate-pulse" />
                  <span>Page {currentPage} Bookmarked</span>
                </div>
              ) : (
                <button
                  id="sidebar-add-bookmark-btn"
                  onClick={onAddBookmark}
                  className="w-full py-2 px-3 bg-natural-sage hover:bg-natural-sage-dark text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-transform hover:scale-101 active:scale-99 cursor-pointer"
                >
                  <BookmarkPlus size={14} />
                  <span>Bookmark Page {currentPage}</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              <h3 className="text-[10px] font-extrabold text-natural-muted uppercase tracking-wider mb-2">Saved bookmarks ({bookmarks.length})</h3>
              {bookmarks.length === 0 ? (
                <div className="text-center py-8 text-xs text-natural-muted font-medium bg-natural-card rounded-xl border border-dashed border-natural-border-muted p-4">
                  No bookmarks created on this document. Flip pages and click bookmark to save locations!
                </div>
              ) : (
                bookmarks.map((bookmark) => (
                  <div 
                    key={bookmark.id}
                    className="flex items-center justify-between p-3 bg-natural-card border border-natural-border rounded-xl hover:border-natural-border-muted hover:shadow-2xs transition-all relative group"
                  >
                    <button
                      onClick={() => {
                        onPageChange(bookmark.pageNumber);
                        if (onClose) onClose();
                      }}
                      className="text-left min-w-0 pr-8 cursor-pointer flex-1"
                      title={`Jump to Page ${bookmark.pageNumber}`}
                    >
                      <div className="flex items-center space-x-1.5">
                        <Bookmark size={12} className="text-natural-sage shrink-0 fill-natural-sage" />
                        <span className="text-xs font-extrabold text-natural-sage-dark">Page {bookmark.pageNumber}</span>
                      </div>
                      <span className="text-[9px] font-medium text-natural-muted mt-1 flex items-center space-x-1 mt-0.5">
                        <Clock size={10} />
                        <span>Saved {new Date(bookmark.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </span>
                    </button>

                    <button
                      onClick={() => onRemoveBookmark(bookmark.id)}
                      className="text-red-400 hover:text-red-700 p-2 rounded-lg bg-red-50/50 hover:bg-red-50 active:bg-red-100 transition-all cursor-pointer flex items-center justify-center"
                      title="Delete Bookmark"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* NOTES TAB */}
        {activeTab === 'notes' && activePdf && (
          <div className="flex flex-col h-full space-y-4">
            <div className="shrink-0 bg-natural-card border border-natural-border p-3.5 rounded-xl space-y-3">
              <div className="space-y-1">
                <h4 className="text-xs font-extrabold text-natural-text">Page Sticky Notes</h4>
                <p className="text-[10px] text-natural-muted leading-relaxed">
                  Record study summaries or ideas for <strong className="text-natural-text">Page {currentPage}</strong>.
                </p>
              </div>

              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Write down details or comments here..."
                maxLength={400}
                className="w-full h-20 p-2.5 text-xs bg-white text-natural-text border border-natural-border-muted rounded-xl focus:outline-hidden focus:border-natural-sage focus:ring-1 focus:ring-natural-sage shadow-2xs resize-none placeholder-stone-400"
              />

              <button
                id="sidebar-add-note-btn"
                disabled={!noteText.trim()}
                onClick={() => {
                  onAddNote(noteText);
                  setNoteText('');
                }}
                className="w-full py-2 px-3 bg-natural-sage hover:bg-natural-sage-dark disabled:bg-stone-100 disabled:text-stone-300 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-2 shadow-xs transition-transform hover:scale-101 active:scale-99 disabled:pointer-events-none cursor-pointer"
              >
                <Plus size={14} />
                <span>Save Note on Page {currentPage}</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
              <h3 className="text-[10px] font-extrabold text-natural-muted uppercase tracking-wider mb-2">My sticky notes ({pdfNotes.length})</h3>
              {pdfNotes.length === 0 ? (
                <div className="text-center py-8 text-xs text-natural-muted font-medium bg-natural-card rounded-xl border border-dashed border-natural-border-muted p-4">
                  No notes saved for this document. Select a page, type something above and save it!
                </div>
              ) : (
                pdfNotes.map((note) => (
                  <div 
                    key={note.id}
                    className="p-3 border border-natural-border bg-amber-50/50 rounded-xl space-y-2 relative group hover:border-[#DCD7CC]"
                  >
                    <div className="flex items-start justify-between">
                      <button
                        onClick={() => {
                          onPageChange(note.pageNumber);
                          if (onClose) onClose();
                        }}
                        className="text-left font-extrabold text-xs text-natural-sage-dark hover:underline flex items-center space-x-1 cursor-pointer"
                        title="Jump to Note Location"
                      >
                        <StickyNote size={12} className="text-amber-600 fill-amber-300" />
                        <span>Page {note.pageNumber}</span>
                        <ExternalLink size={10} className="inline ml-0.5 opacity-60" />
                      </button>

                      <button
                        onClick={() => onRemoveNote(note.id)}
                        className="text-red-400 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50/60 transition-colors cursor-pointer"
                        title="Remove Note"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <p className="text-xs text-natural-text leading-relaxed whitespace-pre-wrap break-words pr-2">
                      {note.text}
                    </p>

                    <div className="text-[9px] font-medium text-natural-muted flex items-center space-x-1 pt-1.5 border-t border-natural-border/40">
                      <Clock size={10} />
                      <span>{new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </aside>
  );
}

