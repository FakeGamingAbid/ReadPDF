# 📖 ReadPdf

A modern, elegant, and secure PDF reading and annotation web application built with **React**, **Vite**, **TypeScript**, and **Tailwind CSS**. It is designed with a strong focus on privacy, performing all PDF extraction, rendering, and database persistence **entirely client-side** on your local device.

[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=Vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## ✨ Features

- 📂 **Local PDF Uploads**: Drag-and-drop or select any PDF file to load instantly.
- 🔒 **100% Client-Side & Private**: Your files are stored inside your browser's local sandbox; they are **never uploaded to any server**.
- 📬 **IndexedDB Integration**: High-capacity local database storage that retains your custom PDFs, notes, and bookmark states across browser sessions.
- 📴 **Fully Offline Capable**: Once loaded, the application operates completely offline without needing an active internet connection.
- 🧭 **Sidebar Navigation panel**: Interactive sidebar featuring:
  - Document lists for quick switching.
  - Page-specific bookmark management.
  - Rich text notes anchored to specific pages.
- 🎨 **Fluid Animations**: Smooth, tactile entrance/exit spring-animations powered by **Motion** (`motion/react`) for sidebar menus and overlays.
- 🔍 **Interactive Toolbar**: Precision controls for zooming, fast page search, fullscreen presentation, and direct physical printing.

---

## 🛠️ Tech Stack & Libraries

- **Frontend Core**: React 18 & TypeScript
- **Bundler & Tooling**: Vite
- **Animations**: `motion/react`
- **Styling**: Tailwind CSS
- **PDF Core Rendering**: [PDF.js by Mozilla](https://mozilla.github.io/pdf.js/) (integrated via browser APIs and canvas layers)
- **Local Database**: IndexedDB (for structured binary blob files) & LocalStorage (for general layout preferences)
- **Iconography**: [lucide-react](https://lucide.github.io/lucide/)

---

## 🚀 Getting Started

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ReadPdf.git
   cd ReadPdf
   ```

2. **Install the dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

---

## 📐 Project Structure

```text
/
├── src/
│   ├── components/
│   │   ├── Sidebar.tsx        # Slide-out interactive navigational sidebar
│   │   ├── PageRenderer.tsx   # Core element rendering PDF viewport canvases
│   │   ├── Toolbar.tsx        # Integrated navigation & page inspection actions
│   │   └── EmptyState.tsx     # Clean file drops & initial onboarding view
│   ├── App.tsx                # Context coordination & IndexedDB controller
│   ├── index.css              # Custom themes and standard Tailwind configurations
│   ├── types.ts               # Shared internal typescript definitions
│   └── main.tsx               # App entry mount
├── index.html                 # Main HTML viewport template
├── package.json               # Package declarations & deployment scripts
└── metadata.json              # Platform runtime metadata configurations
```

---

## 🛡️ Privacy & Security

**ReadPdf** takes user security extremely seriously:
* No analytics trackers or secondary telemetry.
* No backend servers or cloud databases.
* Binary files and your personal documents remain sandboxed in your browser's private state, safe from third-party interception.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
