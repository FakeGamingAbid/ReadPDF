import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  FilePlus2, 
  Sparkles, 
  Check, 
  BookOpen, 
  FolderSearch,
  BookMarked,
  RotateCw
} from 'lucide-react';

interface EmptyStateProps {
  onFileUpload: (file: File) => void;
  onLoadSample: () => void;
}

export default function EmptyState({ onFileUpload, onLoadSample }: EmptyStateProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type === 'application/pdf') {
      onFileUpload(files[0]);
    } else if (files.length > 0) {
      alert("Invalid format! Please upload a valid PDF document (.pdf file).");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileUpload(files[0]);
    }
  };

  return (
    <div id="empty-state-container" className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-natural-bg overflow-y-auto">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Title and description */}
        <div className="space-y-3">
          <div className="inline-flex items-center space-x-2 bg-natural-sidebar border border-natural-border-muted text-natural-sage-dark font-extrabold px-3.5 py-1 rounded-full text-[10px] uppercase tracking-wider animate-fade-in shadow-2xs">
            <Sparkles size={12} className="text-natural-sage animate-spin-slow" />
            <span>Smooth Client-Side Engine</span>
          </div>
          <h1 className="text-4xl font-bold font-serif text-natural-text tracking-tight leading-none sm:text-5xl">
            Read PDFs beautifully.
          </h1>
          <p className="text-natural-muted text-sm max-w-md mx-auto leading-relaxed font-medium">
            Drag in your textbooks, documentation papers, or slides. No server storage, no tracking — 100% private and sandboxed.
          </p>
        </div>

        {/* Drag and Drop Box */}
        <div
          id="dropzone-area"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative p-8 md:p-12 border-2 border-dashed rounded-3xl cursor-pointer bg-natural-card transition-all duration-300 transform flex flex-col items-center group shadow-xs ${
            dragOver 
              ? 'border-natural-sage bg-natural-paper scale-102 ring-4 ring-natural-sage/5' 
              : 'border-natural-border hover:border-natural-sage hover:shadow-md'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="relative mb-4">
            {/* Soft backdrop rings */}
            <div className="absolute inset-0 bg-natural-sidebar rounded-full scale-150 group-hover:scale-175 transition-transform duration-300 blur-xs" />
            <div className="relative p-4 bg-natural-paper text-natural-sage rounded-2xl border border-natural-border flex items-center justify-center group-hover:bg-natural-sage group-hover:text-[#F9F7F2] transition-all shadow">
              <UploadCloud size={32} className="animate-pulse" />
            </div>
          </div>

          <div className="space-y-1 z-10">
            <p className="text-sm font-extrabold text-natural-text">
              Drag and drop PDF here
            </p>
            <p className="text-xs text-natural-muted">
              or click to open local file explorer
            </p>
          </div>

          <div className="mt-6 flex items-center space-x-2 text-[10px] text-natural-muted border-t border-natural-border-light pt-4 w-full justify-center">
            <span>Accepted file formats:</span>
            <span className="font-extrabold text-natural-sage-dark bg-natural-sidebar border border-natural-border-muted px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider">
              .PDF
            </span>
          </div>
        </div>

        {/* Try Sample Section */}
        <div id="sample-pdf-loader-section" className="flex flex-col items-center space-y-3 pt-2">
          <span className="text-xs text-natural-muted font-semibold">Just exploring? Try the viewer instantly:</span>
          
          <button
            id="btn-empty-state-sample"
            onClick={onLoadSample}
            className="inline-flex items-center space-x-2.5 py-3 px-6 bg-natural-sage hover:bg-natural-sage-dark text-white font-extrabold leading-none rounded-xl text-xs sm:text-sm shadow-md hover:shadow-xl hover:scale-101 active:scale-99 transition-all cursor-pointer"
          >
            <FilePlus2 size={16} />
            <span>Open Sample Document</span>
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-natural-border-muted">
          <div className="flex items-start space-x-3 text-left">
            <div className="p-2 bg-natural-sidebar text-natural-text border border-natural-border-muted rounded-lg">
              <FolderSearch size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-natural-text">Jump to Page</p>
              <p className="text-[10px] text-natural-muted leading-relaxed">Fast index navigation using page numbers.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-left">
            <div className="p-2 bg-natural-sidebar text-natural-text border border-natural-border-muted rounded-lg">
              <BookMarked size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-natural-text">Sticky Bookmarks</p>
              <p className="text-[10px] text-natural-muted leading-relaxed">Save highlights and add detailed sticky notes.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3 text-left">
            <div className="p-2 bg-natural-sidebar text-natural-text border border-natural-border-muted rounded-lg">
              <RotateCw size={14} />
            </div>
            <div>
              <p className="text-xs font-bold text-natural-text">Contrast Themes</p>
              <p className="text-[10px] text-natural-muted leading-relaxed">Light, Sepia, and Inverted Dark mode reading views.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
