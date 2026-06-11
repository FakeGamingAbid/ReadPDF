import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  RotateCcw, 
  Sun, 
  Moon, 
  BookOpen, 
  Eye, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Maximize2, 
  Minimize2,
  Printer,
  Search,
  FileDown
} from 'lucide-react';
import { ReaderTheme } from '../types';

interface ToolbarProps {
  currentPage: number;
  totalPages: number;
  zoom: number;
  theme: ReaderTheme;
  sidebarOpen: boolean;
  presentationMode: boolean;
  activePdfName: string;
  rotation: number;
  onPageChange: (page: number) => void;
  onZoomChange: (zoom: number) => void;
  onThemeChange: (theme: ReaderTheme) => void;
  onToggleSidebar: () => void;
  onTogglePresentation: () => void;
  onRotate: (direction: 'cw' | 'ccw') => void;
  onPrint: () => void;
  onDownload: () => void;
}

export default function Toolbar({
  currentPage,
  totalPages,
  zoom,
  theme,
  sidebarOpen,
  presentationMode,
  activePdfName,
  rotation,
  onPageChange,
  onZoomChange,
  onThemeChange,
  onToggleSidebar,
  onTogglePresentation,
  onRotate,
  onPrint,
  onDownload
}: ToolbarProps) {
  const [pageInput, setPageInput] = useState<string>(String(currentPage));

  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(pageInput, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed);
    } else {
      setPageInput(String(currentPage));
    }
  };

  const handlePageInputBlur = () => {
    setPageInput(String(currentPage));
  };

  const formatPercent = (val: number) => {
    return `${Math.round(val * 100)}%`;
  };

  return (
    <div id="pdf-toolbar" className="bg-natural-card border-b border-natural-border shadow-xs h-16 min-h-16 flex items-center justify-between px-3 sm:px-6 z-20">
      {/* Left: Sidebar Toggle & Doc Name */}
      <div className="flex items-center space-x-2 sm:space-x-4 select-none truncate max-w-[15%] sm:max-w-[35%]">
        <button
          id="btn-sidebar-toggle"
          onClick={onToggleSidebar}
          title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
          className="p-1.5 sm:p-2 rounded-lg text-natural-text hover:text-natural-sage hover:bg-natural-sidebar transition-colors cursor-pointer"
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>

        <div className="hidden sm:flex flex-col truncate">
          <span className="text-[10px] font-extrabold text-natural-muted uppercase tracking-wider">Active Document</span>
          <span className="text-sm font-bold text-natural-text truncate" title={activePdfName}>
            {activePdfName || "No PDF Loaded"}
          </span>
        </div>
      </div>

      {/* Middle: Pagination / Page Search by Number & Navigation */}
      <div className="flex items-center space-x-1 sm:space-x-2">
        <div className="flex items-center border border-natural-border-muted bg-natural-paper rounded-xl p-0.5 sm:p-1 shadow-xs">
          <button
            id="btn-first-page"
            disabled={currentPage <= 1 || totalPages === 0}
            onClick={() => onPageChange(1)}
            title="First Page"
            className="hidden sm:inline-flex p-1.5 rounded-lg text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronsLeft size={16} />
          </button>
          
          <button
            id="btn-prev-page"
            disabled={currentPage <= 1 || totalPages === 0}
            onClick={() => onPageChange(currentPage - 1)}
            title="Previous Page"
            className="p-1.5 rounded-lg text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>

          {/* Search Page Input by Number */}
          <form id="page-search-by-number-form" onSubmit={handlePageSubmit} className="flex items-center px-1.5 sm:px-3 border-x border-[#E2DFD6]">
            <span className="hidden sm:inline text-xs font-semibold text-natural-muted mr-1.5 select-none">Page</span>
            <input
              id="page-number-search-input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageInputBlur}
              disabled={totalPages === 0}
              className="w-8 sm:w-12 text-center text-xs sm:text-sm font-bold bg-white text-natural-text border border-natural-border-muted rounded-md focus:outline-hidden focus:border-natural-sage focus:ring-1 focus:ring-natural-sage py-0.5 px-1 shadow-inner disabled:bg-neutral-100 disabled:text-stone-300"
              title="Search and jump to page number"
            />
            <span className="text-xs sm:text-sm font-bold text-natural-text ml-1 sm:ml-1.5 select-none text-nowrap">
              / {totalPages || 0}
            </span>
          </form>

          <button
            id="btn-next-page"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => onPageChange(currentPage + 1)}
            title="Next Page"
            className="p-1.5 rounded-lg text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>

          <button
            id="btn-last-page"
            disabled={currentPage >= totalPages || totalPages === 0}
            onClick={() => onPageChange(totalPages)}
            title="Last Page"
            className="hidden sm:inline-flex p-1.5 rounded-lg text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      </div>

      {/* Right: Zoom, Rotate, Contrast View mode, Fullscreen, Actions */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        {/* Zoom group */}
        <div className="hidden md:flex items-center border border-natural-border-muted bg-natural-paper rounded-xl p-1">
          <button
            id="btn-zoom-out"
            disabled={(zoom !== 0 && zoom <= 0.5) || totalPages === 0}
            onClick={() => onZoomChange(zoom === 0 ? 1.0 : Math.max(0.5, zoom - 0.25))}
            title="Zoom Out"
            className="p-1 rounded-md text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ZoomOut size={16} />
          </button>
          
          <select
            id="zoom-preset-select"
            value={zoom}
            disabled={totalPages === 0}
            onChange={(e) => onZoomChange(parseFloat(e.target.value))}
            className="bg-transparent text-xs font-bold text-natural-text focus:outline-hidden px-1 cursor-pointer disabled:text-stone-300"
          >
            <option value={0}>Auto-Fit</option>
            <option value={0.5}>50%</option>
            <option value={0.75}>75%</option>
            <option value={1.0}>100%</option>
            <option value={1.25}>125%</option>
            <option value={1.5}>150%</option>
            <option value={1.75}>175%</option>
            <option value={2.0}>200%</option>
            <option value={2.5}>250%</option>
            <option value={3.0}>300%</option>
            <option value={4.0}>400%</option>
          </select>

          <button
            id="btn-zoom-in"
            disabled={(zoom !== 0 && zoom >= 4.0) || totalPages === 0}
            onClick={() => onZoomChange(zoom === 0 ? 1.5 : Math.min(4.0, zoom + 0.25))}
            title="Zoom In"
            className="p-1 rounded-md text-natural-text hover:text-natural-sage disabled:text-stone-300 hover:bg-natural-card disabled:pointer-events-none transition-all cursor-pointer"
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Rotation controls */}
        <div className="hidden lg:flex items-center space-x-1">
          <button
            id="btn-rotate-ccw"
            disabled={totalPages === 0}
            onClick={() => onRotate('ccw')}
            title="Rotate Counter-Clockwise"
            className="p-2 rounded-lg text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <RotateCcw size={16} />
          </button>
          <button
            id="btn-rotate-cw"
            disabled={totalPages === 0}
            onClick={() => onRotate('cw')}
            title="Rotate Clockwise"
            className="p-2 rounded-lg text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-colors cursor-pointer"
          >
            <RotateCw size={16} />
          </button>
        </div>

        {/* Reading Themes switcher */}
        <div id="theme-selector-group" className="flex items-center border border-natural-border-muted bg-natural-paper rounded-xl p-0.5 sm:p-1">
          <button
            id="theme-light-btn"
            onClick={() => onThemeChange('light')}
            title="Light Paper Theme"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === 'light' ? 'bg-natural-sage text-white shadow-sm font-semibold' : 'text-natural-muted hover:text-natural-text'}`}
          >
            <Sun size={15} />
          </button>
          <button
            id="theme-sepia-btn"
            onClick={() => onThemeChange('sepia')}
            title="Warm Eye-Save Sepia Theme"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === 'sepia' ? 'bg-[#f4ebd0] text-[#5c4033] shadow-sm' : 'text-natural-muted hover:text-natural-text'}`}
          >
            <BookOpen size={15} />
          </button>
          <button
            id="theme-dark-btn"
            onClick={() => onThemeChange('dark')}
            title="Slate Dark Theme (Eye Saver)"
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${theme === 'dark' ? 'bg-[#2D2A26] text-[#F9F7F2] shadow-sm' : 'text-natural-muted hover:text-[#2D2A26]'}`}
          >
            <Moon size={15} />
          </button>
        </div>

        {/* Print / Download / Fullscreen actions */}
        <div className="flex items-center space-x-0.5 sm:space-x-1">
          <button
            id="btn-print-doc"
            disabled={totalPages === 0}
            onClick={onPrint}
            title="Print PDF"
            className="hidden md:inline-flex p-2 rounded-lg text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
          >
            <Printer size={16} />
          </button>

          <button
            id="btn-fullscreen-toggle"
            disabled={totalPages === 0}
            onClick={onTogglePresentation}
            title={presentationMode ? "Exit Fullscreen" : "Presentation Mode"}
            className="hidden md:inline-flex p-2 rounded-lg text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {presentationMode ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
