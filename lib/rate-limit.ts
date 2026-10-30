import { NextRequest, NextResponse } from "next/server";
import { getInsForgeServerClient } from "@/lib/insforge-server";

export type RateLimitAction =
  | "start_research"
  | "expand_node"
  | "mutate_hypothesis"
  | "node_chat";

export interface RateLimitPolicy {
  maxRequests: number;
  windowMs: number;
  errorMessage: string;
}

export const RATE_LIMIT_CONFIG: Record<RateLimitAction, RateLimitPolicy> = {
  start_research: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,
    errorMessage:
      "Hourly rate limit exceeded. You can launch up to 5 investigations per hour. Please wait before starting another inquiry.",
  },
  expand_node: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    errorMessage:
      "Hourly rate limit exceeded. You can run up to 10 rabbit hole expansions per hour. Please wait before expanding further.",
  },
  mutate_hypothesis: {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,
    errorMessage:
      "Hourly rate limit exceeded. You can perform up to 10 hypothesis mutations per hour. Please wait before submitting another change.",
  },
  node_chat: {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000,
    errorMessage:
      "Hourly rate limit exceeded. You can send up to 20 inquiries per hour. Please wait before submitting another question.",
  },
};

interface MemoryBucketEntry {
  count: number;
  resetAt: number;
  lastSyncedAt: number;
}

// In memory sliding window cache for sub millisecond verification
const memoryBuckets = new Map<string, MemoryBucketEntry>();

let lastEvictionTime = Date.now();
const EVICTION_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Periodically purges expired buckets from memory
 */
function evictExpiredBuckets() {
  const now = Date.now();
  if (now - lastEvictionTime < EVICTION_INTERVAL_MS) return;
  lastEvictionTime = now;

  for (const [key, entry] of memoryBuckets.entries()) {
    if (now >= entry.resetAt) {
      memoryBuckets.delete(key);
    }
  }
}

/**
 * Resolves the client identity from authenticated cookie or guest IP headers
 */
export async function resolveClientIdentity(request: NextRequest): Promise<string> {
  try {
    const insforge = await getInsForgeServerClient();
    const { data } = await insforge.auth.getCurrentUser();
    if (data?.user?.id) {
      return `usr:${data.user.id}`;
    }
  } catch {
    // Outside active authenticated session
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const clientIp = forwardedFor.split(",")[0].trim();
    if (clientIp) return `ip:${clientIp}`;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return `ip:${realIp.trim()}`;

  return "ip:127.0.0.1";
}

/**
 * Asynchronously syncs bucket state to PostgreSQL in the background
 */
async function syncBucketToDatabase(
  bucketKey: string,
  tokens: number,
  resetAt: number,
  windowMs: number,
) {
  try {
    const insforge = await getInsForgeServerClient();
    const windowStart = new Date(resetAt - windowMs).toISOString();

    await insforge.database.from("rate_limit_buckets").upsert(
      {
        key: bucketKey,
        tokens,
        window_start: windowStart,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" },
    );
  } catch (err) {
    console.warn(`[RateLimit] Background database sync skipped or failed for ${bucketKey}:`, err);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  errorMessage?: string;
}

/**
 * Evaluates whether an incoming request is allowed under sliding window limits
 */
export async function checkRateLimit(
  request: NextRequest,
  action: RateLimitAction,
): Promise<RateLimitResult> {
  evictExpiredBuckets();

  const policy = RATE_LIMIT_CONFIG[action];
  const identity = await resolveClientIdentity(request);
  const bucketKey = `${action}:${identity}`;
  const now = Date.now();

  let entry = memoryBuckets.get(bucketKey);

  // If entry exists and window has not expired
  if (entry && now < entry.resetAt) {
    if (entry.count >= policy.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
        errorMessage: policy.errorMessage,
      };
    }

    entry.count += 1;
    void syncBucketToDatabase(bucketKey, entry.count, entry.resetAt, policy.windowMs);

    return {
      allowed: true,
      remaining: Math.max(0, policy.maxRequests - entry.count),
      resetAt: entry.resetAt,
    };
  }

  // Window expired or new client: initialize fresh sliding window
  const resetAt = now + policy.windowMs;
  entry = {
    count: 1,
    resetAt,
    lastSyncedAt: now,
  };
  memoryBuckets.set(bucketKey, entry);
  void syncBucketToDatabase(bucketKey, 1, resetAt, policy.windowMs);

  return {
    allowed: true,
    remaining: policy.maxRequests - 1,
    resetAt,
  };
}

/**
 * Creates a minimal HTTP 429 response when rate limit is exceeded
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    {
      error:
        result.errorMessage ||
        "Hourly rate limit exceeded. Please wait before starting another inquiry.",
    },
    { status: 429 },
  );
}

/**
 * Helper to clear memory cache during unit testing
 */
export function _resetRateLimitStoreForTesting() {
  memoryBuckets.clear();
}
