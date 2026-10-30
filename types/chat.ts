import { z } from "zod";
import { sourceCitationSchema } from "./graph";

export const chatRoleSchema = z.enum(["user", "assistant", "system"]);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatRoleSchema,
  content: z.string(),
  createdAt: z.string().optional(),
  citedSourceUrls: z.array(z.string()).optional(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const nodeChatRequestSchema = z.object({
  nodeId: z.string().min(1),
  query: z.string().min(1).max(500),
  sources: z.array(sourceCitationSchema),
  nodeLabel: z.string().optional(),
  history: z.array(chatMessageSchema).optional(),
});
export type NodeChatRequest = z.infer<typeof nodeChatRequestSchema>;

export const nodeChatResponseSchema = z.object({
  message: z.string(),
  citedSourceUrls: z.array(z.string()).optional(),
  isGrounded: z.boolean().default(true),
});
export type NodeChatResponse = z.infer<typeof nodeChatResponseSchema>;

