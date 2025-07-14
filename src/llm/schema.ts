import { z } from 'zod';

export const PlanStepSchema = z.object({
  steps: z.array(
    z.object({
      type: z.enum(['tool', 'reason']),
      tool: z.string().optional(),
      args: z.object({}).optional(),
      input: z.string().optional()
    })
  )
});
