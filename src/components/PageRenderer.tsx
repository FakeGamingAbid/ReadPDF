import React, { useEffect, useRef, useState } from 'react';
import { ReaderTheme } from '../types';
import { 
  Loader2, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Maximize2,
  ZoomIn,
  ZoomOut
} from 'lucide-react';

interface PageRendererProps {
  pdfDocument: any;
  currentPage: number;
  zoom: number;
  theme: ReaderTheme;
  rotation: number;
  onPageChange: (page: number) => void;
  onPdfError: (msg: string) => void;
  totalPages: number;
  onZoomChange: (zoom: number) => void;
}

export default function PageRenderer({
  pdfDocument,
  currentPage,
  zoom,
  theme,
  rotation,
  onPageChange,
  onPdfError,
  totalPages,
  onZoomChange
}: PageRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const renderTaskRef = useRef<any | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);

  // States and refs for mouse grab-to-scroll/panning
  const [isGrabbed, setIsGrabbed] = useState(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const scrollTopRef = useRef(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only drag with left mouse button
    if (e.button !== 0 || !containerRef.current) return;
    
    // Check if there is scrolling content to allow grabbing
    const container = containerRef.current;
    const hasScroll = container.scrollHeight > container.clientHeight || container.scrollWidth > container.clientWidth;
    if (!hasScroll) return;

    // Prevent highlighting elements when dragging a document
    e.preventDefault();

    isDraggingRef.current = true;
    setIsGrabbed(true);
    
    startXRef.current = e.pageX - container.offsetLeft;
    startYRef.current = e.pageY - container.offsetTop;
    scrollLeftRef.current = container.scrollLeft;
    scrollTopRef.current = container.scrollTop;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current || !containerRef.current) return;
    e.preventDefault();
    
    const container = containerRef.current;
    const x = e.pageX - container.offsetLeft;
    const y = e.pageY - container.offsetTop;
    
    const walkX = (x - startXRef.current) * 1.5;
    const walkY = (y - startYRef.current) * 1.5;
    
    container.scrollLeft = scrollLeftRef.current - walkX;
    container.scrollTop = scrollTopRef.current - walkY;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
    setIsGrabbed(false);
  };

  // Resize observer to recalculate zoom on viewport changes
  useEffect(() => {
    if (!containerRef.current) return;
    
    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const width = entries[0].contentRect.width;
      if (width > 0) {
        setContainerWidth(width);
      }
    });
    
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Scroll back to top cleanly when switching content pages
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  useEffect(() => {
    let active = true;

    const renderPage = async () => {
      if (!pdfDocument || !canvasRef.current) return;

      setLoading(true);
      setErrorLocal(null);

      // Cancel any ongoing rendering task gracefully
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore error on already done/cancelled tasks
        }
        renderTaskRef.current = null;
      }

      try {
        const page = await pdfDocument.getPage(currentPage);
        if (!active) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (!context) throw new Error("Could not acquire 2D canvas context.");

        // Calculate viewport with correct rotation and scale
        // PDFJS default rotation + user manual zoom rotation
        const nativeRotation = typeof page.rotate === 'number' ? page.rotate : (typeof page.rotation === 'number' ? page.rotation : 0);
        let finalRotation = (nativeRotation + rotation) % 360;
        if (finalRotation < 0) {
          finalRotation = (finalRotation + 360) % 360;
        }

        // Calculate unscaled viewport to determine optimal width
        const unscaledViewport = page.getViewport({ scale: 1.0, rotation: finalRotation });
        
        // Calculate dynamic zoom if Auto-Fit is active (zoom === 0)
        const padding = containerWidth < 640 ? 16 : 48;
        let calculatedZoom = (containerWidth - padding) / unscaledViewport.width;
        // Clamp to sensible range
        calculatedZoom = Math.max(0.4, Math.min(4.0, calculatedZoom));
        
        const activeZoom = zoom === 0 ? calculatedZoom : zoom;
        const viewport = page.getViewport({ scale: activeZoom, rotation: finalRotation });

        // Account for Retina Displays high-DPI
        const devicePixelRatio = window.devicePixelRatio || 1;
        canvas.width = viewport.width * devicePixelRatio;
        canvas.height = viewport.height * devicePixelRatio;

        if (zoom !== 0) {
          // User requested a specific zoom preset - respect exact pixel viewport dimensions
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
        } else {
          // Dynamic Auto-Fit mode on resize, fit to standard bounding layout responsive width safely
          const fitsScreen = viewport.width <= containerWidth - 32;
          if (fitsScreen) {
            canvas.style.width = `${viewport.width}px`;
            canvas.style.height = `${viewport.height}px`;
          } else {
            canvas.style.width = '100%';
            canvas.style.maxWidth = `${viewport.width}px`;
            canvas.style.height = 'auto';
          }
        }

        // Scale context to ensure crisp high-res crispness
        context.scale(devicePixelRatio, devicePixelRatio);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        // Store the render task reference to be cancelable
        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
        
        if (active) {
          setLoading(false);
        }
      } catch (err: any) {
        if (err.name === 'RenderingCancelledException') {
          // Rendering was canceled by subsequent render; this is expected behavior
          return;
        }
        console.error("PDF page render failure: ", err);
        if (active) {
          setErrorLocal(err.message || "Failed to render PDF page onto drawing canvas.");
          setLoading(false);
          onPdfError(err.message || "Renderer side error.");
        }
      }
    };

    renderPage();

    return () => {
      active = false;
      if (renderTaskRef.current) {
        try {
          renderTaskRef.current.cancel();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [pdfDocument, currentPage, zoom, rotation, containerWidth]);

  // Adjust theme color palette filters for the canvas
  let themeCanvasFilter = '';
  let themeBgColor = 'bg-natural-bg'; // outer backplate color

  if (theme === 'sepia') {
    themeCanvasFilter = 'sepia(25%) contrast(95%) saturate(110%) hue-rotate(5deg)';
    themeBgColor = 'bg-[#f5ebd0]';
  } else if (theme === 'dark') {
    // Beautiful inverted eye-save dark mode: Invert everything to make pages dark, 
    // then rotate hue 180 degrees to preserve color integrity!
    themeCanvasFilter = 'invert(92%) hue-rotate(180deg) brightness(98%) contrast(105%)';
    themeBgColor = 'bg-[#2D2A26]';
  } else if (theme === 'book') {
    themeCanvasFilter = 'sepia(10%) brightness(102%)';
    themeBgColor = 'bg-[#F2EEE8]';
  }

  const cursorClass = isGrabbed 
    ? 'cursor-grabbing' 
    : (zoom !== 0 ? 'cursor-grab' : 'cursor-default');

  return (
    <div className="flex-1 w-full h-full relative overflow-hidden flex flex-col">
      <div 
        ref={containerRef}
        id="pdf-view-stage"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        className={`flex-1 overflow-auto relative p-3 sm:p-6 md:p-12 flex flex-col justify-start items-center transition-colors duration-300 ${themeBgColor} ${cursorClass}`}
      >
        {/* Loading overlay with subtle spinner */}
        {loading && (
          <div className="absolute top-4 right-4 bg-natural-card/90 backdrop-blur-xs py-1.5 px-3.5 rounded-full flex items-center space-x-2 text-xs font-bold text-natural-text border border-natural-border-muted shadow-sm z-10 w-auto">
            <Loader2 className="animate-spin text-natural-sage h-4 w-4" />
            <span>Shaping Page...</span>
          </div>
        )}

        {/* Main Canvas Display Wrapper */}
        <div className="relative shadow-2xl rounded-sm border border-natural-border/40 bg-white select-none transition-transform duration-200 m-auto">
          
          {errorLocal ? (
            <div className="w-[450px] aspect-[1/1.4] flex flex-col items-center justify-center text-center p-8 text-rose-600 bg-natural-card rounded-xl space-y-4">
              <AlertTriangle size={36} className="text-rose-500 animate-bounce" />
              <div className="space-y-1">
                <p className="text-sm font-bold">Error Displaying Page</p>
                <p className="text-xs text-natural-muted max-w-sm px-4">{errorLocal}</p>
              </div>
              <button
                id="btn-retry-render"
                onClick={() => onPageChange(currentPage)}
                className="py-2 px-4 bg-natural-sage hover:bg-natural-sage-dark text-[#FDFCFB] font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Retry Canvas Loading
              </button>
            </div>
          ) : (
            <canvas 
              id="pdf-render-canvas"
              ref={canvasRef} 
              className="rounded-xs select-none pointer-events-none transition-all duration-300 transform-gpu"
              style={{ filter: themeCanvasFilter }}
            />
          )}
        </div>
      </div>

      {/* Corner Controls for easy flip navigation while reading (statically positioned relative to viewport bottom) */}
      {totalPages > 0 && (
        <div className="absolute bottom-6 inset-x-0 flex items-center justify-center space-x-6 pointer-events-none z-10">
          <div className="bg-natural-card/95 backdrop-blur-xs shadow-md border border-natural-border rounded-full flex items-center p-1.5 space-x-1 pointer-events-auto select-none">
            <button
              id="hover-btn-prev"
              disabled={currentPage <= 1}
              onClick={() => onPageChange(currentPage - 1)}
              title="Previous Page"
              className="p-1.5 rounded-full text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-xs font-extrabold text-natural-text px-4 min-w-[75px] text-center">
              {currentPage} / {totalPages}
            </span>
            <button
              id="hover-btn-next"
              disabled={currentPage >= totalPages}
              onClick={() => onPageChange(currentPage + 1)}
              title="Next Page"
              className="p-1.5 rounded-full text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>

            {/* Floating Zoom Option controls */}
            <span className="h-5 w-px bg-natural-border-muted mx-1" />
            <button
              id="floating-btn-zoom-out"
              disabled={(zoom !== 0 && zoom <= 0.5) || totalPages === 0}
              onClick={() => onZoomChange(zoom === 0 ? 1.0 : Math.max(0.5, zoom - 0.25))}
              title="Zoom Out"
              className="p-1.5 rounded-full text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
            <span className="text-xs font-extrabold text-natural-text min-w-[45px] text-center select-none">
              {zoom === 0 ? "Auto" : `${Math.round(zoom * 100)}%`}
            </span>
            <button
              id="floating-btn-zoom-in"
              disabled={(zoom !== 0 && zoom >= 4.0) || totalPages === 0}
              onClick={() => onZoomChange(zoom === 0 ? 1.5 : Math.min(4.0, zoom + 0.25))}
              title="Zoom In"
              className="p-1.5 rounded-full text-natural-text hover:text-natural-sage hover:bg-natural-sidebar disabled:text-stone-300 disabled:pointer-events-none transition-all cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
