"use server";

import { z } from "zod";
import { getInsForgeServerClient } from "@/lib/insforge-server";

const themeSchema = z.enum(["light", "dark"]);

export type Theme = z.infer<typeof themeSchema>;

export async function updateUserThemeAction(themeInput: unknown): Promise<{
  success: boolean;
  theme?: Theme;
  error?: string;
}> {
  try {
    const parseResult = themeSchema.safeParse(themeInput);
    if (!parseResult.success) {
      return {
        success: false,
        error: "Invalid theme value. Expected 'light' or 'dark'.",
      };
    }
    const theme = parseResult.data;

    const insforge = await getInsForgeServerClient();
    const { data: authData, error: authError } = await insforge.auth.getCurrentUser();

    if (authError || !authData?.user) {
      // Unauthenticated or guest user preference is handled locally by client
      return { success: true, theme };
    }

    const userId = authData.user.id;
    const { error: updateError } = await insforge.database
      .from("profiles")
      .update({ theme, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (updateError) {
      console.error("[actions/theme:updateUserThemeAction] Database update failed:", updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, theme };
  } catch (err) {
    console.error("[actions/theme:updateUserThemeAction]", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update theme",
    };
  }
}

export async function getUserThemeAction(): Promise<{
  theme: Theme;
}> {
  try {
    const insforge = await getInsForgeServerClient();
    const { data: authData } = await insforge.auth.getCurrentUser();

    if (!authData?.user) {
      return { theme: "light" };
    }

    const { data: profile, error } = await insforge.database
      .from("profiles")
      .select("theme")
      .eq("id", authData.user.id)
      .single();

    if (error || !profile) {
      return { theme: "light" };
    }

    if (profile.theme === "dark" || profile.theme === "light") {
      return { theme: profile.theme };
    }

    return { theme: "light" };
  } catch (err) {
    console.error("[actions/theme:getUserThemeAction]", err);
    return { theme: "light" };
  }
}
