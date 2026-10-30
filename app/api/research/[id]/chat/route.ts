import { NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { getPrimaryLlmModel } from "@/lib/llm-provider";
import { nodeChatRequestSchema } from "@/types/chat";
import { checkRateLimit, createRateLimitResponse } from "@/lib/rate-limit";
import type { SourceCitation } from "@/types/graph";

function buildSystemPrompt(nodeLabel: string, sources: SourceCitation[]): string {
  const citationsBlock = sources
    .map(
      (s, i) =>
        `[Source ${i + 1}] (${s.title}):\n"${s.verbatimSnippet}"\nURL: ${s.url}`,
    )
    .join("\n\n");

  return `YOU ARE THE INVESTIGATIVE ASSISTANT FOR THE ENTITY: "${nodeLabel}".
YOUR KNOWLEDGE IS STRICTLY RESTRICTED TO THE VERBATIM EVIDENCE PROVIDED BELOW.
DO NOT INVENT, SPECULATE, OR INTRODUCE EXTERNAL FACTS OUTSIDE THESE CITATIONS.

EVIDENCE BLOCK:
${citationsBlock}

INSTRUCTIONS:
1. Answer the user query clearly and concisely using only facts present in the evidence block.
2. If the user query cannot be answered directly from the provided verbatim evidence, you MUST reply:
   "Based on the verified sources for this entity, no supporting evidence exists to answer this query."
3. Cite the relevant source title or publisher domain when stating facts.`;
}

function buildHeuristicFallback(
  query: string,
  sources: SourceCitation[],
): string {
  const queryWords = query
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3);

  const matchedSources: Array<{ source: SourceCitation; matchCount: number }> = [];

  for (const src of sources) {
    const text = (src.title + " " + src.verbatimSnippet).toLowerCase();
    let count = 0;
    for (const w of queryWords) {
      if (text.includes(w)) count++;
    }
    if (count > 0) {
      matchedSources.push({ source: src, matchCount: count });
    }
  }

  if (matchedSources.length === 0) {
    return "Based on the verified sources for this entity, no supporting evidence exists to answer this query.";
  }

  matchedSources.sort((a, b) => b.matchCount - a.matchCount);
  const best = matchedSources[0].source;
  return `According to verified evidence in "${best.title}": "${best.verbatimSnippet}"`;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const rateLimit = await checkRateLimit(request, "node_chat");
    if (!rateLimit.allowed) {
      return createRateLimitResponse(rateLimit);
    }

    await context.params;
    const body = await request.json();
    const parsed = nodeChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid chat payload", details: parsed.error.format() },
        { status: 400 },
      );
    }

    const { query, sources, nodeLabel = "Investigated Entity", history = [] } =
      parsed.data;
    const systemPrompt = buildSystemPrompt(nodeLabel, sources);

    // Format chat messages
    const formattedMessages = [
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: query },
    ];

    const primaryLlm = getPrimaryLlmModel(undefined, "reader");

    if (primaryLlm) {
      try {
        const streamResult = streamText({
          model: primaryLlm.model,
          system: systemPrompt,
          messages: formattedMessages,
        });

        return streamResult.toTextStreamResponse();
      } catch (streamErr) {
        console.warn(
          "[NodeChat] Live streaming failed, falling back to heuristic:",
          streamErr,
        );
      }
    }

    // Heuristic Fallback Stream when LLM is unavailable or offline
    const fallbackMessage = buildHeuristicFallback(query, sources);
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream out words with brief intervals for realistic typing
        const chunks = fallbackMessage.split(" ");
        for (let i = 0; i < chunks.length; i++) {
          const chunk = (i === 0 ? "" : " ") + chunks[i];
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[NodeChat] Unhandled route error:", error);
    return NextResponse.json(
      { error: "Failed to process chat query" },
      { status: 500 },
    );
  }
}
