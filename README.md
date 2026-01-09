# DocForge Landing Page

A modern SaaS landing page for DocForge - an AI-powered documentation linting tool.

## Tech Stack

- **React 18** with **TypeScript**
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Lucide React** for icons

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
DocForge/
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

