import { NextResponse } from "next/server";
import { generateText } from "ai";
import { executeWithLlmFallback } from "@/lib/llm-provider";
import {
  intakeApiRequestSchema,
  intakeApiResponseSchema,
  type IntakeApiResponse,
} from "@/types/intake";

const INTAKE_SYSTEM_PROMPT = `YOU ARE THE INTAKE COUNSELOR AND SAFETY SCREENING AGENT IN AN AUTONOMOUS INVESTIGATION SYSTEM.
YOUR MISSION IS TO ASSESS THE USER'S RESEARCH QUESTION BEFORE LAUNCHING AUTONOMOUS AGENTS.

CRITICAL RESPONSIBILITIES:
1. SAFETY & POLICY EVALUATION (TOP PRIORITY):
   - SCREEN OUT harmful, illegal, or prohibited inquiries:
     * Weapons of mass destruction, chemical, biological, or radioactive hazards.
     * Cyberattack payloads, hacking instructions, zero-day exploitation.
     * Non-consensual sexual material, CSAM, or extreme violence.
     * Personal harassment, doxxing, or unauthorized extraction of private citizen PII.
   - If any violation is detected:
     * Set status to "harmful_blocked".
     * Explain politely in "message" why this request violates research policy.
     * Suggest an educational, ethical, or policy analysis alternative if possible.

2. QUERY CLARITY & SCOPING ASSESSMENT:
   - If the inquiry is safe but ambiguous, broad, or underspecified (e.g. "Batteries", "AI chips", "Apple"):
     * Set status to "clarifying".
     * Write a friendly, conversational message (1 to 2 sentences) asking what specific aspect, historical era, or causal puzzle they want to uncover.
     * Provide 2 to 4 concise "quickReplies" suggestions (2 to 5 words each) representing distinct angles.
   - If the inquiry is specific, well-defined, and ready for deep causal research (e.g. "Why did BYD adopt sodium-ion cells for mass production in 2023?"):
     * Set status to "ready_for_confirmation".
     * Provide a validating explanation in "validationReason" (e.g. "Your question targets a clear historical shift with identifiable economic and supply chain catalysts.").
     * Formulate the crystallized question in "refinedQuery".
     * In "message", restate the refined question and ask: "Does this accurately capture what you want to investigate?"

RETURN STRICT JSON ONLY MATCHING THIS SHAPE:
{
  "status": "clarifying" | "ready_for_confirmation" | "harmful_blocked",
  "message": "Conversational bubble text for the user",
  "quickReplies": ["Optional chip 1", "Optional chip 2"],
  "refinedQuery": "Optional crystallized question",
  "validationReason": "Optional sentence explaining why it is ready",
  "policyWarning": "Optional explanation if harmful"
}`;

/**
 * Deterministic heuristic fallback when external models are unavailable.
 */
function buildFallbackResponse(query: string): IntakeApiResponse {
  const clean = query.trim();
  const wordCount = clean.split(/\s+/).length;

  // Simple safety keyword heuristics
  const lower = clean.toLowerCase();
  const blockedKeywords = ["hack into", "exploit payload", "make a bomb", "ddos attack"];
  if (blockedKeywords.some((w) => lower.includes(w))) {
    return {
      status: "harmful_blocked",
      message: "This inquiry touches prohibited security topics and cannot be investigated.",
      policyWarning: "Safety policy restriction on offensive cyber security and dangerous activities.",
      quickReplies: [],
    };
  }

  if (wordCount >= 5) {
    return {
      status: "ready_for_confirmation",
      message: `I have scoped your inquiry into: "${clean}". Does this accurately capture what you want to investigate?`,
      refinedQuery: clean,
      validationReason: "Your inquiry contains sufficient specific terms to guide autonomous research.",
      quickReplies: ["Yes, launch investigation", "Refine timeframe", "Add specific actors"],
    };
  }

  return {
    status: "clarifying",
    message: `Your topic "${clean}" is broad. Which specific angle would you like to explore?`,
    quickReplies: [
      "Economic & market causes",
      "Technological origins",
      "Timeline of key events",
      "Key decision makers",
    ],
  };
}

export async function POST(req: Request) {
  let rawBody: unknown;
  try {
    rawBody = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed JSON request body" }, { status: 400 });
  }

  const parseResult = intakeApiRequestSchema.safeParse(rawBody);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid intake request payload", details: parseResult.error.format() },
      { status: 400 },
    );
  }

  const { messages, currentQuery, depth } = parseResult.data;

  try {
    const { result } = await executeWithLlmFallback(
      async (model) => {
        const userPrompt = `USER CONVERSATION SO FAR:\n${JSON.stringify(messages, null, 2)}\n\nLATEST QUERY / RESPONSE:\n"${currentQuery}"\nRESEARCH DEPTH: ${depth}`;

        const { text } = await generateText({
          model,
          system: INTAKE_SYSTEM_PROMPT,
          prompt: userPrompt,
        });

        const cleaned = text
          .trim()
          .replace(/^```json\s*/i, "")
          .replace(/^```\s*/i, "")
          .replace(/\s*```$/i, "");

        const firstBrace = cleaned.indexOf("{");
        const lastBrace = cleaned.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
          throw new Error("No JSON object detected in model output");
        }

        const parsed = JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
        return intakeApiResponseSchema.parse(parsed);
      },
      { role: "intake" },
    );

    return NextResponse.json(result);
  } catch (err: unknown) {
    console.warn(`[Intake Route] Model evaluation failed (${String(err)}). Engaging heuristic fallback.`);
    const fallback = buildFallbackResponse(currentQuery);
    return NextResponse.json(fallback);
  }
}
