import { z } from 'zod';

export const readingSchema = z.object({
  systolic: z.number()
    .min(60, "PAS demasiado baja (mín 60)")
    .max(300, "PAS demasiado alta (máx 300)"),
  diastolic: z.number()
    .min(40, "PAD demasiado baja (mín 40)")
    .max(200, "PAD demasiado alta (máx 200)"),
  heartRate: z.number()
    .min(30, "FC demasiado baja (mín 30)")
    .max(250, "FC demasiado alta (máx 250)")
    .optional()
    .nullable(),
  slot: z.enum(['morning', 'evening']),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida"),
  notes: z.string().max(500, "Nota demasiado larga").optional().nullable(),
});

export type ReadingInput = z.infer<typeof readingSchema>;
