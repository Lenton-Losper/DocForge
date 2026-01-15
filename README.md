# DocDocs

A modern SaaS platform for AI-powered documentation analysis and generation.

## 🚀 Quick Start

### Install Dependencies

```bash
# Install all dependencies (frontend + backend)
npm run install:all
```

Or separately:
```bash
npm install              # Frontend
cd backend && npm install # Backend
```

### Run Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Backend: http://localhost:8000

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend: http://localhost:5173

See `QUICKSTART.md` or `RUN.md` for detailed instructions.

## 🤖 AI Features (Powered by Ollama)

DocForge uses [Ollama](https://ollama.com) for local, privacy-first AI features:

- ✨ README improvement
- 📊 Architecture diagram generation
- 📝 API documentation generation
- 🔍 Code quality analysis

### Setup Ollama

1. **Install Ollama:**
   ```bash
   # Windows: Download from https://ollama.com/download
   # Mac/Linux: curl -fsSL https://ollama.com/install.sh | sh
   ```

2. **Pull the model:**
   ```bash
   ollama pull llama3.2
   ```

3. **Verify Ollama is running:**
   ```bash
   # On Windows, Ollama runs as a background service automatically
   # Verify with:
   curl http://127.0.0.1:11434/api/tags
   ```

4. **Configure environment variables:**
   
   Add to `backend/.env`:
   ```env
   OLLAMA_URL=http://127.0.0.1:11434
   OLLAMA_MODEL=llama3.2
   ```

### Benefits
- 🆓 Completely free (no API costs)
- 🔒 100% private (runs locally)
- ⚡ Fast (2-5 second responses)
- 🚫 No rate limits

See `OLLAMA_INTEGRATION.md` for detailed integration guide.

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Ollama** for local AI features

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
DocDocs/
├── src/
│   ├── components/
│   │   ├── Navigation.tsx      # Sticky navigation bar
│   │   ├── Hero.tsx            # Hero section with CTA
│   │   ├── Preview.tsx         # Document preview section
│   │   ├── Features.tsx        # Features grid
│   │   └── WorkflowDiagram.tsx # Workflow diagram modal
│   ├── App.tsx                 # Main app component
│   ├── main.tsx                # Entry point
│   └── index.css               # Global styles
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## Features

- ✅ Responsive design (mobile-first)
- ✅ Smooth scroll behavior
- ✅ Sticky navigation with scroll shadow
- ✅ Interactive workflow diagram
- ✅ Accessible components with ARIA labels
- ✅ Modern UI with Tailwind CSS
- ✅ TypeScript for type safety

## Design System

### Colors
- Primary Blue: `#2563eb`
- Dark Navy: `#1a2332`
- Success Green: `#10b981`
- Warning Yellow: `#f59e0b`
- Error Red: `#ef4444`

### Typography
- Headings: Bold, large sizes (text-4xl, text-3xl, text-2xl)
- Body: text-base, text-gray-700

## License

MIT

