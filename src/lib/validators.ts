import { z } from "zod";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/\d/, "Password must contain a digit"),
  name: z.string().min(1).max(80),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const projectCreateSchema = z.object({
  name: z.string().min(1).max(80),
  description: z.string().max(500).optional(),
});

export const projectUpdateSchema = projectCreateSchema.partial();

export const memberInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const memberUpdateSchema = z.object({
  role: z.enum(["ADMIN", "MEMBER"]),
});

const isoDate = z
  .string()
  .datetime({ offset: true })
  .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/))
  .optional()
  .nullable();

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(2000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
  dueDate: isoDate,
  assigneeId: z.string().nullable().optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
});

export const taskUpdateSchema = taskCreateSchema.partial();

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});
