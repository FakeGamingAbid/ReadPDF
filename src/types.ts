export interface PDFDocumentInfo {
  id: string;
  name: string;
  size: number;
  uploadDate: string;
  dataUrl?: string; // Cache base64 data URL for persistence in storage if space permits
  file?: File; // Temporary reference to loaded File object
}

export interface Bookmark {
  id: string;
  pageNumber: number;
  label?: string;
  createdAt: string;
}

export interface PDFNote {
  id: string;
  pageNumber: number;
  text: string;
  color: string; // Tailwind bg color class
  createdAt: string;
}

export interface PDFSearchResult {
  pageNumber: number;
  text: string;
  matchIndex: number;
  contextIndex: number;
}

export interface OutlineItem {
  title: string;
  dest: any;
  pageNumber?: number;
  items: OutlineItem[];
}

export type ViewMode = 'single' | 'double' | 'continuous';

export type ReaderTheme = 'light' | 'dark' | 'sepia' | 'book';

export interface ReaderSettings {
  zoom: number; // 0.5 to 3.0
  theme: ReaderTheme;
  viewMode: ViewMode;
  presentationMode: boolean;
  autoScroll: boolean;
  sidebarOpen: boolean;
  activeSidebarTab: 'outline' | 'thumbnails' | 'search' | 'notes' | 'files';
}
