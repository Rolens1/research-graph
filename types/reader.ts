import { z } from "zod";
import { cleanSearchResultSchema } from "./tavily";
import { backwardSubQuerySchema } from "./architect";

/**
 * Candidate Entity Schema
 * Represents an entity extracted by The Reader before verification by The Fact Checker.
 */
export const candidateEntitySchema = z.object({
  name: z.string().min(1).max(120),
  entityType: z.enum(["actor", "event", "technology", "decision", "dispute"]),
  significance: z.string().min(5).max(400),
  temporalAnchor: z.string().optional(),
  sourceUrl: z.string().url(),
  quoteSnippet: z.string().min(10).max(1000),
});
export type CandidateEntity = z.infer<typeof candidateEntitySchema>;

/**
 * Extracted Fact Schema
 * Represents a discrete historical statement or milestone extracted from search text.
 */
export const extractedFactSchema = z.object({
  statement: z.string().min(10).max(500),
  dateMentioned: z.string().optional(),
  entitiesInvolved: z.array(z.string()).default([]),
  sourceUrl: z.string().url(),
  sourceTitle: z.string().min(1),
  sourceDomain: z.string().min(1),
  quoteSnippet: z.string().min(10).max(1000),
  confidenceScore: z.number().int().min(0).max(100).default(80),
});
export type ExtractedFact = z.infer<typeof extractedFactSchema>;

/**
 * Rabbit Hole Lead Schema
 * Represents a promising low scoring lead that diverges into unexpected historical branches.
 */
export const rabbitHoleLeadSchema = z.object({
  title: z.string().min(1),
  url: z.string().url(),
  domain: z.string().min(1),
  divergentTopic: z.string().min(5).max(300),
  matchedContextKeywords: z.array(z.string()).default([]),
  searchScore: z.number().min(0).max(1),
  snippet: z.string().min(10).max(1500),
});
export type RabbitHoleLead = z.infer<typeof rabbitHoleLeadSchema>;

/**
 * Single Query Execution Result Schema
 * Holds search results and extracted facts for an individual backward sub query.
 */
export const readerQueryExecutionResultSchema = z.object({
  queryId: z.string(),
  queryText: z.string(),
  searchResultsCount: z.number().int().min(0),
  extractedFacts: z.array(extractedFactSchema),
  candidateEntities: z.array(candidateEntitySchema).max(6),
  rabbitHoleLeads: z.array(rabbitHoleLeadSchema).max(3),
  rawSearchResults: z.array(cleanSearchResultSchema),
});
export type ReaderQueryExecutionResult = z.infer<typeof readerQueryExecutionResultSchema>;

/**
 * Reader Output Schema
 * Final synthesized payload returned to the multi-agent loop.
 */
export const readerOutputSchema = z.object({
  queryResults: z.array(readerQueryExecutionResultSchema),
  allEntities: z.array(candidateEntitySchema),
  allFacts: z.array(extractedFactSchema),
  allRabbitHoles: z.array(rabbitHoleLeadSchema),
  reasoningSteps: z.array(z.string()).min(1),
  executionTimeMs: z.number().int().min(0),
});
export type ReaderOutput = z.infer<typeof readerOutputSchema>;

/**
 * Reader Input Options Schema
 */
export const readerInputSchema = z.object({
  subQueries: z.array(backwardSubQuerySchema).min(1).max(4),
  existingGraphKeywords: z.array(z.string()).default([]),
  includeFullContent: z.boolean().default(false),
  preferredProvider: z.string().optional(),
});
export type ReaderInput = z.input<typeof readerInputSchema>;
