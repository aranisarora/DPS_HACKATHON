import { z } from "zod";

// ===== One schema validates LLM output, API routes, and forms =====

export const ActionTypeSchema = z.enum([
  "recap_email",
  "follow_up_booking",
  "task_assignment",
  "absentee_update",
  "slack_summary",
  "email_reply",
  "calendar_block",
  "agenda_add",
  "daily_brief",
  "other",
]);

export const BlastRadiusSchema = z.enum(["internal", "team", "external"]);

/**
 * What Fable 5 must return for each candidate action extracted from a
 * transcript or email. The model PROPOSES confidence/risk — deterministic
 * code makes the final fire decision (see autonomy/router.ts).
 */
export const ExtractedActionSchema = z.object({
  action_type: ActionTypeSchema,
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  source_quote: z.string().max(1000),
  owner_hint: z.string().optional(), // name/email of who should do it
  due_hint: z.string().optional(), // ISO date or natural language
  confidence: z.number().min(0).max(1),
  blast_radius: BlastRadiusSchema,
  reversible: z.boolean(),
  params: z.record(z.unknown()).default({}),
});
export type ExtractedAction = z.infer<typeof ExtractedActionSchema>;

export const ExtractionResultSchema = z.object({
  actions: z.array(ExtractedActionSchema).max(20),
  summary: z.string().max(2000),
});
export type ExtractionResult = z.infer<typeof ExtractionResultSchema>;

// ===== API route inputs =====

export const DecisionSchema = z.object({
  action_id: z.string().uuid(),
  decision: z.enum(["approve", "edit", "skip"]),
  edited_params: z.record(z.unknown()).optional(),
});

export const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().max(2000).optional(),
  assignee_name: z.string().max(200).optional(),
  due_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD")
    .optional(),
});

export const UpdateTaskSchema = z.object({
  task_id: z.string().uuid(),
  status: z.enum(["open", "done"]),
});

export const ManualIngestSchema = z.object({
  text: z.string().min(3).max(10000),
});

export const OnboardingSchema = z.object({
  what_you_do: z.string().min(3).max(1000),
  who_your_clients_are: z.string().min(3).max(1000),
  tone_of_voice: z.string().min(3).max(500),
});
