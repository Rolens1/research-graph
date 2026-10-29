import { z } from "zod";

export const intakeRoleSchema = z.enum(["user", "assistant"]);
export type IntakeRole = z.infer<typeof intakeRoleSchema>;

export const intakeMessageSchema = z.object({
  id: z.string().min(1),
  role: intakeRoleSchema,
  content: z.string().min(1),
  timestamp: z.string(),
});
export type IntakeMessage = z.infer<typeof intakeMessageSchema>;

export const intakeStatusSchema = z.enum([
  "clarifying",
  "ready_for_confirmation",
  "harmful_blocked",
]);
export type IntakeStatus = z.infer<typeof intakeStatusSchema>;

export const intakeApiRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: intakeRoleSchema,
      content: z.string().min(1).max(2000),
    }),
  ).max(30),
  currentQuery: z.string().min(1).max(500),
  depth: z.enum(["recon", "expedition"]).default("recon"),
});
export type IntakeApiRequest = z.infer<typeof intakeApiRequestSchema>;

export const intakeApiResponseSchema = z.object({
  status: intakeStatusSchema,
  message: z.string().min(1).max(2000),
  quickReplies: z.array(z.string().min(1).max(60)).max(4).optional().default([]),
  refinedQuery: z.string().max(500).optional(),
  validationReason: z.string().max(500).optional(),
  policyWarning: z.string().max(500).optional(),
});
export type IntakeApiResponse = z.infer<typeof intakeApiResponseSchema>;

