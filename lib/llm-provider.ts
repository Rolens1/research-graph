import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LlmProviderType =
  | "groq"
  | "gemini"
  | "cerebras"
  | "openrouter"
  | "sambanova"
  | "mistral"
  | "github_models"
  | "openai";

export type AgentTaskRole = "architect" | "reader" | "fact_checker" | "visualizer" | "intake" | "general";

export type LlmProviderInfo = {
  id: LlmProviderType;
  name: string;
  modelName: string;
  isAvailable: boolean;
  priority: number;
};

/**
 * Task role based priority routing.
 * - architect (Lead reasoning): Groq leads research and asks questions.
 * - reader (High-volume ingestion): Gemini Flash & OpenRouter handle search snippets.
 * - fact_checker (Verification & Contradictions): SambaNova & Gemini evaluate disputes.
 * - visualizer (Impact & Narrative): Gemini Flash primary, Groq & SambaNova fallback.
 */
const ROLE_PRIORITY_MAP: Record<AgentTaskRole, LlmProviderType[]> = {
  architect: ["groq", "gemini", "sambanova", "openrouter", "cerebras", "mistral", "github_models", "openai"],
  reader: ["gemini", "openrouter", "sambanova", "groq", "cerebras", "mistral", "github_models", "openai"],
  fact_checker: ["sambanova", "gemini", "groq", "openrouter", "cerebras", "mistral", "github_models", "openai"],
  visualizer: ["gemini", "groq", "sambanova", "openrouter", "cerebras", "mistral", "github_models", "openai"],
  intake: ["groq", "gemini", "sambanova", "openrouter", "cerebras", "mistral", "github_models", "openai"],
  general: ["groq", "gemini", "cerebras", "openrouter", "sambanova", "mistral", "github_models", "openai"],
};

function getProviderDefinitions(): Record<
  LlmProviderType,
  {
    name: string;
    modelName: string;
    baseURL?: string;
    getApiKey: () => string | undefined;
    priority: number;
  }
> {
  return {
    groq: {
      name: "Groq Cloud (High Speed Lead Reasoning)",
      modelName: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      baseURL: "https://api.groq.com/openai/v1",
      getApiKey: () => process.env.GROQ_API_KEY,
      priority: 1,
    },
    gemini: {
      name: "Google AI Studio (Gemini Flash)",
      modelName: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      getApiKey: () =>
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY,
      priority: 2,
    },
    cerebras: {
      name: "Cerebras Cloud (Ultra Fast)",
      modelName: process.env.CEREBRAS_MODEL || "llama3.3-70b",
      baseURL: "https://api.cerebras.ai/v1",
      getApiKey: () => process.env.CEREBRAS_API_KEY,
      priority: 3,
    },
    openrouter: {
      name: "OpenRouter (Free Tier Models)",
      modelName: process.env.OPENROUTER_MODEL || "nvidia/nemotron-3.5-lightning:free",
      baseURL: "https://openrouter.ai/api/v1",
      getApiKey: () => process.env.OPENROUTER_API_KEY,
      priority: 4,
    },
    sambanova: {
      name: "SambaNova Cloud (Fast Verifier)",
      modelName: process.env.SAMBANOVA_MODEL || "gemma-4-31B-it",
      baseURL: "https://api.sambanova.ai/v1",
      getApiKey: () => process.env.SAMBANOVA_API_KEY,
      priority: 5,
    },
    mistral: {
      name: "Mistral AI",
      modelName: process.env.MISTRAL_MODEL || "mistral-small-latest",
      baseURL: "https://api.mistral.ai/v1",
      getApiKey: () => process.env.MISTRAL_API_KEY,
      priority: 6,
    },
    github_models: {
      name: "GitHub Models (GPT-4o Mini)",
      modelName: process.env.GITHUB_MODEL || "gpt-4o-mini",
      baseURL: "https://models.inference.ai.azure.com",
      getApiKey: () => process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      priority: 7,
    },
    openai: {
      name: "OpenAI Direct (GPT-4o Mini)",
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
      getApiKey: () => process.env.OPENAI_API_KEY,
      priority: 8,
    },
  };
}

