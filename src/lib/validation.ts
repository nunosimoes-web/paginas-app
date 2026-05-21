import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(8),
  displayName: z.string().trim().min(1).max(60).optional().or(z.literal("")),
});

export const checkinSchema = z.object({
  mood: z.number().int().min(1).max(5),
  note: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const journalSchema = z.object({
  body: z.string().trim().min(1).max(10000),
  pieceId: z.string().optional().or(z.literal("")),
});

export const onboardingSchema = z.object({
  themeSlugs: z.array(z.string()).min(1),
  role: z.enum(["INDIVIDUAL", "THERAPIST"]),
  promptHour: z.number().int().min(0).max(23),
});

export const settingsSchema = z.object({
  displayName: z.string().trim().max(60).optional().or(z.literal("")),
  locale: z.enum(["pt-PT", "en"]),
  promptHour: z.number().int().min(0).max(23),
  role: z.enum(["INDIVIDUAL", "THERAPIST"]),
});

export const connectSchema = z.object({
  code: z.string().trim().min(4).max(32),
});

export const seedThemesSchema = z.object({
  clientId: z.string().min(1),
  themeSlugs: z.array(z.string()).min(1),
});
