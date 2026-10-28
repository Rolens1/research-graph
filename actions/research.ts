"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { getInsForgeServerClient } from "@/lib/insforge-server";
import {
  startResearchRequestSchema,
  type StartResearchRequest,
} from "@/types/actions";

export type CreateResearchInput = StartResearchRequest;

export async function createResearchSessionAction(input: unknown): Promise<{
  success: boolean;
  researchId?: string;
  error?: string;
}> {
  try {
    const parseResult = startResearchRequestSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid research query.",
      };
    }

    const { query } = parseResult.data;
    const insforge = await getInsForgeServerClient();
    const { data: authData } = await insforge.auth.getCurrentUser();

    if (authData?.user) {
      const { data, error } = await insforge.database
        .from("researches")
        .insert({
          user_id: authData.user.id,
          query,
          status: "running",
          confidence_score: 0,
        })
        .select("id")
        .single();

      if (error) {
        console.error("[actions/research:createResearchSessionAction] Insert error:", error);
        return { success: false, error: error.message };
      }

      return { success: true, researchId: data.id };
    }

    // Guest / unauthenticated fallback session identifier
    const guestSessionId = "guest_" + Math.random().toString(36).substring(2, 10);
    return { success: true, researchId: guestSessionId };
  } catch (err) {
    console.error("[actions/research:createResearchSessionAction]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to initialize investigation session.",
    };
  }
}

const deleteResearchSchema = z.object({
  researchId: z.string().uuid("Invalid research session identifier"),
});

export type DeleteResearchInput = z.infer<typeof deleteResearchSchema>;

export async function deleteResearchSessionAction(input: unknown): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const parseResult = deleteResearchSchema.safeParse(input);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error.issues[0]?.message || "Invalid research identifier.",
      };
    }

    const { researchId } = parseResult.data;
    const insforge = await getInsForgeServerClient();
    const { data: authData } = await insforge.auth.getCurrentUser();

    if (!authData?.user) {
      return {
        success: false,
        error: "Unauthorized. Please sign in to manage investigations.",
      };
    }

    const { error } = await insforge.database
      .from("researches")
      .delete()
      .eq("id", researchId)
      .eq("user_id", authData.user.id);

    if (error) {
      console.error("[actions/research:deleteResearchSessionAction] Delete error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath("/workspace");
    return { success: true };
  } catch (err) {
    console.error("[actions/research:deleteResearchSessionAction]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete investigation session.",
    };
  }
}
