<!-- BEGIN:runtime-environment-guardrails -->
# 1. RUNTIME ENVIRONMENT & IMMUTABLE GUARDRAILS

- **Framework:** Next.js 15+ / 16 (App Router, React 19, Server Actions).
- **Language:** TypeScript 5+ in strict mode (`"strict": true`, `"noImplicitAny": true`).
- **Core Principle:** The agent is an implementer under strict contracts. You do NOT make product assumptions, you do NOT invent architectural shortcuts, and you NEVER write code without loading the active phase context.
- **Secret Zero-Exposure Rule:** Secret API keys (`TAVILY_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DATABASE_URL`) exist ONLY in server runtimes (`process.env`). Never prefix secrets with `NEXT_PUBLIC_`. Never import server-only modules inside client components.
<!-- END:runtime-environment-guardrails -->

---

# 2. MANDATORY CONTEXT READING ORDER

Before executing ANY prompt, generating ANY plan, or editing ANY file, read the relevant context files in this exact order:

1. `context/project-overview.md` — In-scope boundaries, user persona, non-negotiable features.
2. `context/architecture.md` — System boundaries, data flow, server/client splits, DB schemas.
3. `context/schemas-and-contracts.md` — Zod definitions for Graph Nodes, Edges, Research State, and Timeline.
4. `context/code-standards.md` — TypeScript standards, error handling patterns, naming conventions.
5. `context/ui-tokens.md` — Semantic colors, typography, layout dimensions, border radiuses.
6. `context/ui-rules.md` — Viewport layout rules (3-zone split), responsive breakpoints, canvas constraints.
7. `context/library-docs.md` — Verified code patterns for `@xyflow/react`, `dagre`, Vercel AI SDK, and Tavily.
8. `context/build-plan.md` — Active phase, feature dependency chains, acceptance criteria.
9. `context/progress-tracker.md` — Check completed vs pending features.
10. `context/ui-registry.md` — Reusable components already built. Never recreate existing patterns.

If any context file contradicts your base training data, **the context file overrides your training data 100% of the time.**

---

# 3. BOUNDARY INVARIANTS (RULES THAT NEVER CHANGE)

### A. Code & Framework Architecture
- **Server Actions vs Route Handlers:**
  - Use **Server Actions** for mutations (starting a research session, bookmarking a node, saving a note).
  - Use **Route Handlers (`/api/...`)** exclusively for Server-Sent Events (SSE) streaming (telemetry stream, graph streaming) and external webhooks.
- **Client vs Server Boundary:**
  - Files containing `"use client"` MUST NOT import database clients, raw LLM SDKs, or secret environment keys.
  - Client components only receive serializable JSON props or consume streams via custom hooks.
- **Zero Raw Hex & Zero Ad-Hoc Styling:**
  - Hardcoded hex codes (`#1a202c`) and arbitrary Tailwind values (`w-[347px]`, `text-[#ff0000]`) are BANNED.
  - Use semantic tokens from `globals.css` and `context/ui-tokens.md` (e.g., `bg-background-subtle`, `text-accent-primary`, `border-border-muted`).

### B. Graph & Canvas Determinism
- **No Coordinate Guessing:**
  - LLMs are topologically competent but spatially blind. The LLM must NEVER output `{ x: number, y: number }` coordinates for graph nodes.
  - The agent extracts raw graph topology: `nodes: [{ id, label, type }]` and `edges: [{ source, target, relation }]`.
  - All positional coordinates must be computed deterministically on client or server using `dagre` or `elkjs` layout algorithms before rendering.
- **Node Collision & Isolation Prevention:**
  - Every node must have at least one incoming or outgoing edge, unless explicitly marked as a `root_query` or `isolated_finding`.
  - Node IDs must follow a strict slug format: `[entity_type]_[kebab-case-name]` (e.g., `tech_sodium-ion`, `org_byd`).

### C. LLM & Agent Safety Loops
- **Zod Schema Invariance:**
  - Every external API response (Tavily search results) and every LLM output MUST be validated through `safeParse()` using schemas from `schemas-and-contracts.md`.
  - If parsing fails, do NOT crash the UI: invoke the repair fallback or trigger an automatic re-prompt step with the validation error.
