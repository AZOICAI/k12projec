import { z } from "zod";

export const assignmentStatusSchema = z.enum(["todo", "in_progress", "done"]);

export const termCreateSchema = z.object({
  name: z.string().min(1).max(200),
  starts_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  ends_on: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const termUpdateSchema = termCreateSchema.partial();

export const courseCreateSchema = z.object({
  term_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1).max(200),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .default("#3B82F6"),
});
export const courseUpdateSchema = courseCreateSchema.partial();

export const courseMeetingSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_minutes: z.number().int().min(0).max(1439),
  end_minutes: z.number().int().min(0).max(1439),
});
export const courseMeetingCreateSchema = courseMeetingSchema.extend({
  course_id: z.string().uuid(),
});

export const assignmentCreateSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string().min(1).max(500),
  due_at: z.string().datetime({ offset: true }),
  status: assignmentStatusSchema.optional(),
  notes: z.string().max(5000).nullable().optional(),
  estimate_minutes: z.number().int().min(0).max(24 * 60).nullable().optional(),
  source_url: z.string().url().max(2000).nullable().optional(),
});
export const assignmentUpdateSchema = assignmentCreateSchema.partial();

export const studyBlockCreateSchema = z.object({
  title: z.string().min(1).max(200),
  starts_at: z.string().datetime({ offset: true }),
  ends_at: z.string().datetime({ offset: true }),
  course_id: z.string().uuid().nullable().optional(),
  assignment_id: z.string().uuid().nullable().optional(),
});
export const studyBlockUpdateSchema = studyBlockCreateSchema.partial();

export const preferencesUpdateSchema = z.object({
  timezone: z.string().min(1).max(100).optional(),
  web_notifications_enabled: z.boolean().optional(),
  extension_notifications_enabled: z.boolean().optional(),
  email_reminders_enabled: z.boolean().optional(),
  remind_before_hours: z.array(z.number().int().min(0).max(168)).optional(),
});
