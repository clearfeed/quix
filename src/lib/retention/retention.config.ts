import { registerAs } from '@nestjs/config';

export default registerAs('retention', () => ({
  softDays: parseInt(process.env.RETENTION_SOFT_DAYS || '7', 10),
  hardMonths: parseInt(process.env.RETENTION_HARD_MONTHS || '2', 10)
}));
