# Causality-Search — Deep Research & Interactive Knowledge Engine

Causality-Search is an autonomous deep research platform that performs recursive multi-agent web investigations and renders verified findings into an interactive, causal knowledge graph and chronological timeline.

---

## Architecture Overview

Causality-Search pairs autonomous AI inquiry loops with deterministic spatial visualization:

1. **Autonomous Multi-Agent Loop:**
   - **The Architect:** Decomposes complex queries into hypothesis trees and graph topology.
   - **The Reader:** Fetches primary web documents and source snippets via Tavily.
   - **The Fact Checker:** Validates credibility scores, detects disputed claims, and flags contradictions.
   - **The Visualizer:** Translates raw graph topology into deterministic left-to-right causal layouts.

2. **3-Zone Interactive Workspace:**
   - **Left Zone (Canvas):** `@xyflow/react` interactive canvas powered by `elkjs` hierarchical auto-layout.
   - **Right Top (Live Terminal):** Real-time Server-Sent Events (SSE) telemetry feed showing agent thoughts and source scrapes.
   - **Right Bottom (Timeline):** Chronological milestone track with time-dilation scaling and dispute indicators.

3. **Backend & Relational State:**
   - **Database:** InsForge PostgreSQL with relational integrity, cascading foreign keys, and Row Level Security (RLS).
   - **Data Contracts:** Strict Zod schema validation across all agent inputs, API payloads, and graph nodes.

---

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router, Server Actions, Route Handlers)
- **Library:** React 19 with strict TypeScript
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com) with semantic CSS design tokens (zero hardcoded hex codes)
- **Graph & Layout:** `@xyflow/react` and `elkjs`
- **Database & Auth:** `@insforge/sdk` (PostgreSQL with RLS)
- **AI SDK:** Vercel AI SDK (`ai`, `@ai-sdk/openai`)

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ installed
- Access to InsForge database backend

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to inspect the application.

### 4. Build for Production
```bash
npm run build
```

---

## Project Structure

```
├── app/                  # Next.js App Router (pages, layouts, API routes)
│   ├── globals.css       # Semantic theme tokens (surfaces, entities, agents)
│   ├── layout.tsx        # Root layout with Inter & Geist Mono fonts
│   └── page.tsx          # System verification dashboard
├── context/              # Architectural guardrails, tokens & schemas
├── docs/specs/           # Phased feature architectural blueprints
├── lib/                  # Shared utilities (cn, helpers)
└── migrations/           # Versioned PostgreSQL DDL migrations
```
