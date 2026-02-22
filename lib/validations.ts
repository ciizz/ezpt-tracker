import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z.string().min(1).max(50),
  isGuest: z.boolean().optional().default(false),
});

export const updatePlayerSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  isGuest: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const participantSchema = z.object({
  playerId: z.number().int().positive(),
  rebuys: z.number().int().min(0).default(0),
  profitLoss: z.number(),
});

export const createSessionSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  gameTypeId: z.number().int().positive(),
  maxBuyIn: z.number().positive(),
  eventId: z.number().int().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
  participants: z.array(participantSchema).min(1),
});

export const updateSessionSchema = createSessionSchema.partial().extend({
  participants: z.array(participantSchema).optional(),
});

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(100),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const statsQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).optional(),
});
