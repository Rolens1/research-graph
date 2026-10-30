# Causality-Search

> **An autonomous deep research engine that transforms complex inquiries into interactive causal knowledge graphs, live agent dialogue, and chronological timelines.**

[![Live Demo](https://img.shields.io/badge/Demo-Live_on_Vercel-blue?style=for-the-badge&logo=vercel)](https://research-graph.vercel.app/)
[![Next.js](https://img.shields.io/badge/Next.js_16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript_5-007ACC?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Overview

When researching complex, multi-layered topics (geopolitical conflicts, industry disruptions, scientific breakthroughs, or historical inflection points), conventional AI search tools provide flat walls of text that are hard to verify, spatial relationships that are lost in linear prose, and opaque reasoning hidden behind loading spinners.

**Causality-Search** takes a different approach:
Instead of outputting static text, a synchronized team of **four autonomous AI agents** investigates the web in public view. As they read sources, cross-examine evidence, and debate contradictions, they construct:
1. **An Interactive Causal Graph** illustrating root causes, obstacles, financial ties, and policy decisions.
2. **A Live Telemetry Terminal** streaming agent discussions and search activity via Server-Sent Events.
3. **A Chronological Milestones Timeline** synchronized directly with the visual graph.
4. **An Executive Decision Dossier (PDF)** generated on demand with verified primary citations.

---

## 🚀 Live Demo

Experience the live application here:  
👉 **[https://research-graph.vercel.app/](https://research-graph.vercel.app/)**

*Tip: You can explore immediately as a guest directly from the search bar or sign in via Google or GitHub.*

---

## 🤖 The Multi-Agent Architecture

Rather than relying on a single prompt, investigations are driven by four specialized autonomous agents working in a continuous verification loop:

```
                  ┌──────────────────────┐
                  │    The Architect     │
                  │  (Decomposes query   │
                  │  & plans hypotheses) │
                  └──────────┬───────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
┌──────────────────────┐           ┌──────────────────────┐
│      The Reader      │           │   The Fact Checker   │
│  (Live web retrieval │ ◄───────► │  (Cross-examines     │
│  & clean extraction) │           │  & flags conflicts)  │
└──────────────────────┘           └──────────────────────┘
            │                                 │
            └────────────────┬────────────────┘
                             ▼
                  ┌──────────────────────┐
                  │    The Visualizer    │
                  │  (Plots causal nodes │
                  │  & calculates graph) │
                  └──────────────────────┘
```

* **The Architect**: Breaks open-ended questions into targeted sub-inquiries and coordinates research depth.
* **The Reader**: Dispatches live web queries via Tavily and Exa to retrieve primary sources and factual evidence snippets.
* **The Fact Checker**: Cross-references claims across sources, adjusts confidence scores, and flags disputed statements.
* **The Visualizer**: Structures confirmed facts into typed entities and computes conflict-free layouts.

---

## ✨ Key Features

### 1. 3-Zone Real-Time Workspace
* **Zone 1 (Interactive Canvas)**: Explore entities and causal arrows powered by `@xyflow/react` and deterministic `elkjs` layout algorithms. Toggle between **Constellation Star Chart** and **Entity Card** view modes.
* **Zone 2 (Live Telemetry Terminal)**: Watch agents debate, search, and extract facts in real time with adjustable streaming speeds ("Turbo" vs. "Step-by-Step").
* **Zone 3 (Interactive Timeline)**: Horizontally scroll through chronological milestones. Clicking any event highlights and centers its corresponding node on the canvas.

### 2. Deep Drill-Down & Hypothesis Testing
* **Verifiable Source Inspector**: Inspect exact pull quotes, publication dates, and source URLs for any node.
* **Rabbit Hole Expansion**: Select any entity and instruct the agents to initiate a recursive secondary investigation.
* **What-If Hypothesis Mutation**: Manually introduce counterfactual hypotheses or remove causal links to test alternative historical outcomes.

### 3. One-Click Executive PDF Export
* Generates a publication-ready, two-page executive briefing dossier complete with causal summaries, key timeline events, and numbered citations.

---

## 🛠️ Tech Stack & Engineering Highlights

| Layer | Technologies | Key Highlights |
| :--- | :--- | :--- |
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript | Server Components, Server Actions, strict type safety (zero `any`) |
| **Styling & UI** | Tailwind CSS v4, Lucide Icons | Custom nautical cartography tokens, zero hardcoded hex codes, light & dark modes |
| **Graph & Canvas** | `@xyflow/react` (React Flow), `elkjs` | Deterministic layered left-to-right auto-layout, custom SVG star nodes |
| **AI Orchestration** | Vercel AI SDK (`ai`), Multi-provider fallback | Google Gemini, Groq (Qwen/Llama), OpenAI with graceful fallback resilience |
| **Search Retrieval**| Tavily Search API, Exa API | Clean real-time web extraction and source verification |
| **Realtime Streaming**| Server-Sent Events (SSE) | Anti-buffering streaming route with keep-alive pings and client reconnection |
| **Backend & Auth** | InsForge (PostgreSQL + RLS) | Google & GitHub OAuth, Row Level Security, relational schema with cascade deletes |
| **Document Export** | `@react-pdf/renderer` | Server-rendered high-resolution PDF generation with live client graph synchronization |

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js** 20+ installed
* A package manager (`npm`, `pnpm`, or `bun`)

### 1. Clone the repository
```bash
git clone https://github.com/Rolens1/research-graph.git
cd research-graph
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Copy `.env.example` to `.env.local` and add your API keys:
```bash
cp .env.example .env.local
```
*(Required: `NEXT_PUBLIC_INSFORGE_URL`, `NEXT_PUBLIC_INSFORGE_ANON_KEY`, `TAVILY_API_KEY`, and at least one LLM key such as `GEMINI_API_KEY` or `OPENAI_API_KEY`)*

### 4. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📜 License

Created as an open demonstration of modern multi-agent systems, real-time spatial graph visualization, and full-stack Next.js 16 engineering.