- **Recursion Caps & Token Safeguards:**
  - Max research depth: strictly 3 iterations.
  - Max queries per iteration: strictly 4.
  - Every recursive loop must contain an absolute termination condition:
    ```typescript
    if (iterationCount >= MAX_ITERATIONS || unvisitedQueries.length === 0) break;
    ```

---

# 4. STEP-BY-STEP EXECUTION PROTOCOL

For every feature or bug fix requested, follow this 5-stage loop without skipping steps:


```

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ 1. Context Load │ ──► │  2. Plan Phase  │ ──► │ 3. Execution   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
│
┌─────────────────┐     ┌────────▼────────┐
│ 5. Registry/Log │ ◄── │ 4. Verification │
└─────────────────┘     └─────────────────┘

```

1. **Context Load:** Identify the target feature ID from `build-plan.md`. Read the corresponding section and verify prerequisites in `progress-tracker.md`.
2. **Plan Phase (`/architect`):**
   - For any feature touching >1 file or involving state/APIs, list all impacted files, define props/schemas, and wait for confirmation if in Plan Mode.
3. **Execution Phase:**
   - Write clean, modular code. Respect file length limits (<250 lines per component).
   - Extract UI subcomponents into separate files under the appropriate directory.
4. **Verification Phase (`/review`):**
   - Run type checks (`tsc --noEmit`).
   - Run linter (`npm run lint`).
   - Verify that no banned patterns (raw hex, client imports of server modules) were introduced.
5. **Registry & Tracker Update (`/imprint` & Bookkeeping):**
   - If a new UI component was created, document its class patterns in `context/ui-registry.md`.
   - Mark the feature as completed `[x]` in `context/progress-tracker.md`.

---

# 5. DIAGNOSTIC & RECOVERY PROTOCOL (`/recover`)

When an error or broken state occurs, immediately identify the failure mode. Do NOT guess or blindly try random code changes:

### Failure Mode 1: TypeScript / Build Compilation Error
- **Symptom:** Next.js build fails, missing imports, type mismatch.
- **Action:** Inspect the exact terminal stack trace. Check if a newly installed package requires Next.js 15+ external package transpile or `"use client"` directives. Fix the type definition at the source (`schemas-and-contracts.md`), not with `as any`.

### Failure Mode 2: LLM JSON / Schema Extraction Failure
- **Symptom:** `ZodError`, invalid JSON string, markdown backticks returned in API payload.
- **Action:** Enforce `response_format: { type: "json_object" }` or use Vercel AI SDK's `generateObject()` with direct schema attachment. Strip leading/trailing markdown fences (` ```json `) defensively.

### Failure Mode 3: React Flow Canvas Layout Glitch
- **Symptom:** Nodes overlapping at `(0, 0)`, canvas rendering black, edges pointing to non-existent nodes.
- **Action:** Check node measurement lifecycle. Ensure `dagre.layout()` runs AFTER node dimensions are set, or provide fallback default dimensions (`width: 220, height: 80`) to the layout function.

### Failure Mode 4: Context Pollution & Agent Hallucination
- **Symptom:** The agent creates duplicate utility files, ignores existing design tokens, or starts refactoring unrelated code.
- **Action:** Halt work immediately. Discard active file edits. Run `/remember restore` to reload ground truth from `memory.md`, then proceed with single-file atomic prompts.

---

# 6. ACTIVE SKILLS SPECIFICATION

| Command | Lifecycle Trigger | Objective | Output Artifact |
| :--- | :--- | :--- | :--- |
| `/architect [feature_id]` | Before touching code for any complex logic or schema change. | Surfaces edge cases, validates data flow, structures implementation steps. | Markdown blueprint with exact file changes. |
| `/imprint` | Immediately after building any new UI component or canvas node. | Extracts Tailwind classes, visual tokens, and component API. | Appended entry in `context/ui-registry.md`. |
| `/review` | After completing a feature or before testing in the browser. | Verifies architecture boundaries, type safety, and acceptance criteria. | Graded audit report (Critical, Important, Minor). |
| `/recover` | Immediately upon encountering an unhandled crash or repeat bug. | Categorizes the failure mode (1 to 4) and applies one atomic corrective patch. | Root-cause diagnosis + single targeted diff. |
| `/remember save` | At the end of every work session or before switching agents. | Compresses active state, resolved decisions, and next target feature. | Updated `memory.md`. |
| `/remember restore` | At the start of every session. | Ingests `memory.md` to restore full situational awareness without context loss. | Confirmation of active phase and next task. |