export function getAvailableLlmProviders(): LlmProviderInfo[] {
  const definitions = getProviderDefinitions();
  return (Object.keys(definitions) as LlmProviderType[]).map((id) => {
    const def = definitions[id];
    const key = def.getApiKey();
    return {
      id,
      name: def.name,
      modelName: def.modelName,
      isAvailable: Boolean(key && key.trim().length > 0),
      priority: def.priority,
    };
  });
}

export function getLlmModelByProvider(providerId: LlmProviderType): {
  model: LanguageModel;
  providerId: LlmProviderType;
  modelName: string;
} | null {
  const definitions = getProviderDefinitions();
  const def = definitions[providerId];
  if (!def) return null;

  const apiKey = def.getApiKey();
  if (!apiKey || apiKey.trim().length === 0) return null;

  const client = createOpenAI({
    baseURL: def.baseURL,
    apiKey: apiKey.trim(),
  });

  return {
    model: client.chat(def.modelName),
    providerId,
    modelName: def.modelName,
  };
}

export function getPrimaryLlmModel(preferredProvider?: string, role: AgentTaskRole = "general"): {
  model: LanguageModel;
  providerId: LlmProviderType;
  modelName: string;
} | null {
  const definitions = getProviderDefinitions();
  if (preferredProvider && preferredProvider in definitions) {
    const preferred = getLlmModelByProvider(preferredProvider as LlmProviderType);
    if (preferred) return preferred;
  }

  const roleOrder = ROLE_PRIORITY_MAP[role] || ROLE_PRIORITY_MAP.general;
  const available = getAvailableLlmProviders().filter((p) => p.isAvailable);
  available.sort((a, b) => {
    const idxA = roleOrder.indexOf(a.id);
    const idxB = roleOrder.indexOf(b.id);
    return (idxA !== -1 ? idxA : 99) - (idxB !== -1 ? idxB : 99);
  });

  if (available.length === 0) return null;
  return getLlmModelByProvider(available[0].id);
}

/**
 * Executes a runner function with role-based provider ordering and automatic fallback.
 */
export async function executeWithLlmFallback<T>(
  runner: (model: LanguageModel, providerId: LlmProviderType, modelName: string) => Promise<T>,
  options?: { preferredProvider?: string; role?: AgentTaskRole },
): Promise<{ result: T; providerId: LlmProviderType; modelName: string }> {
  const role = options?.role || "general";
  const roleOrder = ROLE_PRIORITY_MAP[role] || ROLE_PRIORITY_MAP.general;

  const availableProviders = getAvailableLlmProviders()
    .filter((p) => p.isAvailable)
    .sort((a, b) => {
      if (options?.preferredProvider) {
        if (a.id === options.preferredProvider) return -1;
        if (b.id === options.preferredProvider) return 1;
      }
      const idxA = roleOrder.indexOf(a.id);
      const idxB = roleOrder.indexOf(b.id);
      return (idxA !== -1 ? idxA : a.priority + 10) - (idxB !== -1 ? idxB : b.priority + 10);
    });

  if (availableProviders.length === 0) {
    throw new Error(
      "No active LLM API keys found. Please set GROQ_API_KEY, GEMINI_API_KEY, OPENROUTER_API_KEY, or SAMBANOVA_API_KEY.",
    );
  }

  let lastError: unknown = null;
  for (const prov of availableProviders) {
    const instance = getLlmModelByProvider(prov.id);
    if (!instance) continue;

    try {
      const result = await runner(instance.model, instance.providerId, instance.modelName);
      return {
        result,
        providerId: instance.providerId,
        modelName: instance.modelName,
      };
    } catch (err: unknown) {
      lastError = err;
      console.warn(
        `[LLM Provider] Role '${role}' on provider '${prov.name}' (${instance.modelName}) failed: ${String(err)}. Failing over...`,
      );
    }
  }

  throw new Error(`All fallback providers failed for role '${role}'. Last error: ${String(lastError)}`);
}
