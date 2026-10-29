import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

export type LlmProviderType = "groq" | "gemini" | "github_models" | "openai";

export type LlmProviderInfo = {
  id: LlmProviderType;
  name: string;
  modelName: string;
  isAvailable: boolean;
  priority: number;
};

/**
 * Registry of supported free and standard model providers.
 */
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
      name: "Groq Cloud (High Speed Inference)",
      modelName: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
      baseURL: "https://api.groq.com/openai/v1",
      getApiKey: () => process.env.GROQ_API_KEY,
      priority: 1,
    },
    gemini: {
      name: "Google AI Studio (Gemini)",
      modelName: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
      baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
      getApiKey: () =>
        process.env.GOOGLE_GENERATIVE_AI_API_KEY ||
        process.env.GEMINI_API_KEY ||
        process.env.GOOGLE_API_KEY,
      priority: 2,
    },
    github_models: {
      name: "GitHub Models (GPT-4o Mini)",
      modelName: process.env.GITHUB_MODEL || "gpt-4o-mini",
      baseURL: "https://models.inference.ai.azure.com",
      getApiKey: () => process.env.GITHUB_TOKEN || process.env.GH_TOKEN,
      priority: 3,
    },
    openai: {
      name: "OpenAI Direct (GPT-4o Mini)",
      modelName: process.env.OPENAI_MODEL || "gpt-4o-mini",
      getApiKey: () => process.env.OPENAI_API_KEY,
      priority: 4,
    },
  };
}

/**
 * Inspects environment variables to report available model providers without leaking keys.
 */
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

/**
 * Instantiates a specific model provider client.
 */
export function getLlmModelByProvider(providerId: LlmProviderType): {
  model: LanguageModel;
  providerId: LlmProviderType;
  modelName: string;
} | null {
  const definitions = getProviderDefinitions();
  const def = definitions[providerId];
  if (!def) return null;

  const apiKey = def.getApiKey();
  if (!apiKey || apiKey.trim().length === 0) {
    return null;
  }

  const client = createOpenAI({
    baseURL: def.baseURL,
    apiKey: apiKey.trim(),
  });

  return {
    model: client(def.modelName),
    providerId,
    modelName: def.modelName,
  };
}

/**
 * Returns the primary available LLM model instance.
 */
export function getPrimaryLlmModel(preferredProvider?: string): {
  model: LanguageModel;
  providerId: LlmProviderType;
  modelName: string;
} | null {
  const definitions = getProviderDefinitions();
  if (preferredProvider && preferredProvider in definitions) {
    const preferred = getLlmModelByProvider(preferredProvider as LlmProviderType);
    if (preferred) return preferred;
  }

  const providers = getAvailableLlmProviders()
    .filter((p) => p.isAvailable)
    .sort((a, b) => a.priority - b.priority);

  if (providers.length === 0) {
    return null;
  }

  return getLlmModelByProvider(providers[0].id);
}

/**
 * Executes a runner function with automatic provider fallback if a provider fails or rate limits.
 */
export async function executeWithLlmFallback<T>(
  runner: (model: LanguageModel, providerId: LlmProviderType, modelName: string) => Promise<T>,
  options?: { preferredProvider?: string },
): Promise<{ result: T; providerId: LlmProviderType; modelName: string }> {
  const availableProviders = getAvailableLlmProviders()
    .filter((p) => p.isAvailable)
    .sort((a, b) => {
      if (options?.preferredProvider) {
        if (a.id === options.preferredProvider) return -1;
        if (b.id === options.preferredProvider) return 1;
      }
      return a.priority - b.priority;
    });

  if (availableProviders.length === 0) {
    throw new Error(
      "No active LLM API keys found. Please set GROQ_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, GITHUB_TOKEN, or OPENAI_API_KEY in your environment variables.",
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
        `[LLM Provider] Provider '${prov.name}' (${instance.modelName}) failed: ${String(err)}. Attempting next provider in fallback chain...`,
      );
    }
  }

  throw new Error(`All LLM fallback providers failed. Last error: ${String(lastError)}`);
}
